---
title: "avd-power-platform"
summary: "Control plane: Power Platform environments, DLP policies and Power Automate day-2 workflows for Azure Virtual Desktop"
topic: repos
status: plan
last_reviewed: 2026-10-27
---

# avd-power-platform

The Power Platform and Power Automate day-2 workflow control plane for deployed AVD estates.

<!-- more -->

Bicep enterprise policies, Power Platform environment governance, and unpacked Power Automate solutions that automate self-service access and day-2 host operations for an estate deployed by avd-landing-zone ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)).

The repo is the source of truth: [avd-ops/avd-power-platform](https://github.com/avd-ops/avd-power-platform). This page says where it fits.

## What it does

It provisions Power Platform governance and approval-gated Power Automate flows for the AVD estate.

- Deploys dedicated Power Platform environments, strict DLP policies, and Bicep `Microsoft.PowerPlatform/enterprisePolicies` for VNet subnet injection.
- Ships unpacked Power Automate solutions in Git for self-service pool and personal desktop access requests in Microsoft Teams.
- Automates approval-gated session-host drain mode, restart, personal desktop start-on-demand, and stale FSLogix profile alerts.
- Driven headlessly from Bicep, PowerShell 7, Bash, Python and the Power Platform CLI (`pac`).

## How it fits

It wires deterministic tenant workflows to the groups in avd-entra and the host pools in avd-azure.

- Orchestrated by [avd-landing-zone](avd-landing-zone.md) after [avd-entra](avd-entra.md) and [avd-azure](avd-azure.md) complete.
- Complements [avd-swarm](avd-swarm.md): whereas avd-swarm runs agentic reasoning and GitHub-gated plans, avd-power-platform runs deterministic self-service and operator approval flows inside the tenant.

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-power-platform/blob/main/README.md)
