---
status: proposed
date: 2026-11-14
decision-makers: [owner]
---

# 0015. Add avd-gcp as the GCP Hybrid session-host control-plane repo

Add `avd-gcp` as the GCP compute, network, FSLogix storage, and Azure Arc onboarding control-plane repo for Azure Virtual Desktop Hybrid.

## Context and Problem Statement

How should the family deploy and operate Azure Virtual Desktop (AVD) Hybrid session hosts on Google Cloud Platform without mixing GCP Terraform/Packer into the Azure Bicep control planes?

<!-- more -->

AVD Hybrid (GA September 2026) keeps the AVD brokering, workspace, and host-pool control plane in Azure while allowing session hosts to run on non-Azure infrastructure onboarded as Azure Arc-enabled servers with `Microsoft.AzureVirtualDesktop.CloudDeviceExtension`. Under [decision 0009](0009-split-landing-zone-into-five-control-planes.md), [avd-azure](../repos/avd-azure.md) owns Azure-native Bicep infrastructure and [avd-landing-zone](../repos/avd-landing-zone.md) orchestrates Azure control planes. Bicep cannot provision Google Cloud Compute Engine VMs, VPCs, Cloud NAT, or Google Cloud NetApp Volumes, and AVD Hybrid does not support Windows 10/11 Enterprise multi-session, AVD Autoscale, Start VM on Connect, or Azure VM power management. How should GCP-hosted AVD Hybrid infrastructure be structured?

## Considered Options

Three options were weighed.

- Add `avd-gcp` as a dedicated Terraform + Packer repo for GCP Hybrid session hosts, emitting contract C32 (`avd-gcp-outputs/v1`)
- Add GCP Terraform modules directly inside `avd-hcl` alongside Azure-native Terraform
- Keep GCP session-host provisioning out of scope and require operators to onboard existing VMs manually

## Decision Outcome

Chosen option: "Add `avd-gcp` as a dedicated Terraform + Packer repo for GCP Hybrid session hosts, emitting contract C32 (`avd-gcp-outputs/v1`)".

<!-- more -->

Why: keeping `avd-gcp` separate preserves `avd-azure`'s Azure Bicep boundary and `avd-hcl`'s Azure-native Terraform boundary, while giving AVD Hybrid a clean, repeatable GCP plane with its own offline `terraform test` suite and cost guardrails.

- **Scope of `avd-gcp`:** GCP VPC and private subnet with Cloud Router + Cloud NAT (outbound-only TCP 443 to AVD and Azure Arc endpoints, optional outbound UDP 3478 for RDP Shortpath, no inbound RDP `3389` from the internet), Shielded Compute Engine session hosts (Secure Boot + vTPM), Packer golden image pipeline, optional Google Cloud NetApp Volumes (SMB) for FSLogix profile containers, Cloud Instance Schedules for power management, and idempotent Azure Arc + `CloudDeviceExtension` onboarding.
- **MVP OS & identity target:** Single-session **Windows 11 Enterprise** with **Entra ID join** (no AD DS required), aligning with `avd-landing-zone`'s cloud-native identity model. Windows Server 2022/2025 (AD DS / hybrid-joined with RDS CALs) remains a documented extension path.
- **No-idle-burn guardrail:** `enable_fslogix_netapp` defaults to `false` in the `lab` profile to avoid minimum-capacity NetApp charges when testing, and Cloud Instance Schedules stop session hosts outside active hours.
- **Handoff contract:** `avd-gcp` emits `gcp-outputs.json` (contract C32 `avd-gcp-outputs/v1`) for `avd-azure`, `avd-landing-zone`, and `avd-current-state`.

### Consequences

- Good, because GCP provider credentials, Terraform state, and Packer images stay isolated from Azure Bicep and Azure-native HCL repos.
- Good, because AVD Hybrid constraints (single-session client OS, external power schedules, outbound-only Arc/AVD networking) are encoded explicitly in modules and tests.
- Bad, because `avd-assess` (contract C32) and `avd-current-state` must account for Arc-enabled GCP session hosts alongside Azure VMs.

## More Information

Links to related family decisions and repository registration rules.

<!-- more -->

- [Decision 0009](0009-split-landing-zone-into-five-control-planes.md) defines the control-plane split and repository registration in `repos.json`.
- [Decision 0014](0014-add-avd-networking-connectivity-control-plane.md) establishes the pattern for adding sibling control-plane repos with a redacted output contract.
