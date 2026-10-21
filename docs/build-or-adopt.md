# Build or adopt

A convention for every repo in the family, next to [three questions, three repos](family-roles.md):
when to use an outside tool and when to build our own. The decision record, with the reasons, is
avd-second-brain decision 0023, `docs/knowledge/decisions/0023-family-format-best-open-source-or-build.md`
([avd-second-brain #44](https://github.com/avd-ops/avd-second-brain/pull/44)).

## The rule

> "If ARI is the top of the line and open source, OK. Otherwise we build our own, or something else
> that is open source instead." (Nick, 2026-10-20)

1. **Check prior art first.** Before building anything new, run
   `python3 scripts/kb/prior_art.py "<topic>"` and read what the family's knowledge bases and
   avd-assess already know.
2. **Adopt only the best, and only if it's open source.** Use or wrap an outside tool only when it
   is the best at our job and its repo carries a license we can read (MIT, Apache-2.0 and the
   like).
3. **Otherwise build our own, or pick another open-source tool.** The tool we didn't adopt becomes
   the parity checklist: ours has to do what it does.
4. **Closed, unlicensed or license-unclear tools are prior art only.** Cite the facts, never copy
   the code, never depend on it. A paid service can only be an optional add-on that no free repo
   needs.

## How to tell

- **Best means best at our job,** measured against what we need: redaction before anything leaves
  the environment, contract-shaped output, runs in Cloud Shell, testable offline. Run the
  candidates side by side on the same input where you can. Being well known isn't the test.
- **Open source means the license file in the repo.** Read the file, not a package listing or a
  description. When the two disagree, settle it before anything is reused.
- **Pin what you adopt** to a release or commit, and record it as a reference in
  [avd-assess](https://github.com/avd-ops/avd-assess) so readers can see what we read and when.
- **Azure itself is the platform**, not a tool this rule weighs: Resource Graph, Learn and the
  Azure MCP Server are what we build on.
- The [roles convention](family-roles.md) still holds: an adopted tool never makes
  avd-landing-zone or avd-current-state depend on the layer on top.

## How it played out

| Tool | Job | Outcome |
|---|---|---|
| [Windows Desktop Optimization Tool](https://github.com/The-Virtual-Desktop-Team/Windows-Desktop-Optimization-Tool) (WDOT) | Image optimization | **Adopted.** MIT license file. avd-landing-zone's image build runs a release pinned by commit with a reviewed profile. Its README and EULA add sample-code terms, so the run accepts them explicitly. The older VDOT has no license and stays prior art only. |
| [PSRule for Azure](https://github.com/Azure/PSRule.Rules.Azure) | Checking templates against Well-Architected rules | **Adopted** (MIT) in avd-landing-zone's CI. |
| [WARA](https://github.com/Azure/Well-Architected-Reliability-Assessment) and the AVD review checklist | Well-Architected review | **Adopted** (WARA is MIT) as the rule engine for live reliability checks, with the checklist as a source. We dropped our own rule engine. |
| [Azure Resource Inventory](https://github.com/microsoft/ARI) (ARI) | Inventory and diagrams | **Built our own.** ARI is open source but not the best at our job: it has no redacted, contract-shaped output, and Mermaid drew the environment more accurately in a side-by-side run. avd-current-state builds its inventory from Resource Graph, with ARI as the parity checklist. ARI's repo says MIT while its PowerShell Gallery listing says otherwise, so none of its code is reused before that's settled. |
