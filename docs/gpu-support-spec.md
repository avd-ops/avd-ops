# Full GPU Support Specification Across Assessment, Landing Zone, Intune, and Current State

Status: proposed (2026-11-14).

This specification defines end-to-end GPU session host support across `avd-assess`, `avd-azure`, `avd-intune`, `avd-current-state`, and `avd-landing-zone`, closing the gap between `avd-assess`'s documented GPU standards (`graphics.gpu-need`, `graphics.gpu-size`, `graphics.users-per-gpu`, `protocol.graphics-encoding`) and what the deployment, policy, collector, and assessment layers actually enforce and verify.

---

## 1. Architectural Principles

1. **One canonical GPU SKU catalog (`C32`, `avd-gpu-skus/v1`) in `avd-assess`.**
   `avd-assess` owns `contracts/gpu-skus.json` and `contracts/schemas/gpu-skus.schema.json`. It classifies Azure VM sizes used for AVD session hosts into:
   - **`supported` NV-family series** (e.g., `Standard_NV*ads_A10_v5`, `Standard_NV*ads_V710_v5`), with `gpuVendor` (`nvidia` | `amd`), `driverExtension` (`NvidiaGpuDriverWindows` | `AmdGpuDriverWindows`), `acceleratedNetworkingSupported` (`true` | `false`), `gridLicenseMaxUsers` (`25` for NVIDIA, `null` for AMD), and `hevcSupported`.
   - **`retired` NV-family series** (`Standard_NV*s_v3`, `Standard_NV*as_v4`, retired 2026-09-30 per Microsoft Learn).
   - **`compute` GPU series** (`Standard_NC*`, `Standard_ND*`), which are not appropriate for Windows UI / AVD session hosts (`ref:avd-gpu-acceleration#no-compute-gpus`).
2. **Declarative driver deployment in `avd-azure` with both VM extension and image-bake paths.**
   - By default (`gpuDriverMode = 'auto'`), `avd-azure/bicep/modules/sessionHosts.bicep` detects `Standard_NV*` SKUs and deploys the Azure-distributed `NvidiaGpuDriverWindows` or `AmdGpuDriverWindows` VM extension (`Microsoft.HpcCompute`), which works directly on marketplace Windows 10/11 multi-session images.
   - Operators baking custom golden images can use `scripts/image/Install-GpuDriver.ps1` and set `gpuDriverMode = 'image'` (or `'none'` to opt out).
   - `enableAcceleratedNetworking` is exposed as a parameter (default `true`) so GPU SKUs without accelerated networking support do not fail NIC deployment.
3. **Defense-in-depth RDP graphics encoding policy (Host + Intune).**
   Because AVD defaults to CPU rendering and software encoding even on GPU VMs (`ref:avd-gpu-acceleration#cpu-by-default`), both `avd-azure` (`scripts/sessionhost/Set-GpuGraphicsPolicy.ps1` when `enableGpuGraphicsPolicy = true`) and `avd-intune` (`profiles/settings-catalog/avd-gpu-graphics-encoding.json`) configure:
   - Use hardware graphics adapters for all Remote Desktop Services sessions (`Enabled`)
   - Configure H.264/AVC hardware encoding for Remote Desktop Connections (`Enabled`)
   - Prioritize H.264/AVC 444 Graphics mode (`Enabled`)
   - Configure compression for RemoteFX data (`Optimized to use less memory`)
4. **Automated `asm-gpu-*` assessment checks in `avd-assess` and `avd-current-state`.**
   Every GPU host pool is evaluated offline against `C11` facts collected by `avd_current_state_facts.ps1`:
   - `asm-gpu-no-compute-skus` (`gap`): Flags `NC*`/`ND*` compute GPUs in AVD host pools.
   - `asm-gpu-no-retired-skus` (`warn`): Flags retired `NVv3`/`NVv4` SKUs.
   - `asm-gpu-driver-extension` (`warn`): Flags GPU session hosts missing `NvidiaGpuDriverWindows` / `AmdGpuDriverWindows` extensions (note: pre-baked image drivers without extension report `warn` unless excluded).
   - `asm-gpu-grid-session-cap` (`gap`): Flags pooled NVIDIA GPU host pools with `maxSessionLimit > 25` (`ref:avd-gpu-acceleration#grid-license-25`).
   - `asm-gpu-graphics-diagnostics` (`warn`): Flags GPU host pools that do not send `ConnectionGraphics` (or `allLogs`) to Log Analytics (`ref:wvdconnectiongraphicsdata-table#frame-drops-by-cause`).
5. **Usage export and portal sizing integration.**
   - `avd-current-state/Export-AvdInsightsUsage.ps1` infers `gpuRequired = $true` when a host pool runs NV-family GPU VM sizes (instead of hardcoding `$false`).
   - `avd-landing-zone/site/portal/portal-core.js` adds supported NVads A10 v5 and NVads V710 v5 sizes to `VM_SIZES` and adds a `graphics` pool template to `POOL_TEMPLATES` with the 25-user NVIDIA GRID cap enforced in sizing guidance.

---

## 2. Per-Repository Deliverables

| Repository | Deliverables | Verification |
|---|---|---|
| `avd-ops` | `docs/gpu-support-spec.md` (this spec) | `scripts/kb/build.py`, `scripts/kb/validate.py`, `unittest` |
| `avd-assess` | `contracts/gpu-skus.json`, `contracts/schemas/gpu-skus.schema.json`, `contracts/fact-register.json` & `current-state-facts.schema.json` GPU facts, `dimensions.yaml` & `method.json` `asm-gpu-*` checks | `py -3 scripts/check_all.py` |
| `avd-azure` | `bicep/modules/sessionHosts.bicep` & `bicep/main.bicep` (`enableAcceleratedNetworking`, `gpuDriverMode`, `enableGpuGraphicsPolicy`, GPU extensions), `scripts/sessionhost/Set-GpuGraphicsPolicy.ps1`, `scripts/image/Install-GpuDriver.ps1` | `az bicep build` + Pester / PSScriptAnalyzer |
| `avd-intune` | `profiles/settings-catalog/avd-gpu-graphics-encoding.json`, `scripts/Deploy-AvdIntune.ps1` integration | `py -3 scripts/validate.py`, `pytest` / `unittest` |
| `avd-current-state` | `avd_current_state_facts.ps1` GPU facts & extensions, `Export-AvdInsightsUsage.ps1` `gpuRequired` inference, `contracts/intake.schema.json` (`graphicsWorkloads`), `assess/method.json` & `checks/catalog.json` & `lib/AvdAssess.psm1` `asm-gpu-*` checks | Pester tests + Node portal tests |
| `avd-landing-zone` | `site/portal/portal-core.js` (`VM_SIZES` GPU SKUs, `POOL_TEMPLATES.graphics`) | Node portal tests |
