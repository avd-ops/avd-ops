---
title: "avd-entra"
summary: "Control plane: Entra ID security groups, dynamic session-host groups, Conditional Access and Entra Kerberos for Azure Virtual Desktop"
topic: repos
status: plan
last_reviewed: 2026-10-27
---

# avd-entra

The Entra ID identity and zero-trust control plane for an AVD estate, orchestrated by avd-landing-zone.

<!-- more -->

Declarative Microsoft Graph templates and Cloud Shell scripts that prepare Entra ID for greenfield and brownfield Azure Virtual Desktop deployments ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-entra](https://github.com/avd-ops/avd-entra). This page says where it fits.

## What it does

It prepares groups, Conditional Access and Entra Kerberos in Entra ID with zero portal click-ops.

- Creates per-pool user security groups, dynamic session-host device groups, and break-glass exclusion groups.
- Deploys Conditional Access policies targeting Azure Virtual Desktop and Windows Cloud Login (`reportOnly` by default).
- Completes the Microsoft Graph service principal and Entra Kerberos readiness steps for Premium Azure Files (FSLogix).
- Checks tenant license SKUs in preflight and seeds optional greenfield lab users without buying commitments.

## How it fits

It runs as the root identity stage under avd-landing-zone and feeds the other four control planes.

- Orchestrated by [avd-landing-zone](avd-landing-zone.md) or run standalone from Azure Cloud Shell.
- Emits `entra-manifest.json` so [avd-intune](avd-intune.md), [avd-m365](avd-m365.md), [avd-azure](avd-azure.md) and [avd-power-platform](avd-power-platform.md) bind to the same security groups.
- Checked read-only by [avd-current-state](avd-current-state.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-entra/blob/main/README.md)
