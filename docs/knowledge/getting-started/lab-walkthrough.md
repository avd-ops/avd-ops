---
title: "Lab walkthrough: empty subscription to validated landing zone"
summary: "Take an empty lab subscription to a deployed Azure Virtual Desktop landing zone and validate it with avd-current-state using self-contained Cloud Shell blocks"
topic: getting-started
status: verified
last_reviewed: 2026-11-11
---

# Lab walkthrough: empty subscription to validated landing zone

Go from an empty lab subscription to a deployed Azure Virtual Desktop landing zone, validate it with `avd-current-state`, and tear it down cleanly from Azure Cloud Shell.

<!-- more -->

This walkthrough connects [avd-landing-zone](../repos/avd-landing-zone.md) and [avd-current-state](../repos/avd-current-state.md) in five self-contained Azure Cloud Shell (PowerShell) steps. Every command block clones or updates its repo, moves into it, and runs the step so a disconnected tab never leaves you stuck ([working from Cloud Shell](cloud-shell.md), [landing zone lesson 0015](https://github.com/avd-ops/avd-landing-zone/blob/master/build/lessons/0015-cloud-shell-ergonomics.md)). For interactive command generation and output analysis, open the [Deployment Portal](https://avd-ops.github.io/avd-landing-zone/portal/) and the [Assessment Portal](https://avd-ops.github.io/avd-current-state/portal/).

## 1. Preflight and retail cost estimate ($0)

Check subscription readiness, Entra groups, regional quotas, and retail Azure pricing before creating a single resource.

<!-- more -->

- **Cost:** $0 (read-only checks against Azure Resource Manager, Microsoft Graph, and the public Azure Retail Prices API).
- **Details:** [avd-landing-zone deployment guide](https://github.com/avd-ops/avd-landing-zone/blob/master/docs/deploy.md) and [cost estimates decision 0010](https://github.com/avd-ops/avd-landing-zone/blob/master/build/decisions/0010-cost-estimates.md).

```powershell
if (-not (Test-Path ~/avd-landing-zone/.git)) { git clone https://github.com/avd-ops/avd-landing-zone.git ~/avd-landing-zone }
Set-Location ~/avd-landing-zone; git checkout -q master; git pull -q --ff-only
./scripts/ops/Connect-AvdLandingZone.ps1
./scripts/ops/Test-AvdSubscriptionReadiness.ps1 -ParameterFile parameters/dev.bicepparam -Location eastus2 -Fix
```

## 2. Deploy the dev landing zone (~$0.35 to $0.60/hour while running)

Deploy the `dev` parameter file (or orchestrate across the five control planes) with daily auto-shutdown enabled by default.

<!-- more -->

- **Cost:** Billed by the hour for the session host VM, Premium Azure Files profile share, Log Analytics ingestion, and private endpoints while running; `parameters/dev.bicepparam` schedules daily host shutdown at 20:00 ([auto-shutdown decision 0011](https://github.com/avd-ops/avd-landing-zone/blob/master/build/decisions/0011-auto-shutdown.md)).
- **Details:** [avd-landing-zone README](https://github.com/avd-ops/avd-landing-zone/blob/master/README.md) and [five control planes decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md).

```powershell
if (-not (Test-Path ~/avd-landing-zone/.git)) { git clone https://github.com/avd-ops/avd-landing-zone.git ~/avd-landing-zone }
Set-Location ~/avd-landing-zone; git checkout -q master; git pull -q --ff-only
bash ./scripts/deploy/deploy.sh -p parameters/dev.bicepparam -l eastus2
```

## 3. Post-deployment setup and readiness check ($0 extra)

Configure the FSLogix storage Kerberos app, harden the share ACL, and verify session host registration and agent health.

<!-- more -->

- **Cost:** $0 beyond the running deployment.
- **Details:** [avd-landing-zone operations guide](https://github.com/avd-ops/avd-landing-zone/blob/master/docs/operations.md).

```powershell
if (-not (Test-Path ~/avd-landing-zone/.git)) { git clone https://github.com/avd-ops/avd-landing-zone.git ~/avd-landing-zone }
Set-Location ~/avd-landing-zone; git checkout -q master; git pull -q --ff-only
./scripts/ops/Connect-AvdLandingZone.ps1
./scripts/ops/Test-AvdLandingZoneReadiness.ps1 -NamePrefix avdlz -Environment dev -Fix -AllowHostStart
```

## 4. Validate and emit redacted facts with `avd-current-state` ($0)

Run the independent read-only deployment validator and generate a redacted `C11` (`avd-current-state-facts/v1`) snapshot.

<!-- more -->

- **Cost:** $0 (read-only queries through Azure Resource Graph, ARM GET, and Microsoft Graph GET).
- **Details:** [avd-current-state README](https://github.com/avd-ops/avd-current-state/blob/main/README.md) and [assessment portal](https://avd-ops.github.io/avd-current-state/portal/).

```powershell
if (-not (Test-Path ~/avd-current-state/.git)) { git clone https://github.com/avd-ops/avd-current-state.git ~/avd-current-state }
Set-Location ~/avd-current-state; git checkout -q main; git pull -q --ff-only
./avd_deployment_validator.ps1 -OutputPath ~/clouddrive/avd-validation
./avd_current_state_collector.ps1 -OutputDirectory ~/clouddrive/avd-collector
./avd_current_state_facts.ps1 -InputPath ~/clouddrive/avd-collector -OutputPath ~/clouddrive/avd-facts.json
```

## 5. Tear down the lab and verify zero leftovers ($0 after removal)

Remove every billable resource when your lab run is finished while keeping run logs and evidence in the run store.

<!-- more -->

- **Cost:** Stops all compute, storage, and networking meters once deletion completes.
- **Safety:** Teardown keeps the last copy of user profiles, backups, and run evidence unless you explicitly pass `-DiscardLastCopy` ([never delete the last copy](https://github.com/avd-ops/avd-ops/blob/main/docs/never-delete-the-last-copy.md), [never leave the meter running](https://github.com/avd-ops/avd-ops/blob/main/docs/never-leave-the-meter-running.md)).

```powershell
if (-not (Test-Path ~/avd-landing-zone/.git)) { git clone https://github.com/avd-ops/avd-landing-zone.git ~/avd-landing-zone }
Set-Location ~/avd-landing-zone; git checkout -q master; git pull -q --ff-only
./scripts/ops/Remove-Avd.ps1 -NamePrefix avdlz -Environment dev -DiscardLastCopy -Force
```
