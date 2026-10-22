---
status: accepted
date: 2026-10-21
decision-makers: [owner]
---

# 0006. Every operator script runs from either Cloud Shell prompt and on Windows, macOS and Linux

Each script is written once and runs from PowerShell or Bash, on Cloud Shell, Windows, macOS and Linux.

## Context and Problem Statement

People run the scripts from either Cloud Shell prompt and on their own PCs and Macs, but CI only proved Linux.

<!-- more -->

Azure Cloud Shell is how most people meet the family: it opens in PowerShell, often on an iPad, and
a command block is pasted once. Some people work in Cloud Shell's Bash prompt, and some run the
scripts on their own Windows PC or Mac (avd-current-state's facts script runs offline on a laptop).
The owner asked that scripts come in PowerShell and Bash and that anything local works on Windows
and macOS, and that the portals offer a Bash or PowerShell, Windows or macOS toggle. An audit of
the six public repos (2026-10-21) found portable PowerShell 7 code, one Bash entry point that needs
Bash 4, and every CI job on Linux only. How should the family make "runs anywhere" true and keep it
true?

## Considered Options

- One implementation per tool, callable from both shells, proven by a CI OS matrix
- Thin wrappers in the other language for the first commands an operator types, plus the above
- Full twins: every operator script as a `.ps1` and a `.sh`, with a parity test

## Decision Outcome

Chosen option: "One implementation per tool, callable from both shells".

<!-- more -->

Why: both Cloud
Shell prompts and every desktop OS can start `pwsh` and `bash`, so operators get a block in the
shell they chose without a second copy of about 15,000 lines of operator code that would drift. The
owner picked it on 2026-10-21.

- PowerShell 7.2 or later is the PowerShell baseline for operator scripts; Windows PowerShell 5.1
  only for code that runs inside Azure on Windows (exempt) and where a repo already promises it.
- Each repo with operator scripts keeps `scripts/platforms.json`: per script, `tested`,
  `untested` or `no` for Cloud Shell PowerShell, Cloud Shell Bash, Windows and macOS, with the
  evidence for every `tested`. The portals read it and offer only what exists.
- CI runs the existing Pester, analyzer, shellcheck and unit tests on Ubuntu, Windows and macOS
  runners; no new harness.

The full rule, the audit and the ranked gaps: [run anywhere](https://github.com/avd-ops/avd-ops/blob/main/docs/run-anywhere.md).

### Consequences

- Good, because a person picks their shell and OS in the portal and gets a command that is proven,
  or clearly marked as not yet proven.
- Good, because CI on three OSes catches path, encoding and shell differences before an operator does.
- Bad, because macOS runners are slower; the matrix runs only on pull requests that touch scripts
  and weekly on main.
- Bad, because a Bash-only tool still needs `bash` on Windows (Git Bash or WSL).

## More Information

Links, open questions and what changed later.

<!-- more -->

Facts the audit found, each a gap with a fix in the run anywhere page: stock macOS ships Bash 3.2,
so `${x,,}` and `mapfile` fail there; Git Bash on Windows rewrites arguments that start with `/`
(such as `/subscriptions/...` resource IDs) unless `MSYS_NO_PATHCONV=1` (to confirm on a Windows
runner); a Windows checkout with `core.autocrlf` breaks `.sh` files without `*.sh text eol=lf`;
Python before 3.15 opens text in the ANSI code page on Windows unless `encoding="utf-8"` is passed
(PEP 686). Revisit when a script can't be called from the other shell, or when an outside
contributor asks for a native twin.
