---
title: "avd-azure"
summary: "Control plane: cloud-native Azure ARM and Bicep infrastructure for Azure Virtual Desktop, Private Link, FSLogix Azure Files and session hosts"
topic: repos
status: partial
last_reviewed: 2026-10-27
---

# avd-azure

The Azure ARM and Bicep infrastructure control plane for Azure Virtual Desktop, orchestrated by avd-landing-zone.

<!-- more -->

The Azure Bicep deployment engine for cloud-native AVD estates: virtual networks, Private Link, Premium Azure Files for FSLogix, Key Vault, host pools, workspaces and session hosts ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-azure](https://github.com/avd-ops/avd-azure). This page says where it fits.

## What it does

It deploys the Azure and AVD resource layer from Bicep with Private Link and Entra Kerberos.

- Deploys multiple workspaces, Desktop and RemoteApp application groups, and Pooled or Personal host pools from Bicep.
- Configures full AVD Private Link (`connection`, `feed` and `global`) and Private Endpoints for Azure Files and Key Vault.
- Configures FSLogix on Premium Azure Files with Entra Kerberos and no storage keys, plus Azure Policy, Defender for Cloud and budget automation.
- Joins session hosts to Entra ID and enrolls them into [avd-intune](avd-intune.md) via `AADLoginForWindows`.

## How it fits

It is the Azure infrastructure stage orchestrated by avd-landing-zone and checked by avd-current-state.

- Invoked at a pinned commit by [avd-landing-zone](avd-landing-zone.md) or run directly from Azure Cloud Shell.
- Binds application groups and RBAC to groups from [avd-entra](avd-entra.md) and exports `azure-outputs.json` for [avd-power-platform](avd-power-platform.md) and [avd-current-state](avd-current-state.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-azure/blob/main/README.md)
