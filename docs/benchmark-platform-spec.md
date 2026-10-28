# OpenBenchmarking-Style Benchmark Platform and `avd-assess` Content Roadmap

Status: proposed (2026-10-28, [decision 0011](knowledge/decisions/0011-avd-benchmark-and-assess-corpus.md)).

This specification defines:
1. **What is needed to flesh out `avd-assess` content-wise** so every claim, checklist item, observation, and baseline moves from `mapped` or `prior` to `measurable` and `validated`.
2. **How `avd-assess` and a new foundation sibling repo (`avd-benchmark`) form an OpenBenchmarking-style research and benchmark platform** while preserving [family roles](family-roles.md): `avd-assess` remains the map, dictionary, and public research corpus (never a tool), `avd-current-state` remains strictly read-only, and `avd-benchmark` houses the executable test harness and interactive benchmark explorer portal.

---

## 1. Content Roadmap: Fleshing Out `avd-assess`

Today, `avd-assess` (pinned in `avd-ops` at `cfcc302`) contains **110 pinned sources**, **447 claims**, **18 method pages**, **31 observations**, **44 gaps**, and **49 checks**. To complete its content foundation across all five control planes (`azure`, `entra`, `intune`, `m365`, `power-platform`), three content tracks are required.

### 1.1 Track A: Empirical Validation of the 15 `not-yet-tested` Observations and Sizing Priors

Fifteen of the 31 observations in `index.json` carry `"verdict": "not-yet-tested"`, and every sizing density and floor in `methods/targets-benchmarks.md` and `baselines.yaml` is still a Microsoft `prior` rather than measured evidence. Each requires a defined benchmark or sandbox run to turn its verdict into `agrees`, `extends`, or `disagrees`:

| Observation / Prior | Claim Tested | What Needs to Run | Target Contract / Evidence |
|---|---|---|---|
| `users-per-vcpu-adopted` | `ref:session-host-sizing#multisession-users-per-vcpu` | Multi-session workload benchmark across light (6/vCPU), medium (4/vCPU), heavy (2/vCPU), and power (1/vCPU) profiles measuring CPU, memory, and input delay | `C25` (`avd-benchmark-result/v1`) -> `baselines.yaml` |
| `sizing-floor-not-measured` | `ref:session-host-sizing#multisession-vcpu-range` | Compare 4-vCPU memory-optimized (`Standard_E4s_v5`) against 6-8 vCPU general-purpose (`Standard_D8s_v5`) to test whether shared hosts exhaust memory before CPU | `C25` (`avd-benchmark-result/v1`) |
| `premium-ssd-os-disk-default` | `ref:avd-deploy-host-pool#premium-ssd-os-disk` | Measure OS and FSLogix disk latency (p50/p95/p99) across Premium SSD, Ephemeral OS disk, and Standard SSD during logon storms | `C25` (`diskspd-fslogix` & `logon-storm` profiles) |
| `encryption-at-host-by-default` | `ref:disk-encryption-options#encryption-at-host` | A/B disk IOPS and CPU overhead test on identical VM SKUs with `encryptionAtHost` enabled vs disabled | `C25` (`diskspd-host` profile) |
| `defender-cache-maintenance-not-in-image` | `ref:defender-av-vdi#cache-maintenance-before-seal` | Measure CPU and sign-in duration on first 10 sessions of a newly sealed host with vs without Defender cache maintenance run pre-seal | `C25` (`logon-storm` profile) |
| `fslogix-exclusions-partial` | `ref:fslogix-prerequisites#exclusion-scope` | Measure VHDX attach latency and logon duration with partial vs full Defender FSLogix exclusions | `C25` (`logon-storm` profile) |
| `symmetric-nat-egress-means-turn` | `ref:rdp-shortpath#symmetric-nat-means-turn` | Verify `WVDConnections` transport (`TURN` vs direct `Shortpath`) and measure RTT overhead behind NAT Gateway vs public IP / STUN | `C25` + `WVDConnections` evidence |
| `transport-column-names-disagree` | `ref:configure-rdp-shortpath#verify-transport` | Query a live Log Analytics workspace after a sandbox session to settle `TransportType` vs `UdpUse` in `WVDConnections` | `C11` / KQL evidence |
| `private-endpoint-nsg-narrower-than-avd-needs` | `ref:avd-private-link#full-port-range` | Test private endpoint connection path with strict TCP 443 NSG vs TCP 1-65535 across public and private client paths | Sandbox validation run |
| `hub-route-without-avd-bypass` | `ref:firewall-avd#bypass-route-for-scale-in` | Test active session stability when routing `0.0.0.0/0` through a hub firewall without a `WindowsVirtualDesktop` service-tag bypass route | Sandbox validation run |
| `files-backup-key-access-off` | `ref:files-backup-support#key-access-needed` | Trigger an Azure Files snapshot and vaulted backup job with `allowSharedKeyAccess: false` and Private Endpoint enabled, then read job status | `C17` (`avd-recovery-run/v1`) |
| `recovery-tiers-not-yet-tested` | `ref:avd-multiregion-bcdr#rto-rpo-by-model` | Execute and time R0 (rebuild), R1 (restore anywhere), and R2 (warm standby) recovery drills against real profile shares | `C17` (`avd-recovery-run/v1`) |
| `power-role-at-resource-group-scope` | `ref:autoscale-plan#role-at-subscription` | Run autoscale ramp-up/down with the power management custom role scoped to the resource group rather than the subscription and inspect `WVDErrors` | Sandbox validation run |
| `agent-update-window-while-hosts-off` | `ref:avd-scheduled-agent-updates#hosts-on-during-window` | Observe scheduled agent update behavior across deallocated hosts over four maintenance windows | Sandbox / lab observation |
| `scaling-and-start-on-connect-by-default` & `run-cost-settles-late` | `ref:avd-autoscale#scales-to-save-cost`, `ref:cost-management-data#data-latency` | Record 72-hour cost settlement latency and compare scheduled scaling hours against 168h baseline (`C17` `avd-run-cost/v1`) | `C17` (`avd-run-cost/v1`) |

### 1.2 Track B: Closing `gap:checklist-mapping` (Review Checklist & APRL Coverage)

Today, `method.json` has **49 checks**, leaving most of the **447 mapped claims** with `"measurable": false` in `site/data/library.json` because no check in `method.json` evaluates them from built `fact-register.json` facts.
- **Map the remaining Microsoft AVD Review Checklist (`ref:review-checklists-avd`, IDs `A*` through `H*`) and APRL (`ref:aprl-desktop-virtualization`) items:**
  - Group every unmapped checklist item into one of three buckets in `gaps/checklist-mapping.md`:
    1. **Automatable from control-plane APIs (`azure`, `entra`, `intune`, `m365`, `power-platform`):** Add the corresponding C15 fact to `contracts/fact-register.json` and check to `method.json`.
    2. **Automatable from Log Analytics / AVD Insights (`gap:insights-facts`):** Add KQL-backed facts for connection reliability, logon duration percentiles, input delay percentiles, and FSLogix event rates.
    3. **Design / interview only (`gap:intake`, `gap:discovery`):** Map to structured C19 intake facts so the check evaluates deterministically once intake is answered.
- **Cross-link PSRule rule IDs:** Where `PSRule.Rules.Azure` checks the same Bicep property pre-deployment that `avd-current-state` checks post-deployment, record the PSRule ID on the check in `method.json`.

### 1.3 Track C: Concrete Data Tables and Schemas for the 44 Open Gaps

Several of the 44 files in `avd-assess/gaps/` describe proposed data structures that need to graduate into first-class schema-validated YAML/JSON artifacts in `avd-assess`:

1. **`gap:workload-benchmark` & `gap:baseline-profile` -> `benchmarks/profiles.yaml` and `baselines.yaml`:**
   - Formalize the benchmark test profiles (Section 3) and expand `baselines.yaml` to cover memory per user, disk IOPS/latency bands, logon time percentiles (`gap:logon-target`), and GPU frame/encoder bands (`gap:deployment-dimensions`).
2. **`gap:insights-facts` -> Log Analytics / Insights C11 facts:**
   - Promote KQL-derived telemetry facts in `contracts/fact-register.json` (`c11.insights.rttP50`, `c11.insights.rttP95`, `c11.insights.inputDelayP95`, `c11.insights.timeToConnectP95`, `c11.insights.fslogixReadIopsP95`, `c11.insights.connectionFailureRate`) from `specified` to `built`.
3. **`gap:endpoint-map` -> `endpoints.yaml`:**
   - One machine-readable map of every required AVD, Entra ID, Intune, and TURN/STUN endpoint, each row pinned to its Microsoft Learn source without copying prose, consumed at a pinned commit by `avd-linecheck`, `avd-current-state`, and `avd-landing-zone`.
4. **`gap:error-code-map` -> `error-codes.yaml`:**
   - Map `WVDErrors` symbolic and numeric codes, FSLogix status/reason codes, and Entra/Intune join failure codes to their triage method (`triage-cannot-connect`, `triage-slow-logon`, `triage-slow-session`, `triage-profile-failed`, `triage-host-unhealthy`) and owning control plane.
5. **`gap:use-cases` & `gap:use-case-library` -> `use-cases.yaml` & C19 Intake Schema:**
   - Add the anonymized persona record array to C19 (`intake.personas[]`) and wire `avd-current-state` checks to compare each persona's target density, SKU family, GPU need, and region against deployed host pools.
6. **`gap:tune-loop` -> C26 Tuning Record & Lever Map:**
   - Map every tunable host-pool and scaling-plan parameter in `avd-azure` / `avd-landing-zone` to the metric it moves and the before/after comparison window.

---

## 2. OpenBenchmarking Architecture: Repo Boundaries & Family Roles

[OpenBenchmarking.org](https://openbenchmarking.org/) and the Phoronix Test Suite (PTS) work by separating **two distinct concerns**:
- **The Test Harness (PTS):** An open-source runner that provisions a repeatable test profile, executes the workload, collects hardware/OS telemetry, and packages a standardized result file.
- **The Research Corpus (OpenBenchmarking.org):** A public repository of versioned test profile definitions, aggregated benchmark results across hardware/configurations, statistical distributions, and citable comparisons.

Under [family roles](family-roles.md), `avd-assess` is **never a tool** ("It holds no tools, runs no probe and calls nothing in Azure"), and `avd-current-state` is **strictly read-only** (enforced in CI by `tests/ReadOnlyGuard.Tests.ps1`). Therefore, the OpenBenchmarking model splits cleanly across the foundation repos:

| Role in the Benchmark Platform | Repo | What It Owns | What It Never Does |
|---|---|---|---|
| **Test Profile Catalog & Public Corpus** (the "OpenBenchmarking.org" data & paper layer) | [`avd-assess`](https://github.com/avd-ops/avd-assess) | `benchmarks/profiles.yaml` (versioned test profile definitions), `baselines.yaml` (priors + rolled-up empirical percentiles), `evidence/` (validated, redacted `C25` benchmark result files), and contract `C25` (`avd-benchmark-result/v1`, co-owned with `avd-second-brain`). | Never executes a workload, never deploys a VM, never calls Azure or Graph. |
| **Active Benchmark Harness & Interactive Explorer Portal** (the "Phoronix Test Suite" runner + comparison UI) | **`avd-benchmark`** *(new public foundation repo)* | PowerShell 7 / Bash harness that runs deterministic **Tier 1** synthetic and control-plane benchmark profiles against an existing lab host pool or an ephemeral sandbox batch, outputs redacted `C25` JSON, and hosts the interactive **Benchmark Explorer & Runner Portal** on GitHub Pages (`benchmark.avd-ops.dev` or `avd-ops.github.io/avd-benchmark/portal/`). | Never mutates production estates without an approved sandbox batch; never stores unredacted tenant/host identifiers; never depends on `avd-second-brain` or `avd-swarm`. |
| **Passive Telemetry Collector** (the **Tier 2** observational benchmark source) | [`avd-current-state`](https://github.com/avd-ops/avd-current-state) | Collects read-only 7-to-30-day AVD Insights and PerfMon distributions (`WVDConnections`, `WVDConnectionNetworkData`, `Perf`, `WVDAgentHealthStatus`) from real or lab estates and exports either a `C11` snapshot or an anonymized `C25` observational benchmark bundle. | Never injects synthetic load, never modifies a session host, never requests a write scope. |
| **Paper-Style Standards Library & Submission Routing** | [`avd-ops`](https://github.com/avd-ops/avd-ops) | Pins `avd-assess` at a commit and renders benchmark profiles, statistical tables, and `C25` citations inside [`avd-ops.dev/standards/`](https://avd-ops.dev/standards/); routes `baseline-evidence.yml` submissions to `avd-assess`. | Never keeps its own unpinned copy of a benchmark number. |

### Dependency Direction

Dependencies point strictly down and match [family roles](family-roles.md):
- `avd-benchmark` pins `benchmarks/profiles.yaml`, `baselines.yaml`, `contracts/benchmark-result.schema.json` (`C25`), and the aggregated corpus from `avd-assess` at a commit (`PINS.json`).
- When an operator wants an ephemeral test rig, `avd-benchmark` can invoke `avd-landing-zone` (or `avd-azure`) at a pinned commit under the family's **sandbox batch** rule (`go batch <id> $<total>`) and tear it down with evidence at the end of the run.
- Neither `avd-assess`, `avd-current-state`, `avd-landing-zone`, nor `avd-benchmark` depends on `avd-second-brain` or `avd-swarm`.

---

## 3. Two-Tier Benchmark Profiles (`benchmarks/profiles.yaml` in `avd-assess`)

Every benchmark in the family is defined declaratively in `avd-assess/benchmarks/profiles.yaml` with a semantic version (`id`, `version`, `tier`, `parameters`, `metrics`, `claimsTested`, `harness`). A result file (`C25`) is only comparable to another result file when both share the same `profile.id` and `profile.version` major number.

### 3.1 Tier 1: Active Synthetic & Control-Plane Benchmarks (run by `avd-benchmark`)

Under [build or adopt](build-or-adopt.md), `avd-benchmark` adopts best-in-class permissive open-source micro-benchmarks (pinned by commit/SHA256) and pairs them with native PowerShell 7 guest and control-plane probes—requiring zero proprietary load-testing appliances or closed-source VDI agents:

| Profile ID | What It Measures | Open-Source Tool / Probe | Claims & Observations Tested | Key Output Metrics (`C25`) |
|---|---|---|---|---|
| `storage-fslogix-io` | Profile share and local OS disk IOPS, throughput (MiB/s), and latency (p50/p95/p99) for VHDX mount, sequential logon read, and steady-state random 4K R/W | **Adopted:** [Microsoft `diskspd`](https://github.com/microsoft/diskspd) (MIT, pinned release + SHA256) + PowerShell VHDX mount timer | `obs:premium-ssd-os-disk-default`, `obs:encryption-at-host-by-default`, `obs:smb-channel-aes128-gcm-needed`, `ref:review-checklists-avd#H03.05` | `readIopsP50`, `readIopsP95`, `writeIopsP95`, `readLatencyMsP95`, `writeLatencyMsP99`, `vhdxAttachMsP95` |
| `host-logon-storm` | Concurrent or staggered session sign-in duration broken down by stage (broker, transport, Entra Kerberos auth, FSLogix profile attach, GPO/Catalog, shell ready) and host CPU/RAM spike | Native PowerShell session orchestrator + Windows Event Log (`Microsoft-Windows-TerminalServices-*`, `FSLogix-Apps/Operational`) + `WVDConnections` | `gap:logon-target`, `obs:defender-cache-maintenance-not-in-image`, `obs:fslogix-exclusions-partial`, `ref:session-host-sizing#logon-storm-headroom` | `timeToConnectMsP50`, `timeToConnectMsP95`, `profileLoadMsP95`, `peakCpuPct`, `availMemMiBMin` |
| `multisession-density` | Host utilization (CPU %, processor queue length, available memory MiB, disk queue, user input delay counter) under scripted multi-user processes for `light`, `medium`, `heavy`, and `power` personas | Native PowerShell multi-session worker processes (headless browser/DOM, document compression, file I/O, compute loops calibrated to class priors) + PerfMon (`User Input Delay per Session`, `\Processor(_Total)\% Processor Time`, `\System\Processor Queue Length`, `\Memory\Available MBytes`) | `obs:users-per-vcpu-adopted`, `obs:sizing-floor-not-measured`, `gap:workload-benchmark`, `gap:baseline-profile` | `maxPassingSessionsPerVcpu`, `cpuPctP50`, `cpuPctP95`, `pqlPerCoreP95`, `memoryPerSessionMiBP95`, `inputDelayMsP95` |
| `control-plane-autoscale` | Session host provisioning/boot time, Start VM on Connect wake latency, and scaling plan ramp-up/drain reaction time | Azure Resource Graph + `WVDConnections` + Activity Log / `WVDAgentHealthStatus` timer | `obs:power-role-at-resource-group-scope`, `obs:scaling-and-start-on-connect-by-default` | `coldBootToAvailableSecP95`, `startOnConnectWaitSecP95`, `drainToDeallocateSecP95` |
| `bcdr-profile-recovery` | Measured RTO and RPO for R0 (rebuild), R1 (restore anywhere), and R2 (warm standby) recovery drills, plus snapshot/vaulted backup verification | `avd-landing-zone` recovery drill scripts + Azure Backup job timer | `obs:recovery-tiers-not-yet-tested`, `obs:files-backup-key-access-off`, `ref:avd-multiregion-bcdr#rto-rpo-by-model` | `measuredRtoMinutes`, `measuredRpoMinutes`, `backupJobSuccess` |

### 3.2 Tier 2: Observational Telemetry Benchmarks (collected by `avd-current-state`)

Real estates cannot always run synthetic load tests, but their Log Analytics workspaces hold longitudinal evidence. `avd-current-state` runs a read-only KQL benchmark query (`Export-AvdBenchmarkEvidence.ps1`) over a minimum 7-day window (`ref:advisor-vm-rightsize#lookback`) during declared working hours (`intake.workingHours`) and emits a `C25` file with `"tier": "observational"`:
- Summarizes percentiles (`p50`, `p90`, `p95`, `p99`) for `WVDConnections` connect stages, `WVDConnectionNetworkData` RTT and bandwidth by transport (`Shortpath`, `TURN`, `Websocket`), and `Perf` counters (`User Input Delay`, CPU, available memory, disk latency) grouped by **public VM SKU** (`Standard_D8s_v5`, `Standard_E4s_v5`, etc.), **join type**, **storage SKU**, and **session density band**.

---

## 4. Contract C25: `avd-benchmark-result/v1` and the Evidence Pipeline

To ensure every benchmark run is reproducible, citable, and strictly free of tenant or customer identifiers, `avd-second-brain` and `avd-assess` define Contract **C25** (`contracts/benchmark-result.schema.json`).

### 4.1 Shape of a `C25` Benchmark Result

```json
{
  "schema": "avd-benchmark-result/v1",
  "id": "bm-20261028-multisession-density-e4sv5",
  "date": "2026-10-28",
  "source": "sandbox",
  "tier": "synthetic",
  "profile": {
    "id": "multisession-density",
    "version": "1.0.0",
    "workloadClass": "medium",
    "assessCommit": "cfcc3026b968c3c15a4150b8c7160891a138d3f0",
    "benchmarkCommit": "0123456789abcdef0123456789abcdef01234567"
  },
  "environment": {
    "vmSku": "Standard_E4s_v5",
    "vcpu": 4,
    "memoryGiB": 32,
    "osDiskType": "Premium_LRS",
    "ephemeralOsDisk": false,
    "encryptionAtHost": true,
    "trustedLaunch": true,
    "osImage": "win11-24h2-avd-m365",
    "wdotProfile": "avd-ops-reviewed-v1",
    "joinType": "entra-joined",
    "intuneEnrolled": true,
    "profileStorageSku": "Premium_ZRS",
    "profileAuth": "entra-kerberos",
    "smbChannelEncryption": "AES-128-GCM+AES-256-GCM",
    "networkEgress": "nat-gateway",
    "sampleHostsBand": "1-2",
    "sampleSessionsBand": "10-25",
    "windowHours": 2
  },
  "metrics": {
    "sessionsPerVcpuTested": 4.0,
    "cpuPct": { "p50": 58.2, "p90": 74.1, "p95": 78.6, "max": 86.0 },
    "pqlPerCore": { "p50": 0.4, "p90": 1.1, "p95": 1.4 },
    "availableMemoryMiB": { "p50": 11240, "p10": 8420, "min": 7680 },
    "memoryPerSessionMiB": { "p50": 1180, "p90": 1420, "p95": 1510 },
    "inputDelayMs": { "p50": 24, "p90": 52, "p95": 68, "p99": 94 }
  },
  "verdict": {
    "experienceGate": "pass",
    "claims": [
      {
        "claim": "ref:session-host-sizing#multisession-users-per-vcpu",
        "observation": "obs:users-per-vcpu-adopted",
        "verdict": "agrees"
      },
      {
        "claim": "ref:session-host-sizing#multisession-vcpu-range",
        "observation": "obs:sizing-floor-not-measured",
        "verdict": "extends"
      }
    ]
  }
}
```

### 4.2 Privacy and Redaction Guard (`check_evidence.py`)

Every `C25` file must pass `python3 scripts/check_evidence.py` in `avd-assess` before submission and in CI:
- **Closed enums and public SKUs only** in `environment.*` (no hostnames, subscription IDs, tenant IDs, resource group names, custom image names, IP addresses, or exact Azure region names when submitted from a private estate).
- **Banded sample sizes** (`1-2`, `3-9`, `10-25`, `26-100`, `100+`) so an estate's exact host or user count cannot fingerprint the organization.
- **Aggregate percentiles only** in `metrics.*` (never per-user or per-timestamp raw time series).

### 4.3 Submission and Corpus Aggregation Flow

1. **Run & Check:** An operator or researcher runs `avd-benchmark` (Tier 1) or `avd-current-state`'s benchmark exporter (Tier 2), producing a `C25` JSON file validated locally by `check_evidence.py`.
2. **Submit via GitHub Issue Form:** The submitter opens the existing **Baseline evidence** issue form (`submissions/forms/baseline-evidence.yml`, routed to `avd-assess` by `submissions/routing.json`).
3. **Maintainer Review & Merge:** Once reviewed and labeled `accepted` by the owner, a PR adds the file under `avd-assess/evidence/<profile-id>/<id>.json`, updates any linked observation in `observations/*.yaml` from `not-yet-tested` to `agrees` / `extends` / `disagrees`, and runs `scripts/build_benchmarks.py` in `avd-assess` to re-compute `benchmarks/corpus.json` (median of medians, interquartile ranges, and sample counts per SKU and configuration).

---

## 5. Two Reading & Interactive Surfaces: `avd-benchmark` Portal vs `avd-ops.dev/standards/`

To keep `avd-ops.dev/standards/` focused on paper-like reading and citation while giving operators an OpenBenchmarking-style interactive comparison tool, presentation splits across two static surfaces:

### 5.1 Interactive Benchmark Explorer & Runner Portal (`avd-benchmark` GitHub Pages)

Just as `avd-landing-zone` hosts the Deployment Portal (`deploy.avd-ops.dev/portal/`), `avd-current-state` hosts the Assessment Portal, and `avd-linecheck` hosts the Linecheck Portal (`linecheck.avd-ops.dev/`), **`avd-benchmark` hosts the Benchmark Portal** using the vendored `avd-ops` design system (`avd-ops.css`, `avd-ops-shell.css`, `avd-ops-portal.css`, `theme.js`):

1. **Compare Tab (OpenBenchmarking Explorer):**
   - Reads the pinned `benchmarks/corpus.json` and `benchmarks/profiles.yaml` from `avd-assess` (static JSON, zero runtime backend).
   - Lets researchers filter and compare side-by-side across:
     - **VM SKU & Architecture:** e.g., `Standard_D8s_v5` vs `Standard_E4s_v5` vs `Standard_D8as_v5` (AMD)
     - **Disk & Storage Config:** Premium SSD vs Ephemeral OS disk; `encryptionAtHost` on vs off; Azure Files Premium ZRS vs LRS
     - **Guest Optimizations:** WDOT profile on vs off; Defender pre-seal cache maintenance on vs off; FSLogix exclusion scope
   - Renders distribution bars (`p50` / `p90` / `p95`), sample counts (`n` runs), pass/fail against `baselines.yaml` experience gates, and one-click citation strings (`avd-assess@<commit>:evidence/<profile>/<id>.json`).
2. **Run Tab (Cloud Shell / Sandbox Command Builder):**
   - Lets the operator pick a Tier 1 benchmark profile (`storage-fslogix-io`, `host-logon-storm`, `multisession-density`, `control-plane-autoscale`, `bcdr-profile-recovery`), target an existing lab host pool or generate a priced sandbox batch (`concepts/sandbox-batches.md`), and copy a self-contained PowerShell or Bash command block.
3. **Submit Evidence Tab:**
   - Validates a local `C25` JSON file in the browser against `benchmark-result.schema.json` and leak regexes, then opens the prefilled `avd-assess` `baseline-evidence.yml` GitHub Issue Form via `vendor/avd-ops-submissions/links.mjs`.

### 5.2 Paper-Style Standards Library (`avd-ops.dev/standards/`)

When `avd-ops` bumps its `avd-assess` pin (`node scripts/site/build-standards.mjs --pin ../avd-assess`):
- `scripts/site/build-standards.mjs` reads `benchmarks/corpus.json` alongside `index.json` and `method.json`.
- Claim marks on `avd-ops.dev/standards/` automatically flip from `help wanted: not yet tested` to `✓ validated` once backed by a `C25` evidence file in `avd-assess`.
- `standards/how-to-cite.html` adds the citation form for a benchmark profile and a benchmark result (`avd-assess@<commit>:evidence/<profile>/<id>.json`).

---

## 6. Phased Rollout Plan

| Phase | Repo(s) | Deliverables | Verification |
|---|---|---|---|
| **Phase 1: Spec & MADR Decision (this PR)** | `avd-ops` | `docs/benchmark-platform-spec.md`, MADR [decision 0011](knowledge/decisions/0011-avd-benchmark-and-assess-corpus.md), updated KB indexes and generated `site/docs/`. | `py scripts/kb/build.py`, `py scripts/kb/validate.py`, `node scripts/site/build-docs.mjs`, `node --test "tests/*.test.mjs"` |
| **Phase 2: Contract C25, Benchmark Profiles & Core Gaps** | `avd-second-brain` & `avd-assess` | Add `C25` (`avd-benchmark-result/v1`) schema to `avd-second-brain` and `avd-assess`; add `benchmarks/profiles.yaml`, `endpoints.yaml` (`gap:endpoint-map`), and `error-codes.yaml` (`gap:error-code-map`) to `avd-assess`; expand `method.json` checklist mapping (`gap:checklist-mapping`) and KQL Insights facts (`gap:insights-facts`); update `scripts/check_evidence.py` and `scripts/build_benchmarks.py`. | `avd-assess` Python validators (`check_*.py`) and `avd-second-brain` contract tests |
| **Phase 3: Bootstrap `avd-benchmark` & Tier 2 Exporter** | `avd-benchmark` & `avd-current-state` | Stand up `avd-ops/avd-benchmark` with pinned `avd-assess` profiles, Tier 1 harnesses (`storage-fslogix-io`, `host-logon-storm`, `multisession-density`, `control-plane-autoscale`, `bcdr-profile-recovery`), Pester offline tests, and the static Benchmark Explorer Portal; add read-only Tier 2 Insights `C25` exporter to `avd-current-state`. | `avd-benchmark` Pester + Node portal tests; `avd-current-state` `ReadOnlyGuard.Tests.ps1` |
| **Phase 4: List `avd-benchmark` on `avd-ops.dev` & Run Initial Sandbox Batches** | `avd-ops` & `avd-benchmark` | Add `avd-benchmark` to `repos.json` and `docs/knowledge/repos/avd-benchmark.md`; pin updated `avd-assess` in `avd-ops`; queue priced sandbox batches (`go batch <id> $<total>`) to resolve the 15 `not-yet-tested` observations. | `tests/site.test.mjs`, `tests/standards.test.mjs`, and validated `C25` evidence in `avd-assess` |
