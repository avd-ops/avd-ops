"""Unit tests for scripts/ops/org_sweep.py."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

OPS_DIR = Path(__file__).resolve().parent
if str(OPS_DIR) not in sys.path:
    sys.path.insert(0, str(OPS_DIR))

import org_sweep  # noqa: E402


def _sample_repo_data() -> dict:
    return {
        "nameWithOwner": "avd-ops/avd-example",
        "isArchived": False,
        "stargazerCount": 12,
        "forkCount": 3,
        "issues": {"totalCount": 4},
        "latestRelease": {"tagName": "v1.2.0", "publishedAt": "2026-11-10T00:00:00Z"},
        "defaultBranchRef": {
            "name": "main",
            "target": {
                "statusCheckRollup": {
                    "state": "FAILURE",
                    "contexts": {
                        "nodes": [
                            {"__typename": "CheckRun", "name": "ci", "conclusion": "FAILURE"},
                            {"__typename": "CheckRun", "name": "lint", "conclusion": "SUCCESS"},
                        ]
                    },
                }
            },
        },
        "openPrs": {
            "totalCount": 4,
            "nodes": [
                {
                    "number": 10,
                    "title": "Fix @admin [link]\nnewline",
                    "url": "https://github.com/avd-ops/avd-example/pull/10",
                    "isDraft": False,
                    "createdAt": "2026-11-01T00:00:00Z",
                    "updatedAt": "2026-11-05T00:00:00Z",
                    "mergeable": "CONFLICTING",
                    "reviewDecision": None,
                    "author": {"login": "alice"},
                    "reviews": {"totalCount": 0},
                    "commits": {
                        "nodes": [
                            {
                                "commit": {
                                    "statusCheckRollup": {
                                        "state": "FAILURE",
                                        "contexts": {
                                            "nodes": [
                                                {"__typename": "CheckRun", "name": "kb-capture", "conclusion": "FAILURE"}
                                            ]
                                        },
                                    }
                                }
                            }
                        ]
                    },
                },
                {
                    "number": 11,
                    "title": "Fresh PR with UNKNOWN mergeable",
                    "url": "https://github.com/avd-ops/avd-example/pull/11",
                    "isDraft": False,
                    "createdAt": "2026-11-19T00:00:00Z",
                    "updatedAt": "2026-11-19T00:00:00Z",
                    "mergeable": "UNKNOWN",
                    "reviewDecision": None,
                    "author": {"login": "bob"},
                    "reviews": {"totalCount": 0},
                    "commits": {"nodes": []},
                },
                {
                    "number": 12,
                    "title": "Bump actions/checkout",
                    "url": "https://github.com/avd-ops/avd-example/pull/12",
                    "isDraft": False,
                    "createdAt": "2026-11-18T00:00:00Z",
                    "updatedAt": "2026-11-18T00:00:00Z",
                    "mergeable": "MERGEABLE",
                    "reviewDecision": None,
                    "author": {"login": "dependabot[bot]"},
                    "reviews": {"totalCount": 0},
                    "commits": {"nodes": []},
                },
                {
                    "number": 13,
                    "title": "Old bot PR",
                    "url": "https://github.com/avd-ops/avd-example/pull/13",
                    "isDraft": False,
                    "createdAt": "2026-10-20T00:00:00Z",
                    "updatedAt": "2026-10-25T00:00:00Z",
                    "mergeable": "MERGEABLE",
                    "reviewDecision": None,
                    "author": {"login": "renovate[bot]"},
                    "reviews": {"totalCount": 0},
                    "commits": {"nodes": []},
                },
            ],
        },
        "mergedPrs": {
            "nodes": [
                {
                    "number": 8,
                    "createdAt": "2026-11-18T00:00:00Z",
                    "mergedAt": "2026-11-18T04:00:00Z",
                    "author": {"login": "alice"},
                },
                {
                    "number": 9,
                    "createdAt": "2026-11-18T00:00:00Z",
                    "mergedAt": "2026-11-18T08:00:00Z",
                    "author": {"login": "bob"},
                },
            ]
        },
    }


class OrgSweepTests(unittest.TestCase):
    NOW = datetime(2026, 11, 20, 12, 0, 0, tzinfo=timezone.utc)

    def test_sanitize_title_strips_mentions_and_markdown(self):
        out = org_sweep.sanitize_title("Hi @everyone [click](http://x) `cmd`\nnext")
        self.assertNotIn("@", out)
        self.assertNotIn("[", out)
        self.assertNotIn("`", out)
        self.assertNotIn("\n", out)

    def test_analyze_repo_findings_and_metrics(self):
        res = org_sweep.analyze_repo("avd-ops/avd-example", _sample_repo_data(), self.NOW, 7, 14, 7)
        kinds = [f["kind"] for f in res["findings"]]
        self.assertEqual(kinds, ["default_branch_ci", "pr", "bot_pr"])
        pr_nums = [f["number"] for f in res["findings"] if f["kind"] != "default_branch_ci"]
        self.assertEqual(pr_nums, [10, 13])
        self.assertEqual([b["number"] for b in res["bot_summary"]], [12])

        m = res["metrics"]
        self.assertEqual(m["open_prs_human"], 2)
        self.assertEqual(m["open_prs_bot"], 2)
        self.assertEqual(m["merged_recent"], 2)
        self.assertEqual(m["median_merge_hours"], 6.0)
        self.assertFalse(m["default_ci_ok"])
        self.assertEqual(m["latest_release"], "v1.2.0")

    def test_run_sweep_isolates_per_repo_errors(self):
        calls = []

        def fake_api(url, token, method="GET", payload=None):
            name = payload["variables"]["name"]
            calls.append(name)
            if name == "broken":
                raise TimeoutError("timed out")
            return {"data": {"repository": _sample_repo_data()}}

        with patch.object(org_sweep, "api_request", side_effect=fake_api):
            report = org_sweep.run_sweep(["avd-ops/broken", "avd-ops/avd-example"], "tok", now=self.NOW)

        self.assertEqual(calls, ["broken", "avd-example"])
        self.assertEqual(report["totals"]["repos_scanned"], 1)
        self.assertEqual(report["totals"]["repos_errored"], 1)
        md = org_sweep.render_markdown(report)
        self.assertIn("<!-- sweep-hash:", md)
        self.assertIn("| avd-example |", md)

    def test_post_digest_issue_dedup_and_preserves_triaged(self):
        report = {
            "generated_at": "2026-11-20T12:00:00Z",
            "lookback_days": 7,
            "stale_days": 7,
            "bot_stale_days": 14,
            "totals": {"actionable_findings": 1},
            "findings": [{"repo": "avd-ops/x", "kind": "pr", "number": 1, "title": "t", "url": "u", "reasons": ["stale (8d)"]}],
            "bot_summary": [],
            "metrics": [],
            "errors": [],
        }
        h = org_sweep.findings_hash(report)
        patched = []
        posted = []

        def fake_api(url, token, method="GET", payload=None):
            if method == "GET":
                return [
                    {"number": 50, "body": "- [x] checked item", "comments": 0},
                    {"number": 51, "body": "- [ ] untouched", "comments": 0},
                ]
            if method == "PATCH":
                patched.append(url)
                return {}
            posted.append(payload)
            return {"number": 52}

        with patch.object(org_sweep, "api_request", side_effect=fake_api):
            status = org_sweep.post_digest_issue("avd-ops/avd-ops", "org-sweep", report, "body", "tok", False)
        self.assertEqual(status, "opened #52")
        self.assertEqual(len(patched), 1)
        self.assertIn("/issues/51", patched[0])

        # Matching hash skips creating a duplicate issue
        with patch.object(org_sweep, "api_request", return_value=[{"number": 52, "body": f"<!-- sweep-hash:{h} -->", "comments": 0}]):
            status2 = org_sweep.post_digest_issue("avd-ops/avd-ops", "org-sweep", report, "body", "tok", False)
        self.assertEqual(status2, "skipped (matches open #52)")


if __name__ == "__main__":
    unittest.main()
