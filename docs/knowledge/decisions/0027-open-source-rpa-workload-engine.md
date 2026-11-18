---
status: proposed
date: 2026-11-18
decision-makers: [owner]
---

# 0027. Adopt FlaUI (.NET Framework 4.8) for open-source RPA workloads in avd-benchmark

`avd-benchmark` adopts MIT-licensed FlaUI (`net48`) under the `in-session-uia` category token for sandboxed `rpa-ui-responsiveness` `C25` benchmarks.

## Context and Problem Statement

How should `avd-benchmark` simulate interactive Windows desktop UI workloads without proprietary VDI load-testing tools or golden-image bloat?

<!-- more -->

`avd-benchmark` currently uses native PowerShell background worker processes for `multisession-density` ([decision 0011](0011-avd-benchmark-and-assess-corpus.md)) and optionally ingests host-side PerfMon CSVs from EUC Score ([decision 0021](0021-euc-score-byo-output-adapter.md)). Background workers do not exercise real desktop window creation or UI Automation trees, while EUC Score's Community terms restrict commercial and >50-user environments. Running `python3 scripts/kb/prior_art.py "open source rpa workload benchmark"` found no existing family KB entry. What open-source GUI/RPA engine should `avd-benchmark` adopt for native, zero-EULA-restriction UI responsiveness benchmarking, and how should it fit `C25`?

## Considered Options

Six options were weighed.

- **Adopt FlaUI (`FlaUI.UIA3`, MIT) targeting in-box `.NET Framework 4.8` (`net48`)** as a NuGet-locked, CI-attested, SHA-256-verified multi-file bundle orchestrated by Windows PowerShell 5.1 against a self-contained open-source Win32/WPF fixture app in `SandboxBatch` mode, using category token `in-session-uia` in `C25` and keeping FlaUI attribution in `credits.json` and `avd-assess` references
- **Use in-box `.NET Framework` `UIAutomationClient` directly from Windows PowerShell 5.1** with zero external binaries, requiring custom COM retry/pattern and tree-walking wrappers
- **Build our own custom UIA COM wrapper** from scratch instead of adopting FlaUI
- **Adopt Playwright (Apache-2.0)** on guest session hosts, requiring `150–300 MB` runtime browser downloads incompatible with `defaultOutboundAccess: false`
- **Adopt pywinauto (BSD-3-Clause) or Robot Framework + `RPA.Windows` (Apache-2.0)**, requiring Python and pip dependencies on every session host
- **Adopt AutoIt or SikuliX** using pixel/coordinate matching, which is closed-source (AutoIt) or breaks across DPI and codec scaling

## Decision Outcome

Chosen option: **"Adopt FlaUI (`FlaUI.UIA3`, MIT) targeting in-box `.NET Framework 4.8` (`net48`)"**.

<!-- more -->

Why: FlaUI uses Microsoft UI Automation (`UIA3`) semantic locators (`AutomationId`, `Name`, `ControlType`) that survive DPI and resolution changes, targets the `.NET Framework 4.8` runtime already present on Windows 11 24H2 AVD images without installing Python or PowerShell 7, avoids writing and maintaining custom raw COM UIA wrappers, and carries a clean MIT license under [build or adopt](../../build-or-adopt.md).

### Consequences

- Good, because session hosts stay clean (no Python, Java, or Playwright binary downloads), `rpa-ui-responsiveness` results never mix into `multisession-density` in `avd-benchmark/site/portal/corpus.json`, and `C25` stays category-named (`in-session-uia`) without needing a naming exception like [decision 0021](0021-euc-score-byo-output-adapter.md).
- Good, because `C25` additions (`appLaunchMs`, `windowReadyMs`, `actionLatencyMs`, `saveCloseMs`, `stepSuccessRatePct`, `stepTimeoutRatePct`, `extensions.rpa`, and `source: "fixture"`) are additive for old records while keeping `avd-assess` in charge of profile and persona step definitions.
- Bad, because new `rpa-ui-responsiveness` records require a coordinated re-pin of all four `C25` consumers (`avd-assess`, `avd-benchmark`, `avd-current-state`, `avd-second-brain`) before emission, and v1 requires `SandboxBatch` mode with an external Windows driver VM, Key Vault-backed batch test accounts, Job Object watchdogs, and a pre-flight lab run.

## More Information

Related architecture, Fable red-team review, and CUA boundaries.

<!-- more -->

- Full architecture, driver VM, identity/secrets, Job Object containment, and the 18-finding Fable red-team review: [docs/rpa-workload-spec.md](../../rpa-workload-spec.md).
- Companion CUA governance boundary: [decision 0022](0022-cua-external-executor-plumbing.md).
