---
title: "Multi-tenant and multi-subscription lab bootstrap"
summary: "Bootstrap checklist for the 4-subscription ALZ primary tenant and secondary T2T Entra tenant at $0/mo idle cost"
topic: getting-started
status: plan
last_reviewed: 2026-11-15
---

# Multi-tenant and multi-subscription lab bootstrap

Set up a single-tenant or 4-subscription ALZ hub-and-spoke lab (with an optional secondary T2T Entra ID tenant) at \$0/mo idle cost, separating Portal steps from Terraform automation.

<!-- more -->

> **Single-tenant default:** All of `avd-ops` deploys into a **single Azure / Entra ID tenant** (and can start in a single subscription). The secondary Entra tenant (`t2t-lab`) below is **optional**—only needed if you are testing cross-tenant (T2T), Azure Lighthouse, or cross-tenant Private Link boundaries.

This runbook implements [decision 0019](../decisions/0019-multi-subscription-multi-tenant-lab-topology.md). It uses Terraform ([avd-hcl](../repos/avd-hcl.md)) as the primary IaC standard for cross-provider orchestration across Azure, Entra ID, Lighthouse, Policy, and Budgets, while keeping Bicep ([avd-landing-zone](../repos/avd-landing-zone.md)) in its own lane per [decision 0016](../decisions/0016-terraform-as-enterprise-iac-option.md). Never commit tenant, subscription, or object IDs to any repository.

## 1. Topology and base cost (\$0/mo idle)

Four subscriptions in the primary tenant isolate platform, workload, and CI lifecycles, while a fifth subscription in a secondary Entra tenant validates T2T and multitenant boundaries.

<!-- more -->

| Tenant | Management Group | Subscription | Purpose | Idle Cost |
|---|---|---|---|---|
| Primary | `platform/connectivity` | `platform-connectivity` | Hub VNet, Firewall/NVA, Bastion, central Private DNS zones | \$0/mo |
| Primary | `platform/management` | `platform-management` | Central Log Analytics workspace, Automation account, run/evidence store | \$0/mo |
| Primary | `landing-zones` | `lz-avd-workload` | 1–2 spoke subscriptions for AVD host pools and session hosts peering to hub | \$0/mo |
| Primary | `sandbox` | `sandbox-ci` | Disposable subscription for unattended CI runs and Resource Graph teardowns | \$0/mo |
| Primary | `decommissioned` | _(none)_ | Holding group for retired or quarantined subscriptions | \$0/mo |
| Secondary | Tenant Root Group | `t2t-lab` | Azure Lighthouse, Cross-Tenant Access, B2B, multitenant apps, cross-tenant Private Link | \$0/mo |

- **1 vs. 3–4 subscriptions:** Management Groups, RBAC inheritance, and Azure Policy can be tested with 1 subscription. Simultaneous hub-and-spoke peering, central DNS/logging, and subscription vending require 3–4 subscriptions.
- **Meter-off rule:** Deploy paid hub services (Azure Firewall, Bastion, session hosts) only for active runs and tear them down afterward so standing base cost stays \$0/mo.

## 2. Billing agreement check (MCA vs. MOSA)

Verify that your billing account is a Microsoft Customer Agreement (MCA) before automating subscription vending.

<!-- more -->

Run `az billing account list` in an authenticated shell and check `agreementType`:

- **Microsoft Customer Agreement (`MicrosoftCustomerAgreement`):** Preferred. Offers \$0 minimum spend and credit-card Pay-As-You-Go via the business/org signup flow, and supports programmatic subscription vending via Terraform `azurerm_subscription` or `az account alias create`.
- **Subscription cap increase:** New credit-card MCA accounts start with a cap of 1–5 subscriptions. Open a free **Billing Support** ticket in the Azure Portal to raise the cap to at least 5 subscriptions before vending the full topology.
- **Legacy MOSA (`MicrosoftOnlineServicesAgreement`):** Does not support programmatic subscription vending (`az account alias create`). If your account is MOSA, create the initial subscriptions manually in the Azure Portal or open a new MCA billing account.

## 3. One-time Portal steps (manual boundary)

Three setup actions cannot be automated via Terraform or CLI and must be completed once in the Azure Portal.

<!-- more -->

1. **Create the secondary Microsoft Entra ID tenant:** Entra tenant creation enforces an interactive CAPTCHA in the Azure Portal (`Microsoft Entra ID -> Manage tenants -> Create`).
2. **Enable Tenant Root Group elevation:** Temporarily toggle `Access management for Azure resources` in the Entra Properties blade to grant `User Access Administrator` at `/` so your bootstrap identity or service principal can assign MG-scoped RBAC. Toggle it back off once Terraform/CLI bootstrap completes.
3. **Create initial subscription(s) if on MOSA:** Only required if `az billing account list` reports `MicrosoftOnlineServicesAgreement` instead of `MicrosoftCustomerAgreement`.

## 4. Scriptable bootstrap (Terraform, PowerShell, Azure CLI)

Everything after the three Portal steps is 100% scriptable and repeatable across environments.

<!-- more -->

Use Terraform (`avd-hcl`), PowerShell, or Azure CLI (`az`) to provision and maintain:

- **Management Group tree:** Create `platform`, `platform/connectivity`, `platform/management`, `landing-zones`, `sandbox`, and `decommissioned` under the Tenant Root Group.
- **Subscription vending & placement:** Create subscriptions via `azurerm_subscription` / `az account alias create` (MCA) and associate each with its target Management Group.
- **MG-scoped RBAC & OIDC:** Assign least-privilege roles at the Management Group scope and configure GitHub Actions OIDC federated identity credentials (`azurerm_federated_identity_credential`) so CI authenticates to `sandbox-ci` with zero stored secrets.
- **Resource Provider registrations:** Register `Microsoft.DesktopVirtualization`, `Microsoft.Compute`, `Microsoft.Network`, `Microsoft.Storage`, `Microsoft.KeyVault`, `Microsoft.OperationalInsights`, and `Microsoft.ManagedServices` across target subscriptions.
- **Governance & Budgets:** Deploy Azure Policy assignments at Management Group scope and per-subscription `azurerm_consumption_budget_subscription` alerts.
- **T2T & Lighthouse:** Deploy Azure Lighthouse delegation definitions (`Microsoft.ManagedServices/registrationDefinitions` + `registrationAssignments`) from the secondary tenant to the primary tenant, and configure Entra Cross-Tenant Access Settings (`microsoftgraph` / `azuread`).
- **Quota requests:** Submit programmatic vCPU quota increase requests via Azure Quota REST API / `az quota` (`Microsoft.Quota`).

## 5. Spend and quota guardrails

Configure budgets and request `centralus` vCPU quota on every new subscription before running any AVD deployment.

<!-- more -->

- **Per-subscription Azure Budgets:** Attach a monthly budget with 50%, 80%, and 100% forecast/actual alert thresholds to `platform-connectivity`, `platform-management`, `lz-avd-workload`, `sandbox-ci`, and `t2t-lab`.
- **Aggregated MTD spend cap:** Track combined month-to-date (MTD) spend across all 5 subscriptions before launching paid [sandbox batches](../concepts/sandbox-batches.md).
- **Early `centralus` vCPU quota requests:** New Pay-As-You-Go subscriptions often start with low or zero regional vCPU quota (especially for `Standard_Dds_v5` / `Standard_Das_v5` session host families). Request `centralus` vCPU quota increases immediately after subscription creation so CI and lab runs do not block on quota.

## 6. Entra licensing boundary

Entra Free covers basic T2T and Lighthouse testing at \$0/mo; P1 or M365 Dev E5 unlocks Conditional Access and PIM.

<!-- more -->

- **Entra Free (\$0/mo):** Covers Azure Lighthouse delegations, basic B2B guest collaboration, multitenant app registrations and admin consent, and cross-tenant Private Link approvals.
- **Entra ID P1 (1–2 licenses, or M365 Dev E5 if eligible):** Required for Conditional Access policies, Privileged Identity Management (PIM), and granular Cross-Tenant Access Settings (MFA/compliant-device trust across tenants).
