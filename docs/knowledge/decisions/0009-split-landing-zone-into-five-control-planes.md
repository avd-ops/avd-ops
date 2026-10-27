---
status: accepted
date: 2026-10-27
decision-makers: [owner]
---

# 0009. Split deployment into five control-plane repos orchestrated by avd-landing-zone

avd-landing-zone becomes the top-level orchestrator and deployment portal over five control-plane repos: avd-entra, avd-intune, avd-m365, avd-azure and avd-power-platform.

## Context and Problem Statement

How should the project handle Entra ID, Intune, Microsoft 365 and Power Platform alongside Azure Virtual Desktop for greenfield setups?

<!-- more -->

A greenfield AVD deployment needs more than Azure Bicep resources: session hosts must join Entra ID groups and pass Conditional Access, enroll into Intune Settings Catalog and compliance policies, load OneDrive and Teams VDI baselines from Microsoft 365, and tie into day-2 operational workflows in Power Platform. Putting Microsoft Graph, M365 and Power Platform code inside a single Azure Bicep repo mixes different APIs, RBAC roles and tenant-wide teardown rules, while leaving them out leaves greenfield setups incomplete. How should the deployment layer be organized across these control planes?

## Considered Options

Three options were weighed.

- Make avd-landing-zone the top-level orchestrator and deployment portal over five control-plane repos (`avd-entra`, `avd-intune`, `avd-m365`, `avd-azure` and `avd-power-platform`)
- Keep Azure Bicep inside avd-landing-zone and add four sibling repos alongside it
- Combine Entra ID, Intune and Microsoft 365 into one tenant repo alongside avd-landing-zone and a Power Platform repo

## Decision Outcome

Chosen option: "Make avd-landing-zone the top-level orchestrator and deployment portal over five control-plane repos (`avd-entra`, `avd-intune`, `avd-m365`, `avd-azure` and `avd-power-platform`)".

<!-- more -->

Why: each Microsoft control plane has its own API surface, administrator roles and teardown blast radius, while operators still want one deployment portal (`deploy.avd-ops.dev/portal/`) that sequences the whole estate or any slice of it. Separating `avd-entra` from `avd-m365` lets brownfield organizations run `avd-entra`, `avd-intune` and `avd-azure` without touching existing Exchange, SharePoint or Teams settings, while greenfield labs run all five. Extracting the Azure Bicep engine into `avd-azure` gives every control plane a symmetric, single-purpose repo.

- **avd-landing-zone** is the top-level orchestrator and browser deployment portal (`deploy.avd-ops.dev/portal/`). It composes the topology manifest, lets the operator choose which planes to run, invokes each plane at a pinned commit in Azure Cloud Shell, and passes redacted handoff JSON between stages.
- **avd-entra** owns identity and zero-trust access: per-pool user groups, dynamic session-host device groups, break-glass exclusions, AVD Conditional Access policies (`reportOnly` by default), Entra Kerberos setup for Azure Files, and optional greenfield user and license seeding.
- **avd-intune** owns session-host device enrollment and management: MDM auto-enrollment scope, multi-session Windows Enterprise enrollment rules, Settings Catalog profiles (FSLogix, RDP Shortpath, multimedia redirection, session limits, Windows Update rings), compliance policies and host app assignments.
- **avd-m365** owns the greenfield productivity baseline: OneDrive Silent Account Configuration and Known Folder Move, Microsoft Teams VDI media optimization policies, and M365 Apps Shared Computer Activation and Outlook caching baselines.
- **avd-azure** owns the Azure ARM and Bicep infrastructure extracted from avd-landing-zone: virtual networks, Private Link, Premium Azure Files for FSLogix, Key Vault, workspaces, host pools, application groups, session hosts, WDOT image optimization and PSRule CI.
- **avd-power-platform** owns day-2 low-code environment automation for the deployed estate: Bicep `Microsoft.PowerPlatform/enterprisePolicies` for VNet injection, dedicated Power Platform environments, DLP policies, and source-controlled Power Automate solutions for self-service access approvals and session-host operations.
- Every repo is driven by Bicep, PowerShell 7, Bash and Python (`az rest`, Microsoft Graph REST and `pac` CLI) with zero portal click-ops, stamps created tenant objects with a run manifest for clean teardown, and checks licenses in preflight without purchasing commitments.

### Consequences

- Good, because each repo maps to one control plane, one permission boundary and one CI pipeline.
- Good, because brownfield and greenfield deployments share the same portal and pick only the stages they need.
- Bad, because existing Bicep templates, scripts and pinned references in avd-landing-zone must migrate to avd-azure across a phased rollout.

## More Information

Links, rollout phases and how this fits the rest of the project.

<!-- more -->

- Under [family roles](../../family-roles.md), `avd-current-state` remains the single read-only collector and validator across these planes, and `avd-assess` remains the single benchmark and reference map.
- Whereas `avd-swarm` provides agentic reasoning and GitHub-gated plans on top of the foundation, `avd-power-platform` provides deterministic tenant workflows (such as Teams Adaptive Card access approvals and scheduled host operations) inside the deployed environment.
- Each new public repo is added to `repos.json` once its repository and README brand line are live on GitHub.
