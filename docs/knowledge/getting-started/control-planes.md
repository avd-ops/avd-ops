---
title: "Control-plane modules"
summary: "How the modular control-plane repos (Entra, Intune, M365, Azure, networking, security, and Power Platform) compose behind avd-landing-zone"
topic: getting-started
status: unverified
last_reviewed: 2026-11-20
---

# Control-plane modules

Deploy and validate individual AVD control planes in a throwaway lab, or let [avd-landing-zone](../repos/avd-landing-zone.md) orchestrate them together from Azure Cloud Shell ([working from Cloud Shell](cloud-shell.md)).

<!-- more -->

Use the [Lab walkthrough](lab-walkthrough.md) when you want one end-to-end deployment. Open the individual control-plane repos below when you want to inspect, customize, or run a single plane on its own.

## 1. Identity, endpoints, and M365 productivity

Run Entra ID, Intune, and Microsoft 365 Apps baselines before session hosts register.

<!-- more -->

- **[avd-entra](../repos/avd-entra.md):** Creates security groups, user/admin RBAC assignments, and Conditional Access baselines before hosts register.
- **[avd-intune](../repos/avd-intune.md):** Deploys VDI-tuned Windows 11 settings catalog, Defender AV/ASR/FSLogix exclusions, compliance policies, and platform assignment filters (`avd-multisession`, `avd-personal`).
- **[avd-m365](../repos/avd-m365.md):** Applies Microsoft 365 Apps shared computer activation, OneDrive Known Folder Move, and Teams VDI media optimization policies.

## 2. Azure infrastructure, networking, and security

Deploy the AVD host pool, hub-and-spoke networking, and subscription security controls in Azure.

<!-- more -->

- **[avd-azure](../repos/avd-azure.md):** Deploys the Bicep/AzAPI AVD control plane (host pool, application groups, workspace, scaling plan, FSLogix storage, and Azure or `azure-local` session hosts).
- **[avd-networking](../repos/avd-networking.md):** Stands up hub-and-spoke VNets, Private DNS zones, Azure Firewall/NVA egress, and private endpoints when deploying into a hub topology.
- **[avd-security](../repos/avd-security.md):** Configures Microsoft Defender for Cloud, Key Vault posture, and security baselines across the AVD subscription.

## 3. Power Platform governance

Isolate Power Platform connectors and DLP policies for AVD user sessions.

<!-- more -->

- **[avd-power-platform](../repos/avd-power-platform.md):** Applies Power Platform DLP policies and environment isolation when VDI users access Power Apps or Power Automate inside AVD sessions.

```powershell
if (-not (Test-Path ~/avd-azure/.git)) { git clone https://github.com/avd-ops/avd-azure.git ~/avd-azure }
Set-Location ~/avd-azure; git checkout -q main; git pull -q --ff-only
Get-ChildItem
```
