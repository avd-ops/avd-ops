"""Org-wide mechanical PR, CI, and GitHub metrics sweep.

Stdlib-only and reusable across any GitHub org or repos.json manifest:

  python3 scripts/ops/org_sweep.py --repos-file repos.json
  python3 scripts/ops/org_sweep.py --org avd-ops --format json
  python3 scripts/ops/org_sweep.py --repos-file repos.json --post-issue avd-ops/avd-ops

Reads public repos via a single GraphQL query per repository (falling back cleanly on
per-repo permission/network errors) and emits actionable findings plus an org metrics
scorecard. Never echoes raw PR bodies and sanitizes PR titles before rendering.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import statistics
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GRAPHQL_URL = "https://api.github.com/graphql"
REST_URL = "https://api.github.com"
BOT_AUTHORS = {"dependabot", "dependabot[bot]", "renovate", "renovate[bot]", "github-actions", "github-actions[bot]"}
FAIL_CONCLUSIONS = {"FAILURE", "TIMED_OUT", "ACTION_REQUIRED", "STARTUP_FAILURE"}
FAIL_STATES = {"FAILURE", "ERROR"}
SWEEP_HASH_RE = re.compile(r"<!--\s*sweep-hash:([a-f0-9]+)\s*-->")
CHECKED_BOX_RE = re.compile(r"^\s*[-*]\s+\[x\]", re.I | re.M)

REPO_QUERY = """
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    nameWithOwner
    isArchived
    stargazerCount
    forkCount
    issues(states: OPEN) { totalCount }
    latestRelease { tagName publishedAt }
    defaultBranchRef {
      name
      target {
        ... on Commit {
          statusCheckRollup {
            state
            contexts(first: 20) {
              nodes {
                __typename
                ... on CheckRun { name conclusion }
                ... on StatusContext { context state }
              }
            }
          }
        }
      }
    }
    openPrs: pullRequests(states: OPEN, first: 50, orderBy: {field: UPDATED_AT, direction: DESC}) {
      totalCount
      nodes {
        number
        title
        url
        isDraft
        createdAt
        updatedAt
        mergeable
        reviewDecision
        author { login }
        reviews(first: 1) { totalCount }
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
                contexts(first: 30) {
                  nodes {
                    __typename
                    ... on CheckRun { name conclusion }
                    ... on StatusContext { context state }
                  }
                }
              }
            }
          }
        }
      }
    }
    mergedPrs: pullRequests(states: MERGED, first: 30, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        number
        createdAt
        mergedAt
        author { login }
      }
    }
  }
}
"""


def parse_iso(ts: str | None) -> datetime | None:
    if not ts:
        return None
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def sanitize_title(title: str, max_len: int = 100) -> str:
    """Strip @mentions, Markdown link/code chars, and newlines from untrusted PR titles."""
    cleaned = " ".join((title or "").split())
    cleaned = cleaned.replace("@", "").translate(str.maketrans({"[": "(", "]": ")", "`": "'", "<": "", ">": ""}))
    if len(cleaned) > max_len:
        cleaned = cleaned[: max_len - 3].rstrip() + "..."
    return cleaned or "(untitled)"


def resolve_token() -> str:
    for var in ("GITHUB_TOKEN", "GH_TOKEN"):
        if os.environ.get(var):
            return os.environ[var]
    try:
        r = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True, check=True, timeout=5)
        return r.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def api_request(url: str, token: str, method: str = "GET", payload: dict | None = None) -> dict | list:
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "avd-ops-org-sweep"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def load_repos(repos_file: Path | None, org: str | None, only: list[str], token: str) -> list[str]:
    repos: list[str] = []
    if repos_file and repos_file.exists():
        data = json.loads(repos_file.read_text(encoding="utf-8"))
        repos = [r["repo"] for r in data.get("repos", []) if r.get("repo")]
    elif org:
        page = 1
        while True:
            batch = api_request(
                f"{REST_URL}/orgs/{org}/repos?type=public&per_page=100&page={page}", token
            )
            if not batch:
                break
            repos.extend(r["full_name"] for r in batch if not r.get("archived"))
            if len(batch) < 100:
                break
            page += 1
    else:
        raise ValueError("Specify --repos-file or --org.")
    if only:
        want = {r.lower() for r in only}
        repos = [r for r in repos if r.lower() in want]
    return repos


def failed_checks(rollup: dict | None) -> list[str]:
    if not rollup:
        return []
    names: list[str] = []
    for node in (rollup.get("contexts") or {}).get("nodes") or []:
        kind = node.get("__typename")
        if kind == "CheckRun" and node.get("conclusion") in FAIL_CONCLUSIONS:
            names.append(node.get("name") or "check")
        elif kind == "StatusContext" and node.get("state") in FAIL_STATES:
            names.append(node.get("context") or "status")
    return sorted(set(names))


def is_bot(login: str | None) -> bool:
    return (login or "").lower() in BOT_AUTHORS


def analyze_repo(
    repo_name: str,
    repo_data: dict,
    now: datetime,
    stale_days: int,
    bot_stale_days: int,
    lookback_days: int,
) -> dict:
    """Extract actionable PR/CI findings and metrics from a single GraphQL repository payload."""
    stale_cutoff = now - timedelta(days=stale_days)
    bot_cutoff = now - timedelta(days=bot_stale_days)
    lookback_cutoff = now - timedelta(days=lookback_days)

    findings: list[dict] = []
    bot_summary: list[dict] = []

    default_ref = repo_data.get("defaultBranchRef") or {}
    default_rollup = ((default_ref.get("target") or {}).get("statusCheckRollup")) or {}
    default_fails = failed_checks(default_rollup)
    if default_fails:
        findings.append({
            "repo": repo_name,
            "kind": "default_branch_ci",
            "title": f"Default branch `{default_ref.get('name', 'main')}` failing: {', '.join(default_fails)}",
            "url": f"https://github.com/{repo_name}/actions",
        })

    open_prs = (repo_data.get("openPrs") or {}).get("nodes") or []
    human_open = 0
    bot_open = 0
    stale_count = 0

    for pr in open_prs:
        author = (pr.get("author") or {}).get("login") or "unknown"
        bot = is_bot(author)
        if bot:
            bot_open += 1
        else:
            human_open += 1

        updated = parse_iso(pr.get("updatedAt"))
        commits = (pr.get("commits") or {}).get("nodes") or []
        rollup = ((commits[-1].get("commit") or {}).get("statusCheckRollup")) if commits else None
        fails = failed_checks(rollup)
        conflict = pr.get("mergeable") == "CONFLICTING"
        is_stale = bool(updated and updated < (bot_cutoff if bot else stale_cutoff))
        unreviewed = (not bot) and (not pr.get("isDraft")) and ((pr.get("reviews") or {}).get("totalCount", 0) == 0) and is_stale

        if is_stale:
            stale_count += 1

        reasons: list[str] = []
        if fails:
            reasons.append(f"failing: {', '.join(fails[:3])}")
        if conflict:
            reasons.append("merge conflict")
        if is_stale:
            age_days = (now - updated).days if updated else stale_days
            reasons.append(f"stale ({age_days}d)")
        if unreviewed and not is_stale:
            reasons.append("unreviewed")

        entry = {
            "repo": repo_name,
            "kind": "bot_pr" if bot else "pr",
            "number": pr["number"],
            "title": sanitize_title(pr.get("title") or ""),
            "url": pr["url"],
            "author": author,
            "reasons": reasons,
        }

        if bot:
            if fails or is_stale:
                findings.append(entry)
            else:
                bot_summary.append(entry)
        elif reasons:
            findings.append(entry)

    merged_nodes = (repo_data.get("mergedPrs") or {}).get("nodes") or []
    merged_recent = 0
    merge_hours: list[float] = []
    for m in merged_nodes:
        merged_at = parse_iso(m.get("mergedAt"))
        created_at = parse_iso(m.get("createdAt"))
        if merged_at and merged_at >= lookback_cutoff:
            merged_recent += 1
            if created_at and not is_bot((m.get("author") or {}).get("login")):
                merge_hours.append(round((merged_at - created_at).total_seconds() / 3600, 1))

    rel = repo_data.get("latestRelease") or {}
    metrics = {
        "repo": repo_name,
        "stars": repo_data.get("stargazerCount", 0),
        "forks": repo_data.get("forkCount", 0),
        "open_issues": (repo_data.get("issues") or {}).get("totalCount", 0),
        "open_prs_human": human_open,
        "open_prs_bot": bot_open,
        "stale_prs": stale_count,
        "merged_recent": merged_recent,
        "median_merge_hours": round(statistics.median(merge_hours), 1) if merge_hours else None,
        "default_ci_ok": not bool(default_fails),
        "latest_release": rel.get("tagName"),
    }
    return {"findings": findings, "bot_summary": bot_summary, "metrics": metrics}


def run_sweep(
    repos: list[str],
    token: str,
    stale_days: int = 7,
    bot_stale_days: int = 14,
    lookback_days: int = 7,
    now: datetime | None = None,
) -> dict:
    now = now or datetime.now(timezone.utc)
    findings: list[dict] = []
    bot_summary: list[dict] = []
    metrics: list[dict] = []
    errors: list[dict] = []

    for full_name in repos:
        if "/" not in full_name:
            errors.append({"repo": full_name, "error": "invalid repo format (expected owner/name)"})
            continue
        owner, name = full_name.split("/", 1)
        try:
            resp = api_request(
                GRAPHQL_URL,
                token,
                method="POST",
                payload={"query": REPO_QUERY, "variables": {"owner": owner, "name": name}},
            )
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
            errors.append({"repo": full_name, "error": str(exc)})
            continue

        if resp.get("errors"):
            msg = "; ".join(e.get("message", "GraphQL error") for e in resp["errors"])
            errors.append({"repo": full_name, "error": msg})
            continue

        repo_data = (resp.get("data") or {}).get("repository")
        if not repo_data:
            errors.append({"repo": full_name, "error": "repository not found or inaccessible"})
            continue
        if repo_data.get("isArchived"):
            continue

        res = analyze_repo(full_name, repo_data, now, stale_days, bot_stale_days, lookback_days)
        findings.extend(res["findings"])
        bot_summary.extend(res["bot_summary"])
        metrics.append(res["metrics"])

    totals = {
        "repos_scanned": len(metrics),
        "repos_errored": len(errors),
        "actionable_findings": len(findings),
        "open_prs_human": sum(m["open_prs_human"] for m in metrics),
        "open_prs_bot": sum(m["open_prs_bot"] for m in metrics),
        "merged_recent": sum(m["merged_recent"] for m in metrics),
        "open_issues": sum(m["open_issues"] for m in metrics),
        "stars": sum(m["stars"] for m in metrics),
        "forks": sum(m["forks"] for m in metrics),
    }
    return {
        "generated_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "lookback_days": lookback_days,
        "stale_days": stale_days,
        "bot_stale_days": bot_stale_days,
        "totals": totals,
        "findings": findings,
        "bot_summary": bot_summary,
        "metrics": metrics,
        "errors": errors,
    }


def findings_hash(report: dict) -> str:
    canonical = json.dumps(
        {"findings": report["findings"], "errors": report["errors"]},
        sort_keys=True,
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]


def render_markdown(report: dict) -> str:
    t = report["totals"]
    lines = [
        f"## Org Sweep & Metrics ({report['generated_at'][:10]})",
        "",
        f"Scanned **{t['repos_scanned']}** repo(s) | "
        f"**{t['actionable_findings']}** actionable item(s) | "
        f"**{t['open_prs_human']}** human PR(s) & **{t['open_prs_bot']}** bot PR(s) open | "
        f"**{t['merged_recent']}** merged in last {report['lookback_days']}d | "
        f"**{t['open_issues']}** open issues | **{t['stars']}** stars / **{t['forks']}** forks",
        "",
        "### Action needed",
    ]
    if not report["findings"]:
        lines.append("- None — all scanned PRs and default branches look healthy.")
    else:
        for f in report["findings"]:
            if f["kind"] == "default_branch_ci":
                lines.append(f"- [ ] **{f['repo']}**: [{f['title']}]({f['url']})")
            else:
                why = ", ".join(f["reasons"])
                lines.append(
                    f"- [ ] **{f['repo']}** [#{f['number']} {f['title']}]({f['url']}) — {why}"
                )

    if report["bot_summary"]:
        lines.extend(["", f"### Active bot PRs ({len(report['bot_summary'])} healthy/recent)"])
        for b in report["bot_summary"][:15]:
            lines.append(f"- **{b['repo']}** [#{b['number']} {b['title']}]({b['url']}) ({b['author']})")
        if len(report["bot_summary"]) > 15:
            lines.append(f"- ...and {len(report['bot_summary']) - 15} more")

    lines.extend([
        "",
        "### Repo Scorecard",
        "| Repo | Open PRs (H/B) | Merged | Median Merge (h) | Issues | CI | Release | Stars |",
        "| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |",
    ])
    for m in report["metrics"]:
        med = f"{m['median_merge_hours']}" if m["median_merge_hours"] is not None else "—"
        ci = "pass" if m["default_ci_ok"] else "fail"
        rel = m["latest_release"] or "—"
        short = m["repo"].split("/", 1)[-1]
        lines.append(
            f"| {short} | {m['open_prs_human']}/{m['open_prs_bot']} | {m['merged_recent']} | "
            f"{med} | {m['open_issues']} | {ci} | {rel} | {m['stars']} |"
        )

    if report["errors"]:
        lines.extend(["", "### Repo Errors / Skipped"])
        for e in report["errors"]:
            lines.append(f"- **{e['repo']}**: {e['error']}")

    lines.extend(["", f"<!-- sweep-hash:{findings_hash(report)} -->"])
    return "\n".join(lines)


def write_metrics(path: Path, report: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix == ".jsonl":
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(report) + "\n")
    else:
        path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


def post_digest_issue(target_repo: str, label: str, report: dict, body: str, token: str, always: bool) -> str:
    if not report["findings"] and not always:
        return "skipped (no actionable findings)"
    digest_hash = findings_hash(report)
    open_issues = api_request(
        f"{REST_URL}/repos/{target_repo}/issues?state=open&labels={label}&per_page=20",
        token,
    )
    for iss in open_issues:
        existing_body = iss.get("body") or ""
        m = SWEEP_HASH_RE.search(existing_body)
        if m and m.group(1) == digest_hash:
            return f"skipped (matches open #{iss['number']})"
        if not CHECKED_BOX_RE.search(existing_body) and iss.get("comments", 0) == 0:
            api_request(
                f"{REST_URL}/repos/{target_repo}/issues/{iss['number']}",
                token,
                method="PATCH",
                payload={"state": "closed", "state_reason": "not_planned"},
            )
    title = f"Org sweep: {report['totals']['actionable_findings']} item(s) ({report['generated_at'][:10]})"
    created = api_request(
        f"{REST_URL}/repos/{target_repo}/issues",
        token,
        method="POST",
        payload={"title": title, "body": body, "labels": [label]},
    )
    return f"opened #{created.get('number')}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--repos-file", type=Path, help="Path to repos.json manifest")
    ap.add_argument("--org", help="GitHub organization to scan (public non-archived repos)")
    ap.add_argument("--repo", action="append", default=[], help="Filter to specific owner/repo (repeatable)")
    ap.add_argument("--stale-days", type=int, default=7, help="Days before a human/agent PR is stale")
    ap.add_argument("--bot-stale-days", type=int, default=14, help="Days before a bot PR is stale")
    ap.add_argument("--lookback-days", type=int, default=7, help="Lookback window for merged PR metrics")
    ap.add_argument("--format", choices=("markdown", "json"), default="markdown")
    ap.add_argument("--metrics-out", type=Path, help="Write JSON snapshot (.json) or append history (.jsonl)")
    ap.add_argument("--post-issue", help="Host owner/repo to open a digest issue in")
    ap.add_argument("--label", default="org-sweep", help="Issue label for digest issues")
    ap.add_argument("--always-issue", action="store_true", help="Open an issue even when there are 0 findings")
    ap.add_argument("--dry-run", action="store_true", help="Do not post/close issues")
    ap.add_argument("--fail-on-findings", action="store_true", help="Exit 1 if actionable findings exist")
    args = ap.parse_args()

    repos_file = args.repos_file
    if not repos_file and not args.org:
        default_manifest = ROOT / "repos.json"
        if default_manifest.exists():
            repos_file = default_manifest

    token = resolve_token()
    repos = load_repos(repos_file, args.org, args.repo, token)
    report = run_sweep(repos, token, args.stale_days, args.bot_stale_days, args.lookback_days)

    if args.metrics_out:
        write_metrics(args.metrics_out, report)

    output = json.dumps(report, indent=2) if args.format == "json" else render_markdown(report)
    print(output)

    if args.post_issue and not args.dry_run:
        md = render_markdown(report)
        status = post_digest_issue(args.post_issue, args.label, report, md, token, args.always_issue)
        print(f"org-sweep issue: {status}", file=sys.stderr)

    if args.fail_on_findings and report["totals"]["actionable_findings"] > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
