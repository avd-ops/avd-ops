---
status: proposed
date: 2026-10-28
decision-makers: [owner]
---

# 0011. Split the benchmark platform between avd-assess (profiles and corpus) and avd-benchmark (harness and explorer)

avd-assess owns benchmark profile definitions, schemas and the public evidence corpus; a new foundation repo, avd-benchmark, runs the active test harness and hosts the interactive benchmark explorer.

## Context and Problem Statement

How should the project turn its assessment baselines and untested observations into an OpenBenchmarking-style research platform without violating repo boundaries?

<!-- more -->

`avd-assess` holds 15 `not-yet-tested` observations, 44 open methodology gaps and sizing numbers that are still Microsoft priors rather than measured evidence. Turning `avd-assess` into a reproducible benchmark platform like OpenBenchmarking.org requires both a public corpus of versioned test profiles and statistical results, and an executable test harness that runs synthetic storage, logon storm, multi-session density and control-plane benchmarks. Under [family roles](../../family-roles.md), `avd-assess` is the map and the dictionary (never a tool), and `avd-current-state` is strictly read-only (`tests/ReadOnlyGuard.Tests.ps1`). Where should the benchmark definitions, results corpus, executable harness and comparison UI live?

## Considered Options

Three options were weighed.

- Split the platform across `avd-assess` (profiles and corpus), `avd-benchmark` (harness and explorer), and `avd-current-state` (passive telemetry)
- Put the synthetic benchmark harness inside `avd-current-state` or `avd-landing-zone` alongside existing collector or deployment scripts
- Put both the benchmark definitions/corpus and the executable test harness in a single standalone `avd-benchmark` repo outside `avd-assess`

## Decision Outcome

Chosen option: "Split the platform across `avd-assess` (profiles and corpus), `avd-benchmark` (harness and explorer), and `avd-current-state` (passive telemetry)".

<!-- more -->

Why: this matches Phoronix Test Suite (the executable harness) and OpenBenchmarking.org (the public profile catalog and results corpus) while keeping every foundation repo's boundary intact. `avd-assess` stays a pure research index and corpus that never calls Azure or runs a probe; `avd-current-state` keeps its air-tight read-only posture and CI AST guard; and `avd-benchmark` isolates active guest and control-plane load generation behind explicit sandbox batch approvals (`go batch <id> $<total>`).

- **Two-tier benchmark model defined in `avd-assess` (`benchmarks/profiles.yaml`):**
  - **Tier 1 (active synthetic and control-plane probes, run by `avd-benchmark`):** Adopts MIT-licensed open-source micro-benchmarks (such as Microsoft `diskspd` pinned by SHA256 for FSLogix and OS disk I/O) alongside native PowerShell 7 harnesses for logon storms (`WVDConnections` + event logs), multi-session user density (`User Input Delay`, CPU, processor queue length, memory per session), autoscale/boot timings, and BCDR profile recovery RTO/RPO.
  - **Tier 2 (passive observational telemetry, exported by `avd-current-state`):** Read-only KQL queries over 7-to-30-day AVD Insights and PerfMon tables summarizing real-estate percentiles grouped by public VM SKU, join type, storage tier and session density band.
- **Versioned Benchmark Result Contract (`C25`, `avd-benchmark-result/v1`):** Co-owned by `avd-second-brain` and `avd-assess`, enforcing closed enums, public SKU names, banded sample counts (`1-2`, `3-9`, `10-25`, `26-100`, `100+`) and aggregate percentiles only (`p50`, `p90`, `p95`, `p99`). Validated by `scripts/check_evidence.py` and submitted through the shared `baseline-evidence.yml` GitHub Issue Form ([decision 0004](0004-submissions-are-github-issue-forms.md)).
- **Interactive Explorer in `avd-benchmark`, paper citations in `avd-ops.dev/standards/`:** `avd-benchmark` hosts an interactive GitHub Pages portal (using the vendored `avd-ops` design system) for side-by-side SKU/configuration comparison, Cloud Shell command generation and browser-side `C25` validation, while `avd-ops.dev/standards/` renders the pinned paper-style tables, citations and `validated` claim marks.

### Consequences

- Good, because `avd-assess` stays a zero-credential research index and corpus while gaining empirical `C25` evidence to resolve its 15 `not-yet-tested` observations and replace sizing priors with measured distributions.
- Good, because `avd-current-state` keeps its strict read-only guarantee and still contributes Tier 2 observational benchmarks from live estates.
- Bad, because adding `avd-benchmark` introduces one more public repo to bootstrap, pin and check in `family.yml`.

## More Information

Full specification, content roadmap for `avd-assess`, and four-phase rollout plan.

<!-- more -->

- Full specification: [docs/benchmark-platform-spec.md](../../benchmark-platform-spec.md).
- Builds on [family roles](../../family-roles.md), [build or adopt](../../build-or-adopt.md), and [decision 0004](0004-submissions-are-github-issue-forms.md).
