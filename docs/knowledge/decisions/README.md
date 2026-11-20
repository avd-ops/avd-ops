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
| [0011](0011-avd-benchmark-and-assess-corpus.md) | Split the benchmark platform between avd-assess (profiles and corpus) and avd-benchmark (harness and explorer) | Proposed |
| [0012](0012-desktop-devops-for-avd-win365-and-intune.md) | Position avd-second-brain and avd-swarm as Desktop DevOps for AVD, Windows 365 and Intune | Accepted |
| [0013](0013-azure-us-government-and-gcc-high-support.md) | Support Azure US Government and Microsoft 365 GCC High across all five control planes | Accepted |
| [0014](0014-add-avd-networking-connectivity-control-plane.md) | Add avd-networking as the Connectivity control-plane repo | Accepted |
| [0015](0015-add-avd-gcp-hybrid-control-plane.md) | Add avd-gcp as the GCP Hybrid session-host control-plane repo | Proposed |
| [0016](0016-terraform-as-enterprise-iac-option.md) | Position Terraform (avd-hcl) as the enterprise IaC option alongside Bicep | Proposed |
| [0017](0017-platform-decisions-live-in-avd-ops.md) | Keep platform and cross-repo decisions in avd-ops, not avd-second-brain | Proposed |
| [0018](0018-split-project-site-and-public-demo-domains.md) | Split project site (avd-ops.dev) and public demo hub (avd-ops.app) | Accepted |
| [0019](0019-multi-subscription-multi-tenant-lab-topology.md) | Multi-subscription and multi-tenant AVD lab topology | Accepted |
| [0020](0020-lza-bicepparam-starter-export.md) | Frontend Microsoft AVD LZA via an optional C14-to-bicepparam starter export | Accepted |
| [0021](0021-euc-score-byo-output-adapter.md) | Allow EUC Score as a named BYO output-adapter provenance (`euc-score-byo`) | Accepted |
| [0022](0022-cua-external-executor-plumbing.md) | Define public CUA and external-executor plumbing across avd-ops | Proposed |
| [0023](0023-azure-local-support.md) | Support Azure Virtual Desktop on Azure Local via hostPlacement and existing contracts | Accepted |
| [0024](0024-nested-azure-local-lab.md) | Provide an optional nested Azure Local 23H2+ lab prerequisite in Terraform | Proposed |
| [0025](0025-unify-remediate-and-swarm-assistants.md) | Unify the avd-remediate and avd-swarm assistants at the protocol, UX, and corpus layers | Accepted |
| [0026](0026-github-free-limits-and-near-zero-azure-hosting.md) | Call out GitHub Free private-repo limits and allow near-zero Azure page hosting | Accepted |
| [0027](0027-helpdesk-simulator-and-ticket-adapter.md) | Separate helpdesk simulator kit and normalized ticket-adapter boundary | Proposed |
| [0027](0027-open-source-rpa-workload-engine.md) | Adopt FlaUI (.NET Framework 4.8) for open-source RPA workloads in avd-benchmark | Accepted |
| [0028](0028-add-avd-security.md) | Add avd-security for AVD security control plane, posture verification, and detection | Proposed |
| [0029](0029-platform-release-standard.md) | Platform release standard and central release notes on avd-ops.dev | Accepted |
<!-- END GENERATED: decision-index -->
