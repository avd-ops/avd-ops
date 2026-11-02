---
title: "avd-swarm"
summary: "On top, Desktop DevOps execution: agents across AVD, Windows 365 and Intune that read freely and change nothing until a person approves the plan"
topic: repos
status: partial
last_reviewed: 2026-11-02
---

# avd-swarm

Desktop DevOps agents across AVD, Windows 365 and Intune, changing nothing until a person approves the exact plan.

<!-- more -->

Agents that manage Azure Virtual Desktop, Windows 365 Cloud PCs and Microsoft Intune policy-as-code without portal click-ops ([decision 0012](../decisions/0012-desktop-devops-for-avd-win365-and-intune.md)). They read freely and change nothing until a person approves the exact plan.

The repo is the source of truth: [avd-ops/avd-swarm](https://github.com/avd-ops/avd-swarm). This page says where it fits.

## What it does

Specialist Desktop DevOps agents read and propose. Every write is an approved plan behind one kill switch.

<!-- more -->

- A coordinator hands questions to specialist Desktop DevOps agents: `readiness`, `deploy`, `hosts-and-cloudpcs`, `intune-policy`, `images-and-apps`, `users-and-access` and `cost-and-licensing`.
- Detects Intune Settings Catalog and Windows 365 provisioning policy drift, proposes ring-by-ring policy promotions, and manages session-host and Cloud PC operations.
- Writes go through `C9` plans approved in GitHub Environments, with a `dataLossGuard` on destructive actions and one layered kill switch only the owner resets.
- The write path never runs in the public repo; adopters run it from a private repo synced from a release tag.
- Today only the S1a spike runs. Everything after the first two write actions is designed, not scheduled.

## How it fits

It only knows what the brain cites, and checks live state again before any change.

<!-- more -->

- Gets estate facts across AVD, Windows 365 and Intune only from [avd-second-brain](avd-second-brain.md), as cited C11 and C12 evidence, and re-reads live state before any change.
- Changes together with avd-second-brain (decision 0003 and [decision 0012](../decisions/0012-desktop-devops-for-avd-win365-and-intune.md)).

## Read more in the repo

The repo has the full detail. Start here:

- [README](https://github.com/avd-ops/avd-swarm/blob/main/README.md)
- [Spec](https://github.com/avd-ops/avd-swarm/blob/main/docs/spec.md)
- [Governance](https://github.com/avd-ops/avd-swarm/blob/main/docs/governance.md)
