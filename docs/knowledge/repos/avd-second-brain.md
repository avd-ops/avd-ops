---
title: "avd-second-brain"
summary: "On top, the why: each estate's decisions, use cases and RAID log over its life, the family knowledge base, and the upper layers' contracts"
topic: repos
status: verified
last_reviewed: 2026-10-29
---

# avd-second-brain

The why behind every rule, kept over an estate's whole life. It never changes anything.

<!-- more -->

One memory across the AVD lifecycle: what each estate looked like, what broke, what was learned, and why each rule is what it is.

The repo is the source of truth: [avd-ops/avd-second-brain](https://github.com/avd-ops/avd-second-brain). This page says where it fits.

## What it does

A knowledge base, private vaults for each estate, and the contracts every repo uses.

- Lifecycle records (C18) and a RAID log (C25) for each environment: its use cases, every decision with what else was considered, and the change that carried it out ([decision 0020](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0020-the-brain-is-the-why-layer.md), [decision 0022](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0022-the-brain-keeps-the-raid-log.md), scope in [decision 0024](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0024-the-brain-is-the-estate-brain.md)).
- Estate vaults keep one customer's estate in that customer's own private repo. Tenant data never comes back here.
- Guidance learned across estates (sizing calibration, the app catalog, shared runbooks) and the family knowledge base.
- The schemas for the upper layers' own formats. The foundation contracts and the fact register come from [avd-assess](avd-assess.md), copied byte for byte at a pin ([decision 0021](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0021-foundation-contracts-live-in-avd-assess.md)).
- A docs consistency check every repo calls. Each repo's page lives here on avd-ops; the brain's old generated handbook is retired.

## How it fits

It thinks for avd-swarm and reads from the two foundation repos.

- Thinks for [avd-swarm](avd-swarm.md), which acts; the brain never holds a write credential.
- Reads facts from [avd-current-state](avd-current-state.md) and lessons from [avd-landing-zone](avd-landing-zone.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README](https://github.com/avd-ops/avd-second-brain/blob/main/README.md)
- [Architecture](https://github.com/avd-ops/avd-second-brain/blob/main/docs/architecture.md)
- [Contracts](https://github.com/avd-ops/avd-second-brain/blob/main/docs/contracts.md)
- [Knowledge base](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/README.md)
