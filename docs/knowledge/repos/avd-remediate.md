---
title: "avd-remediate"
summary: "Troubleshooting, host-level telemetry collection and human-approved remediation workbench across all five control planes"
topic: repos
status: verified
last_reviewed: 2026-11-11
---

# avd-remediate

The troubleshooting, host-level telemetry collection, diagnosis and human-approved remediation workbench for Azure Virtual Desktop.

<!-- more -->

It combines a 5-step guided portal (`site/portal/`) in the `avd-ops` design system with a deterministic + redacted BYO-LLM troubleshooting assistant, read-only diagnostic probes (`rebuild/scope.json`), and human-gated remediation plans across all five control planes.

The repo is the source of truth: [avd-ops/avd-remediate](https://github.com/avd-ops/avd-remediate). This page says where it fits.

## What it does

It diagnoses session, FSLogix, host health, identity and control-plane issues, collects host-level event and performance telemetry, and never executes blind writes.

<!-- more -->

- Correlates `C11` facts, `C21` assessment checks, `C25` benchmark results and pasted or probed Windows Event Logs (`FSLogix-Apps/Operational`, `TerminalServices`) and host performance counters (`% Processor Time`, `Available MBytes`, `Current Disk Queue Length`, `User Input Delay`).
- Runs allowlisted read-only probes (`scripts/Invoke-AvdDiagnosticProbe.ps1`) and scrubs all tenant identifiers via `redact.js` before any optional BYO-LLM call or upstream KB draft.
- Produces three human-approved remediation outputs: Day-2 PowerShell/Bash fix blocks with preflight and rollback snapshots (Path A), plane-routed `C24` (`avd-remediation-plan/v1`) plans (Path B), and [avd-swarm](avd-swarm.md) plan handoff packages (Path C).

## How it fits

It keeps [avd-current-state](avd-current-state.md) strictly control-plane and `Reader`-only while handling host-level incident triage, native performance collection and human-approved remediation.

<!-- more -->

- Consumes pinned schemas and claims from [avd-assess](avd-assess.md), [avd-current-state](avd-current-state.md) and [avd-second-brain](avd-second-brain.md), and feeds native host-level telemetry into [avd-benchmark](avd-benchmark.md).
- Bridges `C24` remediation plans directly to [avd-landing-zone](avd-landing-zone.md) (`avd-entra`, `avd-intune`, `avd-m365`, `avd-azure`, `avd-power-platform`) and [avd-swarm](avd-swarm.md), while writing unredacted incident bundles only to an adopter's private companion vault (`--vault`).

## Read more in the repo

The repo has the full detail. Start here:

<!-- more -->

- [README and quick start](https://github.com/avd-ops/avd-remediate/blob/main/README.md)
- [Design specification](https://github.com/avd-ops/avd-remediate/blob/main/docs/spec.md)
- [Guardrails](https://github.com/avd-ops/avd-remediate/blob/main/docs/guardrails.md)
