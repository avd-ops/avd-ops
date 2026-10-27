---
title: "avd-power-platform"
summary: "Control plane: Power Platform environments, DLP policies and Power Automate day-2 workflows for Azure Virtual Desktop"
topic: repos
status: partial
last_reviewed: 2026-10-27
---

# avd-power-platform

The Power Platform and Power Automate day-2 workflow control plane for deployed AVD estates.

<!-- more -->

Bicep enterprise policies, Power Platform environment governance, and unpacked Power Automate solutions that automate self-service access and day-2 host operations for an estate deployed by avd-landing-zone ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-power-platform](https://github.com/avd-ops/avd-power-platform). This page says where it fits.

## What it does

It provisions Power Platform governance and approval-gated Power Automate flows for the AVD estate.

<!-- more -->

- Deploys dedicated Power Platform environments (`[avd-ops-<prefix>-<env>] AVD Day-2 Automation`), strict DLP policies (`[avd-ops-<prefix>-<env>] AVD Day-2 Automation Strict DLP Policy`), and Bicep `Microsoft.PowerPlatform/enterprisePolicies` for VNet subnet injection.
- Packs and imports source-controlled Power Automate solutions (`AvdDay2Automation`) wired to `avd-entra` user groups and `avd-azure` host pools for self-service access requests and approval-gated host drain, restart, and start-on-demand in Microsoft Teams.
- `Deploy-AvdPowerPlatform.ps1` emits `power-platform-manifest.json` (`avd-ops-power-platform-manifest/v1`) and records `created: true|false` per resource in `power-platform-run-manifest.json` (`avd-ops-power-platform-run-manifest/v1`).
- `Remove-AvdPowerPlatform.ps1 -DiscardLastCopy` deletes only the DLP policy, environment, and enterprise policy created by the run (`created: true` and matching the `[avd-ops-<prefix>-<env>]` stamp), leaving pre-existing brownfield objects untouched and gating stateful teardown behind `-DiscardLastCopy`.

```powershell
# Azure Cloud Shell (PowerShell)
if (-not (Test-Path ~/avd-power-platform)) { git clone https://github.com/avd-ops/avd-power-platform.git ~/avd-power-platform }
Set-Location ~/avd-power-platform; git checkout -q main; git pull -q --ff-only
./scripts/Deploy-AvdPowerPlatform.ps1 -EntraManifestPath ./entra-manifest.json -AzureOutputsPath ./azure-outputs.json -OutputPath ./power-platform-manifest.json -RunManifestPath ./power-platform-run-manifest.json
./scripts/Remove-AvdPowerPlatform.ps1 -RunManifestPath ./power-platform-run-manifest.json -DiscardLastCopy -WhatIf
```

## How it fits

It wires deterministic tenant workflows to the groups in avd-entra and the host pools in avd-azure.

<!-- more -->

- Orchestrated by [avd-landing-zone](avd-landing-zone.md) after [avd-entra](avd-entra.md) and [avd-azure](avd-azure.md) complete.
- Complements [avd-swarm](avd-swarm.md): whereas avd-swarm runs agentic reasoning and GitHub-gated plans, avd-power-platform runs deterministic self-service and operator approval flows inside the tenant.

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-power-platform/blob/main/README.md)
