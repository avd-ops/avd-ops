---
status: accepted
date: 2026-10-27
decision-makers: [owner]
---

# 0010. Expand avd-assess and avd-current-state natively across all five control planes

avd-assess and avd-current-state stay the single standards map and single read-only collector and validator, expanding across Entra ID, Intune, Microsoft 365, Azure and Power Platform.

## Context and Problem Statement

How should assessment standards, fact collection and deployment validation cover the five control planes introduced in decision 0009?

<!-- more -->

When [decision 0009](0009-split-landing-zone-into-five-control-planes.md) split deployment into five control-plane repos (`avd-entra`, `avd-intune`, `avd-m365`, `avd-azure` and `avd-power-platform`) orchestrated by `avd-landing-zone`, `avd-current-state` and `avd-assess` still focused primarily on Azure resources with draft Intune facts. How should `avd-current-state` and `avd-assess` expand so every plane `avd-landing-zone` orchestrates is assessed, collected, validated and scored under [family roles](../../family-roles.md)?

## Considered Options

Three options were weighed.

- Expand avd-assess and avd-current-state natively across all five control planes (`azure`, `entra`, `intune`, `m365` and `power-platform`)
- Split collection and validation into per-plane scripts inside each control-plane repo and make avd-current-state an orchestrator over them
- Keep avd-current-state and avd-assess scoped to Azure, Entra and Intune only, leaving Microsoft 365 and Power Platform checks inside their deployment repos

## Decision Outcome

Chosen option: "Expand avd-assess and avd-current-state natively across all five control planes (`azure`, `entra`, `intune`, `m365` and `power-platform`)".

<!-- more -->

Why: [family roles](../../family-roles.md) assigns one question to each foundation repo: what is there now (`avd-current-state`), what it should be (`avd-assess`), and how we build it (`avd-landing-zone` over the five control planes). Keeping one read-only collector/validator and one standards map means an operator assessing an existing estate or validating a deployment runs one tool, gets one redacted C11 facts file and one C21 report, and never needs write credentials or five separate assessment tools.

- **Modular plane selection (`-Planes`):** `avd-current-state` scripts (`avd_current_state_collector.ps1` and `avd_deployment_validator.ps1`) and the assessment portal accept `all` (default) or any combination of `azure`, `entra`, `intune`, `m365` and `power-platform`. Uncollected or unconsented planes degrade gracefully to `unknown` facts with a recorded status in `planesCollected` rather than failing the run.
- **Air-tight read-only transport:** `avd-current-state` reads Azure through Resource Graph and ARM `GET`, Entra ID, Intune and Microsoft 365 through `az rest` against Microsoft Graph (`GET` only, with a dedicated read-only scope set and a runtime token guard that rejects `.ReadWrite.*` scopes), Teams VDI policies through read-only `Get-Cs*` calls when available, and Power Platform through ARM `GET`, BAP/Dataverse `GET` and read-only `pac` CLI calls. Every allowed endpoint and command is pinned in `rebuild/scope.json` and enforced by a CI AST guard.
- **One unified C11 snapshot and C15 fact register:** Facts from all five planes live in one C11 snapshot under `c11.entra.*`, `c11.intune.*`, `c11.m365.*` and `c11.powerPlatform.*` alongside the existing Azure paths, keeping counts, booleans, public enums and keyed HMAC pseudonyms only.
- **Methods, scoring and plane-routed remediation in `avd-assess`:** `avd-assess` adds `methods/entra.md`, `methods/m365.md` and `methods/power-platform.md` alongside `methods/intune.md` and the Azure methods, keeps Well-Architected pillars as primary scores while adding per-plane scores and coverage (`azure`, `entra`, `intune`, `m365`, `power-platform`), tags every check and C24 remediation hint with its `plane`, and expands `security-review.yaml` across all 11 public repos.
- **Manifest-aware postflight validation:** `avd_deployment_validator.ps1` validates any combination of planes preflight and postflight, reading the stage handoff manifests (`entra-manifest.json`, `intune-manifest.json`, `m365-manifest.json`, `azure-outputs.json`, `power-platform-manifest.json`) or the `avd-landing-zone` run manifest when supplied, and discovering by convention when run standalone.

### Consequences

- Good, because `avd-current-state` and `avd-assess` stay self-contained foundation repos with one C11/C21/C24 pipeline across the entire five-plane estate.
- Good, because brownfield operators with only Azure `Reader` still get a working collection and assessment while seeing clearly which non-Azure planes were skipped.
- Bad, because `avd-assess` contracts (C11, C15, C20, C21, C24) and `avd-current-state` scripts must be updated and re-pinned in a coordinated four-phase rollout.

## More Information

Full specification and rollout sequence across `avd-ops`, `avd-assess`, `avd-second-brain` and `avd-current-state`.

<!-- more -->

- Full specification: [docs/five-plane-assess-current-state-spec.md](../../five-plane-assess-current-state-spec.md).
- Companion deployment decision: [decision 0009](0009-split-landing-zone-into-five-control-planes.md).
