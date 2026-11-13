---
status: proposed
date: 2026-11-13
decision-makers: [owner]
---

# 0014. Add avd-networking as the Connectivity control-plane repo

Add `avd-networking` as the sixth control-plane repo orchestrated by `avd-landing-zone` for enterprise hub connectivity, egress inspection, and central Private DNS.

## Context and Problem Statement

How should the family deploy a full enterprise hub-and-spoke connectivity foundation without mixing Connectivity subscription RBAC and lifecycle into the AVD workload repo?

<!-- more -->

Under [decision 0009](0009-split-landing-zone-into-five-control-planes.md), [avd-azure](../repos/avd-azure.md) owns both the AVD workload (host pools, workspaces, session hosts, FSLogix storage, Key Vault) and the AVD spoke VNet (`HubPeered` or `Standalone`). While `avd-azure` already accepts `hubVnetResourceId`, `hubFirewallPrivateIp`, `dnsServers`, and `centralPrivateDnsZoneResourceIds`, nothing in the family deploys the hub itself. Putting Azure Firewall, DNS Private Resolver, central Private DNS zones, ExpressRoute/VPN gateways, and shared Azure Bastion inside `avd-azure` mixes Connectivity subscription RBAC, higher idle spend, and shared enterprise blast radius into the AVD workload lifecycle. How should enterprise hub connectivity be structured?

## Considered Options

Three options were weighed.

- Add `avd-networking` as a sixth control-plane repo for Platform Connectivity, emitting contract C31 (`avd-networking-outputs/v1`) consumed by `avd-azure`
- Add hub Bicep modules directly into `avd-azure` alongside the AVD spoke and session hosts
- Keep hub deployment out of scope and require operators to bring an existing hub

## Decision Outcome

Chosen option: "Add `avd-networking` as a sixth control-plane repo for Platform Connectivity, emitting contract C31 (`avd-networking-outputs/v1`) consumed by `avd-azure`".

<!-- more -->

Why: enterprise environments separate the Connectivity subscription (NetOps RBAC) from the AVD workload subscription, while brownfield teams already have a hub and greenfield enterprise labs need to deploy one declaratively. Separating `avd-networking` preserves `avd-azure`'s single-workload boundary, lets brownfield runs skip `avd-networking`, and keeps `avd-landing-zone` as the single orchestrator via a redacted handoff contract.

- **Scope of `avd-networking`:** Hub VNet (`GatewaySubnet`, `AzureFirewallSubnet`, `AzureBastionSubnet`, DNS Private Resolver subnets), Azure Firewall and Firewall Policy aligned with `avd-assess` required endpoints (including RDP Shortpath UDP 3478 where enabled), central Private DNS zones (`privatelink.wvd.*`, `privatelink-global.wvd.*`, `privatelink.file.*`, `privatelink.vaultcore.*`), DNS Private Resolver, optional VPN/ExpressRoute gateways, Standard Azure Bastion, and VNet Flow Logs.
- **Cost profiles (`lab` vs. `enterprise`):** To respect the family's no-idle-burn guardrail, `lab` defaults to Firewall Basic (or optional bypass), no hybrid gateways, and minimal public IPs; `enterprise` enables Standard/Premium Firewall with multi-PIP SNAT scaling, Private Resolver, and optional gateways.
- **Cloud parity (`commercial` and `usgov`):** Follows [decision 0013](0013-azure-us-government-and-gcc-high-support.md) with explicit cloud-aware DNS suffixes and capability fallbacks where a service or SKU is unavailable in `usgov`.
- **Two-phase cross-subscription handoff:** `avd-networking` emits `networking-outputs.json` (contract C31 `avd-networking-outputs/v1`) consumed by `avd-azure` in `HubPeered` mode, and supports an idempotent spoke-linking step (`Add-SpokeLink`) for environments where `avd-azure` lacks `Network Contributor` on the hub subscription.

### Consequences

- Good, because Connectivity RBAC, idle-cost controls, and hub blast radius stay isolated from AVD host-pool deployments.
- Good, because brownfield organizations skip `avd-networking` and pass their existing hub IDs into `avd-azure`, while greenfield enterprise labs deploy end to end.
- Bad, because `avd-landing-zone`, `avd-assess` (contract C31), and `avd-current-state` must support a sixth control plane and its handoff schema.

## More Information

Links to related family decisions and repository registration rules.

<!-- more -->

- [Decision 0009](0009-split-landing-zone-into-five-control-planes.md) defines the control-plane split and the rule that `avd-networking` is added to `repos.json` once its repository and README brand line are live on GitHub.
- [Decision 0013](0013-azure-us-government-and-gcc-high-support.md) defines the `commercial` and `usgov` cloud profiles.
