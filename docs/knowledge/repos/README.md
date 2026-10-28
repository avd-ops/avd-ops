---
title: "The repos"
summary: "Each AVD repo, its lifecycle stage and where to read more; every repo is the source of truth for itself"
topic: repos
status: partial
last_reviewed: 2026-10-27
---

# The repos

Eleven public repos, each the source of truth for itself. Pick one to see where it fits.

| Repo | Role |
|---|---|
| [avd-current-state](avd-current-state.md) | What is there now |
| [avd-assess](avd-assess.md) | What it should be, and why |
| [avd-landing-zone](avd-landing-zone.md) | How it's built and changed from here: orchestrator and portal |
| [avd-entra](avd-entra.md) | Control plane: Entra ID identity, groups and Conditional Access |
| [avd-intune](avd-intune.md) | Control plane: Intune session-host enrollment and Settings Catalog |
| [avd-m365](avd-m365.md) | Control plane: greenfield Microsoft 365, OneDrive and Teams VDI |
| [avd-azure](avd-azure.md) | Control plane: Azure ARM and Bicep infrastructure |
| [avd-power-platform](avd-power-platform.md) | Control plane: Power Platform and Power Automate day-2 workflows |
| [avd-swarm](avd-swarm.md) | On top: the how of operating |
| [avd-second-brain](avd-second-brain.md) | On top: the why, over the environment's life |
| [avd-linecheck](avd-linecheck.md) | End-user browser network check |

<!-- more -->

The list lives in [repos.json](https://github.com/avd-ops/avd-ops/blob/main/repos.json), which the site
and the family check both read ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).
