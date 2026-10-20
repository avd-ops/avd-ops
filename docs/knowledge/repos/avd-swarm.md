---
title: "avd-swarm"
summary: "On top, the how of operating: agents that read freely and change nothing until a person approves the plan"
topic: repos
status: partial
last_reviewed: 2026-10-20
---

# avd-swarm

**On top: the how of operating.** Agents that manage Azure and Entra ID without the portals. They read freely and change nothing until a person approves the exact plan.

The repo is the source of truth: [nickprignano/avd-swarm](https://github.com/nickprignano/avd-swarm). This page says where it fits.

## What it does

- A coordinator hands questions to specialist agents: readiness, deploy, hosts, images, users and cost.
- Writes go through plans approved in GitHub Environments, with one layered kill switch only the owner resets.
- The write path never runs in the public repo; adopters run it from a private repo synced from a release tag.
- Today only the S1a spike runs. Everything after the first two write actions is designed, not scheduled.

## How it fits

- Gets estate facts only from [avd-second-brain](avd-second-brain.md), as cited C11 and C12 evidence, and re-reads live state before any change.
- Changes together with avd-second-brain (decision 0003).

## Read more in the repo

- [README](https://github.com/nickprignano/avd-swarm/blob/main/README.md)
- [Spec](https://github.com/nickprignano/avd-swarm/blob/main/docs/spec.md)
- [Governance](https://github.com/nickprignano/avd-swarm/blob/main/docs/governance.md)
