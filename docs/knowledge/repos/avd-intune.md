---
title: "avd-intune"
summary: "Control plane: Microsoft Intune policy-as-code, session-host enrollment, assignment filters and Windows 365 Cloud PC provisioning"
topic: repos
status: partial
last_reviewed: 2026-11-02
---

# avd-intune

The Microsoft Intune policy-as-code and Windows 365 Cloud PC control plane for desktop estates.

<!-- more -->

Declarative Microsoft Graph Settings Catalog profiles, compliance policies, assignment filters and optional Windows 365 Cloud PC provisioning policies (`deviceManagement/virtualEndpoint`) for Azure Virtual Desktop and Windows 365 ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md), [decision 0012](../decisions/0012-desktop-devops-for-avd-win365-and-intune.md)).

The repo is the source of truth: [avd-ops/avd-intune](https://github.com/avd-ops/avd-intune). This page says where it fits.

## What it does

It configures Intune MDM enrollment, assignment filters, Settings Catalog baselines and optional Windows 365 provisioning policies.

<!-- more -->

- Checks active Intune and Windows 365 service plans (`INTUNE_A*`, `CPC_E_*`, `WIN365_*`), MDM auto-enrollment scope and Windows Enterprise multi-session enrollment rules in preflight without purchasing commitments.
- Deploys standard Intune assignment filters (`avd-multisession`, `avd-personal`, `win365-cloudpc`, `physical-desktop`), Settings Catalog profiles (`FSLogix`, `Watermarking`, `ScreenCaptureProtection`, `SessionTimeLimits`, `DefenderVdiExclusions`) and device compliance policies stamped with `[avd-ops-<prefix>-<env>]`.
- Optionally deploys declarative Windows 365 Cloud PC provisioning policies (`enableSingleSignOn: true`), user settings (`localAdminEnabled: false`, scheduled restore points) and Azure Network Connections when `-IncludeWin365` is enabled ([decision 0012](../decisions/0012-desktop-devops-for-avd-win365-and-intune.md)).
- Assigns Settings Catalog, compliance and Windows 365 policies to the groups from [avd-entra](avd-entra.md).
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
