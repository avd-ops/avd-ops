---
title: "avd-swarm"
summary: "On top, the how of operating: agents that read freely and change nothing until a person approves the plan"
topic: repos
status: partial
last_reviewed: 2026-10-20
---

# avd-swarm

Agents that run an estate, changing nothing until a person approves the exact plan.

<!-- more -->

Agents that manage Azure and Entra ID without the portals. They read freely and change nothing until a person approves the exact plan.

The repo is the source of truth: [avd-ops/avd-swarm](https://github.com/avd-ops/avd-swarm). This page says where it fits.

## What it does

Specialist agents read and propose. Every write is an approved plan behind one kill switch.

- A coordinator hands questions to specialist agents: readiness, deploy, hosts, images, users and cost.
- Writes go through plans approved in GitHub Environments, with one layered kill switch only the owner resets.
- The write path never runs in the public repo; adopters run it from a private repo synced from a release tag.
- Today only the S1a spike runs. Everything after the first two write actions is designed, not scheduled.

## How it fits

It only knows what the brain cites, and checks live state again before any change.

- Gets estate facts only from [avd-second-brain](avd-second-brain.md), as cited C11 and C12 evidence, and re-reads live state before any change.
- Changes together with avd-second-brain (decision 0003).

## Read more in the repo

- [README](https://github.com/avd-ops/avd-swarm/blob/main/README.md)
- [Spec](https://github.com/avd-ops/avd-swarm/blob/main/docs/spec.md)
- [Governance](https://github.com/avd-ops/avd-swarm/blob/main/docs/governance.md)
