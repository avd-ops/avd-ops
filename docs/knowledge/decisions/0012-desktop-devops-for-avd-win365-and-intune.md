---
status: accepted
date: 2026-11-02
decision-makers: [owner]
---

# 0012. Position avd-second-brain and avd-swarm as Desktop DevOps for AVD, Windows 365 and Intune

avd-second-brain and avd-swarm form a Desktop DevOps layer across Azure Virtual Desktop, Windows 365 and Microsoft Intune, with Windows 365 handled inside avd-intune and the foundation.

## Context and Problem Statement

How should avd-second-brain, avd-swarm and the five-plane foundation cover Windows 365 Cloud PCs and Intune policy-as-code alongside Azure Virtual Desktop?

<!-- more -->

Enterprise desktop teams rarely operate Azure Virtual Desktop alone: they run pooled and personal AVD host pools alongside Windows 365 Cloud PCs (Enterprise and Frontline) and manage both—plus physical Windows endpoints—through Microsoft Intune Settings Catalog, compliance policies, assignment filters and update rings. [Decision 0009](0009-split-landing-zone-into-five-control-planes.md) and [decision 0010](0010-expand-assess-and-current-state-across-five-control-planes.md) established the five control planes (`avd-entra`, `avd-intune`, `avd-m365`, `avd-azure` and `avd-power-platform`), while `avd-second-brain` and `avd-swarm` were still described around AVD alone. How should the intelligence layer, the agent layer and the foundation repos support Desktop DevOps across AVD, Windows 365 and Intune?

## Considered Options

Three options were weighed.

- Position avd-second-brain and avd-swarm as Desktop DevOps across AVD, Windows 365 and Intune, integrating Windows 365 into avd-intune, avd-current-state and avd-assess
- Add Windows 365 and Intune policy-as-code only in avd-second-brain and avd-swarm, leaving the foundation repos scoped to AVD only
- Create a sixth control-plane repository (`avd-win365`) alongside `avd-intune` for Windows 365 Cloud PCs

## Decision Outcome

Chosen option: "Position avd-second-brain and avd-swarm as Desktop DevOps across AVD, Windows 365 and Intune, integrating Windows 365 into avd-intune, avd-current-state and avd-assess".

<!-- more -->

Why: in Microsoft's cloud architecture, Windows 365 is an Intune-native service exposed on the Microsoft Graph `deviceManagement/virtualEndpoint` surface (`cloudPCs`, `provisioningPolicies`, `userSettings`, `deviceImages`, `onPremisesConnections`), governed under `Intune Administrator` / `Cloud PC Administrator` RBAC, and sharing the same Entra groups (`avd-entra`), optional Azure VNet connections (`avd-azure`), OneDrive/Teams VDI policies (`avd-m365`) and Intune Settings Catalog baselines (`avd-intune`). Keeping Windows 365 inside `avd-intune` and the existing foundation avoids a sixth control-plane repo while giving `avd-second-brain` and `avd-swarm` one unified contract pipeline (`C11`, `C15`, `C9`, `C10`, `C19`) across the entire desktop estate.

- **avd-second-brain (Desktop DevOps intelligence and memory):** Owns the unified knowledge base, contract schemas, policy and app compatibility catalog, workload placement rules (pooled AVD vs. personal AVD vs. Windows 365 Enterprise vs. Windows 365 Frontline), and per-estate private vaults across AVD, Windows 365 and Intune. It never holds a write credential.
- **avd-swarm (Desktop DevOps execution and operating layer):** Specialist agents (`readiness`, `deploy`, `hosts-and-cloudpcs`, `intune-policy`, `images-and-apps`, `users-and-access`, `cost-and-licensing`) read live state across Azure (`Microsoft.DesktopVirtualization`), Windows 365 (`deviceManagement/virtualEndpoint`) and Intune (`deviceManagement/*`), detect portal click-ops policy drift, and propose GitHub-gated `C9` plans behind one layered kill switch (`C10`).
- **avd-intune (Intune policy-as-code and Windows 365 control plane):** Deploys standard Intune assignment filters (`avd-multisession`, `avd-personal`, `win365-cloudpc`, `physical-desktop`) so multi-session and single-session policies never collide, plus an optional `-IncludeWin365` slice for declarative Windows 365 provisioning policies, user settings (local admin off, scheduled restore points) and Azure Network Connections.
- **avd-current-state and avd-assess:** `avd-current-state` collects read-only `c11.intune.win365.*` and assignment-filter facts via `GET /v1.0/deviceManagement/virtualEndpoint/*` and `/beta/deviceManagement/assignmentFilters` (guarded by `rebuild/scope.json` and `tests/ReadOnlyGuard.Tests.ps1`), and `avd-assess` scores assignment filter hygiene and Windows 365 readiness (marked `not-applicable` when `intake.win365Scope == "not-used"`).
- **Data-loss and spend guardrails:** Cloud PC reprovisioning or grace-period termination requires a verified point-in-time restore point or explicit `-DiscardLastCopy` ([never delete the last copy](../../never-delete-the-last-copy.md)), and scripts never purchase Windows 365 or Intune license commitments ([never leave the meter running](../../never-leave-the-meter-running.md)).

### Consequences

- Good, because operators get one Desktop DevOps workflow (GitOps policy management, drift detection and human-approved agent plans) across AVD, Windows 365 and Intune without a sixth control-plane repo.
- Good, because Intune assignment filters prevent multi-session AVD policies (`FSLogix`, `ServerRdsh` settings) from accidentally applying to single-session Cloud PCs or physical laptops.
- Bad, because `C9`, `C10`, `C11`, `C15` and `C19` schemas and `avd-intune` / `avd-current-state` scripts must expand in coordinated phases.

## More Information

Full specification and four-phase rollout order across avd-ops, avd-second-brain, avd-assess, avd-intune, avd-current-state and avd-swarm.

<!-- more -->

- Full specification: [docs/desktop-devops-spec.md](../../desktop-devops-spec.md).
- Builds on [family roles](../../family-roles.md), [decision 0009](0009-split-landing-zone-into-five-control-planes.md) and [decision 0010](0010-expand-assess-and-current-state-across-five-control-planes.md).
