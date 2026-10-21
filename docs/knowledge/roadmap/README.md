---
title: "Roadmap"
summary: "Where each AVD repo is today and what these docs will cover next"
topic: roadmap
status: plan
last_reviewed: 2026-10-20
---

# Roadmap

Where each repo stands, in a line. Each repo's own roadmap and build order are the source of truth.

| Repo | Today |
|---|---|
| [avd-current-state](../repos/avd-current-state.md) | Built: collector, validator and the C11 facts snapshot |
| [avd-assess](../repos/avd-assess.md) | Public: the five methods, with sources pinned and observations growing |
| [avd-landing-zone](../repos/avd-landing-zone.md) | Built: the landing zone, its CI and the deployment portal |
| [avd-second-brain](../repos/avd-second-brain.md) | Built and growing: knowledge base, contracts and docs check |
| [avd-swarm](../repos/avd-swarm.md) | Design and spike: the S1a spike runs; the write path is designed, not scheduled |

## Next for these docs

- A walkthrough from an empty lab subscription to a validated landing zone.
- A glossary of the terms the repos share.
- Per-repo pages rendered from each README at the commit pinned in `repos.json`.

## A family roadmap page (proposed)

A public roadmap across every repo is designed in [docs/roadmap-spec.md](../../roadmap-spec.md), not built. What the prior-art check found, for the next page like it:

- Open source roadmaps that hold up are built from issues: one public tracking issue per item, a status label, and done closes the issue with a link to what shipped ([GitHub's public roadmap](https://github.com/github/roadmap), [Kubernetes enhancements](https://github.com/kubernetes/enhancements)). Hand-written roadmap pages go stale (the [Backstage roadmap](https://backstage.io/docs/overview/roadmap/) names an update date already past).
- Leave dates out. The roadmaps that give quarters also warn that dates move.
- Say maturity apart from progress (Kubernetes' alpha, beta, stable). Here that is proven, pre-beta and design, so an item in progress in a design-stage repo can't read as nearly ready.
- Issue titles are written by whoever opened the issue: a generated page shows only approved items, checks who added the approval label, and pulls an item whose title changed after approval.
