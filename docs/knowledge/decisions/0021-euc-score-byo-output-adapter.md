---
status: accepted
date: 2026-11-16
decision-makers: [owner]
---

# 0021. Allow EUC Score as a named BYO output-adapter provenance (`euc-score-byo`)

`avd-benchmark` records operator-supplied EUC Score telemetry CSVs as `euc-score-byo` under `C25` `extensions.generator`, with zero binaries bundled.

## Context and Problem Statement

Should EUC Score BYO outputs use generic category naming or an explicit named provenance token?

<!-- more -->

`avd-benchmark` uses native PowerShell 7 workers, PerfMon counters, and pinned MIT `diskspd` for Tier 1 benchmarks ([decision 0011](0011-avd-benchmark-and-assess-corpus.md)). Operators running public-result labs can also run [EUC Score](https://eucscore.com/freeware/) (`Simload Runner` to launch `Simloads` and configure `Telemetry.ini`, plus `Data Miner` for host-side PerfMon telemetry CSVs and SUT inventory) side by side. Under existing wording and portal rules (`avd-assess/tests/wording.json` and `avd-benchmark/tests/portal.test.mjs`), third-party products normally appear only as categories without implying integration.

## Considered Options

Two options were weighed.

- **Option A (category naming):** Use `external-persona-simulator` in `extensions.generator.kind` and `"External generator"` in the portal UI, naming EUC Score only in `README.md` prior-art text and `credits.json`.
- **Option B (named BYO provenance):** Allow `euc-score-byo` in `C25` `extensions.generator.kind` and `"EUC Score (BYO)"` in the portal Explorer, paired with an explicit non-affiliation notice, a `wording.json` exception in `avd-assess`, and a portal test exception in `avd-benchmark`.

## Decision Outcome

Chosen option: **"Option B (named BYO provenance)"**.

<!-- more -->

Why: crediting Dr. Tritsch IT Consulting's EUC Score methodology accurately and transparently in BYO calibration runs avoids hiding where a persona workload came from, while keeping strict technical and licensing boundaries intact:

- **Zero bundling or automation:** `avd-benchmark` never bundles, mirrors, downloads, or automates registration for `Simload Runner`, `Data Miner`, `Simloads`, `Avatar Telemetry Collector`, or `GetVideoAdapters.exe`.
- **Stay on `C25` `v1` via `extensions.generator`:** Provenance lives in `C25`'s `extensions.generator` namespace (`kind: "euc-score-byo"`, `persona`, `licenseSelfDeclared`, `exportSha256`) with a closed sub-schema, rather than adding `profile.*` fields or a `metrics.eex` object. Endpoint frame-grabber / `Sync Player` outputs are not exported CSV datasets and are excluded.
- **Host-side PerfMon CSVs only:** The BYO adapter reads only a single operator-supplied telemetry CSV paired with its `Telemetry.ini` (refusing `SysInfo` `.txt`, `.ref` event logs, inventory CSVs, and unrenamed `Telemetry_<Computername>_<Username>_...csv` filenames).
- **License boundary & EULA gate:** Under `eucscore.com` public terms (checked 2026-11-16), the free non-commercial Community Subscription covers producing EUC benchmarking content and sharing it publicly at no cost, whereas organizations with either more than 50 PCs or users, OR more than $1 million USD in annual revenues conducting tests for commercial or End-User Computing product-related purposes require a paid Enterprise Subscription. Until the EULA inside the EUC Score download ZIP is reviewed, `licenseSelfDeclared` accepts only `"community-public-results"`.

### Consequences

- Good, because native `avd-benchmark` runs and BYO EUC Score calibration runs can be compared side by side in `site/portal/` with clear provenance and accurate attribution.
- Good, because `avd-current-state` and `avd-landing-zone` stay completely free of EUC Score dependencies or templates.
- Bad, because `avd-assess/tests/wording.json` and `avd-benchmark/tests/portal.test.mjs` require an explicit allowlist entry for `euc-score-byo` / EUC Score attribution, and parser implementation remains gated on reviewing the download ZIP EULA and validating against a single lab/sandbox telemetry export.

## More Information

Related benchmark architecture, credits, and open-source boundaries.

<!-- more -->

- Builds on [decision 0011](0011-avd-benchmark-and-assess-corpus.md) and [docs/benchmark-platform-spec.md](../../benchmark-platform-spec.md).
- Credits entry: [credits.json](../../../credits.json).
