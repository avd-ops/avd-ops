---
status: proposed
date: 2026-11-20
decision-makers: [owner]
---

# 0028. Add avd-security for AVD security control plane, posture verification, and detection

Add `avd-security` for AVD security controls (Defender, Sentinel, Policy), posture verification, and detection without duplicating sibling repos.

## Context and Problem Statement

Defender for Cloud, Sentinel AVD detections, Azure Policy baselines, and continuous posture checks have no dedicated repo.

<!-- more -->

[avd-assess](../repos/avd-assess.md) publishes the security review map (`security-review.yaml`, contract `C20`) and assessment method (`methods/security.md`), while [avd-azure](../repos/avd-azure.md) configures resource-level flags such as Trusted Launch, Key Vault, and Private Endpoints. However, no repository owns cross-cutting security governance and detection: Microsoft Defender for Cloud plans, Microsoft Sentinel AVD analytics and hunting KQL rules, Azure Policy security initiatives, RBAC/PIM least-privilege audits, and automated verification of session-host hardening (RDP redirection restrictions, Screen Capture Protection, Watermarking, Credential Guard, and FSLogix antivirus exclusions). Placing these inside `avd-azure` or `avd-remediate` would mix SecOps RBAC, SIEM content, and compliance baselines into workload deployment or day-2 host remediation. How should `avd-ops` organize deployable security controls, continuous verification, and AVD threat detection?

## Considered Options

Three options were weighed.

- **Add `avd-security` spanning `control`, `assess`, and `operate`:** Own Defender for Cloud plans, Microsoft Sentinel AVD analytics/workbooks, Azure Policy security baselines, and read-only posture/hardening verification, emitting redacted contracts for `avd-assess`, `avd-current-state`, and `avd-remediate`
- **Distribute security controls across existing repos:** Put Defender/Policy in `avd-azure`, Sentinel KQL in `avd-landing-zone`, and hardening checks in `avd-remediate`
- **Limit scope to read-only assessment scripts inside `avd-assess`:** Keep `avd-assess` focused on standards and checks while leaving Defender, Sentinel, and Policy deployment out of scope

## Decision Outcome

Chosen option: "Add `avd-security` spanning `control`, `assess`, and `operate`".

<!-- more -->

Why: Enterprise security teams (SecOps / InfoSec) often hold separate RBAC boundaries from AVD platform engineers and require both declarative security guardrails (Policy, Defender, Sentinel) and continuous verification against [avd-assess](../repos/avd-assess.md) claims. Keeping `avd-security` focused on cross-cutting security controls, detections, and read-only posture verification preserves single-purpose boundaries across the existing repos.

- **Clear lane boundaries (no overlap):**
  - [avd-entra](../repos/avd-entra.md) keeps Entra ID identity, groups, and Conditional Access.
  - [avd-intune](../repos/avd-intune.md) keeps Intune configuration profiles, compliance, and Windows 365 / session-host enrollment.
  - [avd-networking](../repos/avd-networking.md) keeps hub VNet, Azure Firewall, Private DNS, Bastion, and VNet Flow Logs.
  - [avd-azure](../repos/avd-azure.md) keeps AVD host pools, workspaces, session hosts, FSLogix storage, and Key Vault.
  - [avd-assess](../repos/avd-assess.md) remains the canonical map of security claims (`C20`) and standards.
- **Three-pillar scope of `avd-security`:**
  1. **Deployable Security Control Plane (`control`):** Bicep modules and Azure Policy initiatives for Microsoft Defender for Cloud (`VirtualMachines`, `KeyVaults`, `StorageAccounts`), Microsoft Sentinel solution integration with AVD-specific KQL analytics rules (anomalous sign-in/MFA patterns, unexpected redirection/clipboard usage, FSLogix share access anomalies, host tampering), and AVD security policy assignments (Trusted Launch / vTPM, Key Vault soft-delete and purge protection, Storage TLS 1.2 + Private Endpoints, no public IPs on session hosts).
  2. **Continuous Posture & Hardening Verification (`assess`):** Read-only PowerShell verification (`Invoke-AvdSecurityAudit.ps1`) that checks session-host hardening (RDP redirection, Screen Capture Protection, Watermarking, Credential Guard / VBS, Defender EDR status, FSLogix VHD/VHDX exclusions) and control-plane RBAC/PIM hygiene against `avd-assess` security claims.
  3. **Security Outputs & Remediation Handoff (`operate`):** Emits redacted `security-outputs.json` (`avd-security-outputs/v1`) and `security-posture.json` (`avd-security-posture/v1`) so [avd-current-state](../repos/avd-current-state.md) and [avd-assess](../repos/avd-assess.md) can score live posture and [avd-remediate](../repos/avd-remediate.md) can propose human-approved fixes without `avd-security` executing destructive changes directly.
- **Cost profiles (`lab` vs. `enterprise`) and cloud parity:** Respects [decision 0013](0013-azure-us-government-and-gcc-high-support.md) (`commercial` and `usgov`) and the family no-idle-burn guardrail: `lab` defaults to free/minimal Defender tiers, `Audit` policy effect, and zero additional paid SIEM ingestion beyond an existing Log Analytics workspace; `enterprise` enables Standard Defender plans, Sentinel analytics rules, and `Deny` / `DeployIfNotExists` policy effects.
- **Registration rule:** `avd-security` is added to `repos.json` and `docs/knowledge/repos/` once its repository and `README.md` brand line are live on GitHub.

### Consequences

- Good, because SecOps baselines, Sentinel KQL detections, Azure Policy initiatives, and posture verification get a single, auditable home.
- Good, because `lab` cost profiles and read-only audit scripts keep experimentation near \$0 while supporting full `enterprise` enforcement.
- Bad, because `avd-landing-zone`, `avd-assess`, `avd-current-state`, and `avd-remediate` will need optional integration hooks for `security-outputs.json` and `security-posture.json`.

## More Information

Related control-plane, security-mapping, and cloud-parity decisions.

<!-- more -->

- Control-plane split and registration rule: [decision 0009](0009-split-landing-zone-into-five-control-planes.md) and [decision 0014](0014-add-avd-networking-connectivity-control-plane.md).
- Azure US Government and GCC High parity: [decision 0013](0013-azure-us-government-and-gcc-high-support.md).
- Troubleshooting and human-approved remediation boundary: [avd-remediate](../repos/avd-remediate.md).
