---
title: "avd-landing-zone"
summary: "How it's built and changed from here: a cloud-native AVD landing zone and deployment portal for multiple pools, workspaces and Private Link"
topic: repos
status: partial
last_reviewed: 2026-10-27
---

# avd-landing-zone

How an estate is built and changed from here: one Bicep template, deployed from a full-fledged browser deployment portal.

<!-- more -->

An Azure Virtual Desktop landing zone for cloud-native organizations: Entra ID-joined, Intune-managed, private by default, deployed end to end from one Bicep template and a guided deployment portal.

The repo is the source of truth: [avd-ops/avd-landing-zone](https://github.com/avd-ops/avd-landing-zone). This page says where it fits.

## What it does

A cloud-only, private-by-default landing zone with a deployment portal that configures the full topology and walks you through each step.

- No domain controllers, no line of sight to on-premises, no post-deployment scripts.
- Deploys multiple workspaces, Desktop and RemoteApp application groups, and Pooled or Personal host pools from one Bicep template and topology manifest.
- Configures every setting per host pool (sizing, load balancing, RDP properties, FSLogix profile size, autoscale, Encryption at Host, Intune, availability zones, and network access) with setting templates that apply to all or selected pools.
- Full AVD Private Link (`connection` on host pools, `feed` and `global` on workspaces) and Private Endpoints for Azure Files and Key Vault, supporting both new and existing Private DNS zones per zone.
- FSLogix on Premium Azure Files with Entra Kerberos and no storage keys; Azure Policy, Defender for Cloud and a budget that switches hosts off when it runs out.
- A deployment portal in the browser that designs and prices the topology and walks you through Cloud Shell, one pasted output at a time.

## How it fits

It pairs with avd-current-state and works without anything on top.

- With [avd-current-state](avd-current-state.md) it forms a self-contained pair that never depends on the layer on top, orchestrating five control-plane repos (`avd-entra`, `avd-intune`, `avd-m365`, `avd-azure` and `avd-power-platform`) for greenfield and brownfield estates ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).
- Can read a C14 target-state manifest from [avd-second-brain](avd-second-brain.md) when one exists, and works without one.
- Its lessons are recorded in avd-second-brain's knowledge base.

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-landing-zone/blob/master/README.md)
- [Deployment portal](https://deploy.avd-ops.dev/portal/)
