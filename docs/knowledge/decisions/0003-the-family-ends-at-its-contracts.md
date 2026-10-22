---
status: proposed
date: 2026-10-21
decision-makers: [owner]
---

# 0003. The family ends at its contracts; work outside it builds on them, never the reverse

The family ends at its published contracts. Work outside it may build on them; the family never depends on that work.

## Context and Problem Statement

Nothing said where the family ends, or which way dependencies may cross the line.

<!-- more -->

The AVD repos on this site are public and free. Some work that builds on them may live outside the family, and
some of the family's text, source lists and checks still name or fetch repositories outside it,
which breaks the day that work moves, renames or changes visibility. The family roles say which
way the repos inside the family depend on each other, but not where the family ends. Where is the
line, and which way may dependencies cross it?

## Considered Options

- Family contracts and docs name the outside repositories that produce or read them, and family
  repos may fetch or link them
- The family ends at its contracts: they name a producer by its role, every format that crosses the
  line is a published contract, and nothing in the family depends on, fetches or describes work
  outside it

## Decision Outcome

Chosen option: "The family ends at its contracts".

<!-- more -->

Why: a family repo that depends on or
describes outside work breaks when that work moves, and a published contract lets anything build
on the family without the family knowing what it is.

- **Dependencies point one way.** Outside work reads the family's contracts and outputs at pinned
  versions. No family script, workflow, source list, test or doc step fetches, imports or needs a
  repository outside the family, and every one runs without one.
- **Contracts name roles, not repositories.** A contract says what produces or reads it ("the
  assessment that writes the target state"), not which repository does.
- **Every format that crosses the line is a published contract**, with a schema, an example and a
  check in the family, so an outside producer can't change it silently.
- **Family text names the boundary only.** It may say a piece of work is outside the family; it
  doesn't describe what that work does or plans.

Recorded as rule 4 in [family roles](../../family-roles.md).

### Consequences

- Good, because outside work can move, rename or change visibility without a family pull request.
- Good, because the family's own checks cover every format that crosses the line.
- Bad, because existing text and source lists in several repos that still name outside
  repositories need a cleanup pull request each, linked as one set.

## More Information

Links, open questions and what changed later.

<!-- more -->

- Replaces a record first proposed in avd-second-brain, closed there as outside that knowledge
  base's scope after its restructure.
- Revisit if a family repo ever needs outside work to run: that need becomes a published contract
  in the family, not a dependency.
