---
title: "Knowledge base"
summary: "What this knowledge base is, how it's organised, and how to add to it safely"
topic: overview
status: partial
last_reviewed: 2026-10-18
---

# Knowledge base

What this project has learned: research findings, gotchas, fixes with versions, and the decisions
behind them. It's written for people, tools and LLM agents alike. When something new is learned,
add it to the topic page it belongs to instead of starting a new file.

## Index

<!-- BEGIN GENERATED: kb-index (from front matter; run scripts/kb/build.py) -->
| Page | What's in it | Status |
|---|---|---|
| [getting-started/](getting-started/README.md) | What the AVD repos do, which one to open first, and how to try them safely in a lab | partial |
| [getting-started/cloud-shell.md](getting-started/cloud-shell.md) | The conventions every AVD repo follows for Azure Cloud Shell: one self-contained block, pinned sources, nothing kept in the shell, one sign-in, redact before sharing, tear down with evidence | partial |
| [concepts/](concepts/README.md) | The ideas the AVD repos share: lifecycle stages, contracts, read-first agents, tenant data boundaries and knowledge capture | partial |
| [concepts/sandbox-batches.md](concepts/sandbox-batches.md) | How test runs that cost money are queued, priced, approved once at an exact total, run one after another, and torn down with evidence | partial |
| [repos/](repos/README.md) | Each AVD repo, its lifecycle stage and where to read more; every repo is the source of truth for itself | partial |
| [repos/avd-assess.md](repos/avd-assess.md) | Foundation, what it should be: an open AVD assessment methodology that links pinned published sources and adds what real runs observed | partial |
| [repos/avd-current-state.md](repos/avd-current-state.md) | What is there now: read-only PowerShell that collects an AVD environment, validates it and writes redacted C11 facts | partial |
| [repos/avd-landing-zone.md](repos/avd-landing-zone.md) | How it's built and changed from here: a cloud-native AVD landing zone in one Bicep template, with a deployment portal | partial |
| [repos/avd-second-brain.md](repos/avd-second-brain.md) | On top, the why: the knowledge base, contract registry and fact register over the environment's life | partial |
| [repos/avd-swarm.md](repos/avd-swarm.md) | On top, the how of operating: agents that read freely and change nothing until a person approves the plan | partial |
| [troubleshooting/](troubleshooting/README.md) | Errors hit in this project: symptom, cause, fix and source | partial |
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
| [AVD](https://github.com/nickprignano/avd-second-brain/tree/main/docs/knowledge) | member | Azure Virtual Desktop itself, across its lifecycle (assess, inventory, deploy, operate), and the intelligence layer behind avd-swarm | Azure Virtual Desktop platform; FSLogix; session host images in general; the AVD landing zone and its operations; the contracts between the AVD repos |
| [Liquidware](https://github.com/nickprignano/avd-liquidware/tree/main/docs/knowledge) | member | Liquidware products on virtual desktops, starting with Stratusphere UX in Azure | Liquidware products; Stratusphere UX appliances; the Liquidware tier for the landing zone |
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
  the versions it applies to, and mark anything you haven't confirmed as *unverified*. Known errors
  go in [troubleshooting/known-errors.yaml](troubleshooting/known-errors.yaml). Decisions are a copy
  of [decisions/template.md](decisions/template.md) at the next number, `proposed` until the
  maintainer says yes. Run `python3 scripts/kb/build.py` and `python3 scripts/kb/validate.py`
  before pushing.

## Format

Page front matter (`title`, `summary`, `topic`, `status`, `last_reviewed`) is checked against
[schema/page.schema.json](schema/page.schema.json). Decisions are
[MADR 4](https://adr.github.io/madr/) records. The YAML data files each have a JSON Schema in
[schema/](schema/page.schema.json), and the Markdown tables and `llms.txt` are generated from them.
The full system is in the [2ndbrain spec](../2ndbrain/SPEC.md).
