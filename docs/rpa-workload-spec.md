# Open-Source GUI/RPA Workload Engine Specification (`avd-benchmark`)

Status: proposed (2026-11-18, [decision 0027](knowledge/decisions/0027-open-source-rpa-workload-engine.md)). Remains `proposed` until the pre-flight sandbox run (section 3.2) succeeds.

`avd-benchmark` currently simulates multi-session density using background PowerShell worker processes (CPU, memory, disk I/O, and headless loops) paired with PerfMon counters ([benchmark-platform-spec.md](benchmark-platform-spec.md)), plus an optional BYO output adapter for EUC Score ([decision 0021](knowledge/decisions/0021-euc-score-byo-output-adapter.md)). It lacks an **open-source, deterministic, in-session GUI/RPA workload engine**—an open-source counterpart to commercial VDI synthetic workload products—capable of driving real Windows desktop windows inside active AVD sessions and measuring UI responsiveness without proprietary licenses or closed binaries.

### What Exists Today
In `avd-benchmark` today, `Invoke-AvdBenchmarkProfile` (`scripts/AvdBenchmark.psm1`) returns hard-coded sample arrays in all modes (`OfflineFixture` and `ExistingHostPool` both emit `source: "lab"`), with no live Azure, PerfMon, or session-query collector wired yet. Version 1 of this spec scopes to the **real collection path** in `SandboxBatch` mode, requires the first `C25` record to come from a recorded sandbox run, and adds a distinct `source: "fixture"` marker for `OfflineFixture` runs that `check_evidence.py` and the portal reject from `site/portal/corpus.json`.

---

## 1. Goals and Non-Goals

### Goals
1. **Open-source parity for GUI workloads:** Drive real Windows desktop windows inside active AVD user sessions using semantic UI Automation locators (not brittle pixel coordinates).
2. **UI-level latency telemetry:** Measure step-level timings (`appLaunchMs`, `windowReadyMs`, `actionLatencyMs`, `saveCloseMs`) at `p50`/`p90`/`p95`/`p99` over completed steps, paired with `stepSuccessRatePct`, `stepTimeoutRatePct`, step sample count `n`, Windows `User Input Delay per Session`, and host PerfMon counters.
3. **Zero proprietary dependencies:** Run entirely on permissive open-source components (MIT / Apache-2.0) pinned by lockfile, attested in CI, and verified by SHA-256 manifest before execution.
4. **Zero golden-image bloat:** Target in-box `.NET Framework 4.8` (`net48`) and Windows PowerShell 5.1 on the session host—requiring no Python, Java, PowerShell 7, or browser runtime downloads on the image.
5. **Strict `C25` privacy:** Emit only redacted, banded `avd-benchmark-result/v1` (`C25`) JSON—never screenshots, window titles, usernames, hostnames, or raw event streams.

### Non-Goals
1. **Not an AI / CUA agent:** This engine executes deterministic, pre-authored workload scripts for benchmarking. Arbitrary or LLM-driven desktop control belongs to [cua-executor-spec.md](cua-executor-spec.md) (`avd-swarm` `external-executor`).
2. **Not a protocol emulator:** `avd-benchmark` does not emulate any vendor's remoting protocol; it uses standard Microsoft Remote Desktop clients from an external driver VM and runs the RPA worker inside the resulting active Windows session.
3. **Not for `ExistingHostPool` in v1:** Version 1 runs **only** in `SandboxBatch` mode (plus `OfflineFixture` for CI unit tests, tagged `source: "fixture"` and rejected from `corpus.json`). `ExistingHostPool` is excluded in v1 so every real run has a written cost estimate, a hash-bound `approval.json`, and an armed deadline deletion.
4. **Not a replacement for `euc-score-byo`:** Operators in public-result labs can still use EUC Score BYO CSV ingestion ([decision 0021](knowledge/decisions/0021-euc-score-byo-output-adapter.md)).

---

## 2. Build or Adopt Analysis (`build-or-adopt.md`)

Per [build-or-adopt.md](build-or-adopt.md), `python3 scripts/kb/prior_art.py "open source rpa workload benchmark"` was run (finding no existing family KB entry). Candidate engines were evaluated against four criteria: permissive license, semantic UI locators, in-box session-host runtime compatibility, and deterministic timing support:

| Candidate | License | Locator Model | Host Footprint | Outcome |
|---|---|---|---|---|
| **[FlaUI](https://github.com/FlaUI/FlaUI)** (`FlaUI.UIA3`) | MIT | Microsoft UI Automation (`UIA3`/`UIA2`) by `AutomationId`, `Name`, `ControlType` | Targets in-box `.NET Framework 4.8` (`net48`); delivered as a SHA-256-verified multi-file manifest | **Adopted** as the in-session UIA engine (`in-session-uia` category). |
| **In-box `.NET` `UIAutomationClient` (PS 5.1)** | OS-included | Raw COM `UIA` | Zero external binaries | **Not adopted** (lacks ergonomic retry/pattern wrappers and structured tree helpers; would require building and maintaining equivalent COM wrapper code). |
| **Build our own COM wrapper** | MIT | Custom UIA wrapper | High maintenance burden | **Not adopted** (FlaUI already provides MIT-licensed UIA3 wrappers). |
| **Playwright** | Apache-2.0 | DOM / Accessibility | Downloads `150–300 MB` browser binaries + driver | **Rejected** (violates zero image bloat and `defaultOutboundAccess: false` egress rules). |
| **pywinauto / Robot Framework** | BSD-3 / Apache-2.0 | Win32 / UIA | Requires Python + pip packages on every session host | **Not adopted** (adds Python runtime to golden image). |
| **SikuliX / AutoIt** | MIT / Proprietary | Pixel/image/coordinates | Java or closed-source binary | **Rejected** (AutoIt is closed-source; pixel locators break on DPI/codec scaling). |

### Supply-Chain and Binary Delivery
- **Package restoration & attestation:** Packages are restored from NuGet using `packages.lock.json` (`RestoreLockedMode=true`, content hashes verified) and built in a new `avd-benchmark` GitHub Actions build/release workflow using `actions/attest-build-provenance`. (Because `net48` does not support single-file publish, the release ships a manifest listing every `.exe`/`.dll` and its SHA-256 hash, including `Interop.UIAutomationClient`.)
- **Delivery & runtime verification:** Attestation is verified off-host before the batch `test` step delivers the verified bundle to an administrator-only path (`%ProgramFiles%\AvdBenchmark\`). A mandatory open-then-hash-then-run check verifies every file in the manifest before execution (and `Test-AvdDiskSpdBinary`'s production allowlist removes its zero-byte test stub, injecting it in unit tests only).
- **Application control:** Sandbox pools use a batch-scoped, hash-based WDAC/Defender allow rule removed by batch teardown. Pools enforcing standing third-party application control are out of scope until [decision 0008](knowledge/decisions/0008-code-signing.md) is extended to sign this artifact.
- **Attribution:** Register the pinned FlaUI release and license in `avd-ops/credits.json` and `avd-assess` references; keep the `C25` record and `avd-assess` `harness:` line category-based (`in-session-uia`).

---

## 3. Architecture and Repo Boundaries

Dependencies follow [family-roles.md](family-roles.md) strictly downward:

| Component | Owner Repo | Responsibility |
|---|---|---|
| **Profile, Personas & Schema** | `avd-assess` | Defines `rpa-ui-responsiveness` and the persona step lists (application category, step IDs, pacing) in `benchmarks/profiles.yaml`, adds gap/claim entries, and validates `C25` output in `scripts/check_evidence.py`. |
| **RPA Worker, Driver VM & Harness** | `avd-benchmark` | Builds `AvdBenchmark.RpaWorker.exe` (`net48`, FlaUI) and the v1 self-contained Win32/WPF fixture app; ships the driver VM deployment template (deployed from the batch item into the batch RG); runs Windows PowerShell 5.1 guest collection (`Invoke-AvdRpaWorkload.ps1`); and assembles/validates `C25` off-host in PowerShell 7. |
| **Lab Host Pool** | `avd-landing-zone` | Provisions the ephemeral lab host pool under an approved sandbox batch (`approval.json`), with zero dependency on `avd-benchmark` and no benchmark-only VM templates added to `avd-landing-zone`. |
| **Read-Only Telemetry** | `avd-current-state` | Unchanged; never injects synthetic load or runs RPA workers. |

### 3.1 Driver VM and Cloud Shell Execution (`decision 0006`)
- **Driver VM:** Deployed by the batch item from `avd-benchmark` into the **same** sandbox batch resource group (matching `avd-landing-zone`'s deadline RG naming pattern). Sized explicitly for decoding `N` concurrent sessions.
- **Interactive Driver Session:** Configured for automatic console sign-in of a local, randomly generated password account (password generated on-VM, never leaves the VM) with `RemoteDesktop_SuppressWhenMinimized = 2` (for `mstsc`/RDC; Windows App applicability to be verified in pre-flight) and screen-lock/screensaver disabled on the driver during the batch.
- **Start, Poll, Collect (No Blocking Run Command):** Cloud Shell cannot launch RDP clients, and Azure VM Run Command runs non-interactively as `SYSTEM` (90-minute cap) and cannot display windows. Instead, Cloud Shell triggers a short Run Command that registers/starts a **scheduled task inside the driver's interactive console session** and returns immediately. Cloud Shell polls a status file and collects outputs when complete—making the `test` step safe across Cloud Shell's ~20-minute idle timeout and `-Resume`.

### 3.2 Identity and Secrets
1. **Batch-scoped test accounts:** The owner runs a pre-batch setup script that creates `N` dedicated lab test accounts with random passwords written directly into a Key Vault inside the batch RG. The driver VM's managed identity reads those secrets at launch; no password appears in chat, git, or CLI arguments.
2. **Conditional Access & SSO consent:**
   - **SSO consent prompt (one-time owner prerequisite):** Because `enablerdsaadauth:i:1` prompts for host consent on new ephemeral hosts (up to 15 hosts / 30 days), the owner runs a documented one-time tenant prerequisite adding the lab host device group to the SSO service principal (with documented undo steps).
   - **CA/MFA exclusion:** Scoped to a batch-created security group containing only the `N` test accounts and conditioned on the driver VM's egress IP.
3. **Teardown verification:** Batch teardown deletes the `N` test accounts, the batch security group, and the Key Vault/RG, and **verifies via a directory read that the accounts and group are gone** before the batch closes clean.

### 3.3 Session Mechanics, Containment, and Scratch Isolation
1. **V1 Application Scope:** Version 1 runs **only the self-contained open-source Win32/WPF fixture application** (typing, scrolling, file save/open, UI control tree latency). In-box Edge and MSIX Notepad are deferred to v2 until a pre-flight run proves window correlation and Job Object containment across system-brokered hand-offs.
2. **Pre-Flight Gate:** Before any density batch is priced or run, a 1-account, 1-session, 1-step end-to-end pre-flight run must verify: driver auto-logon, SSO sign-in, `OpenInputDesktop` behavior on lock/disconnect, `SendInput` vs RD idle timers, and `User Input Delay per Session` registration.
3. **Unlocked Interactive Desktop Guard:** Before every iteration, the worker checks `WTSINFOEX` (`SessionFlags` lock state) **and** `OpenInputDesktop` / `GetUserObjectInformation(UOI_NAME) == "Default"` (treating any access-denied error or `"Winlogon"` as not ready). On Entra SSO lock/disconnect, the driver reconnects or drops the session, and all samples from the last good check to the disconnect are discarded and counted.
4. **Job Object Containment & Watchdog:**
   - Only the **fixture application processes** are placed inside a `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` Windows Job Object.
   - `AvdBenchmark.RpaWorker.exe` and a lightweight per-session supervisor remain **outside** the Job Object. If a cross-process UIA COM call hangs past the step timeout, the supervisor closes the Job Object (hard-killing the hung fixture app), records the timeout, waits for handle release, deletes the session scratch folder, and fails closed if any file remains.
   - All UIA queries are process-scoped (`CacheRequest` + explicit COM RCW cleanup + periodic worker recycling; no root-desktop tree walks). UIA steps are paired with bounded Win32 `SendInput` probes so `User Input Delay per Session` measures real input-queue latency.
5. **Single Scratch Root & Reparse-Safe Collection:**
   - All scratch data lives in **one** machine-local path outside FSLogix containers: `%SystemDrive%\AvdBmTmp`.
   - An elevated setup step creates `%SystemDrive%\AvdBmTmp` with an explicit non-inherited ACL (`Administrators` and `SYSTEM` Full; `Users` no access), then creates each session's subfolder with a random name ACL'd solely to that session user's SID (passed to the worker; never derived from session ID).
   - `AvdBenchmark.RpaWorker.exe` runs unprivileged (`VM User Login`). An elevated `SYSTEM` scheduled task collects session aggregates before sign-out by opening handles with `FILE_FLAG_OPEN_REPARSE_POINT`, verifying final path, owner SID, file type, and size cap, parsing only fixed-shape numeric records, deleting the session folders, and verifying `%SystemDrive%\AvdBmTmp` is empty.

---

## 4. Contract `C25` Integration and Rollout

### 4.1 Schema Changes (`avd-benchmark-result/v1`)
This change is **additive for old records** (existing `C25` files remain valid), **but new `rpa-ui-responsiveness` records will be rejected by every consumer until all pinned repos are updated.**

- `profile.id`: Add `"rpa-ui-responsiveness"` (dedicated profile; never mixed with `multisession-density`). Move `manifestCommit` (40-hex SHA of the persona manifest) into `profile` beside `benchmarkCommit` so comparability fields stay out of `extensions`.
- `metrics`: Add optional `$defs/distribution` fields (`appLaunchMs`, `windowReadyMs`, `actionLatencyMs`, `saveCloseMs`) each carrying step sample count `n` alongside `p50`/`p90`/`p95`/`p99`, plus `stepSuccessRatePct` (`0..100`) and `stepTimeoutRatePct` (`0..100`).
  - **Censoring rule:** Percentiles are computed over **completed steps only**. Any percentile whose tail is exceeded by `stepTimeoutRatePct` (e.g., `p99` when `stepTimeoutRatePct > 1%`, `p95` when `> 5%`) is omitted rather than filled with the timeout constant.
  - **Denominator rule:** `stepSuccessRatePct = completed / attempted` and `stepTimeoutRatePct = timedOut / attempted`; steps skipped after an iteration abort are counted as `notAttempted` (reported separately, not in `attempted`).
  - **Comparability note:** Host counters (`cpuPct`, `pqlPerCore`, `memoryPerSessionMiB`) include the RPA worker's own footprint and are not directly comparable to `multisession-density`.
- `verdict`: `verdict.experienceGate` gates **only** on the existing `inputDelayMs` rule in v1; step latencies are reported without a pass/fail verdict until empirical baselines exist. `verdict.claims` cites `gap:workload-benchmark` and a new UI step-latency gap row in `avd-assess`.
- `extensions.rpa`: Add a typed sub-schema in `benchmark-result.schema.json` with `additionalProperties: false` (`engine: "in-session-uia"`, strict semver `version`) and close `extensions.generator` in the same schema so `check_evidence.py` rejects unknown keys under `extensions`.

### 4.2 Required Six-Site Rollout Order
1. **`avd-assess` schema & profile PR:** Update `contracts/schemas/benchmark-result.schema.json` (profile enum, `metrics`, `extensions.rpa`, `extensions.generator`), `benchmarks/profiles.yaml`, `scripts/check_evidence.py` (reject unknown `extensions` keys and `source: "fixture"`), `tests/check_baselines.py` fixtures, and `gaps/`.
2. **`avd-assess` release:** Owner-approved release with `NOT-BREAKING:` summary and `tools/diff_bundle.py` output.
3. **Consumer pin bumps:** Update `PINS.json` and validators in `avd-benchmark` (`AvdBenchmark.psm1` `$AllowedProfiles` / `ValidateSet`, `Invoke-AvdBenchmark.ps1` `ValidateSet`, `site/portal/benchmark-core.js` `ALLOWED_PROFILES` / `extractDistributionBars`, `site/portal/corpus.json`), `avd-current-state`, and `avd-second-brain`.
4. **First real record:** Only after all four repos re-pin may the first `rpa-ui-responsiveness` `C25` record be emitted.

---

## 5. Safety, Privacy, and Cost Guardrails

1. **Off-host `C25` validation:** Session hosts emit only redacted numeric per-session aggregates (checked against a small aggregate schema on arrival off-host). Full `C25` assembly and `Test-AvdBenchmarkResult` (`AvdBenchmark.psm1`, `#requires -Version 7.2`) run off-host in PowerShell 7; `check_evidence.py` gates CI and submissions.
2. **Zero-reflection error handling:** `AvdBenchmark.RpaWorker.exe` logs only opaque step IDs and sanitized `AutomationId`/`ControlType` tokens—never window titles, file paths, UPNs, or raw UIA trees.
3. **Sandbox batch & deadline RG deletion (`never-leave-the-meter-running.md`):** Every real run uses an `avd-landing-zone` sandbox batch verified via `Approve-AvdSandboxBatch.ps1` (`approval.json` hash check, not a free-text CLI string). Teardown copies `keep` paths first and passes `-DiscardLastCopy` to `Invoke-AvdSandboxDeadline.ps1` so the entire RG (session hosts, disks, NAT Gateway, Key Vault, and driver VM) is **deleted**, not merely deallocated.
4. **No `avd-swarm` coupling:** `avd-benchmark` has zero dependency on `avd-swarm`, and no pool tag suppresses any detection. Benchmark runs are identifiable solely from their approved sandbox batch record.
5. **Minimal-Run Cost Shape (pre-pricing checklist for first batch):**
   - **Compute & storage:** 1 Windows driver VM + 1 AVD session host (measurement window + warmup) + OS disks + FSLogix `Premium_ZRS` share + NAT Gateway.
   - **Identity & secrets:** `N` batch-scoped Entra test accounts + 1 security group + 1 Key Vault (all deleted in teardown).
   - **Recurring non-teardown items:** AVD / Windows Client license entitlement for the `N` test accounts (cannot be auto-provisioned or auto-cancelled by teardown; must be pre-existing lab entitlements).

---

## 6. Review History

### Second-Pass Review (Fable in Claude, 2026-11-18)
Cross-checked against `avd-assess` (`064607c`), `avd-benchmark` (`8ca5347`), `avd-landing-zone` (`4c5850a`), `avd-swarm` (`a6fb30e`), `avd-second-brain`, `avd-current-state`, and Microsoft Learn. All 18 findings (F1–F18) and the owner's 10 design decisions ("go with your recs") are folded into sections 1–5 above:
- **F1–F2:** Added §3.1 (Driver VM, interactive console session, start/poll/collect) and §3.2 (Key Vault test-account passwords, one-time SSO consent prereq, batch CA/MFA group, verified directory teardown).
- **F3:** Moved `C25` assembly and `Test-AvdBenchmarkResult` (PS 7.2) off-host (§5.1).
- **F4–F6:** Fixed "additive for old records" framing, documented the 6-site rollout order (§4.2), closed `extensions.rpa`/`extensions.generator` in `benchmark-result.schema.json` (§4.1), added censoring/denominator/sample-count/`n` rules, and scoped `experienceGate` to `inputDelayMs` (§4.1).
- **F7:** Removed `%LOCALAPPDATA%` contradiction; single admin-ACL'd `%SystemDrive%\AvdBmTmp` with random per-SID subfolders and handle-verified `SYSTEM` collection (§3.3.5).
- **F8:** Removed non-existent `avd-swarm` watchdog exclusion and pool-tag trust anchor (§5.4).
- **F9:** Dropped `ExistingHostPool` in v1; gated on `approval.json` hash + `-DiscardLastCopy` deadline deletion (§1.3, §5.3).
- **F10:** Fixed NuGet lockfile + multi-file manifest + CI attestation + mandatory hash-verified delivery + sandbox-only hash allow rule (§2).
- **F11–F12:** Added Entra SSO disconnect handling (§3.3.3) and scoped v1 to the self-contained fixture app inside `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` with out-of-job supervisor (§3.3.1, §3.3.4).
- **F13–F18:** Added "What Exists Today" + `source: "fixture"` rejection, moved persona step lists to `avd-assess`, moved driver VM template to `avd-benchmark`, switched `C25` engine token to `in-session-uia`, added minimal-run cost checklist (§5.5), aligned ADR 0027, and replaced protocol brand names with category phrasing.

### Remaining Unverified Items for Pre-Flight
1. Default ACL on `%SystemDrive%` root in marketplace `win11-24h2-avd-m365`.
2. `OpenInputDesktop` return value (access denied vs desktop name) for an unprivileged process when locked/disconnected.
3. Whether `RemoteDesktop_SuppressWhenMinimized` applies to Windows App / AVD Desktop Client in addition to `mstsc`.
4. Whether in-session `SendInput` resets RD idle session limits and registers in `User Input Delay per Session`.
5. `FlaUI` latest release, target frameworks, and `Interop.UIAutomationClient` transitive license details when populating `packages.lock.json` and `credits.json`.
