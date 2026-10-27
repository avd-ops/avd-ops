# Decision records

Every choice that shapes these docs and the work they cover, one record each.

<!-- more -->

One file per decision, numbered in order, in [MADR 4](https://adr.github.io/madr/) format. Copy
[template.md](template.md) to add one. A decision stays `proposed` until the maintainer says yes.
A reversed decision gets a new record, and the old one is marked *Superseded by NNNN*. Each KB in
the family numbers its own decisions; refer to a sibling's as `<project> 0012`, with a link.

<!-- BEGIN GENERATED: decision-index (from front matter; run scripts/kb/build.py) -->
| # | Decision | Status |
|---|---|---|
| [0001](0001-adopt-the-2ndbrain-format.md) | Adopt the 2ndbrain knowledge base format, version 1 | Accepted |
| [0002](0002-avd-ops-is-the-front-door.md) | avd-ops is the front door for the AVD repos | Accepted |
| [0003](0003-the-family-ends-at-its-contracts.md) | The family ends at its contracts; work outside it builds on them, never the reverse | Proposed |
| [0004](0004-submissions-are-github-issue-forms.md) | Every outside submission is a GitHub issue form in the repo that owns it | Accepted |
| [0005](0005-one-app-shell-for-every-page.md) | One app shell for every avd-ops page, vendored as a pinned copy | Accepted |
| [0006](0006-run-anywhere.md) | Every operator script runs from either Cloud Shell prompt and on Windows, macOS and Linux | Accepted |
| [0007](0007-starters-not-a-theme-repo.md) | The theme ships as starters and a brand profile in avd-ops, not as its own repo or package | Proposed |
| [0008](0008-code-signing.md) | Family scripts ship as attested, immutable releases; Authenticode only where Windows enforces it | Accepted |
| [0009](0009-split-landing-zone-into-five-control-planes.md) | Split deployment into five control-plane repos orchestrated by avd-landing-zone | Accepted |
| [0010](0010-expand-assess-and-current-state-across-five-control-planes.md) | Expand avd-assess and avd-current-state natively across all five control planes | Accepted |
<!-- END GENERATED: decision-index -->
