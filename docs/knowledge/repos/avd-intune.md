---
title: "avd-intune"
summary: "Control plane: Microsoft Intune session-host MDM enrollment, Settings Catalog baselines and compliance policies for Azure Virtual Desktop"
topic: repos
status: plan
last_reviewed: 2026-10-27
---

# avd-intune

The Microsoft Intune device enrollment and endpoint configuration control plane for AVD session hosts.

<!-- more -->

Declarative Microsoft Graph Settings Catalog and compliance profiles that enroll and configure Azure Virtual Desktop session hosts ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-intune](https://github.com/avd-ops/avd-intune). This page says where it fits.

## What it does

It configures Intune MDM enrollment, Settings Catalog profiles and device compliance for session hosts.

- Configures MDM auto-enrollment scope and Windows Enterprise multi-session enrollment rules.
- Deploys Settings Catalog profiles for AVD session hosts: FSLogix policies, RDP Shortpath, multimedia redirection, session limits and Windows Update rings.
- Applies session-host compliance policies that pair with [avd-entra](avd-entra.md) Conditional Access.
- Assigns core host applications to the dynamic session-host device groups.

## How it fits

It targets the device groups from avd-entra so session hosts deployed by avd-azure enroll on first boot.

- Orchestrated by [avd-landing-zone](avd-landing-zone.md) alongside [avd-azure](avd-azure.md) and [avd-entra](avd-entra.md).
- Validated read-only by [avd-current-state](avd-current-state.md) against benchmarks in [avd-assess](avd-assess.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-intune/blob/main/README.md)
