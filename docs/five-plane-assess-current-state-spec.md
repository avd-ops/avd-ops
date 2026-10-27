# Five-plane expansion spec: `avd-assess` and `avd-current-state`

Status: accepted (2026-10-27, [decision 0010](knowledge/decisions/0010-expand-assess-and-current-state-across-five-control-planes.md)).

When [decision 0009](knowledge/decisions/0009-split-landing-zone-into-five-control-planes.md) expanded `avd-landing-zone` into the top-level orchestrator and deployment portal over five control-plane repos (`avd-entra`, `avd-intune`, `avd-m365`, `avd-azure` and `avd-power-platform`), [family roles](family-roles.md) kept `avd-current-state` as the single read-only collector and validator and `avd-assess` as the single map and dictionary. This specification defines how `avd-assess` and `avd-current-state` expand across all five control planes while preserving the foundation's read-only, privacy, and zero-upward-dependency guarantees.

---

## 1. Architectural principles

1. **One collector and validator (`avd-current-state`), one map and dictionary (`avd-assess`).**
   Neither collection nor assessment splits into five repos. `avd-assess` specifies the methods, sources, claims, facts, checks, and remediation hints across all five control planes (`azure`, `entra`, `intune`, `m365`, `power-platform`). `avd-current-state` implements them read-only and validates deployments across all five planes.
2. **Modular plane selection with graceful degradation.**
   `avd-current-state` scripts accept `-Planes` (`all` by default, or any subset of `azure`, `entra`, `intune`, `m365`, `power-platform`). If an operator skips a plane or lacks the read role or consent for a non-Azure plane, collection and validation record the plane's status and reason in `planesCollected` and leave its facts `unknown` rather than failing the run.
3. **Air-tight read-only posture across every API.**
   `avd-current-state` never requests or uses write scopes (`.ReadWrite.*`, `.Manage.*`, or ARM write roles). Every Azure Resource Graph query, ARM `GET`, Microsoft Graph `GET`, BAP/Dataverse `GET`, and read-only PowerShell cmdlet (`Get-Cs*`, `pac`) is listed in `rebuild/scope.json` and guarded in CI.
4. **One redacted C11 snapshot (`avd-current-state-facts`).**
   Facts from all five planes live in one C11 snapshot per tenant under plane-scoped namespaces (`c11.entra.*`, `c11.intune.*`, `c11.m365.*`, `c11.powerPlatform.*` alongside the existing Azure namespaces). Counts, booleans, public enums, and keyed HMAC pseudonyms only; no tenant, subscription, object or policy IDs, group or policy names, UNC paths, domains, or emails ever enter C11.
5. **Well-Architected primary scores, per-plane secondary scores.**
   Well-Architected pillars (`reliability`, `security`, `cost`, `operations`, `performance`) remain the primary rollup in C21 and the assessment portal. A secondary per-plane breakdown (`azure`, `entra`, `intune`, `m365`, `power-platform`) reports score and coverage per plane. Uncollected planes remain `unknown` (affecting coverage, never penalizing the score), and planes opted out via intake answers score as `not-applicable`.
6. **Plane-routed C24 remediation hints.**
   Every remediation hint in `method.json` and every item in the C24 remediation plan (`avd-remediation-plan/v1`) carries a `plane` field (`azure`, `entra`, `intune`, `m365`, `power-platform`, or `orchestrator`) so approved fixes map directly to the owning control-plane repo's parameters/manifests or the `avd-landing-zone` topology slice.

---

## 2. Control-plane read transport and permissions (`avd-current-state`)

### 2.1 Authentication and read-only token guard

Unlike `avd-landing-zone`, which signs in with a union of scopes that includes write scopes for deployment, `avd-current-state` enforces read-only authentication at two layers:

1. **Token scope inspection at runtime:** Before issuing any Microsoft Graph or BAP request, `avd-current-state` decodes the `scp` / `roles` claim of the access token (in memory only, never logged) and refuses to use any token carrying a scope matching `(ReadWrite|Write|Manage|FullControl|Directory\.AccessAsUser\.All)` unless running under Azure CLI's built-in first-party token where only `rebuild/scope.json`-listed `GET` endpoints are invoked.
2. **Dedicated read-only public client app (optional helper):** When Azure CLI's default token lacks a plane's read scope, the operator can consent a dedicated read-only public client registration (`Initialize-AvdCurrentStateReaderApp.ps1` or manual consent) requesting only:
   - **Entra ID:** `Directory.Read.All`, `Policy.Read.All`, `Organization.Read.All`
   - **Intune:** `DeviceManagementConfiguration.Read.All`, `DeviceManagementManagedDevices.Read.All`, `DeviceManagementServiceConfig.Read.All`, `DeviceManagementApps.Read.All`
   - **Microsoft 365:** `Organization.Read.All`, `SharePointTenantSettings.Read.All` (plus read-only Teams policy reader via `Get-Cs*`)
   - **Power Platform:** BAP service read (`https://api.bap.microsoft.com/.default` with Environment Maker / System Administrator read or Power Platform Administrator read-only calls) and Azure `Reader` on `Microsoft.PowerPlatform/enterprisePolicies`

### 2.2 Transport per control plane

| Plane | Primary read transport | Secondary / fallback read transport | Required operator role (read-only) |
|---|---|---|---|
| `azure` | `az graph query` (Resource Graph) | `az rest --method get` against `https://management.azure.com` | `Reader` (`Desktop Virtualization Reader` recommended; `Log Analytics Reader` for Insights) |
| `entra` | `az rest --method get --resource https://graph.microsoft.com` (`/v1.0/groups`, `/v1.0/identity/conditionalAccess/policies`, `/v1.0/servicePrincipals`, `/v1.0/subscribedSkus`) | None | `Global Reader` or `Security Reader` + `Directory Readers` |
| `intune` | `az rest --method get --resource https://graph.microsoft.com` (`/beta/deviceManagement/configurationPolicies`, `/v1.0/deviceManagement/managedDevices`, `/v1.0/deviceManagement/deviceCompliancePolicies`, `/v1.0/deviceManagement/settings`, `/v1.0/deviceManagement/deviceEnrollmentConfigurations`) | None | `Intune Administrator` (read) or custom Intune role with Read-only permissions, or `Global Reader` |
| `m365` | `az rest --method get --resource https://graph.microsoft.com` (Intune Settings Catalog policies for OneDrive KFM, Silent Account Config, M365 Apps SCA and Outlook caching; `/v1.0/subscribedSkus`) | Read-only `MicrosoftTeams` module (`Get-CsTeamsMeetingPolicy`, `Get-CsTeamsVdiPolicy`) when installed and consented; otherwise Teams-specific facts degrade to `unknown` | `Global Reader` (plus `Teams Communications Reader` or `Teams Administrator` for `Get-Cs*`) |
| `power-platform` | `az graph query` / `az rest --method get` for `Microsoft.PowerPlatform/enterprisePolicies` and VNet subnet delegations; `az account get-access-token --resource https://api.bap.microsoft.com` + `GET https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments` and `/api/data/v9.2/solutions` + `/api/data/v9.2/workflows` | `pac admin list`, `pac solution list` (read-only CLI subcommands) | `Reader` (Azure) + `Power Platform Administrator` or `System Reader` |

### 2.3 `rebuild/scope.json` and CI read-only guard

`rebuild/scope.json` in `avd-current-state` expands from a flat list of Azure calls into a plane-keyed allowlist (`planes.azure`, `planes.entra`, `planes.intune`, `planes.m365`, `planes.powerPlatform`). Every entry specifies:
- `plane`: `azure | entra | intune | m365 | power-platform`
- `transport`: `resource-graph | arm-rest | graph-rest | bap-rest | dataverse-rest | teams-ps | pac-cli`
- `method`: always `GET` (for REST) or `SELECT/PROJECT` (for KQL) or `Get-*` / `list` (for CLI/PS)
- `uriPattern` or `command`
- `facts`: the C15 fact IDs populated from that call

A new Pester test in `avd-current-state` (`tests/ReadOnlyGuard.Tests.ps1`) parses the AST of every `.ps1` script in the repo to verify:
1. No script invokes `Set-*`, `New-*`, `Remove-*`, `Update-*`, `Invoke-AzRestMethod -Method POST|PUT|PATCH|DELETE`, or `az rest --method post|put|patch|delete`.
2. Every `az rest` / Graph / BAP endpoint and external command matches an entry in `rebuild/scope.json`.
This closes the `ci-read-only-guard` gap in `security-review.yaml`.

---

## 3. Contract C11 (`avd-current-state-facts`) and C15 (`fact-register.json`) expansion

### 3.1 `planesCollected` metadata block in C11

Every C11 snapshot gains a top-level `planesCollected` object so downstream consumers (`avd-current-state` portal, `avd-second-brain`, `avd-swarm`) know whether a missing fact is absent in the estate or simply uncollected:

```json
"planesCollected": {
  "azure": { "status": "collected" },
  "entra": { "status": "collected" },
  "intune": { "status": "collected" },
  "m365": { "status": "partial", "reason": "teams-ps-unavailable" },
  "power-platform": { "status": "skipped", "reason": "not-selected" }
}
```

Allowed `status` values: `"collected"`, `"partial"`, `"skipped"`, `"unconsented"`. Allowed `reason` values are a closed enum (`not-selected`, `insufficient-scope`, `no-license`, `teams-ps-unavailable`, `bap-unavailable`, `not-applicable-intake`)—never free text.

### 3.2 Fact register (`fact-register.json`, C15) additions by control plane

All facts below use `"contract": "C11"`, enforce strict redaction (counts, booleans, public enums, or keyed pseudonyms), and link to target-state decisions where applicable.

#### A. Entra ID plane (`c11.entra.*` plus promoted `c11.hostPool.*` identity facts)

| Fact ID | Path | Grain | Unit | Privacy | Status target | Description |
|---|---|---|---|---|---|---|
| `c11.hostPool.sessionHosts.entraJoined` | `/subscriptions/*/hostPools/*/sessionHosts/entraJoined` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Session hosts joined to Entra ID (`AADLoginForWindows`) |
| `c11.hostPool.sessionHosts.domainJoined` | `/subscriptions/*/hostPools/*/sessionHosts/domainJoined` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Session hosts joined to AD DS / Entra DS (`JsonADDomainExtension`) |
| `c11.hostPool.entraSso` | `/subscriptions/*/hostPools/*/entraSso` | `hostPool` | `enum` | `public` | promote `specified` -> `built` | `enablerdsaadauth:i:1` state on the host pool (`enabled`, `disabled`) |
| `c11.hostPool.directUserAssignments` | `/subscriptions/*/hostPools/*/directUserAssignments` | `hostPool` | `count` | `count` | promote `specified` -> `built` | Count of direct `User` principal assignments on application groups or host pools (should be 0; use groups) |
| `c11.entra.userGroupsAssigned` | `/entra/userGroupsAssigned` | `estate` | `count` | `count` | `specified` -> `built` | Distinct Entra security groups assigned `Desktop Virtualization User` on application groups |
| `c11.entra.dynamicHostGroups` | `/entra/dynamicHostGroups` | `estate` | `count` | `count` | `specified` -> `built` | Count of dynamic device security groups targeting AVD session hosts (`device.displayName -startsWith ...` or enrollment profile) |
| `c11.entra.caPoliciesTargetingAvd` | `/entra/caPoliciesTargetingAvd` | `estate` | `countMap` | `count` | `specified` -> `built` | Count of Conditional Access policies targeting AVD / Windows Cloud Login app IDs by state (`enabled`, `enabledForReportingButNotEnforced`, `disabled`) |
| `c11.entra.caAvdRequiresMfa` | `/entra/caAvdRequiresMfa` | `estate` | `enum` | `public` | `specified` -> `built` | Whether an active or report-only CA policy requires MFA or authentication strength for AVD (`enforced`, `report-only`, `none`) |
| `c11.entra.caAvdRequiresCompliantDevice` | `/entra/caAvdRequiresCompliantDevice` | `estate` | `enum` | `public` | `specified` -> `built` | Whether a CA policy requires a compliant device or hybrid joined device for AVD (`enforced`, `report-only`, `none`) |
| `c11.entra.caAvdSignInFrequencyConfigured` | `/entra/caAvdSignInFrequencyConfigured` | `estate` | `bool` | `boolean` | `specified` -> `built` | Whether CA session controls configure periodic reauthentication (`signInFrequency`) for AVD |
| `c11.entra.caAvdBreakGlassExcluded` | `/entra/caAvdBreakGlassExcluded` | `estate` | `bool` | `boolean` | `specified` -> `built` | Whether every AVD-targeted CA policy excludes at least one emergency-access user or group |
| `c11.entra.kerberosStoragePrincipalsReady` | `/entra/kerberosStoragePrincipalsReady` | `estate` | `count` | `count` | `specified` -> `built` | Storage account service principals in Entra with Kerberos password / Graph `User.Read` permissions consented |
| `c11.entra.skuAvdEligibleAvailable` | `/entra/skuAvdEligibleAvailable` | `estate` | `count` | `count` | `specified` -> `built` | Available (unassigned) seats across Windows Enterprise / M365 E3/E5/F3/Business Premium SKUs |

#### B. Intune plane (`c11.intune.*` and `c11.hostPool.sessionHosts.intune*`)

| Fact ID | Path | Grain | Unit | Privacy | Status target | Description |
|---|---|---|---|---|---|---|
| `c11.hostPool.sessionHosts.intuneEnrollRequested` | `/subscriptions/*/hostPools/*/sessionHosts/intuneEnrollRequested` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Hosts with `mdmId` set on `AADLoginForWindows` |
| `c11.hostPool.sessionHosts.intuneManaged` | `/subscriptions/*/hostPools/*/sessionHosts/intuneManaged` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Hosts present in Intune `managedDevices` |
| `c11.hostPool.sessionHosts.intuneCompliant` | `/subscriptions/*/hostPools/*/sessionHosts/intuneCompliant` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Hosts with `complianceState == 'compliant'` |
| `c11.hostPool.sessionHosts.intuneNoncompliant` | `/subscriptions/*/hostPools/*/sessionHosts/intuneNoncompliant` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Hosts with `complianceState == 'noncompliant'` |
| `c11.hostPool.sessionHosts.intuneSyncStale` | `/subscriptions/*/hostPools/*/sessionHosts/intuneSyncStale` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Managed hosts whose `lastSyncDateTime` is older than 7 days |
| `c11.hostPool.sessionHosts.intuneConfigErrors` | `/subscriptions/*/hostPools/*/sessionHosts/intuneConfigErrors` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Managed hosts with configuration profile error states |
| `c11.hostPool.sessionHosts.intuneBaselineApplied` | `/subscriptions/*/hostPools/*/sessionHosts/intuneBaselineApplied` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Managed hosts with security baseline applied |
| `c11.hostPool.intuneOrphans` | `/subscriptions/*/hostPools/*/intuneOrphans` | `hostPool` | `hosts` | `count` | promote `specified` -> `built` | Intune device records matching the pool's host naming prefix with no live VM in Azure |
| `c11.intune.noPolicyMeansNoncompliant` | `/intune/noPolicyMeansNoncompliant` | `estate` | `bool` | `boolean` | promote `specified` -> `built` | Tenant `secureByDefault` compliance setting (`true` = devices without a policy are marked noncompliant) |
| `c11.intune.mdmAutoEnrollmentScope` | `/intune/mdmAutoEnrollmentScope` | `estate` | `enum` | `public` | `specified` -> `built` | MDM auto-enrollment scope (`all`, `some`, `none`) |
| `c11.intune.multiSessionCatalogProfiles` | `/intune/multiSessionCatalogProfiles` | `estate` | `count` | `count` | `specified` -> `built` | Settings Catalog policies scoped to `windows10` with `windowsEnterpriseMultiSession` technology/filter |
| `c11.intune.fslogixProfileConfigured` | `/intune/fslogixProfileConfigured` | `estate` | `bool` | `boolean` | `specified` -> `built` | Settings Catalog profile enables FSLogix Profiles (`Enabled=1`, `VHDLocations` set, `RoamIdentity=0`) without exposing the UNC path |
| `c11.intune.rdpShortpathConfigured` | `/intune/rdpShortpathConfigured` | `estate` | `bool` | `boolean` | `specified` -> `built` | Settings Catalog profile configures RDP Shortpath for managed/public networks |
| `c11.intune.sessionTimeLimitsConfigured` | `/intune/sessionTimeLimitsConfigured` | `estate` | `bool` | `boolean` | `specified` -> `built` | Settings Catalog profile sets idle and disconnected session limits on session hosts |
| `c11.intune.multiSessionUpdateRingAssigned` | `/intune/multiSessionUpdateRingAssigned` | `estate` | `bool` | `boolean` | `specified` -> `built` | Whether a Windows Update ring or quality update policy is assigned to session-host device groups |

#### C. Microsoft 365 plane (`c11.m365.*`)

| Fact ID | Path | Grain | Unit | Privacy | Status target | Description |
|---|---|---|---|---|---|---|
| `c11.m365.oneDriveSilentConfigEnabled` | `/m365/oneDriveSilentConfigEnabled` | `estate` | `bool` | `boolean` | `specified` -> `built` | Intune Settings Catalog policy enables `SilentAccountConfig` for OneDrive |
| `c11.m365.oneDriveKfmState` | `/m365/oneDriveKfmState` | `estate` | `enum` | `public` | `specified` -> `built` | Known Folder Move state (`enforced`, `prompt`, `none`) |
| `c11.m365.oneDriveFilesOnDemandEnabled` | `/m365/oneDriveFilesOnDemandEnabled` | `estate` | `bool` | `boolean` | `specified` -> `built` | OneDrive Files On-Demand (`FilesOnDemandEnabled`) enabled for VDI |
| `c11.m365.m365AppsSharedComputerActivation` | `/m365/m365AppsSharedComputerActivation` | `estate` | `bool` | `boolean` | `specified` -> `built` | Microsoft 365 Apps Shared Computer Activation (`SharedComputerLicensing`) enabled in policy |
| `c11.m365.outlookCachedModeConfigured` | `/m365/outlookCachedModeConfigured` | `estate` | `bool` | `boolean` | `specified` -> `built` | Outlook cached Exchange mode and sync window tuned for FSLogix containers |
| `c11.m365.teamsMediaOptimizationState` | `/m365/teamsMediaOptimizationState` | `estate` | `enum` | `public` | `specified` -> `built` | Teams VDI WebRTC / SlimCore media optimization policy state (`enabled`, `disabled`) |
| `c11.m365.mmrConfigured` | `/m365/mmrConfigured` | `estate` | `bool` | `boolean` | `specified` -> `built` | Multimedia Redirection (MMR) policy and host/browser extension state |

#### D. Power Platform plane (`c11.powerPlatform.*`)

| Fact ID | Path | Grain | Unit | Privacy | Status target | Description |
|---|---|---|---|---|---|---|
| `c11.powerPlatform.enterprisePoliciesCount` | `/subscriptions/*/powerPlatform/enterprisePoliciesCount` | `subscription` | `count` | `count` | `specified` -> `built` | Count of `Microsoft.PowerPlatform/enterprisePolicies` resources (VNet injection) in the subscription |
| `c11.powerPlatform.vnetInjectedSubnets` | `/subscriptions/*/powerPlatform/vnetInjectedSubnets` | `subscription` | `count` | `count` | `specified` -> `built` | Subnets delegated to `Microsoft.PowerPlatform/enterprisePolicies` |
| `c11.powerPlatform.dedicatedEnvironments` | `/powerPlatform/dedicatedEnvironments` | `estate` | `count` | `count` | `specified` -> `built` | Count of non-default (`Production` or `Sandbox`) Power Platform environments in the tenant |
| `c11.powerPlatform.dlpPoliciesCoveringAvdEnv` | `/powerPlatform/dlpPoliciesCoveringAvdEnv` | `estate` | `count` | `count` | `specified` -> `built` | DLP policies scoped to the AVD operational environment(s) |
| `c11.powerPlatform.dlpDefaultGroupClassification` | `/powerPlatform/dlpDefaultGroupClassification` | `estate` | `enum` | `public` | `specified` -> `built` | Default connector classification in the AVD environment's DLP policy (`Blocked`, `Confidential`, `General`) |
| `c11.powerPlatform.avdDay2SolutionsDeployed` | `/powerPlatform/avdDay2SolutionsDeployed` | `estate` | `count` | `count` | `specified` -> `built` | Count of managed AVD day-2 Power Automate solutions installed |
| `c11.powerPlatform.avdDay2FlowsActive` | `/powerPlatform/avdDay2FlowsActive` | `estate` | `countMap` | `count` | `specified` -> `built` | Count of AVD day-2 cloud flows by state (`activated`, `draft`, `suspended`) |

#### E. Intake facts (`intake.*`, C19) for plane applicability

To prevent false gaps when a brownfield estate intentionally leaves Microsoft 365 or Power Platform out of scope, `fact-register.json` adds two intake facts:
- `intake.m365PlaneScope`: `"in-scope" | "managed-separately" | "not-used"`
- `intake.powerPlatformPlaneScope`: `"in-scope" | "not-used"`

---

## 4. `avd-assess` expansion: methods, checks, scoring, and security review

### 4.1 Three new method pages (`methods/*.md`)

Alongside `methods/intune.md` and the Azure method pages (`security.md`, `network.md`, `reliability.md`, `finops.md`, `remote-protocols.md`, `diagnostics.md`), `avd-assess` adds three method pages so every control plane has a peer method in the Standards Library (`avd-ops.dev/standards/`):

1. **`methods/entra.md` (Entra ID and identity method):**
   - How to judge session-host join type (`AADLoginForWindows` vs domain join), Entra Single Sign-On (`enablerdsaadauth:i:1`), RBAC group vs direct-user assignment (`ref:avd-rbac#user-role`), dynamic device groups, Conditional Access for AVD and Windows Cloud Login (MFA, device compliance, sign-in frequency, break-glass exclusions, `reportOnly` vs enforced), Entra Kerberos for Azure Files (`ref:review-checklists-avd#D02.01`), and license SKU readiness.
2. **`methods/m365.md` (Microsoft 365 and VDI productivity method):**
   - How to judge OneDrive Silent Account Configuration, Known Folder Move (KFM), Files On-Demand, Microsoft 365 Apps Shared Computer Activation (`SharedComputerLicensing`), Outlook cached mode limits inside FSLogix profile containers, Teams VDI media optimization (SlimCore / WebRTC), and Multimedia Redirection (MMR). Scores checks as `not-applicable` when `intake.m365PlaneScope == "not-used"`.
3. **`methods/power-platform.md` (Power Platform and day-2 workflow governance method):**
   - How to judge Power Platform environments hosting AVD day-2 workflows: never running production AVD approvals in the tenant Default environment, strict DLP policies (`Default` connector group set to `Blocked` or `General` with Business/Non-Business separation), Bicep `Microsoft.PowerPlatform/enterprisePolicies` VNet injection when reaching private endpoints, managed solutions over unmanaged flows, and human approval gates on destructive host actions. Scores checks as `not-applicable` when `intake.powerPlatformPlaneScope == "not-used"`.

`methods/assessment.md` adds steps linking `entra.md`, `m365.md`, and `power-platform.md` alongside `security.md`, `remote-protocols.md`, `intune.md`, and `diagnostics.md`.

### 4.2 New checks in `method.json`

Every check in `method.json` gains a required `"plane"` property (`"azure" | "entra" | "intune" | "m365" | "power-platform"`). Existing checks are tagged `"plane": "azure"` (or `"entra"` / `"intune"` where appropriate), and new checks are added for each plane:

| Check ID | Plane | Pillar | Severity | Facts | Remediation (`plane` + `kind` + `name`) |
|---|---|---|---|---|---|
| `asm-entra-no-direct-user-rbac` | `entra` | `security` | `medium` | `c11.hostPool.directUserAssignments` | `plane: "entra"`, `kind: "lz-setting"`, `name: "entra-group-rbac-only"` |
| `asm-entra-sso-enabled` | `entra` | `security` | `low` | `c11.hostPool.sessionHosts.entraJoined`, `c11.hostPool.entraSso` | `plane: "azure"`, `kind: "lz-parameter"`, `name: "enableEntraSso"` |
| `asm-entra-ca-avd-mfa` | `entra` | `security` | `high` | `c11.entra.caAvdRequiresMfa` | `plane: "entra"`, `kind: "lz-parameter"`, `name: "deployAvdConditionalAccess"` |
| `asm-entra-ca-break-glass-excluded` | `entra` | `reliability` | `high` | `c11.entra.caAvdBreakGlassExcluded` | `plane: "entra"`, `kind: "lz-setting"`, `name: "ca-exclude-break-glass-group"` |
| `asm-entra-files-kerberos-ready` | `entra` | `security` | `medium` | `c11.storage.filesIdentity`, `c11.entra.kerberosStoragePrincipalsReady` | `plane: "entra"`, `kind: "lz-setting"`, `name: "entra-kerberos-consent"` |
| `asm-intune-hosts-managed` | `intune` | `operations` | `medium` | `c11.hostPool.sessionHosts.intuneEnrollRequested`, `c11.hostPool.sessionHosts.intuneManaged` | `plane: "intune"`, `kind: "lz-setting"`, `name: "intune-mdm-auto-enrollment"` |
| `asm-intune-hosts-compliant` | `intune` | `security` | `high` | `c11.hostPool.sessionHosts.intuneNoncompliant` | `plane: "intune"`, `kind: "lz-setting"`, `name: "intune-session-host-compliance"` |
| `asm-intune-secure-by-default` | `intune` | `security` | `medium` | `c11.intune.noPolicyMeansNoncompliant` | `plane: "intune"`, `kind: "lz-parameter"`, `name: "complianceSecureByDefault"` |
| `asm-intune-fslogix-catalog-profile` | `intune` | `operations` | `medium` | `c11.intune.fslogixProfileConfigured` | `plane: "intune"`, `kind: "lz-setting"`, `name: "intune-settings-catalog-fslogix"` |
| `asm-intune-no-orphaned-devices` | `intune` | `operations` | `low` | `c11.hostPool.intuneOrphans` | `plane: "intune"`, `kind: "manual"`, `code: "remove-orphaned-devices"` |
| `asm-m365-onedrive-kfm` | `m365` | `reliability` | `medium` | `c11.m365.oneDriveSilentConfigEnabled`, `c11.m365.oneDriveKfmState` | `plane: "m365"`, `kind: "lz-parameter"`, `name: "enableOneDriveKfm"` |
| `asm-m365-shared-computer-activation` | `m365` | `cost` | `high` | `c11.hostPool.type`, `c11.m365.m365AppsSharedComputerActivation` | `plane: "m365"`, `kind: "lz-parameter"`, `name: "enableSharedComputerActivation"` |
| `asm-m365-teams-vdi-optimization` | `m365` | `performance` | `medium` | `c11.m365.teamsMediaOptimizationState` | `plane: "m365"`, `kind: "lz-parameter"`, `name: "enableTeamsVdiOptimization"` |
| `asm-pp-dedicated-environment` | `power-platform` | `operations` | `medium` | `c11.powerPlatform.dedicatedEnvironments` | `plane: "power-platform"`, `kind: "lz-parameter"`, `name: "deployDedicatedEnvironment"` |
| `asm-pp-dlp-blocks-unapproved` | `power-platform` | `security` | `high` | `c11.powerPlatform.dlpPoliciesCoveringAvdEnv`, `c11.powerPlatform.dlpDefaultGroupClassification` | `plane: "power-platform"`, `kind: "lz-setting"`, `name: "power-platform-strict-dlp"` |
| `asm-pp-vnet-enterprise-policy` | `power-platform` | `security` | `medium` | `c11.powerPlatform.enterprisePoliciesCount`, `c11.powerPlatform.vnetInjectedSubnets` | `plane: "power-platform"`, `kind: "lz-parameter"`, `name: "enableVnetEnterprisePolicy"` |

### 4.3 Scoring and coverage (`methods/scoring.md` and C21 report)

1. **Primary rollup (Well-Architected pillars):** Unchanged (`reliability`, `security`, `cost`, `operations`, `performance`), using severity weights (`high: 3`, `medium: 2`, `low: 1`, `warnFactor: 0.5`).
2. **Secondary rollup (Control planes):** The C21 assessment report (`avd-assessment-report/v1`) adds a `planes` map alongside `pillars`:
   ```json
   "planes": {
     "azure": { "score": 0.88, "coverage": 0.92, "pass": 14, "warn": 2, "gap": 1, "unknown": 1, "notApplicable": 0 },
     "entra": { "score": 0.75, "coverage": 1.00, "pass": 3, "warn": 1, "gap": 1, "unknown": 0, "notApplicable": 0 },
     "intune": { "score": 0.80, "coverage": 1.00, "pass": 4, "warn": 0, "gap": 1, "unknown": 0, "notApplicable": 0 },
     "m365": { "score": null, "coverage": 0.00, "pass": 0, "warn": 0, "gap": 0, "unknown": 3, "notApplicable": 0 },
     "power-platform": { "score": null, "coverage": null, "pass": 0, "warn": 0, "gap": 0, "unknown": 0, "notApplicable": 3 }
   }
   ```
3. **Uncollected vs opted-out planes:**
   - If a plane is not collected (`planesCollected.<plane>.status` is `skipped` or `unconsented`), its checks evaluate to `unknown`. They lower that plane's `coverage` to `0.00` and leave its `score` as `null`, never penalizing the pillar score.
   - If an intake answer marks a plane out of scope (`intake.m365PlaneScope == "not-used"` or `intake.powerPlatformPlaneScope == "not-used"`), its checks evaluate to `not-applicable` and are excluded from both the score denominator and the `unknown` count.

### 4.4 Remediation hints (`method.json` and C24 `avd-remediation-plan/v1`)

In `method.json` and C24, each remediation hint carries `"plane"`:
```json
"remediation": {
  "plane": "intune",
  "kind": "lz-setting",
  "name": "intune-settings-catalog-fslogix"
}
```
When `avd-current-state`'s assessment portal generates a C24 remediation plan:
- Items remain ordered by outcome (`gap`, `warn`, `unknown`), severity, and check ID, and carry their `plane` tag.
- Step 7 of `methods/remediation.md` ("Group landing zone changes into one redeploy") groups items by `plane` (`entra`, `intune`, `m365`, `azure`, `power-platform`) in the portal view and exported plan so an operator can apply a single plane's changes standalone or feed the full multi-plane manifest into `avd-landing-zone`.

### 4.5 Security review map (`security-review.yaml`, C20)

`security-review.yaml` in `avd-assess` (and its pinned copy `site/data/security-review.json` in `avd-ops`) expands to cover all 11 public repos in `repos.json`:
1. **`pins` and `maturity.repos`:** Add `avd-entra`, `avd-intune`, `avd-m365`, `avd-azure`, and `avd-power-platform` (with `avd-azure` at `pre-beta` while migrating from `avd-landing-zone`, and `avd-entra`, `avd-intune`, `avd-m365`, `avd-power-platform` at `design` until their first real runs).
2. **Claims (`areas.*.claims`):**
   - `identity-access`: Claims for `avd-entra` (per-pool security groups, dynamic device groups, `reportOnly` Conditional Access default, break-glass exclusions, Entra Kerberos setup, preflight license check without buying commitments) and `cs-graph-readonly` (dedicated read-only scopes and runtime token guard in `avd-current-state`).
   - `network`: Claims for `avd-azure` (Private Link and NSGs migrated from `avd-landing-zone`) and `avd-power-platform` (Bicep `Microsoft.PowerPlatform/enterprisePolicies` VNet subnet injection).
   - `hosts`: Claims for `avd-intune` (MDM auto-enrollment, multi-session Settings Catalog profiles, `secureByDefault` compliance) and `avd-m365` (OneDrive KFM, Shared Computer Activation, Teams VDI media optimization).
   - `governance-spend`: Claims for run-manifest stamping across all five control-plane repos for clean teardown, and `avd-power-platform` DLP policies and human approval gates on day-2 flows.
3. **`threats`:** Threat cards for each of the five control-plane repos stating what each repo touches, its blast radius (e.g., tenant-wide Graph objects in `avd-entra` / `avd-intune` / `avd-m365`), and how it is limited (`reportOnly` CA default, run-manifest tagging, preflight checks, no secret storage).

---

## 5. `avd-current-state` collector, validator, and portal expansion

### 5.1 Collector (`avd_current_state_collector.ps1`)

- **New parameter:**
  ```powershell
  [ValidateSet('all', 'azure', 'entra', 'intune', 'm365', 'power-platform')]
  [string[]]$Planes = @('all')
  ```
- **Modular internal collectors:** Each plane runs in its own isolated collector function (`Get-AvdStateAzure`, `Get-AvdStateEntra`, `Get-AvdStateIntune`, `Get-AvdStateM365`, `Get-AvdStatePowerPlatform`).
- **Evidence package layout:** The portable evidence folder writes one sub-bundle per collected plane (`azure/`, `entra/`, `intune/`, `m365/`, `power-platform/`) plus `collection-manifest.json` recording `planesCollected`.
- **Facts builder (`avd_current_state_facts.ps1`):** Reads each present sub-bundle offline, applies the same HMAC pseudonymization and leak regex guards (blocking GUIDs, emails, UNC paths, domains, and IPs), populates the new `c11.entra.*`, `c11.intune.*`, `c11.m365.*`, and `c11.powerPlatform.*` paths, and validates the output against the pinned C11 schema.

### 5.2 Validator (`avd_deployment_validator.ps1`)

- **New parameters:**
  ```powershell
  [ValidateSet('PreDeployment', 'PostDeployment')]
  [string]$Mode = 'PreDeployment',

  [ValidateSet('all', 'azure', 'entra', 'intune', 'm365', 'power-platform')]
  [string[]]$Planes = @('all'),

  [string]$ManifestPath
  ```
- **Preflight (`-Mode PreDeployment`) per plane:**
  - `azure`: Subscription quotas, resource provider registrations (`Microsoft.DesktopVirtualization`, `Microsoft.Storage`, `Microsoft.KeyVault`, `Microsoft.Network`), region availability, address space overlap.
  - `entra`: Graph read consent, required directory roles, eligible AVD/Windows Enterprise license SKU seats (`subscribedSkus`), absence of conflicting group names.
  - `intune`: Intune tenant status (`subscriptionState`), MDM authority, auto-enrollment readiness.
  - `m365`: M365 license SKU seats, SharePoint/OneDrive tenant readiness.
  - `power-platform`: `Microsoft.PowerPlatform` resource provider registration, subnet delegation readiness, BAP API reachability and environment capacity.
- **Postflight (`-Mode PostDeployment`) per plane:**
  - Accepts `-ManifestPath` pointing to either the `avd-landing-zone` orchestrator run manifest or a directory containing the stage handoff manifests (`entra-manifest.json`, `intune-manifest.json`, `m365-manifest.json`, `azure-outputs.json`, `power-platform-manifest.json`), and also works standalone by discovering resources by naming convention/tags when `-ManifestPath` is omitted.
  - Verifies:
    - `entra`: Security groups created, dynamic membership rules valid, Conditional Access policies deployed in expected state (`reportOnly` or `enabled`) with break-glass exclusions, Entra Kerberos service principal configured.
    - `intune`: Session hosts enrolled in Intune, multi-session Settings Catalog profiles and compliance policies assigned to the dynamic host groups from `entra-manifest.json`, zero configuration errors.
    - `m365`: OneDrive KFM, Silent Account Config, Shared Computer Activation, and Teams VDI policies present and assigned to the user/device groups.
    - `azure`: Host pools, workspaces, application groups, Private Endpoints, Private DNS zones, Azure Files SMB GCM / Entra Kerberos, Key Vault, and session host agent health.
    - `power-platform`: `Microsoft.PowerPlatform/enterprisePolicies` linked to VNet subnets, dedicated environment provisioned, DLP policy active and blocking unapproved connectors, day-2 Power Automate solutions imported and cloud flows turned on.

### 5.3 Assessment portal (`site/portal/` in `avd-current-state`)

1. **Plane selector in Step 1 (Scope & Run):**
   - Segmented / checkbox control defaulting to **All five planes**, with individual toggles for **Azure**, **Entra ID**, **Intune**, **Microsoft 365**, and **Power Platform**.
   - Updates the generated PowerShell and Bash Cloud Shell command blocks (`-Planes ...`) and lists the exact read-only roles/scopes needed for the selected planes.
2. **Plane coverage strip & filter in Findings:**
   - Displays both the five **Well-Architected pillar scores** (primary) and the five **Control-plane scores & coverage** (secondary).
   - Shows why any uncollected plane is `unknown` or `not-applicable` (from `planesCollected` and intake answers).
3. **Plane-grouped Remediation Plan (C24):**
   - Groups Fix items by control plane (`entra`, `intune`, `m365`, `azure`, `power-platform`) and exports a C24 remediation plan that `avd-landing-zone`'s deployment portal (`deploy.avd-ops.dev/portal/`) can import directly.

---

## 6. Rollout order across repos

Because dependencies point down and contracts are byte-pinned across repos, changes land in four ordered phases:

| Phase | Repo | Deliverables | Verification |
|---|---|---|---|
| **Phase 1: Spec & front door (this PR)** | `avd-ops` | `docs/five-plane-assess-current-state-spec.md`, MADR [decision 0010](knowledge/decisions/0010-expand-assess-and-current-state-across-five-control-planes.md), updated `docs/knowledge/repos/avd-current-state.md` and `docs/knowledge/repos/avd-assess.md`, rebuilt `site/docs/` and KB indexes. | `node scripts/site/build-docs.mjs`, `py scripts/kb/build.py`, `py scripts/kb/validate.py`, `node --test "tests/*.test.mjs"` |
| **Phase 2: Contracts & standards** | `avd-second-brain` & `avd-assess` | Update C11 (`avd-current-state-facts`), C15 (`fact-register.json`), C21 (`avd-assessment-report`), and C24 (`avd-remediation-plan`) schemas; add `methods/entra.md`, `methods/m365.md`, `methods/power-platform.md`; add `"plane"` and the 16 multi-plane checks to `method.json`; expand `security-review.yaml` for all 11 repos. | `avd-assess` Python validators (`check_*.py`) and `avd-second-brain` contract schema tests |
| **Phase 3: Collector, validator & portal** | `avd-current-state` | Pin updated contracts and `method.json` from `avd-assess`; add `-Planes` and per-plane read modules to `avd_current_state_collector.ps1` and `avd_deployment_validator.ps1`; expand `avd_current_state_facts.ps1`; expand `rebuild/scope.json` and add `tests/ReadOnlyGuard.Tests.ps1`; update `site/portal/assess-core.js` for plane selection, per-plane scores, and plane-grouped C24 export. | Pester offline scenarios + `ReadOnlyGuard.Tests.ps1` + Node portal tests (`node --test`) |
| **Phase 4: Pin bump & standards library** | `avd-ops` | Run `node scripts/site/build-standards.mjs --pin ../avd-assess`, `node scripts/site/build-standards.mjs`, and `node scripts/site/build-security.mjs` to publish the expanded Standards Library and Security Review page on `avd-ops.dev`. | `tests/site.test.mjs` and `tests/standards.test.mjs` |
