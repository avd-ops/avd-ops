# Desktop DevOps Specification: `avd-second-brain`, `avd-swarm`, and the Foundation Across AVD, Windows 365, and Intune

Status: accepted (2026-11-02, [decision 0012](knowledge/decisions/0012-desktop-devops-for-avd-win365-and-intune.md)).

Enterprise cloud desktop estates rarely run Azure Virtual Desktop in isolation. Operators manage **Azure Virtual Desktop (AVD)** (pooled multi-session and personal session hosts in Azure), **Windows 365** (Enterprise and Frontline Cloud PCs provisioned through Microsoft Graph `deviceManagement/virtualEndpoint`), and **Microsoft Intune** (Settings Catalog baselines, compliance policies, Windows Autopatch / update rings, Endpoint Security, and Win32/Enterprise App Catalog apps across AVD session hosts, Cloud PCs, and physical Windows endpoints) under one identity (`avd-entra`) and productivity (`avd-m365`) umbrella.

This specification defines how **`avd-second-brain`** and **`avd-swarm`** operate as a **Desktop DevOps** intelligence and execution layer for **AVD, Windows 365, and Intune**, and how **Windows 365** and **Intune Desktop DevOps** integrate into `avd-intune`, `avd-current-state`, and `avd-assess` without adding a sixth control-plane repository or breaking [family roles](family-roles.md).

---

## 1. Architectural Principles

1. **Desktop DevOps = GitOps + Agentic, Human-Gated Operations across AVD, Windows 365, and Intune.**
   - **`avd-second-brain`** is the **Desktop DevOps intelligence and memory layer**: one knowledge base, contract registry, fact register, policy/image/app compatibility catalog, and per-estate private vault across AVD, Windows 365, and Intune. It reasons about workload placement (pooled AVD vs. personal AVD vs. Windows 365 Enterprise vs. Windows 365 Frontline), cross-platform Intune policy targeting, drift history, and why each rule is what it is. It never holds a write credential.
   - **`avd-swarm`** is the **Desktop DevOps execution and operating layer**: specialist agents that read live state across Azure (`Microsoft.DesktopVirtualization`), Windows 365 (`deviceManagement/virtualEndpoint`), and Intune (`deviceManagement/*`), compare against cited `avd-second-brain` evidence, and propose declarative, diffable changes (`C9` plan proposals) that execute only after a person approves the exact plan in a GitHub Environment behind one layered kill switch (`C10` execution outcomes).
2. **Windows 365 lives inside `avd-intune` and the existing five control planes—not a sixth control-plane repo.**
   In Microsoft's cloud architecture, Windows 365 is an Intune-native service exposed under the Microsoft Graph `deviceManagement/virtualEndpoint` surface (`cloudPCs`, `provisioningPolicies`, `userSettings`, `deviceImages`, `galleryImages`, `onPremisesConnections`, `auditEvents`) and governed by `Intune Administrator` / `Cloud PC Administrator` RBAC roles.
   - **`avd-intune`** owns declarative Windows 365 provisioning policies, Cloud PC user settings, assignment filters (`avd-multisession`, `avd-personal`, `win365-cloudpc`, `physical-desktop`), Settings Catalog baselines, compliance policies, and update rings.
   - **`avd-entra`** already owns the security groups, dynamic device groups (`device.model -startsWith "Cloud PC"` and AVD session-host groups), Conditional Access policies (`Windows 365` / `Windows Cloud Login` app IDs), and license SKU readiness checks (`Windows 365 Enterprise`, `Windows 365 Frontline`).
   - **`avd-azure`** already owns the optional Azure Virtual Network, subnet, and DNS plumbing when Windows 365 uses an Azure Network Connection (ANC) instead of a Microsoft Hosted Network (MHN).
   - **`avd-m365`** already owns the shared OneDrive Known Folder Move (KFM), Microsoft 365 Apps, and Teams VDI / SlimCore media optimization policies that apply equally to AVD session hosts and Windows 365 Cloud PCs.
3. **Dependencies still point strictly down.**
   `avd-landing-zone` (orchestrating the five control planes) and `avd-current-state` remain a self-contained pair that works with no `avd-second-brain` and no `avd-swarm`. `avd-assess` remains a zero-credential research index and corpus.
4. **Never delete the last copy (`-DiscardLastCopy`) extends to Windows 365 Cloud PCs and Intune policies.**
   Reprovisioning a Cloud PC or ending a Cloud PC grace period permanently deletes the user's virtual disk. Under [never delete the last copy](never-delete-the-last-copy.md), any `avd-intune` script or `avd-swarm` plan that reprovisions or deprovisions a Cloud PC must verify a recent point-in-time restore point (`virtualEndpoint/cloudPCs/*/restorePoints`) or OneDrive KFM sync state, or require explicit `-DiscardLastCopy` approval from the owner.
5. **Never leave the meter running extends to fixed-price Cloud PC licenses and Frontline concurrency.**
   Under [never leave the meter running](never-leave-the-meter-running.md), scripts and agents never purchase Windows 365 or Intune licenses. Preflight checks inspect existing unassigned seats in `subscribedSkus`, and `avd-second-brain` / `avd-swarm` continuously compare AVD consumption compute/storage cost against Windows 365 fixed monthly SKU utilization.

---

## 2. How Each Layer Works in Desktop DevOps

### 2.1 Top Layer: `avd-second-brain` (Desktop DevOps Intelligence & Memory)

`avd-second-brain` expands its knowledge base, calibration tables, and contracts to cover all three Desktop DevOps pillars:

| Capability | AVD Scope | Windows 365 Scope | Intune Scope |
|---|---|---|---|
| **Workload Placement & Sizing Calibration** | Multi-session user density per vCPU/GiB, autoscale schedules, ephemeral vs. Premium SSD OS disks, FSLogix Azure Files sizing | Cloud PC SKU selection (2vCPU/4GB through 16vCPU/64GB), Enterprise (1:1 dedicated) vs. Frontline (3:1 shared shift concurrency), MHN vs. ANC | Policy applicability across multi-session (`windowsEnterpriseMultiSession`), single-session Cloud PC (`device.model -startsWith "Cloud PC"`), and physical endpoints |
| **Policy & Configuration Memory (C18)** | Host pool RDP properties, session limits, Shortpath, watermarking, screen capture protection | Provisioning policies (`provisioningPolicies`), user settings (`userSettings`: local admin off, restore point cadence), custom/gallery images | Settings Catalog JSON baselines (`configurationPolicies`), compliance policies, assignment filters (`assignmentFilters`), Autopatch / update rings, Win32 app superseding |
| **Drift & Incident Correlation** | Correlates `WVDErrors`, `WVDConnections`, FSLogix VHDX mount latency, and Azure resource drift | Correlates Cloud PC provisioning failures, ANC health check failures (`onPremisesConnections`), restore point gaps, and underutilized Cloud PCs | Correlates Intune profile assignment conflicts, configuration errors (`intuneConfigErrors`), noncompliant devices, and un-filtered multi-session policies hitting single-session devices |
| **Proposal Generation (`C9`)** | Generates cited `C9` proposals for host pool scaling, image rotation, or Bicep parameter updates | Generates cited `C9` proposals for Cloud PC rightsizing, Enterprise-to-Frontline conversion, ANC remediation, or provisioning policy updates | Generates cited `C9` proposals with exact Settings Catalog JSON diffs, assignment filter attachments, and ring-by-ring policy promotion (`pilot` -> `broad`) |

### 2.2 Top Layer: `avd-swarm` (Desktop DevOps Agents & Governance Gate)

`avd-swarm` organizes its read-first specialist agents around Desktop DevOps domains. Every agent reads live state and cited `avd-second-brain` evidence; every write goes through an approved `C9` plan in a GitHub Environment with a pre-execution re-read and one layered kill switch:

1. **`readiness` agent:** Checks tenant licensing (`subscribedSkus` for AVD, Windows 365 Enterprise/Frontline, Intune), Entra groups, Conditional Access coverage across AVD and Windows 365 app IDs, Intune MDM auto-enrollment, assignment filters, and Azure Network Connection (ANC) / VNet readiness.
2. **`deploy` agent:** Proposes greenfield or incremental multi-plane deployments via `avd-landing-zone` (or individual slices in `avd-entra`, `avd-intune`, `avd-m365`, `avd-azure`, `avd-power-platform`), including declarative Windows 365 provisioning policies and Intune policy-as-code baselines.
3. **`hosts-and-cloudpcs` agent:** Operates both AVD session hosts and Windows 365 Cloud PCs:
   - *AVD:* Drain/undrain session hosts, start/deallocate hosts, trigger scheduled agent updates, replace unhealthy hosts.
   - *Windows 365:* Trigger Cloud PC resize (when supported by SKU family), restore a Cloud PC to a verified point-in-time restore point, retry failed ANC health checks, or propose controlled Cloud PC reprovisioning (gated by restore-point verification or `-DiscardLastCopy`).
4. **`intune-policy` agent (Policy-as-Code GitOps):**
   - Reads exported Intune Settings Catalog, compliance, and assignment filter JSON from the estate repo and live Graph state (`/beta/deviceManagement/configurationPolicies`, `/v1.0/deviceManagement/deviceCompliancePolicies`, `/beta/deviceManagement/assignmentFilters`).
   - Detects portal click-ops drift (when an admin edits a policy in the Intune portal outside Git), explains the diff against `avd-second-brain`'s C18 decision log, and proposes a `C9` plan to either revert the portal drift or promote the change into the declarative policy repo across staged rings (`canary` -> `pilot` -> `production`).
5. **`images-and-apps` agent:** Tracks gallery and custom image age across AVD Compute Gallery images and Windows 365 `deviceImages`, WDOT optimization state, Defender pre-seal maintenance, and Intune Win32 / Enterprise App Catalog package assignments.
6. **`users-and-access` agent:** Audits group-based RBAC and licensing assignments across AVD application groups and Windows 365 provisioning policy Entra groups, Conditional Access MFA/compliance enforcement, and break-glass exclusions.
7. **`cost-and-licensing` agent:** Compares real session utilization against billing: flags idle personal AVD hosts that should turn on start-on-connect/deallocate, pooled AVD pools with low scaling efficiency, Windows 365 Enterprise Cloud PCs with zero sign-ins over 14/30 days, and shift-worker cohorts where Windows 365 Frontline or pooled AVD reduces license spend.

---

## 3. Foundation Integration: `avd-intune`, `avd-entra`, `avd-current-state`, and `avd-assess`

### 3.1 `avd-intune`: Declarative Intune Policy-as-Code + Windows 365 Provisioning

`avd-intune` expands from AVD session-host Settings Catalog configuration into the declarative **Intune and Windows 365 control-plane repo**:

1. **First-class Assignment Filters (`deviceAndAppManagementAssignmentFilters`):**
   `Deploy-AvdIntune.ps1` deploys and stamps four standard assignment filters so multi-session, Cloud PC, and physical endpoint policies never collide:
   - `avd-multisession`: `(device.osVersion -startsWith "10.0") and (device.deviceSku -eq "ServerRdsh")`
   - `avd-personal`: `(device.displayName -startsWith "<prefix>-p-") and (device.model -eq "Virtual Machine")`
   - `win365-cloudpc`: `(device.model -startsWith "Cloud PC")`
   - `physical-desktop`: `(device.model -notStartsWith "Cloud PC") and (device.model -ne "Virtual Machine")`
2. **Optional Windows 365 Workload Slice (`-IncludeWin365`):**
   When `-IncludeWin365` is passed (or selected in the `avd-landing-zone` deployment portal), `Deploy-AvdIntune.ps1`:
   - Checks preflight for active Windows 365 service plans (`CPC_E_*`, `CPC_LVL_*`, `WIN365_*`) in `/v1.0/subscribedSkus` without purchasing licenses.
   - Optionally creates or validates an **Azure Network Connection (ANC)** (`POST /v1.0/deviceManagement/virtualEndpoint/onPremisesConnections`) linked to the VNet/subnet from `azure-outputs.json`, or uses **Microsoft Hosted Network (MHN)** (`managedType: "windows365"`).
   - Deploys a declarative **Windows 365 Provisioning Policy** (`POST /v1.0/deviceManagement/virtualEndpoint/provisioningPolicies`) stamped with `[avd-ops-<prefix>-<env>]`, configuring Entra Join + Single Sign-On (`enableSingleSignOn: true`), gallery or custom image, Windows Autopatch / language settings, and group assignment to the Windows 365 user group from `entra-manifest.json`.
   - Deploys a declarative **Windows 365 User Settings Policy** (`POST /v1.0/deviceManagement/virtualEndpoint/userSettings`) disabling local administrator rights (`localAdminEnabled: false`) and configuring scheduled point-in-time restore points (`restorePointSetting.frequencyInHours: 4` or `6`, `userRestoreEnabled: true`).
   - Records all created Windows 365 policy and ANC IDs in `intune-manifest.json` (`avd-ops-intune-manifest/v1`) and `intune-run-manifest.json` (`avd-ops-intune-run-manifest/v1`) so `Remove-AvdIntune.ps1 -DiscardLastCopy` cleans up only run-created objects.

### 3.2 `avd-entra`: Identity and Conditional Access for AVD + Windows 365

`avd-entra` expands its group and Conditional Access templates so one identity baseline covers both desktop platforms:
- Optional Windows 365 user security group (`sg-avd-ops-<prefix>-<env>-win365-users`) and dynamic Cloud PC device group (`dg-avd-ops-<prefix>-<env>-cloudpcs`, rule `(device.model -startsWith "Cloud PC")`).
- Conditional Access policy template (`reportOnly` by default) includes the Windows 365 and Windows Cloud Login first-party application IDs alongside Azure Virtual Desktop, enforcing phishing-resistant MFA, device compliance (`RequireCompliantDevice`), sign-in frequency, and emergency-access exclusions.

---

## 4. Contract Expansions (`C11`, `C15`, `C9`, `C10`, `C19`)

### 4.1 Fact Register (`fact-register.json`, C15) and C11 Snapshot (`avd-current-state-facts`)

All new facts live under the `intune` and `entra` planes in C11, use strict redaction (counts, booleans, public enums, or keyed HMAC pseudonyms), and are collected read-only by `avd-current-state`:

#### A. Windows 365 Cloud PC facts (`c11.intune.win365.*` and `c11.entra.skuWin365Available`)

| Fact ID | Path | Grain | Unit | Privacy | Status target | Description |
|---|---|---|---|---|---|---|
| `c11.entra.skuWin365Available` | `/entra/skuWin365Available` | `estate` | `count` | `count` | `specified` -> `built` | Available (unassigned) seats across Windows 365 Enterprise / Frontline SKUs in `subscribedSkus` |
| `c11.intune.win365.cloudPcCountByStatus` | `/intune/win365/cloudPcCountByStatus` | `estate` | `countMap` | `count` | `specified` -> `built` | Count of Cloud PCs by status (`provisioned`, `provisioning`, `failed`, `inGracePeriod`, `deprovisioning`, `notProvisioned`) |
| `c11.intune.win365.provisioningPoliciesCount` | `/intune/win365/provisioningPoliciesCount` | `estate` | `count` | `count` | `specified` -> `built` | Count of Windows 365 provisioning policies (`virtualEndpoint/provisioningPolicies`) |
| `c11.intune.win365.ssoEnabledOnAllPolicies` | `/intune/win365/ssoEnabledOnAllPolicies` | `estate` | `bool` | `boolean` | `specified` -> `built` | Whether every active Windows 365 provisioning policy sets `enableSingleSignOn == true` |
| `c11.intune.win365.networkMode` | `/intune/win365/networkMode` | `estate` | `enum` | `public` | `specified` -> `built` | Network mode across provisioning policies (`microsoft-hosted`, `azure-network-connection`, `mixed`, `none`) |
| `c11.intune.win365.ancCountByHealth` | `/intune/win365/ancCountByHealth` | `estate` | `countMap` | `count` | `specified` -> `built` | Count of Azure Network Connections (`virtualEndpoint/onPremisesConnections`) by `healthCheckStatus` (`passed`, `warning`, `failed`, `pending`) |
| `c11.intune.win365.userSettingsCount` | `/intune/win365/userSettingsCount` | `estate` | `count` | `count` | `specified` -> `built` | Count of Windows 365 user settings policies (`virtualEndpoint/userSettings`) |
| `c11.intune.win365.localAdminDisabled` | `/intune/win365/localAdminDisabled` | `estate` | `bool` | `boolean` | `specified` -> `built` | Whether all Windows 365 user settings policies keep `localAdminEnabled == false` |
| `c11.intune.win365.restorePointFrequencyHoursMax` | `/intune/win365/restorePointFrequencyHoursMax` | `estate` | `hours` | `count` | `specified` -> `built` | Maximum configured point-in-time restore point interval across user settings policies (`4`, `6`, `12`, `16`, `24`) |
| `c11.intune.win365.customImagesReady` | `/intune/win365/customImagesReady` | `estate` | `count` | `count` | `specified` -> `built` | Count of Windows 365 custom device images (`virtualEndpoint/deviceImages`) in `ready` state |

#### B. Intune Desktop DevOps & Fleet Hygiene facts (`c11.intune.*`)

| Fact ID | Path | Grain | Unit | Privacy | Status target | Description |
|---|---|---|---|---|---|---|
| `c11.intune.assignmentFiltersCount` | `/intune/assignmentFiltersCount` | `estate` | `count` | `count` | `specified` -> `built` | Count of Intune assignment filters (`deviceAndAppManagementAssignmentFilters`) |
| `c11.intune.multiSessionFilterPresent` | `/intune/multiSessionFilterPresent` | `estate` | `bool` | `boolean` | `specified` -> `built` | Whether an assignment filter explicitly targets or excludes `ServerRdsh` / multi-session hosts |
| `c11.intune.cloudPcFilterPresent` | `/intune/cloudPcFilterPresent` | `estate` | `bool` | `boolean` | `specified` -> `built` | Whether an assignment filter explicitly targets or excludes `device.model -startsWith "Cloud PC"` |
| `c11.intune.unfilteredAllDevicesPolicies` | `/intune/unfilteredAllDevicesPolicies` | `estate` | `count` | `count` | `specified` -> `built` | Count of Settings Catalog or compliance policies assigned to `All Devices` without an assignment filter |
| `c11.intune.cloudPcManagedCompliant` | `/intune/cloudPcManagedCompliant` | `estate` | `count` | `count` | `specified` -> `built` | Count of Intune-managed Cloud PCs with `complianceState == 'compliant'` |
| `c11.intune.cloudPcManagedNoncompliant` | `/intune/cloudPcManagedNoncompliant` | `estate` | `count` | `count` | `specified` -> `built` | Count of Intune-managed Cloud PCs with `complianceState == 'noncompliant'` |

#### C. Intake fact (`intake.win365Scope`, C19)

To prevent false gaps when an estate uses AVD only (or Windows 365 only), `fact-register.json` adds:
- `intake.win365Scope`: `"in-scope" | "not-used"`
- `intake.avdScope`: `"in-scope" | "not-used"` (default `"in-scope"`)

### 4.2 `rebuild/scope.json` Read-Only Endpoints (`avd-current-state`)

`avd-current-state` adds the following read-only `GET` endpoints under `planes.intune` in `rebuild/scope.json` (requiring `CloudPC.Read.All` and `DeviceManagementConfiguration.Read.All`, enforced by the runtime token guard and `tests/ReadOnlyGuard.Tests.ps1`):
- `GET /v1.0/deviceManagement/virtualEndpoint/cloudPCs`
- `GET /v1.0/deviceManagement/virtualEndpoint/provisioningPolicies`
- `GET /v1.0/deviceManagement/virtualEndpoint/userSettings`
- `GET /v1.0/deviceManagement/virtualEndpoint/onPremisesConnections`
- `GET /v1.0/deviceManagement/virtualEndpoint/deviceImages`
- `GET /beta/deviceManagement/assignmentFilters`

### 4.3 `C9` (`avd-swarm-plan-proposal`) and `C10` (`avd-swarm-execution-outcome`) Schema Additions

In `avd-second-brain` and `avd-swarm`, contract `C9` (`avd-swarm-plan-proposal/v1`) adds:
- `targetSurface`: `"avd" | "win365" | "intune" | "entra" | "m365" | "power-platform"`
- `desktopDevOpsAction`: closed enum of auditable action classes:
  - `avd.host.drain`, `avd.host.power`, `avd.pool.scale`, `avd.image.rotate`
  - `win365.policy.update`, `win365.usersettings.update`, `win365.cloudpc.resize`, `win365.cloudpc.restore`, `win365.cloudpc.reprovision`, `win365.anc.healthcheck`
  - `intune.policy.promote-ring`, `intune.policy.revert-drift`, `intune.filter.attach`, `intune.compliance.update`
- `dataLossGuard`: required object on destructive actions (`win365.cloudpc.reprovision`, `avd.host.replace`) recording `{ "restorePointVerified": true, "restorePointAgeHours": 2, "discardLastCopyApproved": false }`.

---

## 5. `avd-assess` Checks and Methods for Windows 365 & Intune Desktop DevOps

`avd-assess` expands `methods/intune.md` (covering Intune Policy-as-Code, assignment filter separation across AVD multi-session, Windows 365 Cloud PCs, and physical endpoints, and Windows 365 `virtualEndpoint` governance) and adds six checks to `method.json` under `"plane": "intune"`:

| Check ID | Plane | Pillar | Severity | Facts | Applicability | Remediation (`plane` + `kind` + `name`) |
|---|---|---|---|---|---|---|
| `asm-intune-assignment-filters-separate-platforms` | `intune` | `operations` | `high` | `c11.intune.multiSessionFilterPresent`, `c11.intune.cloudPcFilterPresent`, `c11.intune.unfilteredAllDevicesPolicies` | Always when `intune` collected | `plane: "intune"`, `kind: "lz-setting"`, `name: "intune-platform-assignment-filters"` |
| `asm-win365-sso-enabled` | `intune` | `security` | `medium` | `c11.intune.win365.provisioningPoliciesCount`, `c11.intune.win365.ssoEnabledOnAllPolicies` | `not-applicable` when `intake.win365Scope == "not-used"` | `plane: "intune"`, `kind: "lz-parameter"`, `name: "win365EnableSingleSignOn"` |
| `asm-win365-no-local-admin` | `intune` | `security` | `high` | `c11.intune.win365.userSettingsCount`, `c11.intune.win365.localAdminDisabled` | `not-applicable` when `intake.win365Scope == "not-used"` | `plane: "intune"`, `kind: "lz-setting"`, `name: "win365-disable-local-admin"` |
| `asm-win365-restore-points-configured` | `intune` | `reliability` | `medium` | `c11.intune.win365.restorePointFrequencyHoursMax` | `not-applicable` when `intake.win365Scope == "not-used"` | `plane: "intune"`, `kind: "lz-parameter"`, `name: "win365RestorePointFrequencyHours"` |
| `asm-win365-anc-healthy` | `intune` | `reliability` | `high` | `c11.intune.win365.networkMode`, `c11.intune.win365.ancCountByHealth` | `not-applicable` when `intake.win365Scope == "not-used"` or `networkMode == "microsoft-hosted"` | `plane: "intune"`, `kind: "manual"`, `code: "remediate-win365-anc-health"` |
| `asm-win365-cloudpcs-compliant` | `intune` | `security` | `high` | `c11.intune.cloudPcManagedNoncompliant` | `not-applicable` when `intake.win365Scope == "not-used"` | `plane: "intune"`, `kind: "lz-setting"`, `name: "intune-cloudpc-compliance"` |

---

## 6. Rollout Order Across Repos

| Phase | Repo | Deliverables | Verification |
|---|---|---|---|
| **Phase 1: Spec, ADR & front-door positioning (this PR)** | `avd-ops` | `docs/desktop-devops-spec.md`, MADR [decision 0012](knowledge/decisions/0012-desktop-devops-for-avd-win365-and-intune.md), updated `docs/family-roles.md`, `docs/knowledge/family.yaml`, `docs/knowledge/repos/avd-swarm.md`, `docs/knowledge/repos/avd-second-brain.md`, `docs/knowledge/repos/avd-intune.md`, `docs/knowledge/concepts/README.md`, `site/family/*.html`, rebuilt `site/docs/` and KB indexes. | `node scripts/site/build-docs.mjs`, `python3 scripts/kb/build.py`, `python3 scripts/kb/validate.py`, `node --test "tests/*.test.mjs"` |
| **Phase 2: Contracts, knowledge base & standards** | `avd-second-brain` & `avd-assess` | Expand `C9`, `C10`, `C11`, `C15` (`fact-register.json`), and `C19` schemas for Windows 365 and Intune Desktop DevOps; add Desktop DevOps workload placement & Intune policy-as-code topics to `avd-second-brain/docs/knowledge/`; update `methods/intune.md` and add the 6 checks to `avd-assess/method.json`. | `avd-second-brain` contract schema tests + `avd-assess` Python validators (`check_*.py`) |
| **Phase 3: Declarative control plane & read-only collector** | `avd-intune` & `avd-current-state` | Add assignment filters and optional `-IncludeWin365` (`provisioningPolicies`, `userSettings`, `onPremisesConnections`) to `avd-intune`; add `virtualEndpoint` and `assignmentFilters` read-only `GET` collection to `avd-current-state` (`Get-AvdStateIntune`, `rebuild/scope.json`, `avd_current_state_facts.ps1`). | Pester unit/offline tests + `tests/ReadOnlyGuard.Tests.ps1` |
| **Phase 4: Desktop DevOps specialist agents & policy GitOps** | `avd-swarm` | Expand `avd-swarm` spec (`docs/spec.md`) and specialist agent contracts (`hosts-and-cloudpcs`, `intune-policy`, `cost-and-licensing`) to read C11/Graph across AVD, Windows 365, and Intune and emit GitHub-gated `C9` plans with `dataLossGuard`. | `avd-swarm` Pester and governance gate validation tests |
