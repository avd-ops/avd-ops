---
title: "avd-m365"
summary: "Control plane: greenfield Microsoft 365 tenant, OneDrive Known Folder Move, Teams VDI optimization and M365 Apps baselines"
topic: repos
status: verified
last_reviewed: 2026-10-29
---

# avd-m365

The greenfield Microsoft 365 and VDI productivity control plane for Azure Virtual Desktop estates.

<!-- more -->

Declarative Microsoft 365 configuration for greenfield tenants so users signing into Azure Virtual Desktop get OneDrive, Microsoft Teams and M365 Apps tuned for virtual desktops ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-m365](https://github.com/avd-ops/avd-m365). This page says where it fits.

## What it does

It configures OneDrive, Teams VDI and Microsoft 365 Apps baselines for greenfield AVD tenants.

<!-- more -->

- Configures OneDrive Silent Account Configuration, Known Folder Move (`KFMSilentOptIn`, querying the tenant GUID dynamically at deploy time) and Files On-Demand sync rules stamped with `[avd-ops-<prefix>-<env>]`.
- Applies Microsoft Teams VDI media optimization (`SlimCoreAndWebRtc`).
- Sets Microsoft 365 Apps Shared Computer Activation, the Monthly Enterprise update channel and a three-month Outlook cache for FSLogix containers.
- Checks required tenant SKUs in preflight without purchasing recurring commitments.
- `Deploy-AvdM365.ps1` emits `m365-manifest.json` (`avd-ops-m365-manifest/v1`) and records `created: true|false` per policy ID in `m365-run-manifest.json` (`avd-ops-m365-run-manifest/v1`).
- `Remove-AvdM365.ps1 -DiscardLastCopy` deletes only policies created by the run (`created: true` and matching the `[avd-ops-<prefix>-<env>]` stamp), leaving pre-existing brownfield policies untouched and gating teardown behind `-DiscardLastCopy`.

```powershell
# Azure Cloud Shell (PowerShell)
if (-not (Test-Path ~/avd-m365)) { git clone https://github.com/avd-ops/avd-m365.git ~/avd-m365 }
Set-Location ~/avd-m365; git checkout -q main; git pull -q --ff-only
./scripts/Deploy-AvdM365.ps1 -EntraManifestPath ./entra-manifest.json -OutputPath ./m365-manifest.json -RunManifestPath ./m365-run-manifest.json
./scripts/Remove-AvdM365.ps1 -RunManifestPath ./m365-run-manifest.json -DiscardLastCopy -WhatIf
```

## How it fits

It pairs with avd-entra and avd-intune when standing up a greenfield tenant from avd-landing-zone.

<!-- more -->

- Orchestrated by [avd-landing-zone](avd-landing-zone.md) for greenfield setups; brownfield tenants with existing M365 settings can skip it.
- Consumes user group targets from [avd-entra](avd-entra.md) and aligns with endpoint profiles in [avd-intune](avd-intune.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-m365/blob/main/README.md)
