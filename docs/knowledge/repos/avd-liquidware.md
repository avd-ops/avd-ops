---
title: "avd-liquidware"
summary: "Optional tier: ProfileUnity, FlexApp, CommandCTRL and Stratusphere UX on top of a landing zone"
topic: repos
status: partial
last_reviewed: 2026-10-20
---

# avd-liquidware

**Optional Liquidware tier.** An optional Liquidware tier on top of a landing zone: ProfileUnity, FlexApp through AVD app attach, CommandCTRL, and Stratusphere UX for assessments. FSLogix stays the profile container.

The repo is the source of truth: [nickprignano/avd-liquidware](https://github.com/nickprignano/avd-liquidware). This page says where it fits.

## What it does

- One entry point, `Deploy-LiquidwareTier.ps1`, built slice by slice.
- Stratusphere UX in Azure: preflight, the Hub, Database and Collector appliances, Connector ID Key rollout and teardown.
- Reads the landing zone by its naming convention and never changes its default deployment.
- Bring your own Liquidware licenses. No binaries or license material live in the repo.

## How it fits

- Sits on top of [avd-landing-zone](avd-landing-zone.md).
- Keeps its own knowledge base for Liquidware topics, in the same format as these docs.

## Read more in the repo

- [README and quick start](https://github.com/nickprignano/avd-liquidware/blob/main/README.md)
- [Knowledge base](https://github.com/nickprignano/avd-liquidware/blob/main/docs/knowledge/README.md)
