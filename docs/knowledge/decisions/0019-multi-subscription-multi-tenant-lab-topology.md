---
status: accepted
date: 2026-11-15
decision-makers: [owner]
---

# 0019. Multi-subscription and multi-tenant AVD lab topology

Standardize lab and CI testing on a 4-subscription ALZ primary tenant and a secondary T2T Entra ID tenant at \$0/mo idle cost, orchestrated with Terraform (`avd-hcl`).

## Context and Problem Statement

Running interactive lab work, unattended CI teardowns, hub-and-spoke peering, and T2T tests in one subscription and one tenant causes collisions and leaves cross-boundary paths untested.

<!-- more -->

When interactive lab work and unattended CI runs share one subscription, subscription-wide Azure Resource Graph teardown checks and spend locks collide. Likewise, a single subscription cannot validate simultaneous hub-and-spoke peering, central DNS/logging across spokes, or programmatic subscription vending, and a single Microsoft Entra ID tenant cannot validate T2T, B2B, or Lighthouse boundaries. What lab topology and billing/automation boundary should `avd-ops` standardize on for multi-subscription and multi-tenant AVD testing?

## Considered Options

Three options were weighed:

- **Single-tenant, single-subscription lab:** Lowest setup effort; validates Management Groups, RBAC inheritance, and Azure Policy, but cannot test hub-and-spoke peering, central DNS/logging, subscription vending, CI isolation, or T2T scenarios.
- **4-subscription ALZ primary tenant + 1-subscription secondary Entra tenant (MCA-backed, Terraform-orchestrated):** Separates `platform-connectivity`, `platform-management`, `lz-avd-workload`, and `sandbox-ci` under an ALZ Management Group tree, adds a secondary Entra tenant for T2T/Lighthouse, keeps \$0/mo idle base cost, and uses Terraform (`avd-hcl`) for cross-provider automation.
- **Full enterprise EA/CSP multi-region lab with always-on Firewall and Bastion:** Realistic steady state, but incurs continuous hourly charges even when idle, violating the lab's \$0/mo base-cost guardrail.

## Decision Outcome

Chosen option: "4-subscription ALZ primary tenant + 1-subscription secondary Entra tenant (MCA-backed, Terraform-orchestrated)".

<!-- more -->

Why: It gives full coverage of ALZ hub-and-spoke networking, central logging, subscription vending, isolated CI teardowns, and T2T/Lighthouse workflows at a \$0/mo idle base cost, while aligning with [decision 0016](0016-terraform-as-enterprise-iac-option.md) by using Terraform (`avd-hcl`) for cross-provider orchestration across Azure Resource Manager, Microsoft Entra ID, and Azure Lighthouse (with Bicep in `avd-landing-zone` / `avd-azure` staying in its own lane).

### Primary Lab Tenant — 4-Subscription ALZ Hub & Spoke (\$0/mo base cost)

The primary tenant uses a standard ALZ Management Group hierarchy:

- `platform/connectivity` -> `platform-connectivity`: Hub VNet, Azure Firewall / NVA, Azure Bastion, and central Private DNS zones.
- `platform/management` -> `platform-management`: Central Log Analytics workspace, Automation account, and run/evidence store.
- `landing-zones` -> `lz-avd-workload` (1–2 spoke subscriptions): AVD host pools and session hosts peering to the hub.
- `sandbox` -> `sandbox-ci`: Dedicated disposable subscription for unattended CI runs so interactive lab work never collides with subscription-wide Resource Graph teardown checks or spend locks.
- `decommissioned`: Empty holding group for retired or quarantined subscriptions.

Note on scope: Management Groups, RBAC inheritance, and Azure Policy can be tested with 1 subscription, while 3–4 subscriptions are required to test simultaneous hub-and-spoke peering, central DNS/logging, and subscription vending. Paid hub components (Azure Firewall, Bastion, session hosts) are deployed on demand for a run and torn down afterward so the standing idle cost remains \$0/mo.

### Secondary Entra Tenant (Optional) — T2T & Multitenant Testing (\$0/mo base cost)

All of `avd-ops` deploys into a **single Azure / Entra ID tenant** by default. Only when validating cross-tenant scenarios, add a separate Microsoft Entra ID tenant with 1 Pay-As-You-Go subscription:

- Azure Lighthouse delegations (`Microsoft.ManagedServices`).
- Entra Cross-Tenant Access Settings and B2B guest policies.
- Multitenant app consent and cross-tenant Private Link approvals.

Licensing boundary: Entra Free covers Azure Lighthouse delegations and multitenant app registrations at \$0/mo; 1–2 Entra ID P1 licenses (or Microsoft 365 Developer E5 if eligible) are required for Conditional Access, Privileged Identity Management (PIM), and granular Cross-Tenant Access policy testing.

### Billing & Automation Boundary (MCA vs. MOSA)

Check the billing agreement type with `az billing account list` before automating subscription creation:

- **Prefer Microsoft Customer Agreement (MCA):** \$0 minimum spend and credit-card Pay-As-You-Go via the business/org signup flow, supporting programmatic subscription vending (`azurerm_subscription` or `az account alias create`). The initial credit-card subscription cap (typically 1–5 subscriptions) can be raised via a free Billing Support ticket.
- **Legacy MOSA fallback:** Cannot vend subscriptions programmatically; initial subscriptions must be created manually in the Azure Portal.

Scriptable vs. one-time Portal boundary:

- **100% scriptable (Terraform / PowerShell / Azure CLI):** Management Group tree, subscription placement, MG-scoped RBAC and OIDC federated credentials, resource provider registrations, Azure Budgets, Policy assignments, Azure Lighthouse delegations, Cross-Tenant Access Settings, and vCPU quota requests.
- **One-time Portal steps:** Secondary Entra tenant creation (CAPTCHA), Tenant Root Group elevation toggle (`User Access Administrator`), and initial subscription creation if on MOSA.

Spend and quota guardrails:

- Per-subscription Azure Budgets and aggregated month-to-date (MTD) spend cap tracking across all lab subscriptions.
- Early `centralus` vCPU quota requests on every new subscription before running AVD host-pool deployments.

### Consequences

- Good, because unattended CI runs in `sandbox-ci` never collide with interactive lab resources or Resource Graph teardown checks in `lz-avd-workload`.
- Good, because cross-provider Terraform state (`avd-hcl`) manages Azure subscriptions, Management Groups, Entra ID objects, Lighthouse delegations, and Budgets in one dependency graph.
- Good, because idle base cost stays \$0/mo when compute, Firewall, and Bastion are torn down between runs.
- Bad, because MCA credit-card accounts start with a low subscription cap (1–5 subscriptions) requiring a one-time free Billing Support ticket to reach the full 4+1 topology.
- Bad, because Conditional Access, PIM, and granular Cross-Tenant Access tests require 1–2 paid Entra ID P1 licenses (or an eligible M365 Dev E5 tenant).

## More Information

Related bootstrap runbook and family governance decisions:

- Companion bootstrap and operator checklist: [Multi-tenant and multi-subscription lab bootstrap](../getting-started/multi-tenant-lab-bootstrap.md).
- Enterprise IaC positioning: [decision 0016](0016-terraform-as-enterprise-iac-option.md).
- Sandbox cost and batch guardrails: [sandbox batches](../concepts/sandbox-batches.md).
