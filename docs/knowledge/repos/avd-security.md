---
title: "avd-security"
summary: "Security control plane: Defender for Cloud, Sentinel KQL detections, Azure Policy baselines, and posture scoring"
topic: repos
status: verified
last_reviewed: 2026-11-20
---

# avd-security

The AVD security control plane, Sentinel detection catalog, and posture verifier in Bicep and PowerShell.

<!-- more -->

Configures Microsoft Defender for Cloud plans, Azure Policy security baselines, optional Microsoft Sentinel AVD KQL detections, and schema-validated posture scoring ([decision 0028](../decisions/0028-add-avd-security.md)).

The repo is the source of truth: [avd-ops/avd-security](https://github.com/avd-ops/avd-security). This page says where it fits.

## What it does

It separates SecOps security baselines, detections, and posture verification from workload and hub infrastructure.

- **Defender for Cloud (`bicep/modules/defender-plans.bicep`):** In `lab` (`Auto`), leaves existing subscription plans untouched so it never downgrades paid protection; in `enterprise`, configures `Standard` (`VirtualMachines` P1, `KeyVaults`, `StorageAccounts` V2 with `OnUploadMalwareScanning` off by default).
- **Azure Policy (`bicep/modules/policy-assignments.bicep`):** Assigns built-in Key Vault soft-delete, Storage HTTPS secure transfer, and NIC no-public-IP policies (`Audit` in `lab`, `Deny` in `enterprise`).
- **Microsoft Sentinel (`bicep/modules/sentinel-analytics.bicep`):** Opt-in KQL analytics rules (`avd-connection-storm.kql` and `avd-bruteforce-signin.kql`) targeting an existing Sentinel-onboarded Log Analytics workspace.
- **Posture & Outputs (`scripts/`):** `Invoke-AvdSecurityAudit.ps1` scores strict boolean evidence against `avd-assess` claims (`avd-security-posture/v1`), and `Export-AvdSecurityOutputs.ps1` emits redacted `avd-security-outputs/v1`.

## How it fits

It complements [avd-assess](avd-assess.md) and [avd-current-state](avd-current-state.md) without duplicating [avd-entra](avd-entra.md), [avd-intune](avd-intune.md), [avd-networking](avd-networking.md), or [avd-azure](avd-azure.md).

- Maps posture checks to `avd-assess` `ref:*` claims and `asm-*` check IDs, and provides `Remove-AvdSecurityTier.ps1` for teardown to `Free`.

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-security/blob/main/README.md)
