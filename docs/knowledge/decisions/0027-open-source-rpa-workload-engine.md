---
status: proposed
date: 2026-11-18
decision-makers: [owner]
---

# 0027. Adopt FlaUI (.NET Framework 4.8) for open-source RPA workloads in avd-benchmark

`avd-benchmark` adopts MIT-licensed FlaUI (`FlaUI.UIA3` targeting in-box `.NET Framework 4.8`) for deterministic in-session GUI workloads under a dedicated `rpa-ui-responsiveness` `C25` profile.

## Context and Problem Statement

How should `avd-benchmark` simulate interactive Windows desktop UI workloads without proprietary VDI load-testing tools or golden-image bloat?

<!-- more -->

`avd-benchmark` currently uses native PowerShell background worker processes for `multisession-density` ([decision 0011](0011-avd-benchmark-and-assess-corpus.md)) and optionally ingests host-side PerfMon CSVs from EUC Score ([decision 0021](0021-euc-score-byo-output-adapter.md)). Background workers do not exercise real desktop window creation or UI Automation trees, while EUC Score's Community terms restrict commercial and >50-user environments. What open-source GUI/RPA engine should `avd-benchmark` adopt for native, zero-EULA-restriction UI responsiveness benchmarking, and how does it fit `C25`?

## Considered Options

Four options were weighed.

- **Adopt FlaUI (`FlaUI.UIA3`, MIT) targeting in-box `.NET Framework 4.8` (`net48`)** as a SHA-256-verified worker binary orchestrated by Windows PowerShell 5.1 under a dedicated `rpa-ui-responsiveness` `C25` profile
- **Adopt pywinauto (BSD-3-Clause) or Robot Framework + `RPA.Windows` (Apache-2.0)**, requiring Python and pip dependencies on every session host
- **Adopt Playwright (Apache-2.0)** on guest session hosts, requiring `150–300 MB` runtime browser downloads incompatible with `defaultOutboundAccess: false`
- **Adopt AutoIt or SikuliX** using pixel/coordinate matching, which is closed-source (AutoIt) or breaks across DPI and codec scaling

## Decision Outcome

Chosen option: **"Adopt FlaUI (`FlaUI.UIA3`, MIT) targeting in-box `.NET Framework 4.8` (`net48`)"**.

<!-- more -->

Why: FlaUI uses Microsoft UI Automation (`UIA3`) semantic locators (`AutomationId`, `Name`, `ControlType`) that survive DPI and resolution changes, targets the `.NET Framework 4.8` runtime already present on Windows 11 24H2 AVD images without installing Python or PowerShell 7, and carries a clean MIT license under [build or adopt](../../build-or-adopt.md).

### Consequences

- Good, because session hosts stay clean (no Python, Java, or Playwright binary downloads) and `rpa-ui-responsiveness` results never contaminate `multisession-density` baselines in `avd-assess/benchmarks/corpus.json`.
- Good, because all `C25` extensions (`appLaunchMs`, `windowReadyMs`, `actionLatencyMs`, `saveCloseMs`, `stepSuccessRatePct`, and `extensions.rpa`) are backward-compatible additions to `avd-benchmark-result/v1`.
- Bad, because Windows UIA requires actively connected, unlocked RDP/AVD sessions from an external driver VM (`RemoteDesktop_SuppressWhenMinimized=2`), Windows Job Object watchdogs to bound hung cross-process COM RPC calls, and explicit `startVmOnConnect` / `avd-benchmark-pool=true` spend and blast-radius gates.

## More Information

Related architecture, red-team review, and CUA boundaries.

<!-- more -->

- Full architecture, Windows 11 24H2 session mechanics, and the 11-finding Fable red-team review: [docs/rpa-workload-spec.md](../../rpa-workload-spec.md).
- Companion CUA governance boundary: [decision 0022](0022-cua-external-executor-plumbing.md).
