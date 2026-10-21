---
title: "avd-assess"
summary: "Foundation, what it should be: an open AVD assessment methodology that links pinned published sources and adds what real runs observed"
topic: repos
status: partial
last_reviewed: 2026-10-21
---

# avd-assess

**Foundation: what it should be. The map and the dictionary.** An open methodology for assessing Azure Virtual Desktop estates: what to collect, how to judge it, what good looks like and how to score it. It is a research index, not a tool.

The repo is the source of truth: [avd-ops/avd-assess](https://github.com/avd-ops/avd-assess). This page says where it fits.

## What it does

- Five methods: collection, assessment, targets and benchmarks, scoring, and a short sample check.
- Every step cites a pinned published source (`ref:`), what our own runs observed about it (`obs:`), or method written only where nothing exists (`gap:`).
- It stores a claim ID and one line in its own words, never a source's text.
- It holds the shared reference data the tools read, such as the AVD endpoint map, each entry pinned to its source.
- Nothing in it calls Azure or runs a probe.
- It holds the security review map: what each repo does for security, the pinned file that does or proves it, how strong that evidence is, what the operator still owns and the gaps. avd-ops renders it at a pinned commit on the [security review page](https://avd-ops.dev/security.html) and never keeps its own copy of a claim.

## How it fits

- [avd-current-state](avd-current-state.md) runs its methods from pinned copies it carries; [avd-landing-zone](avd-landing-zone.md) is how an estate gets to the target it describes.
- [avd-second-brain](avd-second-brain.md) cites it and owns the schemas its results use.

## Read more in the repo

- [README and the methods](https://github.com/avd-ops/avd-assess/blob/main/README.md)
