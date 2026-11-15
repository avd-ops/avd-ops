---
status: proposed
date: 2026-11-15
decision-makers: [owner]
---

# 0017. Keep platform and cross-repo decisions in avd-ops, not avd-second-brain

`avd-ops` owns platform and cross-repo governance decisions in its existing knowledge base, while `avd-second-brain` owns Desktop DevOps operational intelligence.

## Context and Problem Statement

Platform-wide decisions about why the toolsets are built the way they are were split between `avd-ops` and `avd-second-brain`.

<!-- more -->

`avd-ops` already holds family architecture decisions (`0001`–`0016`), while `avd-second-brain` still holds cross-repo rules such as toolchain lanes (`0012`), last-copy and meter-running invariants (`0016`, `0017`), and foundation contract placement (`0021`). Because `avd-landing-zone` and `avd-current-state` must work with no second brain ([family roles](../../family-roles.md)), foundation rules should not depend upward on `avd-second-brain`. Where should platform and cross-repo governance decisions live?

## Considered Options

Three options were weighed:

- Keep platform decisions in `avd-ops`'s existing `docs/knowledge/decisions/` and move remaining cross-repo governance records out of `avd-second-brain`
- Create a new `avd-ops-second-brain` repository solely for platform and builder decisions
- Leave platform governance decisions in `avd-second-brain`

## Decision Outcome

Chosen option: "Keep platform decisions in `avd-ops`'s existing `docs/knowledge/decisions/` and move remaining cross-repo governance records out of `avd-second-brain`".

<!-- more -->

Why: `avd-ops` already uses the `2ndbrain` format (`0001`) and already holds the majority of platform MADRs without adding another repository to sync. Moving cross-repo rules here removes the upward dependency on `avd-second-brain`, which stays focused on AVD, Windows 365, and Intune operational intelligence (`0012`).

### Consequences

- Good, because foundation repos (`avd-landing-zone`, `avd-current-state`, `avd-assess`) no longer depend upward on `avd-second-brain` for family rules.
- Good, because `avd-second-brain` stays focused on Desktop DevOps intelligence, estate vaults, and `avd-swarm` memory.
- Bad, because `avd-second-brain` decisions `0012`, `0016`, `0017`, and `0021` need migration stubs ("Moved to `avd-ops`") so existing cross-repo links stay valid.
- Bad, because internal builder notes that should not publish to `avd-ops.dev` must stay outside `docs/knowledge/` (or be gated from `site/docs/`).

## More Information

Follow-up work across the family:

- Migrate `avd-second-brain` decisions `0012`, `0016`, `0017`, and `0021` into `avd-ops`, leaving stubs in `avd-second-brain`.
- Keep internal-only builder notes in `docs/platform/` (outside `docs/knowledge/`) if they should not render to `avd-ops.dev`.
