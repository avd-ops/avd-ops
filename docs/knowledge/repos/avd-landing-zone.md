---
title: "avd-landing-zone"
summary: "How it's built and changed from here: a cloud-native AVD landing zone in one Bicep template, with a deployment portal"
topic: repos
status: partial
last_reviewed: 2026-10-21
---

# avd-landing-zone

**How it's built and changed from here. The deployment engine.** An Azure Virtual Desktop landing zone for cloud-native organizations: Entra ID-joined, Intune-managed, private by default, deployed end to end from one Bicep template.

The repo is the source of truth: [avd-ops/avd-landing-zone](https://github.com/avd-ops/avd-landing-zone). This page says where it fits.

## What it does

- No domain controllers, no line of sight to on-premises, no post-deployment scripts.
- FSLogix on Premium Azure Files with Entra Kerberos and no storage keys; session hosts on Trusted Launch with encryption at host.
- No default outbound access, AVD Private Link, Azure Policy, Defender for Cloud and a budget that switches hosts off when it runs out.
- A deployment portal in the browser that sizes the host pool and walks you through Cloud Shell, one pasted output at a time.

## How it fits

- With [avd-current-state](avd-current-state.md) it forms a self-contained pair that never depends on the layer on top.
- Can read a C14 target-state manifest from [avd-second-brain](avd-second-brain.md) when one exists, and works without one.
- Its lessons are recorded in avd-second-brain's knowledge base.

## Read more in the repo

- [README and quick start](https://github.com/avd-ops/avd-landing-zone/blob/master/README.md)
- [Deployment portal](https://avd-ops.github.io/avd-landing-zone/portal/)
