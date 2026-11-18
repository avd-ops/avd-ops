# Open-Source GUI/RPA Workload Engine Specification (`avd-benchmark`)

Status: proposed (2026-11-18, [decision 0027](knowledge/decisions/0027-open-source-rpa-workload-engine.md)). Red-teamed (section 6).

`avd-benchmark` currently simulates multi-session density using background PowerShell worker processes (CPU, memory, disk I/O, and headless DOM loops) paired with PerfMon counters ([benchmark-platform-spec.md](benchmark-platform-spec.md)), plus an optional BYO output adapter for EUC Score ([decision 0021](knowledge/decisions/0021-euc-score-byo-output-adapter.md)). It lacks an **open-source, deterministic, in-session GUI/RPA workload engine**—an open-source counterpart to commercial VDI synthetic workload products—capable of driving real Windows desktop applications inside active AVD sessions and measuring UI responsiveness without proprietary licenses or closed binaries.

This specification defines the architecture, open-source adoption choices, `C25` output shape, Windows 11 24H2 session mechanics, and safety boundaries for adding an in-session RPA workload engine to `avd-benchmark`.

---

## 1. Goals and Non-Goals

### Goals
1. **Open-source parity for GUI workloads:** Drive real Windows desktop and browser applications inside active AVD user sessions using semantic UI Automation locators (not brittle pixel coordinates).
2. **UI-level latency telemetry:** Measure step-level timings (`appLaunchMs`, `windowReadyMs`, `actionLatencyMs`, `saveCloseMs`) at `p50`/`p90`/`p95`/`p99` plus `stepSuccessRatePct`, paired with Windows `User Input Delay per Session` and host PerfMon counters.
3. **Zero proprietary dependencies:** Run entirely on permissive open-source components (MIT / Apache-2.0) compiled from source and pinned by lockfile + SHA-256 in `avd-benchmark`.
4. **Zero golden-image bloat:** Target in-box `.NET Framework 4.8` (`net48`) and Windows PowerShell 5.1 on the session host—requiring no Python runtime, no Java runtime, no PowerShell 7 installation, and no Playwright browser downloads on the image.
5. **Strict `C25` privacy:** Emit only redacted, banded `avd-benchmark-result/v1` (`C25`) JSON—never screenshots, window titles, usernames, hostnames, or raw event streams.

### Non-Goals
1. **Not an AI / CUA agent:** This engine executes deterministic, pre-authored workload scripts for benchmarking. Arbitrary or LLM-driven desktop control belongs to [cua-executor-spec.md](cua-executor-spec.md) (`avd-swarm` `external-executor`).
2. **Not a commercial VDI protocol emulator:** `avd-benchmark` does not reverse-engineer RDP/ICA/Blast; it uses standard Microsoft RDP/AVD clients from an external driver VM and runs the RPA worker inside the resulting active Windows session.
3. **Not a replacement for `euc-score-byo`:** Operators in public-result labs can still use EUC Score BYO CSV ingestion ([decision 0021](knowledge/decisions/0021-euc-score-byo-output-adapter.md)); this spec provides the native, zero-EULA-restriction open-source path.

---

## 2. Build or Adopt Analysis (`build-or-adopt.md`)

Per [build-or-adopt.md](build-or-adopt.md), candidate open-source GUI/RPA engines were evaluated against four criteria: permissive license, semantic UI locators (survives DPI/resolution changes), in-box session-host runtime compatibility, and deterministic timing support.

| Candidate | License | Locator Model | Host Footprint | Outcome |
|---|---|---|---|---|
| **[FlaUI](https://github.com/FlaUI/FlaUI)** (`FlaUI.UIA3`) | MIT | Microsoft UI Automation (`UIA3`/`UIA2`) by `AutomationId`, `Name`, `ControlType` | Targets in-box `.NET Framework 4.8` (`net48`) on Windows 11 24H2; single SHA-256-verified binary | **Adopted** for native Windows desktop apps. |
| **Playwright** | Apache-2.0 | DOM / Accessibility locators | Downloads `150–300 MB` browser binaries + driver at runtime | **Rejected for guest hosts** (violates zero image bloat and `defaultOutboundAccess: false` egress rules). Use inbox Edge driven via `FlaUI` / local CDP instead. |
| **pywinauto** | BSD-3-Clause | Win32 / UIA | Requires Python + pywin32 on every session host | **Not adopted** (adds Python runtime to golden image). |
| **Robot Framework + `RPA.Windows`** | Apache-2.0 | UIA + image fallback | Requires Python + pip dependencies on every session host | **Not adopted** (heavy host footprint for multi-session density). |
| **SikuliX / AutoIt** | MIT / Proprietary freeware | Pixel/image/coordinates | Java (SikuliX) or closed-source binary (AutoIt) | **Rejected** (AutoIt is closed-source; pixel locators break on DPI/codec scaling). |

**Decision:** Adopt **FlaUI (`FlaUI.UIA3`, MIT)** targeting `net48` as the core in-session Windows UIA engine, compiled from source in `avd-benchmark` CI as `AvdBenchmark.RpaWorker.exe` with `packages.lock.json` (`RestoreLockedMode=true`), `actions/attest-build-provenance`, and runtime SHA-256 verification (matching `Test-AvdDiskSpdBinary` and [decision 0008](knowledge/decisions/0008-code-signing.md) or an explicit lab-only WDAC/Defender policy). Register the pinned `FlaUI` release/license in `avd-assess` and `avd-ops/credits.json`.

---

## 3. Architecture and Repo Boundaries

Dependencies follow [family-roles.md](family-roles.md) strictly downward:

| Component | Owner Repo | Responsibility |
|---|---|---|
| **Profile & Schema** | `avd-assess` | Defines `rpa-ui-responsiveness` as a dedicated profile in `benchmarks/profiles.yaml`, adds its claims/observations, and validates `C25` output via `scripts/check_evidence.py`. |
| **RPA Worker & Harness** | `avd-benchmark` | Builds `AvdBenchmark.RpaWorker.exe` (`net48`, FlaUI), ships built-in deterministic persona manifests (`light`, `medium`, `heavy`, `power`), runs Windows PowerShell 5.1 guest orchestration (`Invoke-AvdRpaWorkload.ps1`), collects PerfMon + step timings, and outputs redacted `C25` JSON. |
| **Lab Host Pool & Driver VM (Optional)** | `avd-landing-zone` | Optionally provisions an ephemeral lab host pool and Windows client-driver VM under an approved sandbox batch (`go batch <id> $<total>`), never depending on `avd-benchmark`. |
| **Read-Only Telemetry** | `avd-current-state` | Unchanged; never injects synthetic load or runs RPA workers. |

### 3.1 Session Mechanics and Execution Flow
1. **Active Client-Driven Sessions (No Headless Scheduled Tasks):** An external Windows driver VM (triggered from Cloud Shell or Azure VM Run Command within the same sandbox batch) launches active RDP/AVD sessions against an isolated lab pool. Scheduled tasks without an active RDP client run in `WTSDisconnected` where DWM stops rendering; therefore, active client connections are mandatory.
   - The driver VM sets `RemoteDesktop_SuppressWhenMinimized = 2` and stays unlocked so client-side RDP frame rendering never freezes.
   - For unattended lab logins on Entra-joined pools (`enablerdsaadauth:i:1`), dedicated lab test accounts use scoped Conditional Access / MFA exclusions or a documented lab-only `enablerdsaadauth:i:0` / PRT acquisition flow.
2. **Unlocked Interactive Desktop Guard:** Before every persona iteration, the worker checks `WTSINFOEX` (`SessionFlags` lock state) **and** `OpenInputDesktop` / `GetUserObjectInformation(UOI_NAME) == "Default"` (rejecting `"Winlogon"` or disconnected states) so UIA calls never hang on a lock screen.
3. **Windows 11 24H2-Safe Deterministic Persona Loop:**
   - **No removed or shell-trap apps:** WordPad (removed in Windows 11 24H2) is excluded. File Explorer (`explorer.exe`) is never `Kill()`'d (closing only benchmark-opened `CabinetWClass` windows via `WM_CLOSE`). Modern MSIX Notepad (`Microsoft.WindowsNotepad`) session-restore is disabled via deterministic lab policy, or a self-contained open-source Win32/WPF text/scroll fixture is shipped inside `avd-benchmark` for deterministic text/save timings.
   - **Inbox Edge with isolated non-profile state:** Edge launches with `--user-data-dir=%SystemDrive%\AvdBmTmp\<sessionId>\edge --no-first-run --disable-sync` against read-only `file://` static fixtures under `%ProgramFiles%\AvdBenchmark\fixtures\` verified by SHA-256 (avoiding host-wide `127.0.0.1` port squatting).
   - **M365 Office as a separate explicit profile/flag:** Because `SharedComputerLicensing=1` triggers blocking sign-in modals without a live M365 token, Office apps are never "silently optional" inside `rpa-ui-responsiveness`; they require a separate explicit profile/flag and pre-authenticated lab licensing.
4. **UIA Discipline, Watchdog, and Input-Queue Probes:**
   - **No root-desktop tree walks:** All queries use process-scoped `CacheRequest`s, explicit COM RCW cleanup, and periodic worker recycling to prevent `IUIAutomation` handle leaks.
   - **Hard timeout isolation:** Each iteration runs inside a Windows Job Object (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`) with an out-of-process watchdog that terminates hung UIA RPC calls on timeout. Timed-out steps are recorded as censored max-timeout samples alongside `stepSuccessRatePct` (never dropped as survivorship bias).
   - **Warmup & real input probes:** A configurable warmup window is excluded from recorded percentiles; UIA locators are paired with bounded Win32 `SendInput` probes so `User Input Delay per Session` reflects real input-queue latency and resets idle timers.
5. **Non-Profile Scratch & FSLogix Protection:** All worker scratch files and Edge user data live under machine-local `%SystemDrive%\AvdBmTmp\<sessionId>` (excluded from FSLogix VHDX containers) and are wiped on Job Object close before logoff so containers never bloat or lock on detach.

---

## 4. Contract `C25` Integration

`rpa-ui-responsiveness` emits `avd-benchmark-result/v1` (`C25`) as a **dedicated profile** (never mixed into `multisession-density` in `corpus.json`):

* `profile.id`: `"rpa-ui-responsiveness"` (registered in `avd-assess/benchmarks/profiles.yaml`, `AvdBenchmark.psm1`, and `benchmark-core.js`).
* `metrics`: Retains standard host counters (`cpuPct`, `pqlPerCore`, `availableMemoryMiB`, `memoryPerSessionMiB`, `inputDelayMs`) and adds optional `$defs/distribution` fields in `benchmark-result.schema.json`:
  * `appLaunchMs`: `{ p50, p90, p95, p99 }`
  * `windowReadyMs`: `{ p50, p90, p95, p99 }`
  * `actionLatencyMs`: `{ p50, p90, p95, p99 }`
  * `saveCloseMs`: `{ p50, p90, p95, p99 }`
  * `stepSuccessRatePct`: `0..100`
* `extensions.generator`: Remains reserved for `"native"` | `"euc-score-byo"` ([decision 0021](knowledge/decisions/0021-euc-score-byo-output-adapter.md)). RPA engine metadata uses a separate closed namespace `extensions.rpa`:
  * `{ "engine": "flaui-uia3", "version": "<semver>", "persona": "medium", "manifestCommit": "<sha>" }` (using hyphenated tokens—no dotted filenames—so `Test-AvdBenchmarkResult` and `benchmark-core.js` domain regexes never reject valid records).

---

## 5. Safety, Privacy, and Cost Guardrails

1. **Lab-pool & `startVmOnConnect` spend gates:** Runs only in `-Mode OfflineFixture` or `-Mode ExistingHostPool` against a pool tagged `avd-benchmark-pool=true` with zero active non-benchmark human sessions. If `startVmOnConnect` is enabled and hosts are `Deallocated`, `-Mode ExistingHostPool` refuses to launch unless `-SandboxBatchApproval "go batch <id> $<total>"` is supplied.
2. **Deadline RG deletion (`never-leave-the-meter-running.md`):** Ephemeral lab pools and driver VMs use `avd-landing-zone` sandbox batches (`New-AvdSandboxBatch.ps1` -> `Approve-AvdSandboxBatch.ps1` -> `Invoke-AvdSandboxBatch.ps1`) with `Invoke-AvdSandboxDeadline.ps1` pre-armed to **delete** (not merely deallocate) the resource group. Automated M365 license/trial provisioning is prohibited.
3. **Least privilege & symlink-safe collection:** `AvdBenchmark.RpaWorker.exe` runs unprivileged (`VM User Login`) and writes only to user-ACL'd `%LOCALAPPDATA%\AvdBenchmark\`. The elevated host aggregator reads session JSONL buffers with `FILE_FLAG_OPEN_REPARSE_POINT` and strict schema parsing (never trusting paths or executing content from session buffers).
4. **Zero-reflection redaction:** `AvdBenchmark.RpaWorker.exe` emits only opaque step IDs and sanitized `AutomationId`/`ControlType` tokens—never window titles, file paths, UPNs, or raw UIA trees, even in local JSONL logs. On-host validation uses `Test-AvdBenchmarkResult` (`AvdBenchmark.psm1`); `check_evidence.py` validates CI/issue-form submissions.
5. **MDE / `avd-swarm` alignment:** Lab pools carrying `avd-benchmark-pool=true` are explicitly scoped out of `avd-swarm`'s rogue-CUA watchdog ([cua-executor-spec.md](cua-executor-spec.md)) during approved benchmark windows.

---

## 6. Red team

Reviewed by a separate model pass (Fable, 2026-11-18) against `docs/benchmark-platform-spec.md`, `docs/build-or-adopt.md`, `docs/cua-executor-spec.md`, `avd-assess` (`benchmark-result.schema.json`, `check_evidence.py`, `wording.json`), `avd-benchmark` (`AvdBenchmark.psm1`, `benchmark-core.js`), `avd-landing-zone` (`main.bicep`, `controlPlane.bicep`, `sandbox-runs.md`), and `avd-ops` governance (`tests/site.test.mjs`, decisions `0006`, `0008`, `0011`, `0021`, `0022`). All 11 findings were folded into sections 1–5 above:

| # | Severity | Finding | Resolution Folded Into Spec |
|---|---|---|---|
| 1 | Critical | `C25` schema breakage (`additionalProperties: false` on `profile`/`metrics`, `extensions.generator` collision with `0021`, `multisession-density` corpus poisoning) | Dedicated `rpa-ui-responsiveness` profile, additive `C25` metrics (`appLaunchMs`, `windowReadyMs`, `actionLatencyMs`, `saveCloseMs`, `stepSuccessRatePct`), separate `extensions.rpa` namespace (§4). |
| 2 | Critical | Windows 11 24H2 inbox app removals (WordPad removed, MSIX Notepad alias/multi-tab, `explorer.exe` shell `Kill()` trap, Edge/Office modals) | Removed WordPad, forbade `Kill()` on `explorer.exe`, isolated Edge `--user-data-dir`, isolated Office into an explicit licensed profile, added deterministic Win32/WPF fixture (§3.1.3). |
| 3 | Critical | Broken Active Desktop Guard (`WTSActive` true on lock screen, scheduled tasks run `WTSDisconnected`, RDP minimize freeze, UIA idle-timer blind spot, `enablerdsaadauth:i:1`) | Required active client-driven RDP sessions + `RemoteDesktop_SuppressWhenMinimized=2`, `WTSINFOEX` + `OpenInputDesktop("Default")` check, scoped Entra lab auth (§3.1.1–2). |
| 4 | High | UIA COM RCW leaks, un-cancellable cross-process RPC deadlocks, `User Input Delay` blindness under `InvokePattern`, survivorship bias | Process-scoped `CacheRequest`s, Windows Job Object + out-of-process watchdog, bounded `SendInput` probes, warmup trim, censored timeouts (§3.1.4). |
| 5 | High | FSLogix VHDX profile bloat and locked handles from Edge/Playwright/caches in `%LOCALAPPDATA%` | Machine-local `%SystemDrive%\AvdBmTmp\<sessionId>` scratch outside FSLogix, Job Object cleanup before logoff (§3.1.5). |
| 6 | High | Cross-session privilege escalation / symlink attacks, `127.0.0.1` port squatting, unguarded `-Mode ExistingHostPool`, MDE/swarm rogue-CUA alerts | Unprivileged worker, `FILE_FLAG_OPEN_REPARSE_POINT` collector, `file://` SHA-256 fixtures, `avd-benchmark-pool=true` + zero-human-session gate (§5.3, §5.5). |
| 7 | High | `check_evidence.py` Python contradiction on host, exception reflection leaks of UPNs/titles, dotted-string regex rejection (`FlaUI.UIA3`) | `Test-AvdBenchmarkResult` on-host + `check_evidence.py` in CI, zero-reflection opaque step IDs, hyphenated `flaui-uia3` token in `C25` (§4, §5.4). |
| 8 | High | `startVmOnConnect=true` spend bypass in `ExistingHostPool`, unbound `-SandboxBatchApproval`, deallocate-only teardown leaving disks/NAT billing, M365 license meters | `startVmOnConnect` / `Deallocated` spend gate, `Approve-AvdSandboxBatch.ps1` + `Invoke-AvdSandboxDeadline.ps1` RG deletion, no automated M365 license provisioning (§5.1–2). |
| 9 | High | Hidden `pwsh`/`.NET 8`/Playwright image footprint and Cloud Shell (`0006`) orchestration gap | Target in-box `net48` + PowerShell 5.1, drop Playwright from guest image, Cloud Shell triggers ephemeral in-VNet Windows driver VM (§1.4, §2, §3.1.1). |
| 10 | Medium | Unsigned binary vs SmartScreen/ASR/WDAC and incomplete supply-chain pinning (`packages.lock.json`, `credits.json`, `0008`) | `packages.lock.json` (`RestoreLockedMode=true`), `actions/attest-build-provenance`, runtime SHA-256 check, `credits.json`/`avd-assess` registration, `0008` / lab WDAC policy (§2). |
| 11 | Medium | Banned commercial product names in prose (`tests/site.test.mjs`, `wording.json`) and missing MADR record | Replaced with category phrasing and added [decision 0027](knowledge/decisions/0027-open-source-rpa-workload-engine.md). |
