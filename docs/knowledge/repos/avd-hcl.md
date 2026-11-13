---
title: "avd-hcl"
summary: "Enterprise IaC: native Azure Virtual Desktop deployed and operated with Terraform and Packer"
topic: repos
status: verified
last_reviewed: 2026-11-13
---

# avd-hcl

Native Azure Virtual Desktop deployed and operated with Terraform and Packer—the recommended enterprise IaC option alongside Bicep.

<!-- more -->

For enterprise platform teams, Terraform is the stronger IaC option: it orchestrates Azure alongside Entra ID, GitHub, DNS, monitoring, and multi-cloud or SaaS providers in one dependency graph, tracks explicit state for deterministic `plan` diffs and clean deletion, and standardizes on HCL and mature policy-as-code tooling ([decision 0014](../decisions/0014-terraform-as-enterprise-iac-option.md)).

The repo is the source of truth: [avd-ops/avd-hcl](https://github.com/avd-ops/avd-hcl). This page says where it fits.

## What it does

It deploys native AVD infrastructure and golden images using HashiCorp community editions (Terraform and Packer) with Azure Key Vault and managed identities for secrets.

- Provides modular Terraform roots for the platform, FSLogix storage, Key Vault, monitoring, AVD control plane, session hosts, and Compute Gallery.
- Uses Packer with Windows Desktop Optimization Tool (WDOT) for golden image builds.
- Keeps secrets out of Terraform state using ephemeral reads and write-only attributes.
- Supports pooled or personal Entra-joined host pools, autoscale, Start VM on Connect, and blue/green host rotation.

## How it fits

It is the Terraform and Packer counterpart to [avd-landing-zone](avd-landing-zone.md) and [avd-azure](avd-azure.md) (which remain Bicep and PowerShell for zero-state Azure-native deployments).

- Choose **avd-hcl** when your organization wants multi-provider orchestration, explicit state and deletion tracking, `moved` refactoring, or already standardizes on Terraform.
- Choose **avd-landing-zone** / **avd-azure** when you are Azure-only and want zero state-file management and Day-0 ARM API support.
- Checked by [avd-current-state](avd-current-state.md) and aligned with [avd-assess](avd-assess.md) standards.

## Read more in the repo

The repo has the full detail. Start here:

- [README and layout](https://github.com/avd-ops/avd-hcl/blob/main/README.md)
