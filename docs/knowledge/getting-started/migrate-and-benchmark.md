---
title: "Size with avd-migrate, benchmark with avd-benchmark, and check client networks"
summary: "Generate a single-pool target-state manifest offline with avd-migrate, run an offline or lab benchmark with avd-benchmark, and collect client network verdicts with avd-linecheck"
topic: getting-started
status: unverified
last_reviewed: 2026-11-20
---

# Size with avd-migrate, benchmark with avd-benchmark, and check client networks

Turn `avd-current-state` facts into a sized `.bicepparam` with `avd-migrate`, validate host performance with `avd-benchmark`, and measure end-user network paths with `avd-linecheck`.

<!-- more -->

All three tools can be tried at `$0` using offline fixtures or read-only browser checks ([working from Cloud Shell](cloud-shell.md)).

## 1. Size a single-pool baseline with `avd-migrate` ($0)

Feed `C11` current-state facts and `C19` estate intake answers into `ConvertTo-AvdTargetState.ps1` to emit a `C14` (`avd-target-state/v1`) manifest offline.

<!-- more -->

You can also use the zero-network browser portal at [migrate.avd-ops.dev](https://migrate.avd-ops.dev).

```powershell
if (-not (Test-Path ~/avd-migrate/.git)) { git clone https://github.com/avd-ops/avd-migrate.git ~/avd-migrate }
Set-Location ~/avd-migrate; git checkout -q main; git pull -q --ff-only
./ConvertTo-AvdTargetState.ps1 -CurrentStatePath ./samples/current-state-facts.json -IntakePath ./samples/intake.json -OutputDirectory ./out
```

## 2. Render `.bicepparam` for `avd-landing-zone` ($0)

Convert the `C14` manifest and approval file from `avd-migrate` into a `avd-landing-zone` parameter file before deploying.

<!-- more -->

Pass your target subscription ID and Entra group object IDs when rendering for a real lab deployment ([avd-migrate README](https://github.com/avd-ops/avd-migrate#readme)).

```powershell
if (-not (Test-Path ~/avd-landing-zone/.git)) { git clone https://github.com/avd-ops/avd-landing-zone.git ~/avd-landing-zone }
Set-Location ~/avd-landing-zone; git checkout -q master; git pull -q --ff-only
Get-Help ./scripts/ConvertFrom-AvdTargetState.ps1 -Detailed
```

## 3. Run an offline or lab benchmark with `avd-benchmark` ($0 offline)

Run Tier 1 synthetic benchmarks (`storage-fslogix-io`, `host-logon-storm`, `multisession-density`, `control-plane-autoscale`, `bcdr-profile-recovery`) to emit redacted `C25` (`avd-benchmark-result/v1`) evidence.

<!-- more -->

`-Mode OfflineFixture` runs at `$0` with no cloud calls; never run active synthetic load profiles against production session hosts, and use `-SandboxBatchApproval` for any costed lab batch ([avd-benchmark README](https://github.com/avd-ops/avd-benchmark#readme)).

```powershell
if (-not (Test-Path ~/avd-benchmark/.git)) { git clone https://github.com/avd-ops/avd-benchmark.git ~/avd-benchmark }
Set-Location ~/avd-benchmark; git checkout -q main; git pull -q --ff-only
pwsh -NoLogo -File ./Invoke-AvdBenchmark.ps1 -ProfileId multisession-density -WorkloadClass medium -VmSku Standard_E4s_v5 -Mode OfflineFixture -OutputPath ./out
```

## 4. Check end-user client networks with `avd-linecheck` ($0)

Have a user open the static browser check to measure regional RTT, jitter, download sufficiency, and proxy/tunnel caveats without sign-in or keys.

<!-- more -->

Open [avd-ops.app/linecheck/](https://avd-ops.app/linecheck/), run the one-button check, and share the redacted export bundle with `avd-remediate` or your helpdesk ([avd-linecheck](../repos/avd-linecheck.md)).
