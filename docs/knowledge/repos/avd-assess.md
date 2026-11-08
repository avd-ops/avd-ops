---
title: "avd-assess"
summary: "Foundation, what it should be: an open AVD assessment methodology across all five control planes that links pinned published sources and adds what real runs observed"
topic: repos
status: partial
last_reviewed: 2026-10-28
---

# avd-assess

What an estate should be, and why: the map and the dictionary every other repo reads across all five control planes.

<!-- more -->

An open methodology for assessing Azure Virtual Desktop estates across Azure, Entra ID, Intune, Microsoft 365 and Power Platform: what to collect, how to judge it, what good looks like and how to score it ([decision 0010](../decisions/0010-expand-assess-and-current-state-across-five-control-planes.md)), plus the benchmark profile definitions and public evidence corpus for the benchmark platform ([decision 0011](../decisions/0011-avd-benchmark-and-assess-corpus.md)). It is a research index, not a tool.

The repo is the source of truth: [avd-ops/avd-assess](https://github.com/avd-ops/avd-assess). This page says where it fits.

## What it does

Methods across every pillar and control plane, each step pinned to a published source or to what our own runs saw. It never calls Azure or Graph.

- Core and control-plane methods: collection, assessment, targets and benchmarks, scoring, sample check, remediation, plus dedicated methods for Entra ID (`entra.md`), Intune (`intune.md`), Microsoft 365 (`m365.md`), Power Platform (`power-platform.md`), security, network, reliability, FinOps and remote protocols.
- Every step cites a pinned published source (`ref:`), what our own runs observed about it (`obs:`), or method written only where nothing exists (`gap:`).
- It stores a claim ID and one line in its own words, never a source's text, and rolls check outcomes up into Well-Architected pillar scores (primary) and per-plane scores and coverage (secondary).
- Every check and C24 remediation hint carries its `plane` (`azure`, `entra`, `intune`, `m365`, `power-platform`) so findings map directly to the control-plane repo that fixes them.
- Nothing in it calls Azure, Microsoft Graph or Power Platform, or runs a probe.

<!-- more -->

- It holds the security review map across all 11 public repos: what each repo does for security, the pinned file that does or proves it, how strong that evidence is, what the operator still owns and the gaps. avd-ops renders it at a pinned commit on the [security review page](https://avd-ops.dev/security.html) and never keeps its own copy of a claim.
- avd-ops renders its methods, sources and claims as the [standards library](https://avd-ops.dev/standards/), read like a paper: numbered references, each claim with its pin, read date and three states (mapped, measurable, validated). It reads only avd-assess's own published files at one pinned commit, the same pin as the security page. Most sources are Microsoft Learn pages, and a Learn pin records which version was read, but that commit is not published, so a reader can only open the live page; the library says so on each such source.

## How it fits

The other repos run its methods and cite it. It depends on none of them.

- [avd-current-state](avd-current-state.md) runs its methods from pinned copies it carries; [avd-landing-zone](avd-landing-zone.md) and the five control-plane repos ([avd-entra](avd-entra.md), [avd-intune](avd-intune.md), [avd-m365](avd-m365.md), [avd-azure](avd-azure.md), [avd-power-platform](avd-power-platform.md)) are how an estate gets to the target it describes.
- [avd-second-brain](avd-second-brain.md) cites it and owns the schemas its results use.

## Read more in the repo

The repo has the full detail. Start here:

- [README and the methods](https://github.com/avd-ops/avd-assess/blob/main/README.md)
