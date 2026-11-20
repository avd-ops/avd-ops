"""Unit tests for scripts/ops/release_train.py."""

import unittest
from datetime import date

from release_train import is_release_train_day, next_patch_tuesday_plus_7, render_report, suggest_next_tag


class ReleaseTrainTests(unittest.TestCase):
    def test_is_release_train_day_only_on_third_tuesday(self):
        # 2026-11-10 is 2nd Tuesday (Patch Tuesday); 2026-11-17 is 3rd Tuesday (PT + 7)
        self.assertFalse(is_release_train_day(date(2026, 11, 10)))
        self.assertTrue(is_release_train_day(date(2026, 11, 17)))
        self.assertFalse(is_release_train_day(date(2026, 11, 20)))
        self.assertFalse(is_release_train_day(date(2026, 11, 24)))
        # 2026-12-15 is 3rd Tuesday of December 2026
        self.assertTrue(is_release_train_day(date(2026, 12, 15)))

    def test_next_patch_tuesday_plus_7(self):
        self.assertEqual(next_patch_tuesday_plus_7(date(2026, 11, 17)), date(2026, 11, 17))
        self.assertEqual(next_patch_tuesday_plus_7(date(2026, 11, 20)), date(2026, 12, 15))

    def test_suggest_next_tag(self):
        self.assertEqual(suggest_next_tag(None), "v0.1.0")
        self.assertEqual(suggest_next_tag("v4.0.0"), "v4.1.0")
        self.assertEqual(suggest_next_tag("pe-v1.0.0"), "pe-v1.1.0")
        self.assertEqual(suggest_next_tag("v1.2.3-rc.1"), "v1.3.0")

    def test_render_report_includes_hash_and_rows(self):
        report = render_report(
            [
                {
                    "name": "avd-assess",
                    "maturity": "pre-beta",
                    "tag": "v4.0.0",
                    "aheadBy": 0,
                    "suggestedTag": "v4.0.0",
                    "hasChangelog": False,
                    "hasReleaseWorkflow": True,
                }
            ],
            "2026.11.0",
            "2026-11-17",
        )
        self.assertIn("platform-v2026.11.0", report)
        self.assertIn("avd-assess", report)
        self.assertIn("_unchanged_", report)
        self.assertIn("<!-- release-train-hash:", report)


if __name__ == "__main__":
    unittest.main()
