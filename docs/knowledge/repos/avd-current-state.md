---
title: "avd-current-state"
summary: "What is there now: read-only PowerShell that collects an AVD environment across all five control planes, validates it and writes redacted C11 facts"
topic: repos
status: partial
last_reviewed: 2026-10-27
---

# avd-current-state

What is in an estate right now, read-only: the collector and the validator across all five control planes.

<!-- more -->

Read-only PowerShell that answers what is in an AVD environment today across Azure, Entra ID, Intune, Microsoft 365 and Power Platform, whether an estate is ready for a deployment, and whether the deployment landed correctly ([decision 0010](../decisions/0010-expand-assess-and-current-state-across-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-current-state](https://github.com/avd-ops/avd-current-state). This page says where it fits.

## What it does

It collects evidence, checks a deployment before and after across selected control planes, and never changes anything.

- The collector builds a portable evidence package of the AVD workload and the five control planes (`azure`, `entra`, `intune`, `m365` and `power-platform`), degrading gracefully to `unknown` for any plane skipped or unconsented.
- The validator runs preflight and post-deployment checks across `-Planes` and writes a pass/fail report, optionally reading the stage handoff manifests (`entra-manifest.json`, `intune-manifest.json`, `m365-manifest.json`, `azure-outputs.json`, `power-platform-manifest.json`).
- Only `GET`, `Get-` and `Test-` calls with zero write scopes, pinned in `rebuild/scope.json` and guarded in CI. Nothing is created, changed or deleted.
- The facts script turns packages into one redacted snapshot (contract C11) with plane-scoped namespaces (`c11.entra.*`, `c11.intune.*`, `c11.m365.*`, `c11.powerPlatform.*` and Azure paths): counts, public values and pseudonyms, no names or IDs.

## How it fits

Its redacted facts feed the brain, and its validator and assessment portal check the five-plane landing zone.

- Its C11 facts feed [avd-second-brain](avd-second-brain.md); avd-swarm sees them only as cited evidence from the brain.
- The validator checks a [avd-landing-zone](avd-landing-zone.md) deployment before and after across [avd-entra](avd-entra.md), [avd-intune](avd-intune.md), [avd-m365](avd-m365.md), [avd-azure](avd-azure.md) and [avd-power-platform](avd-power-platform.md), and the assessment portal exports plane-grouped C24 remediation plans.

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-current-state/blob/main/README.md)
