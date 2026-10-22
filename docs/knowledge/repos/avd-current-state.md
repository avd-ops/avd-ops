---
title: "avd-current-state"
summary: "What is there now: read-only PowerShell that collects an AVD environment, validates it and writes redacted C11 facts"
topic: repos
status: partial
last_reviewed: 2026-10-21
---

# avd-current-state

What is in an estate right now, read-only: the collector and the validator.

<!-- more -->

Read-only PowerShell that answers what is in an AVD environment today, whether a subscription is ready for a deployment, and whether the deployment landed correctly.

The repo is the source of truth: [avd-ops/avd-current-state](https://github.com/avd-ops/avd-current-state). This page says where it fits.

## What it does

It collects evidence, checks a deployment before and after, and never changes anything.

- The collector builds a portable evidence package of the AVD workload and the platform around it.
- The validator runs preflight and post-deployment checks and writes a pass/fail report.
- Only `Get-` and `Test-` calls against Azure. Nothing is created, changed or deleted.
- The facts script turns packages into one redacted snapshot (contract C11): counts, public values and pseudonyms, no names or IDs.

## How it fits

Its redacted facts feed the brain, and its validator checks the landing zone.

- Its C11 facts feed [avd-second-brain](avd-second-brain.md); avd-swarm sees them only as cited evidence from the brain.
- The validator checks a [avd-landing-zone](avd-landing-zone.md) deployment before and after.

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-current-state/blob/main/README.md)
