---
status: proposed
date: 2026-11-13
decision-makers: [maintainers]
---

# 0014. Position Terraform (avd-hcl) as the enterprise IaC option alongside Bicep

Terraform (`avd-hcl`) is the recommended enterprise IaC option alongside Bicep (`avd-landing-zone` and `avd-azure`), with each repo staying in its own toolchain lane.

## Context and Problem Statement

The `avd-ops` family deploys native Azure Virtual Desktop with Bicep and PowerShell in `avd-landing-zone` and `avd-azure`, while `avd-hcl` implements native AVD with Terraform and Packer.

<!-- more -->

For enterprise platform teams, Terraform is the stronger IaC option: it manages Azure alongside Entra ID, GitHub, DNS, monitoring, and multi-cloud or SaaS providers in one dependency graph; tracks explicit state for deterministic `plan` diffs, clean resource deletion, and `moved` refactoring; and standardizes on HCL and mature policy-as-code tooling. How should `avd-ops` position Terraform relative to Bicep across the front door and family docs?

## Considered Options

Three options were weighed:

- Keep Bicep as the only documented IaC path and leave `avd-hcl` off `avd-ops.dev`
- Position Terraform (`avd-hcl`) as the recommended enterprise IaC option alongside Bicep (`avd-landing-zone` / `avd-azure`), keeping each repo in its own toolchain lane
- Replace Bicep with Terraform inside `avd-landing-zone` and `avd-azure`

## Decision Outcome

Chosen option: "Position Terraform (`avd-hcl`) as the recommended enterprise IaC option alongside Bicep (`avd-landing-zone` / `avd-azure`), keeping each repo in its own toolchain lane".

<!-- more -->

Why: enterprise estates benefit from Terraform's cross-provider orchestration, explicit state lifecycle, and `plan` fidelity without breaking the zero-state, Bicep-native `avd-landing-zone` and `avd-current-state` pair. Bicep repos stay Bicep/PowerShell-only, while Terraform and Packer live in [avd-hcl](../repos/avd-hcl.md).

### Consequences

- Good, because enterprise teams evaluating `avd-ops` see a first-class Terraform + Packer path with clear selection criteria.
- Good, because existing Bicep templates, CI guards, and Cloud Shell workflows in `avd-landing-zone` and `avd-azure` remain untouched.
- Bad, because two IaC implementations (`avd-azure` in Bicep and `avd-hcl` in Terraform) must stay aligned on the same `avd-assess` standards and topology contracts.

## More Information

Cross-references to the family knowledge base and `avd-hcl` decision log:

- Also recorded in `avd-second-brain` as [decision 0028](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0028-terraform-as-enterprise-iac-option.md).
- See [avd-hcl decision 0001](https://github.com/avd-ops/avd-hcl/blob/main/docs/knowledge/decisions/0001-native-avd-with-the-hashicorp-stack.md).
