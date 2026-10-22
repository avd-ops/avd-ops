---
title: "avd-second-brain"
summary: "On top, the why: the knowledge base, contract registry and fact register over the environment's life"
topic: repos
status: partial
last_reviewed: 2026-10-20
---

# avd-second-brain

The why behind every rule, kept over an estate's whole life. It never changes anything.

<!-- more -->

One memory across the AVD lifecycle: what each estate looked like, what broke, what was learned, and why each rule is what it is.

The repo is the source of truth: [avd-ops/avd-second-brain](https://github.com/avd-ops/avd-second-brain). This page says where it fits.

## What it does

A knowledge base, private vaults for each estate, and the contracts every repo uses.

- A knowledge base of generalized facts: app catalog, rules with their history, sizing calibration and shared runbooks.
- Estate vaults keep one customer's estate in that customer's own private repo. Tenant data never comes back here.
- The contract registry and fact register that every repo boundary uses.
- A docs consistency check every repo calls. Each repo's page lives here on avd-ops; the brain's old generated handbook is retired.

## How it fits

It thinks for avd-swarm and reads from the two foundation repos.

- Thinks for [avd-swarm](avd-swarm.md), which acts; the brain never holds a write credential.
- Reads facts from [avd-current-state](avd-current-state.md) and lessons from [avd-landing-zone](avd-landing-zone.md).

## Read more in the repo

- [README](https://github.com/avd-ops/avd-second-brain/blob/main/README.md)
- [Architecture](https://github.com/avd-ops/avd-second-brain/blob/main/docs/architecture.md)
- [Contracts](https://github.com/avd-ops/avd-second-brain/blob/main/docs/contracts.md)
- [Knowledge base](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/README.md)
