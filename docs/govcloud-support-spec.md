# Azure US Government & Microsoft 365 GCC High (`usgov`) Specification Across the Five Control Planes and Foundation

Status: accepted (2026-11-08, [decision 0013](knowledge/decisions/0013-azure-us-government-and-gcc-high-support.md)).

When [decision 0009](knowledge/decisions/0009-split-landing-zone-into-five-control-planes.md), [decision 0010](knowledge/decisions/0010-expand-assess-and-current-state-across-five-control-planes.md), and [decision 0012](knowledge/decisions/0012-desktop-devops-for-avd-win365-and-intune.md) established the five control planes (`avd-entra`, `avd-intune`, `avd-m365`, `avd-azure`, `avd-power-platform`), the unified five-plane collector/validator (`avd-current-state`) and standards map (`avd-assess`), and Desktop DevOps across AVD, Windows 365, and Intune (`avd-second-brain`, `avd-swarm`), every endpoint, Private DNS zone, region list, and CLI sign-in helper assumed Azure Commercial (`AzureCloud`) and Commercial Microsoft 365 (`graph.microsoft.com`).

This specification defines how the 12 public repositories support **Azure US Government (`AzureUSGovernment`) paired with Microsoft 365 GCC High (ITAR / CUI / FedRAMP High, non-DoD, unclassified)** as a first-class cloud profile (`usgov`) alongside Commercial (`commercial`), and how every repository proves `usgov` compliance offline in CI (`standing: guarded`) without requiring a live sovereign lab subscription.

---

## 1. Architectural Principles

1. **Two deterministic, 1:1 cloud profiles: `commercial` and `usgov` (non-DoD, unclassified only).**
   - **`commercial` (default):** Azure Commercial (`AzureCloud`) paired with Commercial Entra ID, Intune, Microsoft 365 (`https://graph.microsoft.com`, `https://login.microsoftonline.com`), and Commercial Power Platform (`https://api.bap.microsoft.com`, `pac` cloud `Public`).
   - **`usgov`:** Azure US Government (`AzureUSGovernment`) paired with Microsoft 365 GCC High Entra ID, Intune, and M365 (`https://graph.microsoft.us`, `https://login.microsoftonline.us`), and US Government GCC High Power Platform (`https://gov.api.bap.microsoft.us`, `*.crm9.dynamics.com`, `pac` cloud `UsGovHigh`).
   - **Out of scope:** DoD (IL5 / `*.crm.appsplatform.us` / `Dod`), classified clouds, China (`AzureChinaCloud`), and hybrid cross-cloud pairings (such as Commercial Entra paired with `AzureUSGovernment`) are out of scope for v1 so every cloud profile maps 1:1 to a single set of endpoints, suffixes, and DNS zones.
2. **One canonical cloud environment contract (`C26`, `avd-cloud-environments/v1`) in `avd-assess`.**
   Under [family roles](family-roles.md), `avd-assess` owns shared reference data and foundation contracts (`contracts/cloud-environments.json` and `contracts/schemas/cloud-environments.schema.json`), with every endpoint and parity note citing its pinned Microsoft Learn source. Consuming repositories (`avd-landing-zone`, `avd-current-state`, `avd-entra`, `avd-intune`, `avd-m365`, `avd-azure`, `avd-power-platform`, `avd-linecheck`) keep a byte-identical pinned copy verified by their contract hash tests.
3. **Fail-closed cloud-boundary verification before any network call.**
   - Portal-generated blocks pass `-Cloud <commercial|usgov>` explicitly; interactive runs without `-Cloud` auto-detect the cloud from `(Get-AzContext).Environment.Name` or `az cloud show --query name -o tsv`.
   - Before issuing any ARM, Resource Graph, Microsoft Graph, Teams, or BAP/Dataverse request, every operator script verifies that active sessions (`Az`, `az` CLI, `MgGraph`, `pac`) and any input handoff manifests (`entra-manifest.json`, `intune-manifest.json`, `m365-manifest.json`, `azure-outputs.json`, `power-platform-manifest.json`) match the resolved cloud profile. Any mismatch aborts immediately before a cross-boundary request can be sent.
4. **Capability-driven adaptation and `not-applicable-cloud` scoring.**
   Where Microsoft's US Government / GCC High platform differs from Commercial, control planes read the capability flags in `C26`:
   - If a US Gov equivalent exists (for example, Bastion `Basic`/`Standard` instead of `Developer` when the opt-in jumpbox is enabled in `avd-azure`; Azure Network Connection (ANC) instead of Microsoft Hosted Network (MHN) for Windows 365 in `avd-intune`; WebRTC media optimization fallback when `SlimCore` is unavailable in `avd-m365`), the plane adapts automatically and records the adaptation in preflight and the stage manifest.
   - If a capability is unsupported in `usgov` (for example, `Microsoft.PowerPlatform/enterprisePolicies` VNet subnet injection in an unsupported US Gov region), the deployment skips that resource with `"skipped": "unsupported-in-usgov"` in the stage manifest, and `avd-assess` / `avd-current-state` score the corresponding check as `not-applicable` (`reason: "unsupported-in-cloud"`) so a GovCloud estate is never penalized for a platform parity gap.
5. **ITAR / CUI hardening profile (`complianceProfile: "itar-cui"`) by default when `cloud == "usgov"`.**
   When `cloud == "usgov"`, `avd-azure` restricts Azure Policy allowed locations to the `C26` `usgov` region list (`usgovvirginia`, `usgovarizona`, `usgovtexas`), and `avd-landing-zone` / `avd-azure` / `avd-intune` default to (and recommend) the `itar-cui` session and host hardening profile (clipboard, printer, drive, USB, and Plug-and-Play device redirection off; screen capture protection and watermarking on; smart card / WebAuthn phishing-resistant MFA on; FIPS 140 mode and TLS 1.2+ host baseline enabled), while allowing the operator to override individual pool settings with a recorded departure reason.
6. **Zero `.com` browser probes in `usgov` and pinned offline pricing fallback.**
   - When `cloud == "usgov"` is selected in any family portal (`deploy.avd-ops.dev/portal/`, the `avd-current-state` assessment portal, or `linecheck.avd-ops.dev`), the browser probes **only** `.azure.us` and `.usgovcloudapi.net` endpoints from `C26` (or runs with browser probes disabled), never touching `.com` or `.windows.net` hosts.
   - For preflight cost estimation in `avd-landing-zone` ([working from Cloud Shell](knowledge/getting-started/cloud-shell.md#costs)), Microsoft's Retail Prices API (`https://prices.azure.com/api/retail/prices`) lists `usgovvirginia`, `usgovarizona`, and `usgovtexas` meters on a `.com` hostname. In `usgov`, preflight queries `prices.azure.com` for the target `usgov*` region by default, and automatically falls back (or honors `-OfflinePricing`) to a dated, pinned US Gov retail rate snapshot when `.com` egress is blocked by an ITAR boundary firewall, marking the estimate `"priceSource": "pinned-usgov-snapshot"`.
7. **Offline CI verification (`standing: guarded`) without a live GovCloud lab.**
   Every repository proves its `usgov` implementation in CI via Bicep compilation + PSRule assertions on `usgov` parameters, PowerShell AST and mocked `AzureUSGovernment` Pester tests that fail on any commercial URI, and Node tests for the portal engine. Claims in `security-review.yaml` carry `standing: guarded` until a redacted live run in an `AzureUSGovernment` sandbox upgrades them to `run`.

---

## 2. Contract `C26` (`avd-cloud-environments/v1`) Endpoint and Capability Matrix

`avd-assess` defines `contracts/cloud-environments.json` (validated against `contracts/schemas/cloud-environments.schema.json`), mapping both cloud profiles across all five control planes:

| Property / Surface | `commercial` (`AzureCloud` + Commercial M365) | `usgov` (`AzureUSGovernment` + M365 GCC High) | Consuming Repos |
|---|---|---|---|
| **`azCloudName` / `azPsEnvironment`** | `AzureCloud` / `AzureCloud` | `AzureUSGovernment` / `AzureUSGovernment` | All PowerShell / Bash scripts, `runin.js` |
| **`mgGraphEnvironment`** | `Global` | `USGov` | `avd-landing-zone`, `avd-entra`, `avd-intune`, `avd-m365`, `avd-current-state`, `runin.js` |
| **`pacCloudName`** | `Public` | `UsGovHigh` | `avd-power-platform`, `avd-current-state` |
| **Entra Authority (`loginEndpoint`)** | `https://login.microsoftonline.com` | `https://login.microsoftonline.us` | `avd-azure` (Bicep), `avd-entra`, `avd-intune`, `avd-m365`, `avd-current-state` |
| **Initial Tenant Domain Suffix** | `.onmicrosoft.com` | `.onmicrosoft.us` (and `.onmicrosoft.com` legacy) | `redact.js`, `avd-current-state` C11 redactor |
| **ARM Endpoint (`resourceManager`)** | `https://management.azure.com` | `https://management.usgovcloudapi.net` | `avd-landing-zone`, `avd-azure`, `avd-power-platform`, `avd-current-state`, `avd-swarm` |
| **Microsoft Graph Endpoint** | `https://graph.microsoft.com` | `https://graph.microsoft.us` | `avd-landing-zone`, `avd-entra`, `avd-intune`, `avd-m365`, `avd-current-state`, `avd-swarm` |
| **Storage Suffix (`storageSuffix`)** | `core.windows.net` | `core.usgovcloudapi.net` | `avd-azure` (Bicep), `avd-landing-zone`, `avd-current-state`, `redact.js` |
| **Key Vault DNS Suffix (`keyVaultDns`)** | `vault.azure.net` | `vaultcore.usgovcloudapi.net` | `avd-azure` (Bicep), `avd-landing-zone`, `avd-current-state`, `redact.js` |
| **AVD Service & Broker Domain** | `wvd.microsoft.com` | `wvd.azure.us` | `avd-azure`, `avd-current-state`, `avd-linecheck`, `avd-assess` |
| **AVD Private DNS Zones** | `privatelink.wvd.microsoft.com`, `privatelink-global.wvd.microsoft.com` | `privatelink.wvd.azure.us`, `privatelink-global.wvd.azure.us` | `avd-azure` (Bicep), `avd-current-state` validator |
| **Azure Files & Key Vault Private DNS Zones** | `privatelink.file.core.windows.net`, `privatelink.vaultcore.azure.net` | `privatelink.file.core.usgovcloudapi.net`, `privatelink.vaultcore.usgovcloudapi.net` | `avd-azure` (Bicep), `avd-current-state` validator |
| **SharePoint / OneDrive Admin Suffix** | `.sharepoint.com` | `.sharepoint.us` | `avd-m365`, `avd-current-state`, `redact.js` |
| **Power Platform BAP Endpoint** | `https://api.bap.microsoft.com` | `https://gov.api.bap.microsoft.us` | `avd-power-platform`, `avd-current-state` |
| **Dataverse Environment Suffix** | `.crm.dynamics.com` (and regional `.crm*.dynamics.com`) | `.crm9.dynamics.com` | `avd-power-platform`, `avd-current-state`, `redact.js` |
| **Supported AVD Regions** | Commercial AVD regions (`eastus`, `eastus2`, `westus2`, `westus3`, `centralus`, etc.) | `usgovvirginia`, `usgovarizona`, `usgovtexas` | `avd-landing-zone`, `avd-azure`, `avd-current-state`, `avd-linecheck` |

### 2.1 Capability Flags in `C26` (`capabilities`)

Each cloud profile in `contracts/cloud-environments.json` carries a `capabilities` object so templates and scripts adapt deterministically without hardcoded `if ($Cloud -eq 'usgov')` scattered through business logic:

```json
"capabilities": {
  "bastionDeveloperSku": false,
  "bastionFallbackSku": "Basic",
  "win365Supported": true,
  "win365MicrosoftHostedNetwork": false,
  "win365RequiresAnc": true,
  "win365FrontlineSupported": false,
  "teamsVdiOptimizationModes": ["WebRtc", "SlimCoreAndWebRtc"],
  "teamsVdiDefaultMode": "WebRtc",
  "powerPlatformVnetInjectionRegions": [],
  "defaultComplianceProfile": "itar-cui"
}
```

*(Every boolean and region array in `contracts/cloud-environments.json` links to its pinned Microsoft Learn source in `avd-assess/sources.yaml` so when Microsoft expands US Gov parity—such as adding Bastion Developer or SlimCore in GCC High—updating the pin in `avd-assess` updates the capability flag cleanly.)*

---

## 3. Repository-by-Repository Changes

### 3.1 `avd-ops` (Portal Engine v1.2, Docs, and Decision Record)

1. **`site/assets/engine/runin.js`:**
   - Extend `validRunIn(r)` and `signInLines(where, shell, needs)` with an optional `cloud` field (`'commercial'` default, or `'usgov'`).
   - When `cloud === 'usgov'`, `signInLines` emits cloud-explicit sign-in and guard commands:
     - `azPowerShell`: `if (-not (Get-AzContext) -or (Get-AzContext).Environment.Name -ne 'AzureUSGovernment') { Connect-AzAccount -Environment AzureUSGovernment -UseDeviceAuthentication | Out-Null }`
     - `azCliPwsh`: `az cloud set --name AzureUSGovernment -o none 2>$null; az account show -o none 2>$null; if ($LASTEXITCODE -ne 0) { az login --use-device-code -o none }`
     - `azCliBash`: `az cloud set --name AzureUSGovernment -o none 2>/dev/null; az account show -o none 2>/dev/null || az login --use-device-code -o none`
2. **`site/assets/engine/redact.js`:**
   - Add US Gov public platform domains to `PUBLIC_DOMAINS`: `'azure.us'`, `'usgovcloudapi.net'`, `'microsoftonline.us'`, `'microsoft.us'`, `'sharepoint.us'`, `'dynamics.com'`, `'appsplatform.us'`.
   - Extend tenant domain redaction (lines 111–114) to match both `.onmicrosoft.com` and `.onmicrosoft.us` (`/\b([A-Za-z0-9-]+)(\.onmicrosoft\.(?:com|us))\b/gi`), replacing the tenant prefix with `<tenant-n>` while preserving the `.onmicrosoft.us` suffix so a reader or parser still sees the cloud suffix.

### 3.2 `avd-assess` (Contract `C26`, Pinned GovCloud Sources, Scoring, and Security Map)

1. **Contract `C26` (`contracts/cloud-environments.json` & `contracts/schemas/cloud-environments.schema.json`):**
   - Publish the canonical `commercial` and `usgov` environment map and JSON Schema, pinned to Microsoft Learn sources (`azure-government-avd`, `azure-government-private-link`, `entra-kerberos-usgov`, `intune-usgov-endpoints`, `win365-gov`, `teams-vdi-gov`, `power-platform-usgov`).
2. **Contract `C19` (`intake.schema.json`), `C11` (`facts.schema.json`), and `C14` (`target-state.schema.json`):**
   - Add `"cloud": "commercial" | "usgov"` (default `"commercial"`) and `"complianceProfile": "standard" | "itar-cui"` to `C19` and `C14`, and top-level `"cloud": "commercial" | "usgov"` metadata to `C11`.
   - Add `"unsupported-in-cloud"` to the closed enum of `planesCollected.*.reason` in `C11` and check skip reasons in `C21`.
3. **Methods & Checks (`methods/*.md`, `method.json`):**
   - Add US Gov / ITAR checks (`gov-allowed-locations`, `gov-private-dns-zones`, `gov-itar-redirection-lockdown`, `gov-fips-tls-baseline`) that evaluate when `intake.cloud == "usgov"` or `intake.complianceProfile == "itar-cui"`, and mark Commercial-only checks (such as MHN-only Windows 365 checks) as `not-applicable` when `c11.cloud == "usgov"`.
4. **Security Review Map (`security-review.yaml`):**
   - Add `usgov` claims covering cloud-boundary isolation, zero-`.com` portal probes, US Gov Private Link DNS zones, and ITAR session lockdown at `standing: guarded`.

### 3.3 `avd-landing-zone` (Orchestrator, Deployment Portal, and Pricing)

1. **Deployment Portal (`site/portal/`):**
   - Add a **Cloud** selector (`Commercial (AzureCloud)` | `Azure US Gov / GCC High`) next to the **Run in** bar.
   - Selecting `Azure US Gov / GCC High`:
     - Switches the region picker to `usgovvirginia`, `usgovarizona`, and `usgovtexas`.
     - Switches the browser latency/reachability probe list strictly to the `usgov` `.azure.us` / `.usgovcloudapi.net` hosts from `C26` (and provides a "Skip browser probes" toggle for boundary-restricted workstations).
     - Defaults the security/RDP template to `itar-cui` (clipboard, printer, drive, USB redirection off; screen capture protection and watermarking on) while letting the operator customize per pool.
     - Appends `-Cloud usgov` to every generated Cloud Shell / local command block and sets `"cloud": "usgov"` in the topology manifest and `<<<AVDLZ-STATE ...>>>` state lines.
2. **PowerShell Orchestrator & Helpers (`scripts/ops/AvdLandingZone.psm1`, `Connect-AvdLandingZone.ps1`, `Test-AvdLandingZoneReadiness.ps1`):**
   - Add `Resolve-AvdCloudEnvironment` reading `contracts/cloud-environments.json` (`C26`).
   - Enforce the fail-closed preflight guard: verify `(Get-AzContext).Environment.Name`, `az cloud show`, and `Get-MgContext` match the target cloud before any API call.
   - In `Test-AvdLandingZoneReadiness.ps1` pricing: filter `prices.azure.com` by the `usgov*` region, and if `prices.azure.com` is unreachable or `-OfflinePricing` is passed in `usgov`, calculate the upper-bound estimate from `contracts/usgov-retail-prices.snapshot.json` (recording `"priceSource": "pinned-usgov-snapshot"` and the snapshot date in `run-cost.json`).

### 3.4 `avd-azure` (Azure ARM & Bicep Infrastructure Control Plane)

1. **Bicep Cloud Suffixes & Private DNS Zones (`bicep/`):**
   - Add `@allowed(['commercial', 'usgov']) param cloud string = 'commercial'` and `@allowed(['standard', 'itar-cui']) param complianceProfile string = (cloud == 'usgov' ? 'itar-cui' : 'standard')`.
   - Derive storage and Key Vault endpoints exclusively from `az.environment().suffixes.storage` (`core.usgovcloudapi.net`) and `az.environment().suffixes.keyvaultDns` (`vaultcore.usgovcloudapi.net`), and Entra authority from `az.environment().authentication.loginEndpoint` (`https://login.microsoftonline.us/`).
   - Map AVD Private Link DNS zones dynamically by `cloud`:
     - `commercial`: `privatelink.wvd.microsoft.com` (`connection`, `feed`) and `privatelink-global.wvd.microsoft.com` (`global`)
     - `usgov`: `privatelink.wvd.azure.us` (`connection`, `feed`) and `privatelink-global.wvd.azure.us` (`global`)
   - Map Azure Files and Key Vault Private DNS zones dynamically (`privatelink.file.${environment().suffixes.storage}`, `privatelink.vaultcore.usgovcloudapi.net` in `usgov`).
2. **Capabilities, Allowed Locations & ITAR Baseline:**
   - When `cloud == 'usgov'`, scope the subscription Azure Policy allowed-locations assignment to `['usgovvirginia', 'usgovarizona', 'usgovtexas']`.
   - When the opt-in admin jumpbox is enabled in `usgov`, use Bastion `Basic` (or `Standard`) instead of `Developer` (per `C26.capabilities.bastionDeveloperSku == false`), surfaced clearly in the preflight cost estimate and portal.
   - When `complianceProfile == 'itar-cui'`, set default host pool `customRdpProperty` to disable clipboard (`redirectclipboard:i:0`), printers (`redirectprinters:i:0`), drives (`drivestoredirect:s:`), USB (`usbdevicestoredirect:s:`), and COM ports (`redirectcomports:i:0`), enable screen capture protection and watermarking, and verify FIPS / TLS 1.2+ in `scripts/security/host-baseline.json`.
3. **Output Contract (`azure-outputs.json`):**
   - Record `"cloud": "commercial" | "usgov"` and `"complianceProfile": "standard" | "itar-cui"` at the root of `azure-outputs.json`.

### 3.5 `avd-entra` (Entra ID Identity & Zero-Trust Control Plane)

1. **Cloud-Aware Graph Sign-In & Endpoints (`Deploy-AvdEntra.ps1`, `Remove-AvdEntra.ps1`):**
   - Accept `-Cloud <commercial|usgov>` and resolve the Graph base URI (`https://graph.microsoft.us` in `usgov`), login authority (`https://login.microsoftonline.us`), and `Connect-MgGraph -Environment USGov` / `az rest --resource https://graph.microsoft.us` from `C26`.
   - Verify active `az` / `MgGraph` environment matches `-Cloud` before any query or write.
2. **Conditional Access & Entra Kerberos in GCC High:**
   - Target the Azure Virtual Desktop (`9cdead84-a844-4324-93f2-b2e6bb768d07`) and Windows Cloud Login / Windows 365 app IDs validated present in the GCC High tenant's `servicePrincipals`.
   - When `complianceProfile == 'itar-cui'`, include phishing-resistant MFA authentication strength (`windowsHelloForBusiness`, `fido2`, `x509CertificateMultiFactor` for smart card / PIV / CAC) and strict session sign-in frequency in the generated Conditional Access policy (`reportOnly` by default).
   - Stamp `"cloud": "commercial" | "usgov"` in `entra-manifest.json` and `entra-run-manifest.json`.

### 3.6 `avd-intune` (Intune Policy-as-Code & Windows 365 Control Plane)

1. **Cloud-Aware Graph Transport (`Deploy-AvdIntune.ps1`, `Remove-AvdIntune.ps1`):**
   - Read `"cloud"` from `entra-manifest.json` (and verify against `-Cloud` and the active `az` / `MgGraph` session), routing all `/v1.0/deviceManagement/*` and `/beta/deviceManagement/*` requests to `https://graph.microsoft.us` when `cloud == "usgov"`.
2. **ITAR / CUI Settings Catalog Baseline (`complianceProfile == "itar-cui"`):**
   - Deploy and assign the `ITAR-CUI-SessionLockdown` Settings Catalog profile enforcing session-host FIPS algorithm policy, TLS 1.2+, disabled client clipboard/drive/printer/USB redirection, mandatory screen capture protection (`fEnableScreenCaptureProtection = 1`), and session watermarking alongside the standard `FSLogix` and `DefenderVdiExclusions` profiles.
3. **Windows 365 Government Adaptation (`-IncludeWin365` in `usgov`):**
   - Read `C26.capabilities`: in `usgov`, require an Azure Network Connection (`ANC`) linked to `azure-outputs.json` (refusing `MHN` in preflight with a clear message when `win365MicrosoftHostedNetwork == false`), and block Frontline provisioning mode if `win365FrontlineSupported == false`.
   - Stamp `"cloud": "commercial" | "usgov"` in `intune-manifest.json` and `intune-run-manifest.json`.

### 3.7 `avd-m365` (Greenfield M365, OneDrive KFM & Teams VDI Control Plane)

1. **GCC High Endpoints & SharePoint `.sharepoint.us` (`Deploy-AvdM365.ps1`, `Remove-AvdM365.ps1`):**
   - Route all Graph calls through `https://graph.microsoft.us` and SharePoint / OneDrive admin discovery against `.sharepoint.us` when `cloud == "usgov"`.
2. **Teams VDI Optimization Adaptation:**
   - Read `C26.capabilities.teamsVdiDefaultMode`: in `usgov`, default to `WebRtc` (or `SlimCoreAndWebRtc` when opted in and supported), recording the applied mode in `m365-manifest.json` (`"cloud": "usgov"`, `"teamsVdiMode": "WebRtc"`).

### 3.8 `avd-power-platform` (Power Platform & Power Automate Control Plane)

1. **US Gov High BAP, Dataverse & PAC CLI (`Deploy-AvdPowerPlatform.ps1`, `Remove-AvdPowerPlatform.ps1`):**
   - When `cloud == "usgov"`, authenticate `pac` with `--cloud UsGovHigh`, acquire BAP tokens for `https://gov.api.bap.microsoft.us`, and target Dataverse `*.crm9.dynamics.com` endpoints from `C26`.
2. **Graceful Parity Handling for VNet Enterprise Policies:**
   - Check `C26.capabilities.powerPlatformVnetInjectionRegions` before deploying `Microsoft.PowerPlatform/enterprisePolicies`. If the target `usgov*` region does not support Power Platform VNet injection, skip the Bicep enterprise policy resource, record `"enterprisePolicy": { "status": "skipped", "reason": "unsupported-in-usgov" }` in `power-platform-manifest.json`, and still deploy the GCC High environment and strict DLP policy cleanly.

### 3.9 `avd-current-state` (Read-Only Collector, Validator & Assessment Portal)

1. **Cloud-Aware Read Transport & `rebuild/scope.json`:**
   - Add `-Cloud <commercial|usgov>` (auto-detected from `(Get-AzContext).Environment.Name` when omitted, with fail-closed cross-check against `az`, `MgGraph`, and `pac`).
   - Parameterize `rebuild/scope.json` host roots via `{armHost}`, `{graphHost}`, `{bapHost}`, and `{dataverseSuffix}` resolved strictly from `contracts/cloud-environments.json` (`C26`), and update `tests/ReadOnlyGuard.Tests.ps1` so only the `C26` hosts are permitted.
2. **US Gov AVD Endpoint Probes & C11 Redaction:**
   - Switch TCP/HTTPS required-endpoint probes to the `.azure.us` / `.usgovcloudapi.net` service URLs when `cloud == "usgov"`.
   - Record `"cloud": "commercial" | "usgov"` at the root of `C11` (`avd-current-state-facts/v1`) and ensure `avd_current_state_facts.ps1` strips `.onmicrosoft.us` tenant prefixes and any US Gov resource names identically to Commercial.

### 3.10 `avd-second-brain`, `avd-swarm`, and `avd-linecheck`

1. **`avd-second-brain` & `avd-swarm`:**
   - Propagate `"cloud": "commercial" | "usgov"` through `C9` (`avd-playbook-proposal/v1`), `C10` (`avd-playbook-outcome/v1`), and `C18` (`avd-environment-record/v1`).
   - `avd-swarm`'s governance gate verifies that the target estate's `"cloud"` in `C18` matches the approved `C9` plan and the runner's OIDC Azure/Graph cloud environment before issuing any token.
   - `avd-second-brain` workload placement rules respect `C26` capability flags (for example, never recommending Windows 365 Frontline or MHN in a `usgov` estate while `C26` marks them unsupported).
2. **`avd-linecheck`:**
   - Align the existing `avd-gov` pack (`site/packs/avd-gov.json`) with `C26` (`contracts/cloud-environments.json`) at the pinned `avd-assess` commit so the end-user portal, deployment portal, and `avd-current-state` read one US Gov endpoint list.

---

## 4. Offline CI Verification Strategy (`standing: guarded` -> `run`)

Because contributors and CI runners do not require a live `AzureUSGovernment` / GCC High subscription, every repository enforces four automated offline checks in CI:

1. **Zero-Commercial-URI Bicep Compilation Guard (`avd-azure`, `avd-power-platform`):**
   - CI compiles every Bicep entry point with `cloud = 'usgov'` and `location = 'usgovvirginia'`, runs PSRule for Azure (`Azure.USGov` cloud environment configuration), and asserts that the compiled ARM JSON contains **zero** occurrences of `.windows.net`, `.azure.com`, `vault.azure.net`, `wvd.microsoft.com`, or `login.microsoftonline.com`.
2. **Zero-Commercial-URI PowerShell AST & Mocked Context Guard (`avd-landing-zone`, `avd-current-state`, `avd-entra`, `avd-intune`, `avd-m365`, `avd-power-platform`):**
   - Each repository adds `tests/UsGovCloud.Tests.ps1`:
     - **Static AST scan:** Fails if any `.ps1` or `.psm1` file hardcodes `management.azure.com`, `graph.microsoft.com`, `login.microsoftonline.com`, `api.bap.microsoft.com`, or `.windows.net` outside `contracts/cloud-environments.json` (`C26`).
     - **Mocked `AzureUSGovernment` execution:** Runs preflight, deploy (`-WhatIf` / mocked REST), collector, and validator entry points with `Get-AzContext` returning `Environment.Name = 'AzureUSGovernment'` and verifies that every outbound URI targets `.usgovcloudapi.net`, `.microsoft.us`, or `.azure.us`, and that a simulated mismatch between `Az` (`AzureUSGovernment`) and `MgGraph` (`Global`) fails closed before the first request.
3. **Portal & Engine Node Guard (`avd-ops`, `avd-landing-zone`, `avd-current-state`, `avd-linecheck`):**
   - `node --test` verifies that `runin.js` generates `AzureUSGovernment` / `USGov` sign-in lines, `redact.js` redacts `<tenant-1>.onmicrosoft.us` while keeping `.azure.us` and `.usgovcloudapi.net` as public suffixes, and selecting `usgov` in any portal produces zero `.com` / `.windows.net` probe targets.
4. **Upgrading Standing from `guarded` to `run` via Redacted Field Evidence:**
   - In `avd-assess/security-review.yaml` (rendered on [avd-ops.dev/security.html](https://avd-ops.dev/security.html)), all `usgov` claims start at **`guarded`**.
   - When an operator runs `avd-current-state` or `avd-landing-zone` in an `AzureUSGovernment` sandbox and submits a redacted issue report or `C11`/`C25` snapshot (`"cloud": "usgov"`, zero customer/tenant names or IDs), the verified platform observation is recorded in `avd-assess/observations/` and upgrades the corresponding claim's standing from `guarded` to `run`.

---

## 5. Phased Rollout Plan

| Phase | Target Repositories | Deliverables | Proving Check |
|---|---|---|---|
| **Phase 1: Front Door & Shared Engine** | `avd-ops` | This spec (`docs/govcloud-support-spec.md`), [decision 0013](knowledge/decisions/0013-azure-us-government-and-gcc-high-support.md), `C26` glossary entry, and portal engine v1.2 (`runin.js` `cloud: 'usgov'` + `redact.js` `.onmicrosoft.us` and US Gov domains) | `python3 scripts/kb/validate.py`, `node scripts/site/build-docs.mjs --check`, `node --test "tests/*.test.mjs"` |
| **Phase 2: Foundation Contract & Standards** | `avd-assess`, `avd-second-brain` | Contract `C26` (`contracts/cloud-environments.json` + schema), pinned Learn US Gov sources, `C11`/`C14`/`C19` `"cloud"` & `"complianceProfile"` fields, `usgov` security review claims (`standing: guarded`) | `pytest` / `check_pins.py` / `check_wording.py` in `avd-assess`; schema validation in `avd-second-brain` |
| **Phase 3: Read-Only Assessment & Linecheck** | `avd-current-state`, `avd-linecheck` | Pin `C26`; `-Cloud <commercial|usgov>` in collector, validator, and assessment portal; parameterized `rebuild/scope.json`; `tests/UsGovCloud.Tests.ps1` | `Invoke-Pester` (`ReadOnlyGuard.Tests.ps1`, `UsGovCloud.Tests.ps1`) and `node --test` |
| **Phase 4: Five Control Planes & Orchestrator** | `avd-azure`, `avd-entra`, `avd-intune`, `avd-m365`, `avd-power-platform`, `avd-landing-zone` | Pin `C26`; Bicep `cloud` & `complianceProfile` (`itar-cui`) parameters; US Gov Private DNS zones; Graph/BAP/PAC `USGov`/`UsGovHigh` routing; portal cloud selector & pinned US Gov pricing fallback | Bicep compile + PSRule `Azure.USGov` + `UsGovCloud.Tests.ps1` + portal `node --test` |
| **Phase 5: Desktop DevOps Layer** | `avd-second-brain`, `avd-swarm` | Cloud-aware `C9`/`C10`/`C18` validation, governance gate cloud-match check, and US Gov workload placement rules | Unit tests and governance gate tests in `avd-second-brain` and `avd-swarm` |
