---
title: "avd-intune"
summary: "Control plane: Microsoft Intune session-host MDM enrollment, Settings Catalog baselines and compliance policies for Azure Virtual Desktop"
topic: repos
status: verified
last_reviewed: 2026-10-29
---

# avd-intune

The Microsoft Intune device enrollment and endpoint configuration control plane for AVD session hosts.

<!-- more -->

Declarative Microsoft Graph Settings Catalog and compliance profiles that enroll and configure Azure Virtual Desktop session hosts ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-intune](https://github.com/avd-ops/avd-intune). This page says where it fits.

## What it does

It configures Intune MDM enrollment, Settings Catalog profiles and device compliance for session hosts.

<!-- more -->

- Checks active Intune service plans (`INTUNE_A*`), MDM auto-enrollment scope and Windows Enterprise multi-session enrollment rules in preflight without purchasing commitments.
- Deploys Settings Catalog profiles (FSLogix profile containers; a multi-session host baseline with RDP Shortpath, multimedia redirection and session time limits; a Windows Update ring) and a session-host compliance policy, each stamped with `[avd-ops-<prefix>-<env>]`.
- Assigns Settings Catalog and compliance policies to the dynamic session-host device group from [avd-entra](avd-entra.md).
- `Deploy-AvdIntune.ps1` emits `intune-manifest.json` (`avd-ops-intune-manifest/v1`) and records `created: true|false` per policy ID in `intune-run-manifest.json` (`avd-ops-intune-run-manifest/v1`).
- `Remove-AvdIntune.ps1 -DiscardLastCopy` deletes only policies created by the run (`created: true` and matching the `[avd-ops-<prefix>-<env>]` stamp), leaving pre-existing brownfield policies untouched and gating teardown behind `-DiscardLastCopy`.

```powershell
# Azure Cloud Shell (PowerShell)
if (-not (Test-Path ~/avd-intune)) { git clone https://github.com/avd-ops/avd-intune.git ~/avd-intune }
Set-Location ~/avd-intune; git checkout -q main; git pull -q --ff-only
./scripts/Deploy-AvdIntune.ps1 -EntraManifestPath ./entra-manifest.json -OutputPath ./intune-manifest.json -RunManifestPath ./intune-run-manifest.json
./scripts/Remove-AvdIntune.ps1 -RunManifestPath ./intune-run-manifest.json -DiscardLastCopy -WhatIf
```

## How it fits

It targets the device groups from avd-entra so session hosts deployed by avd-azure enroll on first boot.

<!-- more -->

- Orchestrated by [avd-landing-zone](avd-landing-zone.md) alongside [avd-azure](avd-azure.md) and [avd-entra](avd-entra.md).
- Validated read-only by [avd-current-state](avd-current-state.md) against benchmarks in [avd-assess](avd-assess.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-intune/blob/main/README.md)
