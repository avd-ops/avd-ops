---
title: "Weekly digest: 2026-10-26 to 2026-11-01"
date: "2026-11-01"
summary: "Weekly digest (2026-10-26 to 2026-11-01): 1 release, 53 feature updates, 3 findings, 2 fixes across 12 repos."
repos: ["avd-assess", "avd-azure", "avd-benchmark", "avd-current-state", "avd-entra", "avd-intune", "avd-landing-zone", "avd-linecheck", "avd-m365", "avd-ops", "avd-power-platform", "avd-second-brain"]
tags: ["weekly-digest", "release", "features", "findings", "fixes"]
---

Summary of public updates merged, released, or recorded across the **avd-ops** repositories for **2026-10-26 to 2026-11-01**.

## Releases

- **`avd-assess`** (2026-10-27): [v2.0.0 — avd-assess 2.0.0](https://github.com/avd-ops/avd-assess/releases/tag/v2.0.0) (release)

## Features and updates

- **`avd-current-state`** (2026-10-26): [Assessment portal: align header bar with wizard layout and design system (#55)](https://github.com/avd-ops/avd-current-state/pull/55) (merged PR)
- **`avd-current-state`** (2026-10-26): [Local collector spec: owner's answers on name, schedule and build order (#42)](https://github.com/avd-ops/avd-current-state/pull/42) (merged PR)
- **`avd-ops`** (2026-10-26): [Serve generated llms.txt on Pages (#70)](https://github.com/avd-ops/avd-ops/pull/70) (merged PR)
- **`avd-assess`** (2026-10-27): [feat: expand assess methods, checks, contracts, and security review across five planes (#47)](https://github.com/avd-ops/avd-assess/pull/47) (merged PR)
- **`avd-azure`** (2026-10-27): [feat: extract Azure Bicep, sessionhost, image and PSRule engine from avd-landing-zone (decision 0009) (#1)](https://github.com/avd-ops/avd-azure/pull/1) (merged PR)
- **`avd-current-state`** (2026-10-27): [chore: pin avd-assess release v2.0.0 (#57)](https://github.com/avd-ops/avd-current-state/pull/57) (merged PR)
- **`avd-current-state`** (2026-10-27): [feat: expand collector, facts, validator and portal across five control planes (#56)](https://github.com/avd-ops/avd-current-state/pull/56) (merged PR)
- **`avd-entra`** (2026-10-27): [feat(entra): Phase 4 live Graph CRUD, idempotency, teardown, and offline tests (#2)](https://github.com/avd-ops/avd-entra/pull/2) (merged PR)
- **`avd-entra`** (2026-10-27): [feat: add Entra ID groups, report-only Conditional Access and contract schema (decision 0009) (#1)](https://github.com/avd-ops/avd-entra/pull/1) (merged PR)
- **`avd-intune`** (2026-10-27): [feat(intune): implement live Graph CRUD, idempotency, teardown, and offline tests (#2)](https://github.com/avd-ops/avd-intune/pull/2) (merged PR)
- **`avd-intune`** (2026-10-27): [feat: add Intune Settings Catalog, compliance baselines and contract schema (decision 0009) (#1)](https://github.com/avd-ops/avd-intune/pull/1) (merged PR)
- **`avd-landing-zone`** (2026-10-27): [feat(control-planes): Phase 5 top-level orchestrator and portal control-plane selector (decision 0009) (#123)](https://github.com/avd-ops/avd-landing-zone/pull/123) (merged PR)
- **`avd-landing-zone`** (2026-10-27): [feat(portal): wire 5 control-plane repos and stage selection (decision 0009) (#122)](https://github.com/avd-ops/avd-landing-zone/pull/122) (merged PR)
- **`avd-landing-zone`** (2026-10-27): [feat: expand deployment portal and Bicep for multi-pool, Private Link, and per-zone DNS (#121)](https://github.com/avd-ops/avd-landing-zone/pull/121) (merged PR)
- **`avd-landing-zone`** (2026-10-27): [Resync kb-auto-merge from [redacted] (fail closed past 3,000 files and on a failed enable) (#70)](https://github.com/avd-ops/avd-landing-zone/pull/70) (merged PR)
- **`avd-linecheck`** (2026-10-27): [feat: add Azure US Government cloud, workload packs, and diagnostic extras (#10)](https://github.com/avd-ops/avd-linecheck/pull/10) (merged PR)
- **`avd-linecheck`** (2026-10-27): [Portal theme (ds-v2.7.0 + pe-v1.1.0), S1-S4 spikes, and complete v0/v1 spec (#9)](https://github.com/avd-ops/avd-linecheck/pull/9) (merged PR)
- **`avd-m365`** (2026-10-27): [feat(m365): implement live Graph M365 VDI baseline CRUD, teardown and tests (#2)](https://github.com/avd-ops/avd-m365/pull/2) (merged PR)
- **`avd-m365`** (2026-10-27): [feat: add greenfield M365 OneDrive, Teams VDI and M365 Apps baselines (decision 0009) (#1)](https://github.com/avd-ops/avd-m365/pull/1) (merged PR)
- **`avd-ops`** (2026-10-27): [docs: specify five-plane expansion for avd-assess and avd-current-state (decision 0010) (#78)](https://github.com/avd-ops/avd-ops/pull/78) (merged PR)
- **`avd-ops`** (2026-10-27): [docs: update control-plane repo guides with Phase 4 deploy, teardown, and run-manifest details (#77)](https://github.com/avd-ops/avd-ops/pull/77) (merged PR)
- **`avd-ops`** (2026-10-27): [docs: credit Azure Verified Modules, WDOT and PSRule in avd-azure (decision 0009) (#75)](https://github.com/avd-ops/avd-ops/pull/75) (merged PR)
- **`avd-ops`** (2026-10-27): [feat: add five control-plane repos to repos.json, docs and site (decision 0009) (#74)](https://github.com/avd-ops/avd-ops/pull/74) (merged PR)
- **`avd-ops`** (2026-10-27): [docs: add decision 0009 splitting deployment into five control-plane repos (#73)](https://github.com/avd-ops/avd-ops/pull/73) (merged PR)
- **`avd-ops`** (2026-10-27): [docs: expand avd-landing-zone description for multi-pool portal and Private Link (#71)](https://github.com/avd-ops/avd-ops/pull/71) (merged PR)
- **`avd-power-platform`** (2026-10-27): [feat: implement Phase 4 Power Platform CRUD, solution packing, teardown and offline tests (#2)](https://github.com/avd-ops/avd-power-platform/pull/2) (merged PR)
- **`avd-power-platform`** (2026-10-27): [feat: add Power Platform VNet Bicep, DLP baseline and Power Automate solutions (decision 0009) (#1)](https://github.com/avd-ops/avd-power-platform/pull/1) (merged PR)
- **`avd-second-brain`** (2026-10-27): [feat: sync five-plane foundation contracts (C11, C15, C19, C20, C21, C24) (#114)](https://github.com/avd-ops/avd-second-brain/pull/114) (merged PR)
- **`avd-second-brain`** (2026-10-27): [docs(kb): record PUBLIC_IDS zero-GUID guard lesson from PR #123 (#112)](https://github.com/avd-ops/avd-second-brain/pull/112) (merged PR)
- **`avd-second-brain`** (2026-10-27): [docs(kb): record orchestrator dry-run, Entra Kerberos zero-owner, and PSScriptAnalyzer lessons (#111)](https://github.com/avd-ops/avd-second-brain/pull/111) (merged PR)
- **`avd-second-brain`** (2026-10-27): [chore(kb): enforce eol=lf in .gitattributes and record WindowsApps Python alias lesson (#110)](https://github.com/avd-ops/avd-second-brain/pull/110) (merged PR)
- **`avd-second-brain`** (2026-10-27): [docs(kb): record Phase 4 tenant control-plane lessons and known errors (#109)](https://github.com/avd-ops/avd-second-brain/pull/109) (merged PR)
- **`avd-second-brain`** (2026-10-27): [docs(kb): record 5-control-plane split and CI/Windows lessons (#108)](https://github.com/avd-ops/avd-second-brain/pull/108) (merged PR)
- **`avd-second-brain`** (2026-10-27): [Resync kb-auto-merge from [redacted] (fail closed past 3,000 files and on a failed enable) (#33)](https://github.com/avd-ops/avd-second-brain/pull/33) (merged PR)
- **`avd-benchmark`** (2026-10-28): [feat: bootstrap avd-benchmark Tier 1 harness and Explorer Portal (#1)](https://github.com/avd-ops/avd-benchmark/pull/1) (merged PR)
- **`avd-current-state`** (2026-10-28): [Align Test-AvdEndpoints with pinned endpoints.json (#28) and add CLM local collector (#58)](https://github.com/avd-ops/avd-current-state/pull/58) (merged PR)
- **`avd-landing-zone`** (2026-10-28): [feat(portal): link AVD Line Check from Region and Verify steps (#125)](https://github.com/avd-ops/avd-landing-zone/pull/125) (merged PR)
- **`avd-linecheck`** (2026-10-28): [Add optional v2a echo and upload sink Worker and client helpers (#13)](https://github.com/avd-ops/avd-linecheck/pull/13) (merged PR)
- **`avd-linecheck`** (2026-10-28): [Add guided-step margin SVG callout overlays, metadata scanner, and freshness check (#12)](https://github.com/avd-ops/avd-linecheck/pull/12) (merged PR)
- **`avd-linecheck`** (2026-10-28): [feat(results): add connection details and performance metrics display and buttons (#11)](https://github.com/avd-ops/avd-linecheck/pull/11) (merged PR)
- **`avd-ops`** (2026-10-28): [feat(site): list avd-linecheck in repos.json, KB, and site (#80)](https://github.com/avd-ops/avd-ops/pull/80) (merged PR)
- **`avd-ops`** (2026-10-28): [docs(kb): add portal button specificity and root redirect known errors (#79)](https://github.com/avd-ops/avd-ops/pull/79) (merged PR)
- **`avd-second-brain`** (2026-10-28): [KB cost: lessons from the sandbox queue (#123)](https://github.com/avd-ops/avd-second-brain/pull/123) (merged PR)
- **`avd-second-brain`** (2026-10-28): [Close the issue-to-PR loop for digests, freshness and the docs sweep (#122)](https://github.com/avd-ops/avd-second-brain/pull/122) (merged PR)
- **`avd-second-brain`** (2026-10-28): [KB: lessons from moving the portals onto the shared engine (#121)](https://github.com/avd-ops/avd-second-brain/pull/121) (merged PR)
- **`avd-second-brain`** (2026-10-28): [KB: outside coding agents on a public repo (#120)](https://github.com/avd-ops/avd-second-brain/pull/120) (merged PR)
- **`avd-second-brain`** (2026-10-28): [KB: portal issue-report redaction and own-copy publish lessons (#119)](https://github.com/avd-ops/avd-second-brain/pull/119) (merged PR)
- **`avd-second-brain`** (2026-10-28): [Add a public AZ-140 and AZ-104 study guide to the KB (#118)](https://github.com/avd-ops/avd-second-brain/pull/118) (merged PR)
- **`avd-second-brain`** (2026-10-28): [Record Constrained Language Mode local collector and avd-linecheck lessons (#117)](https://github.com/avd-ops/avd-second-brain/pull/117) (merged PR)
- **`avd-second-brain`** (2026-10-28): [docs(kb): add gh pr create PowerShell quoting and portal CSS hover specificity known errors (#116)](https://github.com/avd-ops/avd-second-brain/pull/116) (merged PR)
- **`avd-second-brain`** (2026-10-28): [Capture S1a live sandbox run lessons (ARM 4 MB limit, Kerberos app owner, MFA cache) (#115)](https://github.com/avd-ops/avd-second-brain/pull/115) (merged PR)
- **`avd-second-brain`** (2026-10-28): [docs(kb): record the Playwright details panel and step aria-label lesson (#113)](https://github.com/avd-ops/avd-second-brain/pull/113) (merged PR)
- **`avd-landing-zone`** (2026-10-29): [AGENTS.md: switch to the hub's "How to make a change" wording (#126)](https://github.com/avd-ops/avd-landing-zone/pull/126) (merged PR)

## Findings and decisions

- **`avd-ops`** (2026-10-27): [0009. Split deployment into five control-plane repos orchestrated by avd-landing-zone](https://github.com/avd-ops/avd-ops/blob/main/docs/knowledge/decisions/0009-split-landing-zone-into-five-control-planes.md) (Decision record)
- **`avd-ops`** (2026-10-27): [0010. Expand avd-assess and avd-current-state natively across all five control planes](https://github.com/avd-ops/avd-ops/blob/main/docs/knowledge/decisions/0010-expand-assess-and-current-state-across-five-control-planes.md) (Decision record)
- **`avd-ops`** (2026-10-28): [0011. Split the benchmark platform between avd-assess (profiles and corpus) and avd-benchmark (harness and explorer)](https://github.com/avd-ops/avd-ops/blob/main/docs/knowledge/decisions/0011-avd-benchmark-and-assess-corpus.md) (Decision record)

## Fixes and hardening

- **`avd-ops`** (2026-10-27): [fix: support Windows run-anywhere paths and record KB lessons (#76)](https://github.com/avd-ops/avd-ops/pull/76) (merged PR)
- **`avd-landing-zone`** (2026-10-28): [fix: keep compiled subscription template under 4 MB and accept operator-owned storage Kerberos app (lessons 0037, 0038) (#124)](https://github.com/avd-ops/avd-landing-zone/pull/124) (merged PR)
