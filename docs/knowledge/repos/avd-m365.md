---
title: "avd-m365"
summary: "Control plane: greenfield Microsoft 365 tenant, OneDrive Known Folder Move, Teams VDI optimization and M365 Apps baselines"
topic: repos
status: plan
last_reviewed: 2026-10-27
---

# avd-m365

The greenfield Microsoft 365 and VDI productivity control plane for Azure Virtual Desktop estates.

<!-- more -->

Declarative Microsoft 365 configuration for greenfield tenants so users signing into Azure Virtual Desktop get OneDrive, Microsoft Teams and M365 Apps tuned for virtual desktops ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-m365](https://github.com/avd-ops/avd-m365). This page says where it fits.

## What it does

It configures OneDrive, Teams VDI and Microsoft 365 Apps baselines for greenfield AVD tenants.

- Configures OneDrive Silent Account Configuration, Known Folder Move (KFM) and sync rules for pooled and personal desktops.
- Applies Microsoft Teams VDI media optimization and meeting policies.
- Sets Microsoft 365 Apps Shared Computer Activation and Outlook caching defaults for FSLogix containers.
- Checks required tenant SKUs in preflight without purchasing recurring commitments.

## How it fits

It pairs with avd-entra and avd-intune when standing up a greenfield tenant from avd-landing-zone.

- Orchestrated by [avd-landing-zone](avd-landing-zone.md) for greenfield setups; brownfield tenants with existing M365 settings can skip it.
- Consumes user group targets from [avd-entra](avd-entra.md) and aligns with endpoint profiles in [avd-intune](avd-intune.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-m365/blob/main/README.md)
