---
title: "avd-second-brain"
summary: "On top, Desktop DevOps intelligence: the knowledge base, contract registry and fact register across AVD, Windows 365 and Intune"
topic: repos
status: partial
last_reviewed: 2026-11-02
---

# avd-second-brain

Desktop DevOps intelligence and memory across AVD, Windows 365 and Intune. It never changes anything.

<!-- more -->

One memory across the cloud desktop lifecycle: what each estate looked like across Azure Virtual Desktop, Windows 365 Cloud PCs and Microsoft Intune, what broke, what was learned, and why each rule and policy is what it is ([decision 0012](../decisions/0012-desktop-devops-for-avd-win365-and-intune.md)).

The repo is the source of truth: [avd-ops/avd-second-brain](https://github.com/avd-ops/avd-second-brain). This page says where it fits.

## What it does

A Desktop DevOps knowledge base, private vaults for each estate, and the contracts every repo uses.

<!-- more -->

- A knowledge base of generalized Desktop DevOps facts: workload placement rules (pooled AVD vs. personal AVD vs. Windows 365 Enterprise vs. Frontline), Intune policy-as-code and assignment filter rules, app catalog, sizing calibration and shared runbooks.
- Estate vaults keep one customer's estate in that customer's own private repo. Tenant data never comes back here.
- The contract registry and fact register (`C9`, `C10`, `C11`, `C14`, `C15`, `C18`, `C19`) that every repo boundary uses across AVD, Windows 365 and Intune.
- A docs consistency check every repo calls. Each repo's page lives here on avd-ops; the brain's old generated handbook is retired.

## How it fits

It thinks for avd-swarm and reads from the foundation repos across all five control planes.

<!-- more -->

- Thinks for [avd-swarm](avd-swarm.md), which acts; the brain never holds a write credential ([decision 0012](../decisions/0012-desktop-devops-for-avd-win365-and-intune.md)).
- Reads facts from [avd-current-state](avd-current-state.md) and lessons from [avd-landing-zone](avd-landing-zone.md) and [avd-intune](avd-intune.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README](https://github.com/avd-ops/avd-second-brain/blob/main/README.md)
- [Architecture](https://github.com/avd-ops/avd-second-brain/blob/main/docs/architecture.md)
- [Contracts](https://github.com/avd-ops/avd-second-brain/blob/main/docs/contracts.md)
- [Knowledge base](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/README.md)
