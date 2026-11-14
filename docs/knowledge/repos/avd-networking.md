---
title: "avd-networking"
summary: "Control plane: Platform Connectivity hub VNet, Azure Firewall, central Private DNS, DNS Private Resolver, gateways and Bastion"
topic: repos
status: verified
last_reviewed: 2026-11-13
---

# avd-networking

The Platform Connectivity control plane in Azure Bicep for enterprise hub-and-spoke AVD deployments.

<!-- more -->

Deploys the shared hub VNet, Azure Firewall and Policy, central Private DNS zones, DNS Private Resolver, optional VPN/ExpressRoute gateways, and shared Bastion ([decision 0014](../decisions/0014-add-avd-networking-connectivity-control-plane.md)).

The repo is the source of truth: [avd-ops/avd-networking](https://github.com/avd-ops/avd-networking). This page says where it fits.

## What it does

It deploys the Connectivity subscription layer independently from AVD workload spokes.

- Deploys the Hub VNet (`GatewaySubnet`, `AzureFirewallSubnet`, `AzureBastionSubnet`, DNS Private Resolver subnets) with `defaultOutboundAccess: false`.
- Configures Azure Firewall (`Basic` in `lab`, `Standard` or `Premium` with multi-PIP SNAT scaling in `enterprise`) and Firewall Policy rules aligned with `avd-assess` required endpoints.
- Deploys central Private DNS zones (`file`, `keyVault`, `avd`, `avdGlobal`) for `commercial` and `usgov` plus optional DNS Private Resolver.
- Provides `Add-SpokeLink.ps1` for two-phase cross-subscription peering and Private DNS VNet linking.

## How it fits

It runs before [avd-azure](avd-azure.md) in greenfield enterprise deployments and is skipped when bringing an existing hub.

- Emits `networking-outputs.json` (contract C31 `avd-networking-outputs/v1`) consumed by [avd-azure](avd-azure.md) in `HubPeered` mode and orchestrated by [avd-landing-zone](avd-landing-zone.md).

## Read more in the repo

The repo has the full detail. Start here:

- [README and quick start](https://github.com/avd-ops/avd-networking/blob/main/README.md)
