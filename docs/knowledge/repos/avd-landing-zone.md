---
title: "avd-landing-zone"
summary: "Deploy and operate: a cloud-native AVD landing zone in one Bicep template, with a deployment portal"
topic: repos
status: partial
last_reviewed: 2026-10-20
---

# avd-landing-zone

**Deploy and operate.** An Azure Virtual Desktop landing zone for cloud-native organizations: Entra ID-joined, Intune-managed, private by default, deployed end to end from one Bicep template.

The repo is the source of truth: [nickprignano/avd-landing-zone](https://github.com/nickprignano/avd-landing-zone). This page says where it fits.

## What it does

- No domain controllers, no line of sight to on-premises, no post-deployment scripts.
- FSLogix on Premium Azure Files with Entra Kerberos and no storage keys; session hosts on Trusted Launch with encryption at host.
- No default outbound access, AVD Private Link, Azure Policy, Defender for Cloud and a budget that switches hosts off when it runs out.
- A deployment portal in the browser that sizes the host pool and walks you through Cloud Shell, one pasted output at a time.

## How it fits

- Reads a C14 target-state manifest from [avd-second-brain](avd-second-brain.md) when one exists.
- Its lessons are recorded in avd-second-brain's knowledge base.
- [avd-liquidware](avd-liquidware.md) builds on it without changing its default deployment.

## Read more in the repo

- [README and quick start](https://github.com/nickprignano/avd-landing-zone/blob/master/README.md)
- [Deployment portal](https://nickprignano.github.io/avd-landing-zone/portal/)
