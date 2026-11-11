---
title: "avd-benchmark"
summary: "Active Tier 1 benchmark harness and interactive explorer: runs synthetic storage, logon storm, multi-session density, autoscale and BCDR profiles and validates C25 evidence"
topic: repos
status: verified
last_reviewed: 2026-11-11
---

# avd-benchmark

Active Tier 1 synthetic and control-plane benchmark harness and interactive benchmark explorer for Azure Virtual Desktop ([decision 0011](../decisions/0011-avd-benchmark-and-assess-corpus.md)).

<!-- more -->

It runs versioned synthetic and control-plane benchmark profiles (`storage-fslogix-io`, `host-logon-storm`, `multisession-density`, `control-plane-autoscale` and `bcdr-profile-recovery`) and hosts the browser-based Benchmark Explorer and `C25` evidence validator.

The repo is the source of truth: [avd-ops/avd-benchmark](https://github.com/avd-ops/avd-benchmark). This page says where it fits.

## What it does

It executes reproducible Tier 1 benchmark profiles and validates redacted `C25` (`avd-benchmark-result/v1`) evidence before anything touches disk.

<!-- more -->

- Runs PowerShell (`Invoke-AvdBenchmark.ps1`) and Bash (`scripts/run-benchmark.sh`) harnesses in `-Mode OfflineFixture` or `-Mode ExistingHostPool` by default, gating any billable cloud provisioning behind `-SandboxBatchApproval "go batch <id> $<total>"`.
- Enforces closed enums, public VM SKUs, banded sample counts (`1-2`, `3-9`, `10-25`, `26-100`, `100+`) and aggregate percentiles only (`p50`, `p90`, `p95`, `p99`), with a fail-closed leak scanner blocking GUIDs, UPNs, IPs and resource IDs.
- Ships an interactive static portal (`site/portal/`) to compare SKUs side by side, generate standalone Cloud Shell commands, and submit validated `C25` evidence.

## How it fits

It pairs with [avd-assess](avd-assess.md) (which owns the profile definitions and public corpus), [avd-current-state](avd-current-state.md) (passive Tier 2 control-plane telemetry), and [avd-remediate](avd-remediate.md) (host-level native telemetry collection).

<!-- more -->

- Reads benchmark profile definitions and experience gates from [avd-assess](avd-assess.md) and sizing priors from [avd-second-brain](avd-second-brain.md).
- Emits `C25` (`avd-benchmark-result/v1`) evidence that resolves untested observations in [avd-assess](avd-assess.md) and calibrates host-level diagnosis in [avd-remediate](avd-remediate.md).

## Read more in the repo

The repo has the full detail. Start here:

<!-- more -->

- [Benchmark Explorer & Runner Portal](https://avd-ops.github.io/avd-benchmark/portal/)
- [README and quick start](https://github.com/avd-ops/avd-benchmark/blob/main/README.md)
- [Benchmark platform specification](https://github.com/avd-ops/avd-ops/blob/main/docs/benchmark-platform-spec.md)
