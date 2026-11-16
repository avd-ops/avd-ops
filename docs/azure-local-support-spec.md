# Azure Virtual Desktop on Azure Local (`azure-local`) Specification Across the Control Planes and Foundation

Status: draft (2026-11-16, proposed; awaiting [decision](knowledge/decisions/README.md) and repo-level implementation).

Today the `avd-ops` family assumes session hosts run as Azure IaaS virtual machines (`Microsoft.Compute/virtualMachines`) in an Azure region, with FSLogix profiles on Azure Files / Azure NetApp Files and Azure-native VM power management. Right now, **AVD on Azure Local** appears only as an open extension point (`network.azure-local` in [network.md](../site/data/standards/methods/network.md#L33)), an unimplemented scope gap (`hybrid-scope`: *"what a hybrid and Azure Local assessment can judge, and where Azure Arc helps on-premises"*), and two pinned Microsoft Learn sources in `avd-assess` (`avd-azure-local` and `avd-azure-local-workload`).

This specification defines how the `avd-ops` family supports **Azure Virtual Desktop on Azure Local** (registered Azure Local 23H2 or later instances with Azure Arc Resource Bridge and Custom Locations) as a first-class host-placement target (`hostPlacement: "azure-local"`) alongside Azure-hosted session hosts (`hostPlacement: "azure"`), and how every repository validates that support offline in CI (`standing: guarded`) without requiring a physical Azure Local cluster.

---

## 1. Architectural Principles and Assumptions

1. **Prerequisite boundary: bring your own registered Azure Local 23H2+ instance.**
   - Provisioning physical hardware, Rack/Cluster deployment, Azure Stack HCI OS installation, and Azure Arc Resource Bridge bootstrap are **out of scope** for `avd-ops`.
   - `avd-landing-zone`, `avd-azure`, and `avd-hcl` target an **existing, registered Azure Local 23H2 or later instance** with an Azure Custom Location (`Microsoft.ExtendedLocation/customLocations`), an Arc logical network, and an Arc VM image / Marketplace image already available on the instance.
2. **Strict host-pool separation (`azure` vs. `azure-local`, never mixed).**
   - Per Microsoft Learn (`avd-azure-local#no-mixed-pools`), a host pool holds session hosts on Azure **or** on Azure Local, **never both**.
   - Every host pool carries an explicit `hostPlacement` (`"azure"` default, or `"azure-local"`). Mixed host pools fail preflight validation and are flagged as a critical finding in `avd-assess` / `avd-current-state`.
3. **Supported OSes, RDP Shortpath, and Connected Machine agent.**
   - Supports Windows 10 and 11 Enterprise multi-session, single-session client, and Windows Server 2019 through 2025 on registered Azure Local 23H2+ instances, with RDP Shortpath and Azure Marketplace images (`avd-azure-local#multisession-and-shortpath`).
   - Session hosts on Azure Local run the **Azure Connected Machine agent** (`Microsoft.HybridCompute/machines`) to reach the Azure Instance Metadata Service (IMDS) endpoint that AVD requires (`avd-azure-local#connected-machine-agent`).
4. **Identity: native Entra ID join only (via Bicep/ARM/PowerShell, no AD DS in v1).**
   - The Azure portal adds Azure Local session hosts only to AD DS (including Entra hybrid join); native Entra ID join requires PowerShell or another programmatic deployment method (`avd-azure-local#entra-join-outside-portal`).
   - Aligning with `avd-landing-zone`'s cloud-native identity model, v1 supports **native Entra ID join only** (via Bicep/ARM/`Microsoft.HybridCompute/machines/extensions` and PowerShell provisioning scripts) and does not provision or join AD DS / Entra hybrid-joined hosts. `avd-current-state` still detects and reports AD DS / hybrid-joined Azure Local pools in brownfield estates.
5. **Profile storage: on-premises SMB share instead of Azure Files.**
   - FSLogix profile containers on Azure Local use an **on-premises SMB share** — either a clustered file server on the Azure Local instance or an external SMB share on the same network for larger deployments (`avd-azure-local#local-smb-for-profiles`).
   - When `hostPlacement == "azure-local"`, `avd-azure` skips Azure Files / Azure NetApp Files provisioning for that pool unless explicitly overridden, and `avd-assess` / `avd-current-state` evaluate profile storage against local SMB / NTFS / Kerberos readiness rather than `AADKERB` and Azure Files Private Endpoints.
6. **Three-part pricing model in preflight.**
   - Running AVD on Azure Local carries three cost components: (1) user access rights (Microsoft 365 / RDS CAL), (2) the Azure Local service fee, and (3) the AVD for Azure Local fee per active vCPU (`avd-azure-local#three-part-pricing`).
   - `avd-landing-zone` preflight cost estimation separates Azure control-plane / monitoring spend from the Azure Local per-vCPU meter and marks hardware/service fees as operator-supplied or excluded from Azure Retail Prices API totals.
7. **Capability-driven `not-applicable` scoring for Azure-VM-only checks.**
   - Checks that only apply to Azure IaaS VMs (Azure Managed Disks, Azure Files Private Endpoints, Azure VM Availability Zones, Azure-region VM quota, or Azure-native Start VM on Connect where unsupported) score as `not-applicable` (`reason: "azure-local-host"`) so an Azure Local estate is never penalized for platform differences.
8. **Offline CI verification (`standing: guarded`).**
   - Every repository proves `azure-local` support in CI via Bicep / AzAPI / Terraform compilation, PSRule assertions, JSON Schema validation, and mocked Pester / Node tests. Claims in `security-review.yaml` remain `standing: guarded` until a redacted live run on a registered Azure Local 23H2+ instance upgrades them to `run`.

---

## 2. Contract Updates Across the Foundation (`avd-assess`)

No new control-plane repository is required; Azure Local extends existing foundation contracts owned by `avd-assess` (with byte-identical pinned copies in consuming repos):

| Contract | File | Proposed Additions |
|---|---|---|
| **`C19`** (`intake.schema.json`) | `contracts/intake.schema.json` | Add optional `hostPlacement` (`"azure" \| "azure-local"`, default `"azure"`), `azureLocalClusterId`, `customLocationId`, `localSmbProfilePath`, and `userAccessRightsType`. |
| **`C11`** (`facts.schema.json`) | `contracts/facts.schema.json` | Add per-host-pool `hostPlacement` (`"azure" \| "azure-local" \| "mixed"`), `azureLocal` inventory block (`clusters[]`, `customLocations[]`, `virtualMachineInstances[]`, `hybridComputeMachines[]`, `connectedMachineAgentVersion`, `imdsReachable`), and add `"azure-local-host"` to the `not-applicable` reason enum. |
| **`C14`** (`target-state.schema.json`) | `contracts/target-state.schema.json` | Add per-pool `hostPlacement: "azure" \| "azure-local"`, `customLocationId`, `logicalNetworkId`, and `profileStorageType: "azure-files" \| "anf" \| "local-smb"`. |
| **`C21`** (check results) | `contracts/check-results.schema.json` | Support `reason: "azure-local-host"` for `not-applicable` Azure-IaaS-only checks. |
| **`C33`** (`avd-azure-local-outputs/v1`, optional) | `contracts/azure-local-outputs.schema.json` | If `avd-azure` splits Azure Local VM instance deployment into a dedicated stage manifest, emit `customLocationId`, `logicalNetworkId`, `vmInstanceIds[]`, and `hybridComputeMachineIds[]` for `avd-current-state` validation. |

---

## 3. Repository-by-Repository Changes

### 3.1 `avd-assess` (Standards, Methods, Claims, and Security Map)

1. **Resolve `gap:hybrid-scope` and `network.azure-local`:**
   - Document what an Azure Local assessment can judge via Azure Resource Graph (`Microsoft.AzureStackHCI/clusters`, `Microsoft.ExtendedLocation/customLocations`, `Microsoft.AzureStackHCI/virtualMachineInstances`, `Microsoft.HybridCompute/machines`) versus what requires on-premises / intake evidence (physical cluster health, Storage Spaces Direct resiliency, local SMB share ACLs and IOPS, LAN/WAN RDP Shortpath UDP reachability).
2. **Cite the remaining 5 claims in `references/avd-azure-local.yaml`:**
   - `network.md` (`network.azure-local`): enforce `no-mixed-pools` and RDP Shortpath reachability (`multisession-and-shortpath`).
   - `identity.md`: check `entra-join-outside-portal` and Connected Machine agent IMDS readiness (`connected-machine-agent`).
   - `storage.md`: check `local-smb-for-profiles` (clustered file server vs. external SMB share on the same network) when `hostPlacement == "azure-local"`.
   - `cost.md`: model `three-part-pricing` (user access rights + Azure Local service fee + AVD for Azure Local active vCPU fee).
   - `reliability.md`: check Arc Resource Bridge / Custom Location health, multi-node cluster fault tolerance, and local SMB availability.
3. **Security Review Map (`security-review.yaml`):**
   - Add `azure-local` claims at `standing: guarded` covering Connected Machine agent / IMDS integrity, local SMB encryption & NTFS permissions, and host-pool placement isolation.

### 3.2 `avd-current-state` (Collector and Validator)

1. **Azure Resource Graph & ARM queries:**
   - Query `Microsoft.AzureStackHCI/clusters` (registration status, OS version >= 23H2), `Microsoft.ExtendedLocation/customLocations`, `Microsoft.AzureStackHCI/virtualMachineInstances`, and `Microsoft.HybridCompute/machines` (Connected Machine agent status, `agentVersion`, `status == "Connected"`).
   - Correlate each AVD session host (`Microsoft.DesktopVirtualization/hostPools/sessionHosts`) with its underlying resource ID to classify every host pool as `"azure"`, `"azure-local"`, or `"mixed"`.
2. **Evaluator rules:**
   - Fail `network.azure-local.no-mixed-pools` if any host pool contains both `Microsoft.Compute/virtualMachines` and `Microsoft.AzureStackHCI/virtualMachineInstances` / `Microsoft.HybridCompute/machines`.
   - Emit `not-applicable` (`reason: "azure-local-host"`) for Azure-VM-only checks on `azure-local` pools.

### 3.3 `avd-azure` and `avd-landing-zone` (Deployment & Portal)

1. **`avd-azure` (Bicep / AzAPI):**
   - Add an optional `hostPlacement` parameter (`'azure' | 'azure-local'`, default `'azure'`) on the session-host module.
   - When `hostPlacement == 'azure-local'`:
     - Accept `customLocationId`, `logicalNetworkId`, `galleryImageId` (Arc VM image), and `localSmbProfilePath`.
     - Deploy `Microsoft.AzureStackHCI/virtualMachineInstances` (with `extendedLocation` pointing to `customLocationId`) and install the AVD agent + native Entra ID join extension (`AADLoginForWindows`) via `Microsoft.HybridCompute/machines/extensions` (or PowerShell provisioning script).
     - Skip Azure VNet session-host subnet, Azure Files / ANF profile storage, and Azure VM Availability Zone resources while keeping the Azure-hosted AVD host pool, application groups, workspace, Log Analytics / AVD Insights, and optional Private Link in Azure.
2. **`avd-landing-zone` (Orchestrator, Preflight, and Portal):**
   - **Portal (`site/portal/`):** Add a **Host Placement** toggle (`Azure VMs` | `Azure Local (23H2+)`) per host pool. Selecting `Azure Local` reveals inputs for Custom Location ID, Arc Logical Network ID, Arc Gallery Image ID, and Local SMB FSLogix path, and hides Azure VM SKU / Availability Zone / Azure Files SKU pickers for that pool.
   - **Preflight (`Test-AvdLandingZoneReadiness.ps1`):** Verify the target Azure Local cluster is registered (`23H2` or later), the Custom Location and Logical Network exist, and the host pool does not mix Azure and Azure Local hosts. Calculate the three-part cost summary cleanly.

### 3.4 `avd-hcl` (Terraform / Enterprise HCL)

- Add a parallel `azure_local` host-pool module using `azapi_resource` (or `azurerm_stack_hci_virtual_machine_instance` where supported by the pinned provider version) with the same `hostPlacement` contract, Custom Location inputs, and offline `terraform validate` / `tflint` checks.

### 3.5 `avd-intune`, `avd-m365`, `avd-linecheck`, `avd-second-brain`, and `avd-swarm`

- **`avd-intune` & `avd-m365`:** Ensure assignment filters (`avd-multisession`, `avd-personal`) and M365 Apps / Teams VDI optimization policies apply cleanly to Arc-connected (`Microsoft.HybridCompute/machines`) native Entra-joined session hosts.
- **`avd-linecheck`:** Add an optional local-gateway / RDP Shortpath UDP probe note when testing clients that connect over LAN/WAN to an Azure Local host pool (since data-plane traffic can stay local while brokering goes through Azure).
- **`avd-second-brain` & `avd-swarm`:** Update reasoning and remediation playbooks so `hostPlacement == "azure-local"` never recommends migrating profiles to Azure Files or adding Azure IaaS VMs to an Azure Local host pool.

---

## 4. Verification and Rollout Plan

1. **Phase 1 — Standards & Contracts (`avd-assess`):**
   - Update `C11`, `C14`, `C19`, `C21`, resolve `gap:hybrid-scope`, wire all 6 claims in `avd-azure-local.yaml` into `methods/*.md`, and pass `avd-assess` schema/link validation.
2. **Phase 2 — Collection & Assessment (`avd-current-state`):**
   - Add Resource Graph queries for `Microsoft.AzureStackHCI/*` and `Microsoft.HybridCompute/machines`, plus Pester tests with mocked Azure Local payloads.
3. **Phase 3 — Deployment & Portal (`avd-azure`, `avd-landing-zone`, `avd-hcl`):**
   - Add `hostPlacement: "azure-local"` Bicep/AzAPI and Terraform modules, preflight checks, three-part cost output, and portal UI controls; verify with Bicep build, PSRule, `terraform validate`, and Pester/Node CI tests (`standing: guarded`).
4. **Phase 4 — Live Sandbox Validation:**
   - Run a redacted end-to-end deployment and `avd-current-state` collection against a registered Azure Local 23H2+ instance to upgrade `security-review.yaml` claims from `standing: guarded` to `run`.

---

## 5. Open Questions

1. **Dedicated contract `C33` vs. extending `C11`/`C14`:** Should Azure Local VM instance outputs stay inside `avd-azure`'s existing `azure-outputs.json` or get a separate `C33` (`avd-azure-local-outputs/v1`) contract?
2. **`avd-hcl` timing:** Should `avd-hcl` ship in Phase 3 alongside `avd-azure` Bicep, or follow in a fast-follow PR once the Bicep/AzAPI resource shapes are proven?
