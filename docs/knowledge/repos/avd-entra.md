---
title: "avd-entra"
summary: "Control plane: Entra ID security groups, dynamic session-host groups, Conditional Access and Entra Kerberos for Azure Virtual Desktop"
topic: repos
status: verified
last_reviewed: 2026-10-29
---

# avd-entra

The Entra ID identity and zero-trust control plane for an AVD estate, orchestrated by avd-landing-zone.

<!-- more -->

Declarative Microsoft Graph templates and Cloud Shell scripts that prepare Entra ID for greenfield and brownfield Azure Virtual Desktop deployments ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-entra](https://github.com/avd-ops/avd-entra). This page says where it fits.

## What it does

It prepares groups, Conditional Access and Entra Kerberos in Entra ID with zero portal click-ops.

<!-- more -->

- Creates security groups stamped with `[avd-ops-<prefix>-<env>]` (`[avd-ops-<prefix>-<env>] AVD Users`, per-pool `[avd-ops-<prefix>-<env>] AVD Users (<pool>)`, `[avd-ops-<prefix>-<env>] AVD Admins`, `[avd-ops-<prefix>-<env>] AVD Break-Glass Exclude`) and dynamic session-host device groups (`[avd-ops-<prefix>-<env>] AVD Session Hosts`).
- Deploys Conditional Access policies targeting Azure Virtual Desktop and Windows Cloud Login (`reportOnly` by default).
- Optionally registers a public-client Microsoft Graph operator app with no secret (`-InitializeGraphApp`), and checks Entra Kerberos readiness for Premium Azure Files (FSLogix) when given the storage account.
- Checks tenant license SKUs in preflight and seeds optional greenfield lab users without buying commitments.
- `Deploy-AvdEntra.ps1` emits `entra-manifest.json` (`avd-ops-entra-manifest/v1`) and records `created: true|false` per object ID in `entra-run-manifest.json` (`avd-ops-entra-run-manifest/v1`).
- `Remove-AvdEntra.ps1 -DiscardLastCopy` tears down only objects created by the run (`created: true` and matching the `[avd-ops-<prefix>-<env>]` stamp), leaving pre-existing brownfield objects untouched and gating stateful deletions behind `-DiscardLastCopy`.

```powershell
# Azure Cloud Shell (PowerShell)
if (-not (Test-Path ~/avd-entra)) { git clone https://github.com/avd-ops/avd-entra.git ~/avd-entra }
Set-Location ~/avd-entra; git checkout -q main; git pull -q --ff-only
./scripts/Deploy-AvdEntra.ps1 -Prefix avd -Environment dev -OutputPath ./entra-manifest.json -RunManifestPath ./entra-run-manifest.json
./scripts/Remove-AvdEntra.ps1 -RunManifestPath ./entra-run-manifest.json -DiscardLastCopy -WhatIf
```

## How it fits

It runs as the root identity stage under avd-landing-zone and feeds the other four control planes.

<!-- more -->

- Orchestrated by [avd-landing-zone](avd-landing-zone.md) or run standalone from Azure Cloud Shell.
- Emits `entra-manifest.json` so [avd-intune](avd-intune.md), [avd-m365](avd-m365.md), [avd-azure](avd-azure.md) and [avd-power-platform](avd-power-platform.md) bind to the same security groups.
- Checked read-only by [avd-current-state](avd-current-state.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-entra/blob/main/README.md)
