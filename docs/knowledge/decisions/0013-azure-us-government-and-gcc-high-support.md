---
status: accepted
date: 2026-11-08
decision-makers: [owner]
---

# 0013. Support Azure US Government and Microsoft 365 GCC High across all five control planes

Support Azure US Government and Microsoft 365 GCC High (`usgov`) alongside Commercial (`commercial`) across all five control planes via contract C26 and CI-guarded offline tests.

## Context and Problem Statement

How should the five control planes, portals and foundation tools support Azure US Government and GCC High (ITAR/CUI) without a live GovCloud lab?

<!-- more -->

After [decision 0009](0009-split-landing-zone-into-five-control-planes.md), [decision 0010](0010-expand-assess-and-current-state-across-five-control-planes.md) and [decision 0012](0012-desktop-devops-for-avd-win365-and-intune.md), the family spans five control planes (`avd-entra`, `avd-intune`, `avd-m365`, `avd-azure` and `avd-power-platform`), a unified read-only collector and validator (`avd-current-state`), and Desktop DevOps agents (`avd-second-brain` and `avd-swarm`). Regulated operators running ITAR or CUI workloads in Azure US Government (`AzureUSGovernment`) and Microsoft 365 GCC High use the same Bicep and PowerShell stack, but every endpoint, Private DNS zone, region list and sign-in helper assumed `AzureCloud` and `graph.microsoft.com`, and contributors do not have a permanent GovCloud lab subscription. How should the family support `AzureUSGovernment` and GCC High safely and prove it in CI?

## Considered Options

Three options were weighed.

- Support two 1:1 cloud profiles (`commercial` and `usgov`) driven by contract C26, capability-based adaptation and CI-guarded offline tests
- Scope Azure US Government support to `avd-azure` Bicep templates only, leaving Entra, Intune, Microsoft 365, Power Platform and the portals commercial-only
- Require a live `AzureUSGovernment` sandbox subscription before building or merging sovereign cloud support

## Decision Outcome

Chosen option: "Support two 1:1 cloud profiles (`commercial` and `usgov`) driven by contract C26, capability-based adaptation and CI-guarded offline tests".

<!-- more -->

Why: an ITAR or GCC High virtual desktop deployment still requires Entra ID groups and Conditional Access (`avd-entra`), Intune session-host lockdown (`avd-intune`), M365/Teams VDI configuration (`avd-m365`), Azure Bicep (`avd-azure`) and read-only validation (`avd-current-state`). Because sovereign cloud differences are deterministic (published endpoints, DNS suffixes, region lists and service capability flags), CI can guard every Bicep template, PowerShell script and browser portal offline at `standing: guarded` before an operator runs it in a GovCloud sandbox.

- **Two 1:1 cloud profiles (`commercial` and `usgov`, non-DoD, unclassified only):** `commercial` maps to `AzureCloud` + Commercial M365 (`graph.microsoft.com`); `usgov` maps to `AzureUSGovernment` + Microsoft 365 GCC High (`graph.microsoft.us`, `login.microsoftonline.us`, `gov.api.bap.microsoft.us`, `pac` cloud `UsGovHigh`, regions `usgovvirginia`, `usgovarizona`, `usgovtexas`).
- **Canonical foundation contract `C26` (`avd-cloud-environments/v1`):** Owned by `avd-assess` (`contracts/cloud-environments.json`), pinning every cloud endpoint, Private DNS zone (`privatelink.wvd.azure.us`, `privatelink-global.wvd.azure.us`, `core.usgovcloudapi.net`, `vaultcore.usgovcloudapi.net`), and capability flag to its Microsoft Learn source, with byte-identical copies pinned in consuming repos.
- **Fail-closed cloud-boundary guard:** Portal blocks pass `-Cloud <commercial|usgov>` explicitly (auto-detected from `Az`/`az` context when run by hand), and every script aborts before the first network request if `Az`, `az` CLI, `MgGraph`, `pac`, or a stage handoff manifest disagree on the active cloud.
- **Capability adaptation and `itar-cui` defaults:** Control planes adapt automatically where a US Gov equivalent exists (Bastion `Basic` instead of `Developer`, ANC instead of MHN for Windows 365, WebRTC default for Teams VDI) and mark unsupported features as `skipped` / `not-applicable` (`reason: "unsupported-in-cloud"`). When `cloud == "usgov"`, deployments default to the `itar-cui` hardening profile (clipboard, printer, drive and USB redirection off; screen capture protection, watermarking and FIPS/TLS 1.2+ on).
- **Zero `.com` browser probes and offline pricing fallback:** Selecting `usgov` in any portal probes only `.azure.us` / `.usgovcloudapi.net` endpoints, and preflight pricing falls back to a pinned US Gov retail rate snapshot when `prices.azure.com` is blocked by a boundary firewall.
- **Offline CI verification (`standing: guarded`):** Every repo enforces zero-commercial-URI Bicep compilation, PSRule `Azure.USGov` checks, AST scans and mocked `AzureUSGovernment` Pester tests in CI; claims start at `guarded` on the security review page and upgrade to `run` when a redacted sandbox run is recorded.

### Consequences

- Good, because regulated ITAR and GCC High operators can run `avd-current-state` (read-only) and `avd-landing-zone` across all five control planes with zero commercial endpoint leakage.
- Good, because every `usgov` path is continuously verified in CI without paying for a standing GovCloud lab subscription.
- Bad, because `C26` and the `-Cloud` guard must be rolled out and pinned across the foundation and control-plane repos in phases.

## More Information

Full specification and phased rollout order across all twelve public repositories.

<!-- more -->

- Full specification: [docs/govcloud-support-spec.md](../../govcloud-support-spec.md).
- Builds on [decision 0009](0009-split-landing-zone-into-five-control-planes.md), [decision 0010](0010-expand-assess-and-current-state-across-five-control-planes.md) and [decision 0012](0012-desktop-devops-for-avd-win365-and-intune.md).
