---
status: proposed
date: 2026-11-17
decision-makers: [owner]
---

# 0024. Provide an optional nested Azure Local 23H2+ lab prerequisite in Terraform

Provide an optional, disposable nested Azure Local 23H2+ lab in `labs/azure-local-nested/` using Terraform for Phase 4 validation.

## Context and Problem Statement

How should `avd-sandbox` stand up a disposable Azure Local 23H2+ target when no physical cluster is available?

<!-- more -->

Without a reproducible nested-virtualization lab option, Phase 4 live validation of `avd-azure` and `avd-hcl` (`hostPlacement: "azure-local"`) cannot run end-to-end in an Azure-hosted sandbox, leaving security claims at `standing: guarded`.

## Considered Options

Three options were weighed.

- **Optional Terraform nested lab stack (`labs/azure-local-nested/`) emitting the 4 BYO outputs:** Provisions a nested-virtualization-capable Azure VM (`Standard_E32ds_v5` default in `centralus`) with auto-shutdown and TTL spend guards, Hyper-V NAT/SMB bootstrap, and Stage 2 Arc Logical Network / Gallery Image resources, emitting `custom_location_id`, `azure_local_logical_network_id`, `azure_local_image_id`, and `local_smb_profile_path`.
- **Embed nested Azure Local cluster provisioning inside `avd-azure` / `avd-hcl`:** Mixes prerequisite cluster infrastructure into AVD host-pool modules and violates Decision 0023's BYO boundary.
- **Require physical Azure Local hardware only:** Blocks cloud-only Phase 4 validation in `avd-sandbox`.

## Decision Outcome

Chosen option: "Optional Terraform nested lab stack (`labs/azure-local-nested/`) emitting the 4 BYO outputs".

<!-- more -->

Why: Keeping the nested lab as a separate, opt-in Terraform stack in `avd-ops` preserves the clean BYO contract in `avd-azure` and `avd-hcl`, follows ADR-0008 (Terraform HCL for new infrastructure), and enforces strict spend guards (`enable_auto_shutdown = true`, `ttl_hours` expiry tags, and single-resource-group `terraform destroy`).

### Consequences

- Good, because `avd-sandbox` Phase 4 runs can provision a disposable Azure Local 23H2+ target in `centralus` and export `AZL_CUSTOM_LOCATION_ID`, `AZL_LOGICAL_NET_ID`, `AZL_IMAGE_ID`, and `AZL_SMB_PATH` directly.
- Good, because `avd-azure` and `avd-hcl` remain unchanged and free of nested-virtualization lab logic.
- Bad, because nested Azure Local 23H2+ requires large-memory SKUs (`Standard_E32ds_v5` recommended, ~$2.30/hr while running), requiring explicit `go batch` approval and prompt teardown.

## More Information

Lab runbook, SKU cost table, and parent Azure Local specification.

<!-- more -->

- Lab stack and cost/SKU documentation: `labs/azure-local-nested/README.md`.
- Parent architecture decision: [decision 0023](0023-azure-local-support.md) and [Azure Local support specification](../../azure-local-support-spec.md).
