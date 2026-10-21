# Run anywhere: scripts for Cloud Shell, Windows, macOS and Linux

A convention for every repo in the family, next to [never delete the last copy](never-delete-the-last-copy.md)
and [never leave the meter running](never-leave-the-meter-running.md). The decision record is
[avd-ops decision 0006](knowledge/decisions/0006-run-anywhere.md). Status: **proposed**, waiting
for the owner's answer on one question (section 2, "Twins").

## 1. The rule

Anyone with a browser, a Windows PC or a Mac can run every operator script in the family.

- **Azure Cloud Shell is the first place a script runs.** It opens in PowerShell, people use it from
  an iPad, and a command block is pasted once after a clean prompt (avd-landing-zone lesson 0015).
  Both Cloud Shell prompts, PowerShell and Bash, have `pwsh`, `bash`, `az` and the Az modules, so a
  script started from either prompt behaves the same.
- **Anything that runs on a person's own machine runs on Windows, macOS and Linux**, with the
  prerequisites printed next to the command.
- **CI proves it.** A claim that a script runs on an OS is "tested" only when a CI job or a recorded
  real run on that OS passed.

## 2. What the rule means in practice

**PowerShell 7 is the PowerShell baseline.** Operator scripts start with `#requires -Version 7.2`
(or higher where they need it, such as 7.4 for `Test-Json`). Windows PowerShell 5.1 is supported
only where code runs inside Windows and the platform gives you nothing else, and those scripts are
exempt from the cross-platform rule (section 4).

**One implementation, callable from both shells (recommended).** Each tool is written once, in
PowerShell 7 unless it is a thin Bicep or `az` wrapper that is clearer in Bash. Every command block
an operator sees comes in two forms that call the same script:

```powershell
# PowerShell (Cloud Shell, or pwsh on Windows, macOS, Linux)
./scripts/ops/Test-AvdLandingZoneReadiness.ps1 -Mode PreDeployment
```

```bash
# Bash (Cloud Shell Bash, macOS Terminal, Linux, Git Bash on Windows)
pwsh -NoProfile -File ./scripts/ops/Test-AvdLandingZoneReadiness.ps1 -Mode PreDeployment
```

and for a Bash tool the reverse (`bash ./scripts/deploy/deploy.sh ...` from PowerShell). The
portals' Shell toggle (PowerShell or Bash) and Where toggle (Cloud Shell, Windows or macOS) pick the
form; they read `scripts/platforms.json` (section 5) and offer only what exists.

**Twins.** Nick asked for scripts in PowerShell and Bash. Rewriting each script in the other
language would roughly double about 15,000 lines of operator code and its tests, and the copies
would drift. The proposal is that a real twin (a `.sh` next to a `.ps1`, or the reverse) is written
only when a script can't be called from the other shell, and the open question to the owner is
which of three levels to adopt: one script callable from both shells (recommended), thin wrappers
for the first commands an operator types, or full twins with a parity test.

**Portable PowerShell.** Build paths with `Join-Path` (or `[IO.Path]`), never `\` or `C:\`; take
temporary and output folders from `[IO.Path]::GetTempPath()`, `$HOME` and `~/clouddrive` with a
fallback, never `$env:TEMP` or `$env:USERPROFILE`; normalize a relative path to `/` before it
becomes a blob name or a key; guard Windows-only calls with `$IsWindows`; write UTF-8 files; and
remember that file names are case-sensitive on Linux and Cloud Shell.

**Portable Bash.** macOS ships Bash 3.2, so a script that needs Bash 4 or later (`${x,,}`,
`mapfile`, associative arrays) checks `BASH_VERSINFO` first and says how to get a newer one
(Homebrew `bash`, or run it from Cloud Shell). Use only POSIX flags of `sed`, `date`, `grep`,
`readlink` and `base64` (the GNU and BSD versions differ), pass `--ids` and other `/subscriptions/...`
arguments with `MSYS_NO_PATHCONV=1` set so Git Bash on Windows doesn't rewrite them as file paths
(to be confirmed on a Windows runner), and keep every `.sh` file LF with a `.gitattributes` line
(`*.sh text eol=lf`), because a Windows checkout with `core.autocrlf` turns them into CRLF and Bash
then fails on `$'\r'`.

**Portable Python and Node** (contributor and CI tools). Open text files with
`encoding="utf-8"` (Windows defaults to the ANSI code page before Python 3.15, PEP 686); build paths
with `pathlib` or `node:path` and compare them as POSIX; call `git` with an argument list, never a
shell string.

## 3. Who runs what (audit, 2026-10-21)

Audited at avd-landing-zone `e66d866`, avd-current-state `f914918`, avd-swarm `c81fbcb`,
avd-assess `3593941`, avd-second-brain `f59a1c5`, avd-ops `37977cb`. Every CI job in all six
repos runs on `ubuntu-latest` only, so nothing is yet proven on Windows or macOS.

| Repo | Scripts | Who runs them, where | Language | State |
|---|---|---|---|---|
| avd-landing-zone | `scripts/ops/*.ps1` (19 entry points, 5 modules) | Operator, Cloud Shell first, local allowed | pwsh 7.2 | Portable paths throughout (`Join-Path`, `~/clouddrive` with a `$HOME` fallback, relative paths normalized to `/`). All but `Initialize-AvdGraphApp.ps1` carry `#requires -Version 7.2`. No Bash form shown in the docs or portal. |
| avd-landing-zone | `scripts/deploy/deploy.sh` | Operator, Cloud Shell Bash (docs), local | Bash, `az` | Needs Bash 4 (`${x,,}`, `mapfile`): fails on stock macOS Bash 3.2. Passes resource IDs to `--ids`, which Git Bash on Windows rewrites unless `MSYS_NO_PATHCONV=1`. No `.gitattributes` LF rule. No PowerShell form shown. |
| avd-landing-zone | `scripts/image`, `scripts/sessionhost`, `scripts/ops/host`, `scripts/automation`, `scripts/jumpbox` | Inside Azure: image builder, session hosts, Automation runbook, jumpbox first boot | Windows PowerShell 5.1 | Exempt (section 4). |
| avd-landing-zone | `build/snapshot-diff.sh`, `.claude/hooks/session-start.sh`, `scripts/kb/*.py` | CI and contributors | Bash, Python | Contributor tooling (section 4). |
| avd-current-state | `avd_current_state_collector.ps1`, `avd_deployment_validator.ps1`, `avd_current_state_facts.ps1` | Operator, Cloud Shell first, **and locally** (the facts script runs offline on a laptop) | Windows PowerShell 5.1 and pwsh 7 (README) | Portable paths, `~/clouddrive` with fallback, UTF-8 with BOM where non-ASCII. The 5.1 and Windows claims are untested: CI runs Pester on Linux pwsh only. No Bash form shown. |
| avd-second-brain | `scripts/*.ps1` | Contributors and the curator, locally and CI | pwsh 7.4 | Portable; relative paths normalized. Linux CI only. |
| avd-second-brain | `vault/avd_second_brain.ps1` | Operator, inside a private vault repo, locally | Windows PowerShell 5.1 and pwsh 7 | Must stay 5.1-compatible (brain rule). Linux CI only. |
| avd-swarm | `scripts/*.py`, `spend/spend_guard.py`, `scripts/check-no-ids.sh` | CI; contributors before a push | Python, Bash | Contributor tooling. `check-no-ids.sh` needs Git Bash on Windows. |
| avd-assess | `scripts/*.py`, `tests/check_*.py` | Contributors and CI | Python | Every file opened with `encoding=`: portable. |
| avd-ops | `scripts/site/*.mjs`, `scripts/kb/*.py`, `scripts/privacy_check.py` | Contributors and CI | Node, Python | Site build portable (POSIX paths). The shared 2ndbrain KB tools (`capture_check.py`, `curate.py`, `prior_art.py`, tests) open text without `encoding=`, so they can fail on Windows with non-ASCII Markdown. The same files are vendored in every family KB. |

## 4. Exempt scripts and why

- **Code that runs inside Azure on Windows**: image customization, session host setup, host-side
  readiness checks, the Automation runbook, jumpbox first boot. The platform runs Windows PowerShell
  5.1 there; they keep the landing zone's 5.1 rules (lesson 0011) and are left out of
  `platforms.json`.
- **Claude Code hooks** (`.claude/hooks/*.sh`): they run in the cloud session container.
- **CI-only helpers** that a workflow calls on its own runner. A contributor tool a person runs
  before a push (`check-no-ids.sh`, the KB tools) is not exempt: it should run on Windows, macOS and
  Linux, Git Bash counting as Windows Bash.

## 5. `scripts/platforms.json`

Each repo with operator scripts keeps one file the portals read: `scripts/platforms.json`, or
`platforms.json` at the root where the scripts live at the root (avd-current-state). Each portal's
engine carries a copy (`PLATFORMS` in avd-landing-zone `site/portal/portal-core.js`, avd-current-state
`site/portal/assess-core.js`) and a test fails when they differ, so a change to the file updates the
copy in the same commit. The shape was agreed with the portal toggle work:

```json
{
  "version": 1,
  "scripts": {
    "scripts/ops/Test-AvdLandingZoneReadiness.ps1": {
      "cloudshell-pwsh": "tested",
      "cloudshell-bash": "untested",
      "windows": "untested",
      "macos": "untested",
      "requires": "pwsh 7.2, Az modules",
      "evidence": "a lesson or run record that proves the tested entries"
    },
    "scripts/deploy/deploy.sh": {
      "cloudshell-pwsh": "untested", "cloudshell-bash": "tested",
      "windows": "no", "macos": "untested",
      "requires": "bash 4+, az, Bicep CLI"
    }
  }
}
```

Keys are the script paths the portal commands call. Each value is `tested` (a CI job or real run
on that platform passed; name it in `evidence`), `untested` (should work, not yet proven; the
portal marks it) or `no` (the portal hides it). Bash means running the `.ps1` through `pwsh` from a
Bash prompt (the portal writes the block to a temporary `.ps1` through a quoted heredoc and runs
`pwsh -NoLogo -File`) unless a real twin exists (`"twin": "scripts/x.sh"`). `windows` means PowerShell 7; a
script that also claims Windows PowerShell adds `"winps51"`. Exempt scripts (section 4) are not
listed. A test in each repo checks that every listed path exists and every operator entry point is
listed.

## 6. How it's tested

No new harness: GitHub Actions' OS matrix with the tools each repo already uses. The prior-art
check for this is avd-second-brain's `kb-prior-art` run of 2026-10-21; what it found is noted in
the pull request that adds this page.

- **PowerShell**: a `strategy.matrix.os: [ubuntu-latest, windows-latest, macos-latest]` job runs
  `Invoke-Pester` and `Invoke-ScriptAnalyzer` with `shell: pwsh`. Repos that claim Windows
  PowerShell add a `windows-latest` job with `shell: powershell` for those files. Offline mocks
  stay pure PowerShell, so they run on every OS; a fake tool written as a Bash script (for example
  a fake `az`) gets a `.ps1` or `.cmd` sibling, or the test is marked to skip on Windows with the
  reason.
- **Bash**: `shellcheck` on Linux as today, plus a `macos-latest` step that runs each `.sh` with
  `/bin/bash` (3.2) to the point where it checks its Bash version, and a `windows-latest` step with
  Git Bash, both with a fake `az` on `PATH`. No step signs in to Azure.
- **Python and Node**: the existing unit tests on the same three OSes.
- **Cost**: GitHub-hosted runners are free for public repos; macOS runs are slower, so the matrix
  runs on pull requests that touch scripts and weekly on main, not on every docs change.

## 6a. Linters, hooks and editor settings

Asked by the owner on 2026-10-21: do the tools that check and suggest code support the rule? Mostly
they run, but on Linux only and without the rules that would catch platform problems. A trial run
of each fix below was made on the audited commits.

| Tool | Where it runs today | Cross-platform today | Finding | Recommendation |
|---|---|---|---|---|
| PSScriptAnalyzer (LZ, current-state, brain) | CI on Linux, locally | Runs on every OS, but none of the compatibility rules are on, and `Severity = @('Error', 'Warning')` hides parse errors (`ParseError` is its own severity) | **Two avd-landing-zone image scripts don't parse** (`"$path: ..."` and `"$i: ..."` read as drive-qualified variables in `scripts/image/Invoke-ImageCleanup.ps1` line 20 and `Update-DefenderSignature.ps1` line 14) and CI passed them | Add `'ParseError'` to `Severity` in every repo now; turn on `PSUseCompatibleSyntax` (target 7.0, plus 5.1 where promised), `PSUseCompatibleCommands` and `PSUseCompatibleTypes` with the bundled PowerShell 7.0 Ubuntu and Windows profiles (and the Windows PowerShell 5.1 profile for 5.1 files). Trial: avd-landing-zone `scripts/ops` gives 8 findings, all in `scripts/ops/host` (Windows-only by design: move that folder under the exempt list or ignore it), plus `Test-Json -SchemaFile` (7.2, newer than the bundled 7.0 profile: ignore). avd-current-state gives 102 hits of its own `Write-Log` (a name in the union profile: `IgnoreCommands`) and one guarded `Test-Json`. Linting is OS-independent once the profiles are on, so it stays one Linux job. |
| Pester | CI on Linux | Tests are PowerShell, so they can run anywhere; LZ fakes include Bash shims | Nothing proven on Windows or macOS | The OS matrix in section 6 |
| shellcheck (LZ, swarm) | CI on Linux | Linux only, which is fine: it reads the script, it doesn't run it | It has no "Bash 3.2" target, so it can't catch `${x,,}` or `mapfile` on macOS | Keep it; add the macOS `/bin/bash` smoke step and an explicit `BASH_VERSINFO` check in scripts that need Bash 4 |
| Bicep lint and build | CI on Linux | The Bicep CLI is the same on every OS | None | Nothing to do |
| gitleaks (CI and LZ's `.githooks/pre-commit`) | CI on Linux; the hook wherever a contributor enables it | gitleaks has Windows and macOS builds; the hook is `/bin/sh`, which Git for Windows runs | None | Nothing to do |
| KB tools (`scripts/kb/*.py`, family-wide) | CI on Linux, Claude Code hooks | Python runs anywhere | `open()` and `Path.read_text()` without `encoding=`: ruff's `PLW1514` finds 3 to 6 per repo | Fix in 2ndbrain and re-sync (gap 6); add `ruff check --select PLW1514` to the KB checks |
| Claude Code hooks (`.claude/settings.json`) | Claude Code sessions | Hooks call `python3` and `bash`; Claude Code on Windows runs hooks through Git Bash, but a Windows Python install often has `python` or `py`, not `python3` | Local Windows contributors may see the hooks fail | Note it in each repo's contributing guide; revisit if an outside contributor on Windows hits it |
| Node site and portal tests (`node --test`) | CI on Linux | Node runs anywhere; paths are POSIX strings | None found | Add Windows to the matrix only for the portal engines' tests (they build the command blocks) |
| EditorConfig | Nowhere | - | No repo has one, so editors pick their own line endings and indentation | Add a small `.editorconfig` (UTF-8, LF, final newline, 2 or 4 spaces as each repo already uses) |
| `.gitattributes` | LZ, current-state, brain, only for byte-pinned contracts | - | No line-ending rule for `.sh` (or anything else) | Add `* text=auto` and `*.sh text eol=lf`, keeping the existing `-text` lines for pinned contracts |
| Markdown and YAML lint | Nowhere (the KB validator checks KB structure, not style) | - | None needed for this rule | Nothing to do |

## 7. Gaps, ranked by value

| # | Gap | Repo | Why it matters | Size |
|---|---|---|---|---|
| 0 | Two image scripts fail to parse; CI's analyzer hides parse errors (add `ParseError` to `Severity` in every repo) | avd-landing-zone, then current-state and brain settings | A real bug that ships today; the image build steps that call them can't run | XS |
| 1 | `platforms.json` with real evidence, and a test that it lists every operator entry point | avd-landing-zone, avd-current-state | The portals' toggle reads it; today it would be a guess | S each |
| 2 | Windows and macOS CI matrix for Pester and the analyzer (plus `shell: powershell` for the 5.1 claims) | avd-current-state | The one repo people already run on their own machines, and its README claims Windows PowerShell 5.1 with no test | S |
| 3 | `deploy.sh`: Bash version check with a clear message, `MSYS_NO_PATHCONV=1`, `*.sh text eol=lf`, and a macOS and Git Bash smoke step with a fake `az` | avd-landing-zone | The deploy command is the one most likely to be run locally, and today it breaks on a stock Mac with an unclear error | S |
| 4 | Portal commands in both forms (PowerShell and Bash) for every block, read from `platforms.json` | avd-landing-zone, avd-current-state portals (with the portal toggle work) | What Nick asked for: anyone picks their shell and OS | M |
| 5 | Windows and macOS matrix for `scripts/ops` Pester tests and offline scenarios | avd-landing-zone | Proves the local path for the ops scripts; fake Bash tools need a PowerShell sibling | M |
| 6 | `encoding="utf-8"` in the shared KB tools, fixed once in 2ndbrain and re-synced | 2ndbrain, then every family KB | Contributors on Windows; small and mechanical | S |
| 7 | New scripts follow the rule: the batch runner moving into avd-landing-zone (`scripts/ops/*Spend*`, `*SandboxBatch*`) lands as pwsh 7.2 with entries in `platforms.json`, and its fake `az` gets a Windows sibling | avd-landing-zone | Keeps the next 7 scripts from becoming new gaps | in that work |
| 7a | Analyzer compatibility rules on (section 6a), `.editorconfig`, `* text=auto` and `*.sh text eol=lf` | every repo with scripts | Catches Windows-only commands and 5.1 syntax at lint time, from one Linux job | S per repo |
| 8 | Brain `scripts/*.ps1` and `vault/avd_second_brain.ps1` on the matrix (the vault script on `shell: powershell`) | avd-second-brain | Contributor and vault operator use on Windows | S |

Gap 0 is a bug fix and goes first. Follow-up pull requests for gaps 1 to 3 and 7a start after the owner's yes; the rest follow in order.
