---
title: "Knowledge base"
summary: "What this knowledge base is, how it's organized, and how to add to it safely"
topic: overview
status: verified
last_reviewed: 2026-10-29
---

# Knowledge base

What this project has learned: research findings, gotchas, fixes with versions, and the decisions
behind them. It's written for people, tools and LLM agents alike. When something new is learned,
add it to the topic page it belongs to instead of starting a new file.

## Index

<!-- BEGIN GENERATED: kb-index (from front matter; run scripts/kb/build.py) -->
| Page | What's in it | Status |
|---|---|---|
| [getting-started/](getting-started/README.md) | What the AVD repos do, which one to open first, and how to try them safely in a lab | verified |
| [getting-started/cloud-shell.md](getting-started/cloud-shell.md) | The conventions every AVD repo follows for Azure Cloud Shell: one self-contained block, pinned sources, nothing kept in the shell, one sign-in, redact before sharing, tear down with evidence | verified |
| [concepts/](concepts/README.md) | The ideas the AVD repos share: lifecycle stages, contracts, read-first agents, tenant data boundaries and knowledge capture | verified |
| [concepts/sandbox-batches.md](concepts/sandbox-batches.md) | How test runs that cost money are queued, priced, approved once at an exact total, run one after another, and torn down with evidence | verified |
| [repos/](repos/README.md) | Each AVD repo, its lifecycle stage and where to read more; every repo is the source of truth for itself | verified |
| [repos/avd-assess.md](repos/avd-assess.md) | Foundation, what it should be: an open AVD assessment methodology across all five control planes that links pinned published sources and adds what real runs observed | verified |
| [repos/avd-azure.md](repos/avd-azure.md) | Control plane: cloud-native Azure ARM and Bicep infrastructure for Azure Virtual Desktop, Private Link, FSLogix Azure Files and session hosts | verified |
| [repos/avd-current-state.md](repos/avd-current-state.md) | What is there now: read-only PowerShell that collects an AVD environment across all five control planes, validates it and writes redacted C11 facts | verified |
| [repos/avd-entra.md](repos/avd-entra.md) | Control plane: Entra ID security groups, dynamic session-host groups, Conditional Access and Entra Kerberos for Azure Virtual Desktop | verified |
| [repos/avd-intune.md](repos/avd-intune.md) | Control plane: Microsoft Intune session-host MDM enrollment, Settings Catalog baselines and compliance policies for Azure Virtual Desktop | verified |
| [repos/avd-landing-zone.md](repos/avd-landing-zone.md) | How it's built and changed from here: a cloud-native AVD landing zone and deployment portal for multiple pools, workspaces and Private Link | verified |
| [repos/avd-linecheck.md](repos/avd-linecheck.md) | End-user browser network check: measures reachability, regional latency, jitter, setup overhead and download sufficiency from the user's device with zero sign-in | verified |
| [repos/avd-m365.md](repos/avd-m365.md) | Control plane: greenfield Microsoft 365 tenant, OneDrive Known Folder Move, Teams VDI optimization and M365 Apps baselines | verified |
| [repos/avd-power-platform.md](repos/avd-power-platform.md) | Control plane: Power Platform environments, DLP policies and Power Automate day-2 workflows for Azure Virtual Desktop | verified |
| [repos/avd-second-brain.md](repos/avd-second-brain.md) | On top, the why: each estate's decisions, use cases and RAID log over its life, the family knowledge base, and the upper layers' contracts | verified |
| [repos/avd-swarm.md](repos/avd-swarm.md) | On top, the how of operating: agents that read freely and change nothing until a person approves the plan | verified |
| [troubleshooting/](troubleshooting/README.md) | Errors hit in this project: symptom, cause, fix and source | verified |
| [roadmap/](roadmap/README.md) | Where each AVD repo is today and what these docs will cover next | plan |
| [curation.md](curation.md) | How the KB stays current: the weekly digest, the prior-art check, the feedback loop, the freshness check and family alignment | verified |
| [experts.md](experts.md) | How we choose which people on this KB's topics the KB follows: the method, the scores and the list | verified |
| [decisions/](decisions/README.md) | Decision records (MADR): what was decided and why |  |
<!-- END GENERATED: kb-index -->

## Related knowledge bases

<!-- BEGIN GENERATED: family (from family.yaml; run scripts/kb/build.py) -->
| Knowledge base | Role | Focus | Source of truth for |
|---|---|---|---|
| [2ndbrain](https://github.com/nickprignano/2ndbrain/tree/main/docs/knowledge) | reference | The template that owns the family knowledge base format | the family knowledge base format; its scripts and schemas |
| [AVD](https://github.com/avd-ops/avd-second-brain/tree/main/docs/knowledge) | member | Azure Virtual Desktop itself, across its lifecycle (assess, inventory, deploy, operate), and the intelligence layer behind avd-swarm | Azure Virtual Desktop platform; FSLogix; session host images in general; the AVD landing zone and its operations; the contracts between the AVD repos |
| [Liquidware](https://github.com/nickprignano/liquidware-ninja/tree/main/docs/knowledge) | member | Liquidware products across virtual and physical desktops (Stratusphere UX, ProfileUnity, FlexApp, CommandCTRL) | Liquidware products (Stratusphere UX, ProfileUnity, FlexApp, CommandCTRL); the Stratusphere API and SpotCheck methodology; how they fit with AVD, Citrix, Horizon and FSLogix, and the avd-liquidware toolkit |
<!-- END GENERATED: family -->

When a fact belongs to a sibling's topic, link to their page instead of copying it. See
[curation.md](curation.md#staying-aligned-with-the-family).

## Before you build something

Every change follows the [guardrails](../guardrails.md). Run the prior-art check first
(`python3 scripts/kb/prior_art.py "<topic>"`, see
[curation.md](curation.md#prior-art-check-kb-prior-art)).

## How to add to it

- **Without editing files:** open a **Knowledge base feedback**, **Known error** or **Suggest an
  expert to follow** issue. When a maintainer labels it `kb-accepted`, a workflow turns it into a
  pull request.
- **With a pull request:** add a bullet to the matching topic page, say what happened, the fix and
  the versions it applies to, and mark anything you haven't confirmed with an italic `*unverified*` marker (the freshness check counts them). Known errors
  go in [troubleshooting/known-errors.yaml](troubleshooting/known-errors.yaml). Decisions are a copy
  of [decisions/template.md](decisions/template.md) at the next number, `proposed` until the
  maintainer says yes. Run `python3 scripts/kb/build.py` and `python3 scripts/kb/validate.py`
  before pushing.
- **How a published page reads** (owner, 2026-10-21: one screen at a time, bottom line first). On
  [avd-ops.dev/docs](https://avd-ops.dev/docs/) the title and intro are the first screen and each
  `##` section is the next one, with Back and Next along the bottom. Open each section with its
  bottom line: one plain sentence, or two, at most 200 characters (a test checks). Put the detail
  after a `<!-- more -->` line; the site folds it behind "+ more", and GitHub and Obsidian hide the
  marker. A decision opens with one line that says what was chosen, and its outcome with the
  chosen option alone, the reasons after the marker.

## Format

Page front matter (`title`, `summary`, `topic`, `status`, `last_reviewed`) is checked against
[schema/page.schema.json](schema/page.schema.json). Decisions are
[MADR 4](https://adr.github.io/madr/) records. The YAML data files each have a JSON Schema in
[schema/](schema/page.schema.json), and the Markdown tables and `llms.txt` are generated from them.
The full system is in the [2ndbrain spec](../2ndbrain/SPEC.md).
