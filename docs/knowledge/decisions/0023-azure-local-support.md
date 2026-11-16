---
status: accepted
date: 2026-11-16
decision-makers: [owner]
---

# 0023. Support Azure Virtual Desktop on Azure Local via hostPlacement and existing contracts

Support Azure Virtual Desktop on registered Azure Local 23H2+ instances (`hostPlacement: "azure-local"`) by extending existing foundation contracts, using native Entra ID join and bring-your-own on-premises SMB storage in v1, and guarding all paths offline in CI.

## Context and Problem Statement

How should the `avd-ops` family deploy, collect, and assess Azure Virtual Desktop session hosts running on Azure Local without duplicating control-plane repos or requiring a physical cluster in CI?

<!-- more -->

The family currently assumes all AVD session hosts run as Azure IaaS VMs (`Microsoft.Compute/virtualMachines`) with FSLogix profiles on Azure Files or Azure NetApp Files. Azure Local support appears only as an open network extension point (`network.azure-local`), an unimplemented scope gap (`hybrid-scope`), and two pinned Microsoft Learn sources in `avd-assess` (`avd-azure-local` and `avd-azure-local-workload`). Because AVD on Azure Local keeps the AVD brokering, workspace, and host-pool control plane in Azure while placing `Microsoft.AzureStackHCI/virtualMachineInstances` on an existing registered Azure Local 23H2+ instance (connected via Azure Arc Resource Bridge and Custom Locations), the family needs a clean way to represent, deploy, and score Azure Local host pools alongside Azure-hosted ones.

## Considered Options

Three options were weighed.

- Extend existing foundation contracts (`C11`, `C14`, `C19`, `C21`) and `avd-azure` / `avd-landing-zone` with `hostPlacement: "azure-local"`, native Entra ID join only, and bring-your-own SMB storage in v1 (with `avd-hcl` as a fast-follow PR)
- Create a dedicated control-plane repository and new output contract (`C33`) specifically for Azure Local session hosts
- Keep Azure Local as reference-only documentation and defer collection and deployment support indefinitely

## Decision Outcome

Chosen option: "Extend existing foundation contracts (`C11`, `C14`, `C19`, `C21`) and `avd-azure` / `avd-landing-zone` with `hostPlacement: "azure-local"`, native Entra ID join only, and bring-your-own SMB storage in v1 (with `avd-hcl` as a fast-follow PR)".

<!-- more -->

Why: Azure Local session hosts share the same Azure-hosted AVD control plane (`avd-azure`) and Bicep/AzAPI deployment pipeline as Azure-hosted pools, so extending existing contracts and modules avoids splitting the control plane or maintaining a redundant repository.

- **Bring-your-own registered Azure Local 23H2+ instance:** Physical hardware provisioning, OS installation, and Azure Arc Resource Bridge / Custom Location bootstrap are prerequisites out of scope for `avd-ops`.
- **Strict host-pool separation (`hostPlacement: "azure" | "azure-local"`):** Per `avd-azure-local#no-mixed-pools`, host pools never mix Azure and Azure Local session hosts; mixed pools fail preflight and assessment checks.
- **Native Entra ID join only in v1:** Aligns with `avd-landing-zone`'s cloud-native identity model via `Microsoft.HybridCompute/machines/extensions` (`AADLoginForWindows`) and PowerShell; `avd-current-state` still detects and reports brownfield AD DS / hybrid-joined Azure Local pools.
- **Bring-your-own on-premises SMB in v1:** Operators supply an existing clustered file server or external SMB share path (`localSmbProfilePath`) for FSLogix profile containers rather than automating cluster storage provisioning in v1.
- **Extend `azure-outputs.json` (no `C33`):** `avd-azure` emits an optional `azureLocal` block inside `azure-outputs.json`, and `C11`/`C14`/`C19`/`C21` carry `hostPlacement`, `azureLocal` inventory, and `reason: "azure-local-host"` for `not-applicable` Azure-IaaS-only checks.
- **Phased Terraform and offline CI (`standing: guarded`):** `avd-hcl` follows in a dedicated PR once Bicep/AzAPI shapes are proven; all repos validate offline via Bicep/AzAPI compilation, PSRule, schema checks, and mocked Pester/Node tests until a live Azure Local 23H2+ run upgrades claims to `run`.

### Consequences

- Good, because `avd-assess`, `avd-current-state`, `avd-azure`, and `avd-landing-zone` gain first-class Azure Local support without adding another control-plane repo or contract version.
- Good, because v1 stays focused on cloud-native Entra ID join and existing SMB shares, avoiding fragile cluster-storage automation.
- Bad, because brownfield AD DS / hybrid-joined Azure Local deployments are assessed read-only in v1 rather than deployed by `avd-landing-zone`, and `avd-hcl` Terraform support lags Bicep by one phase.

## More Information

Full specification and phased rollout plan across the family.

<!-- more -->

- Full specification: [docs/azure-local-support-spec.md](../../azure-local-support-spec.md).
- Builds on [decision 0009](0009-split-landing-zone-into-five-control-planes.md) and [decision 0010](0010-expand-assess-and-current-state-across-five-control-planes.md).
