---
title: "The repos"
summary: "Each AVD repo, its lifecycle stage and where to read more; every repo is the source of truth for itself"
topic: repos
status: verified
last_reviewed: 2026-11-11
---

# The repos

Seventeen public repos across five architectural layers, each the source of truth for itself. Pick one to see where it fits.

## Assess and plan {#layer-assess}

What is there now, what it should be, and what moves.

| Repo | Role | Maturity | Portal |
|---|---|---|---|
| [avd-current-state](avd-current-state.md) | What is there now | Proven | [avd-ops.app/assess](https://avd-ops.app/assess/) |
| [avd-assess](avd-assess.md) | What it should be, and why | Pre-beta | — |
| [avd-migrate](avd-migrate.md) | Single-pool target-state baseline designer and manifest writer | Pre-beta | [avd-ops.app/migrate](https://avd-ops.app/migrate/) |
| [avd-benchmark](avd-benchmark.md) | Active Tier 1 benchmark harness and interactive explorer | Pre-beta | [avd-ops.app/benchmark](https://avd-ops.app/benchmark/) |
| [avd-learn](avd-learn.md) | Ground-up AVD foundations dataset, CLI and installable PWA mapped to AZ-104 and AZ-140 | Pre-beta | [avd-ops.github.io/avd-learn/site](https://avd-ops.github.io/avd-learn/site/) |

## Build and change {#layer-build}

One orchestrator deploys the landing zone and every change after it.

| Repo | Role | Maturity | Portal |
|---|---|---|---|
| [avd-landing-zone](avd-landing-zone.md) | How it's built and changed from here: orchestrator and portal | Proven | [avd-ops.app/deploy](https://avd-ops.app/deploy/) |
| [avd-hcl](avd-hcl.md) | Enterprise IaC: native AVD | Pre-beta | — |

## Control planes {#layer-control}

Identity, devices, Microsoft 365, Azure, the network and day-2 workflows, as code.

| Repo | Role | Maturity |
|---|---|---|
| [avd-entra](avd-entra.md) | Entra ID identity, groups and Conditional Access | Pre-beta |
| [avd-intune](avd-intune.md) | Intune policy-as-code, session-host enrollment and Windows 365 Cloud PCs | Pre-beta |
| [avd-m365](avd-m365.md) | Greenfield Microsoft 365, OneDrive and Teams VDI | Pre-beta |
| [avd-azure](avd-azure.md) | Azure ARM and Bicep infrastructure | Pre-beta |
| [avd-networking](avd-networking.md) | Platform Connectivity hub VNet, Firewall, DNS and gateways | Pre-beta |
| [avd-security](avd-security.md) | Defender for Cloud, Sentinel KQL detections, Azure Policy baselines, and posture scoring | Pre-beta |
| [avd-power-platform](avd-power-platform.md) | Power Platform and Power Automate day-2 workflows | Pre-beta |

## Operate and support {#layer-operate}

Troubleshoot hosts and check the network a user connects from.

| Repo | Role | Maturity | Portal |
|---|---|---|---|
| [avd-remediate](avd-remediate.md) | Troubleshooting, host-level telemetry collection and human-approved remediation workbench | Pre-beta | — |
| [avd-linecheck](avd-linecheck.md) | End-user browser network check | Pre-beta | [avd-ops.app/linecheck](https://avd-ops.app/linecheck/) |

## Intelligence, on top {#layer-intelligence}

Optional agents and memory. The foundation never needs them.

| Repo | Role | Maturity |
|---|---|---|
| [avd-swarm](avd-swarm.md) | Desktop DevOps agents across AVD, Windows 365 and Intune | Design |
| [avd-second-brain](avd-second-brain.md) | Desktop DevOps intelligence and memory across AVD, Windows 365 and Intune | Pre-beta |

<!-- more -->

The list lives in [repos.json](https://github.com/avd-ops/avd-ops/blob/main/repos.json), which the site
and the family check both read ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

## Walkthroughs and guides

Step-by-step walkthroughs for running the repos in a lab, from Cloud Shell setup to troubleshooting.

<!-- more -->

- [Working from Cloud Shell](../getting-started/cloud-shell.md) and [Cloud Shell and its alternatives](../getting-started/shell-options.md)
- [Lab walkthrough](../getting-started/lab-walkthrough.md) and [multi-tenant lab bootstrap](../getting-started/multi-tenant-lab-bootstrap.md)
- [Control-plane modules](../getting-started/control-planes.md)
- [Estate vault walkthrough](../getting-started/estate-vault.md)
- [Migrate, benchmark, and linecheck](../getting-started/migrate-and-benchmark.md)
- [avd-remediate and avd-swarm](../getting-started/remediate-and-swarm.md)
- [Standards and learning](../getting-started/standards-and-learning.md)
