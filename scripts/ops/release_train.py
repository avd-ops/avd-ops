"""Monthly Patch Tuesday + 7 days release train readiness audit and BOM updater.

Stdlib-only helper that checks every public repository in repos.json:
  - Whether today is the monthly release train window (3rd Tuesday, day 15..21)
  - Latest published GitHub Release tag and commits ahead on the default branch
  - Presence of CHANGELOG.md and a release workflow
  - Emits a Markdown readiness report and optionally updates platform-release.json
    or posts a deduplicated tracking issue in avd-ops/avd-ops.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
REST_URL = "https://api.github.com"
TRAIN_HASH_RE = re.compile(r"<!--\s*release-train-hash:([a-f0-9]+)\s*-->")


def is_release_train_day(today: date | None = None) -> bool:
    """Return True if today is the 3rd Tuesday of the month (Patch Tuesday + 7 days)."""
    d = today or datetime.now(timezone.utc).date()
    return d.weekday() == 1 and 15 <= d.day <= 21


def next_patch_tuesday_plus_7(today: date | None = None) -> date:
    """Compute the next 3rd Tuesday on or after today."""
    d = today or datetime.now(timezone.utc).date()
    year, month = d.year, d.month
    for _ in range(3):
        first = date(year, month, 1)
        # Tuesday is weekday() == 1
        offset = (1 - first.weekday()) % 7
        third_tue = date(year, month, 1 + offset + 14)
        if third_tue >= d:
            return third_tue
        month += 1
        if month > 12:
            month = 1
            year += 1
    return d


def github_get(path: str, token: str | None) -> Any:
    """Perform a GET against the GitHub REST API, returning None on 404."""
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "avd-ops-release-train",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{REST_URL}{path}", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        if err.code == 404:
            return None
        raise


def github_post(path: str, token: str, payload: dict[str, Any], method: str = "POST") -> Any:
    """Perform a POST/PATCH against the GitHub REST API."""
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "avd-ops-release-train",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(f"{REST_URL}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def suggest_next_tag(current_tag: str | None) -> str:
    """Suggest the next SemVer tag given the current tag."""
    if not current_tag:
        return "v0.1.0"
    m = re.match(r"^(.*?)(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$", current_tag)
    if not m:
        return "v0.1.0"
    prefix, major, minor, _patch = m.groups()
    return f"{prefix}{major}.{int(minor) + 1}.0"


def inspect_repo(entry: dict[str, Any], token: str | None) -> dict[str, Any]:
    """Inspect one repository's release state via GitHub REST API."""
    full = entry["repo"]
    branch = entry.get("branch") or "main"
    latest = github_get(f"/repos/{full}/releases/latest", token)
    if not latest:
        rels = github_get(f"/repos/{full}/releases?per_page=1", token) or []
        latest = rels[0] if rels else None

    tag = latest["tag_name"] if latest else None
    published_at = (latest.get("published_at") or "")[:10] if latest else None
    release_url = latest.get("html_url") if latest else None

    ahead_by = None
    if tag:
        cmp = github_get(f"/repos/{full}/compare/{tag}...{branch}", token)
        if cmp:
            ahead_by = cmp.get("ahead_by", 0)

    has_changelog = github_get(f"/repos/{full}/contents/CHANGELOG.md?ref={branch}", token) is not None
    wfs = github_get(f"/repos/{full}/contents/.github/workflows?ref={branch}", token) or []
    wf_names = [w.get("name", "") for w in wfs if isinstance(w, dict)]
    has_release_wf = any("release" in n.lower() for n in wf_names)

    return {
        "name": entry["name"],
        "repo": full,
        "layer": entry.get("layer", ""),
        "maturity": entry.get("maturity", ""),
        "branch": branch,
        "tag": tag,
        "publishedAt": published_at,
        "releaseUrl": release_url,
        "aheadBy": ahead_by,
        "suggestedTag": suggest_next_tag(tag) if (ahead_by is None or ahead_by > 0) else tag,
        "hasChangelog": has_changelog,
        "hasReleaseWorkflow": has_release_wf,
    }


def render_report(results: list[dict[str, Any]], platform_version: str, train_date: str) -> str:
    """Render a Markdown release-train readiness report."""
    lines = [
        f"# Release Train Readiness — `platform-v{platform_version}` ({train_date})",
        "",
        "Cadence: **Patch Tuesday + 7 days** (3rd Tuesday of each month).",
        "",
        "| Repo | Maturity | Current Tag | Ahead | Next Tag | Changelog | Release WF |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in results:
        cur = f"`{r['tag']}`" if r["tag"] else "_none_"
        ahead = str(r["aheadBy"]) if r["aheadBy"] is not None else "unreleased"
        nxt = f"`{r['suggestedTag']}`" if (r["aheadBy"] is None or r["aheadBy"] > 0) else "_unchanged_"
        cl = "yes" if r["hasChangelog"] else "no"
        wf = "yes" if r["hasReleaseWorkflow"] else "no"
        lines.append(f"| `{r['name']}` | {r['maturity']} | {cur} | {ahead} | {nxt} | {cl} | {wf} |")

    needs_action = [r for r in results if not r["hasReleaseWorkflow"] or not r["hasChangelog"] or r["tag"] is None]
    lines.extend(["", f"Repositories needing baseline release setup or initial tag: **{len(needs_action)}** of {len(results)}."])
    digest = hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()[:12]
    lines.append(f"\n<!-- release-train-hash:{digest} -->")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Audit monthly Patch Tuesday + 7 days release train readiness.")
    parser.add_argument("--repos-file", default=str(ROOT / "repos.json"))
    parser.add_argument("--manifest", default=str(ROOT / "platform-release.json"))
    parser.add_argument("--check-day", action="store_true", help="Exit 0 early if today is not the 3rd Tuesday")
    parser.add_argument("--force", action="store_true", help="Run even if today is not the 3rd Tuesday")
    parser.add_argument("--dry-run", action="store_true", help="Do not write manifest or post issues")
    parser.add_argument("--write-manifest", action="store_true", help="Update platform-release.json from live releases")
    parser.add_argument("--post-issue", default="", help="Owner/repo to post/update a deduplicated tracking issue")
    args = parser.parse_args(argv)

    today = datetime.now(timezone.utc).date()
    if args.check_day and not args.force and not is_release_train_day(today):
        nxt = next_patch_tuesday_plus_7(today)
        print(f"Today ({today.isoformat()}) is not Patch Tuesday + 7 days (next: {nxt.isoformat()}). Skipping.")
        return 0

    repos_doc = json.loads(Path(args.repos_file).read_text(encoding="utf-8"))
    manifest_path = Path(args.manifest)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    platform_version = f"{today.year}.{today.month:02d}.0"
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")

    results = [inspect_repo(r, token) for r in repos_doc.get("repos", [])]
    report = render_report(results, platform_version, today.isoformat())
    print(report)

    if args.write_manifest and not args.dry_run:
        updated = {
            "schema": "avd-ops-platform-release/v1",
            "platformVersion": manifest.get("platformVersion", platform_version),
            "cadence": "patch-tuesday-plus-7",
            "releasedAt": manifest.get("releasedAt", today.isoformat()),
            "repos": [
                {
                    "name": r["name"],
                    "repo": r["repo"],
                    "layer": r["layer"],
                    "maturity": r["maturity"],
                    "tag": r["tag"],
                    "publishedAt": r["publishedAt"],
                    "releaseUrl": r["releaseUrl"],
                }
                for r in results
            ],
        }
        manifest_path.write_text(json.dumps(updated, indent=2) + "\n", encoding="utf-8")

    if args.post_issue and not args.dry_run and token:
        title = f"Release train readiness: platform-v{platform_version}"
        open_issues = github_get(f"/repos/{args.post_issue}/issues?state=open&per_page=50", token) or []
        existing = next((i for i in open_issues if i.get("title") == title), None)
        if existing:
            m_new = TRAIN_HASH_RE.search(report)
            m_old = TRAIN_HASH_RE.search(existing.get("body") or "")
            if not (m_new and m_old and m_new.group(1) == m_old.group(1)):
                github_post(f"/repos/{args.post_issue}/issues/{existing['number']}", token, {"body": report}, method="PATCH")
        else:
            github_post(f"/repos/{args.post_issue}/issues", token, {"title": title, "body": report})

    return 0


if __name__ == "__main__":
    sys.exit(main())
