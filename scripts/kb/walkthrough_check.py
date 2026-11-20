"""Report which public repos in repos.json have getting-started walkthrough coverage."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def check_walkthroughs(root: Path = ROOT) -> dict:
    repos_data = json.loads((root / "repos.json").read_text(encoding="utf-8"))
    gs_dir = root / "docs" / "knowledge" / "getting-started"
    gs_text = "\n".join(
        p.read_text(encoding="utf-8")
        for p in sorted(gs_dir.glob("*.md"))
    )

    covered: list[str] = []
    uncovered: list[dict[str, str]] = []
    for entry in repos_data.get("repos", []):
        name = entry.get("name", "")
        if not name or name == "avd-ops":
            continue
        pattern = re.compile(rf"\b{re.escape(name)}\b")
        if pattern.search(gs_text):
            covered.append(name)
        else:
            uncovered.append({
                "name": name,
                "maturity": entry.get("maturity", "unknown"),
                "layer": entry.get("layer", "unknown"),
            })

    return {
        "total": len(covered) + len(uncovered),
        "covered": covered,
        "uncovered": uncovered,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Emit JSON summary")
    args = parser.parse_args(argv)

    result = check_walkthroughs()
    if args.json:
        print(json.dumps(result, indent=2))
        return 0

    print(
        f"Walkthrough coverage: {len(result['covered'])}/{result['total']} "
        f"public repos referenced in docs/knowledge/getting-started/ "
        f"({len(result['uncovered'])} uncovered)."
    )
    for item in result["uncovered"]:
        print(f"  - {item['name']} ({item['layer']}, {item['maturity']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
