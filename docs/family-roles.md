# Three questions, three repos

A convention for every repo in the family: which repo answers which question, and which way the
repos are allowed to depend on each other. avd-swarm writes the same roles in its spec, section 2
([avd-swarm #25](https://github.com/nickprignano/avd-swarm/pull/25)), and the second brain in its
operations spec, section 3.0
([avd-second-brain #44](https://github.com/nickprignano/avd-second-brain/pull/44)).

## Two layers

**The foundation** is three repos, each answering one question:

| Question | Repo | What it does |
|---|---|---|
| What it is | [avd-current-state](https://github.com/nickprignano/avd-current-state) | Collects facts about an environment offline and validates them, read-only |
| What it should be | [avd-assess](https://github.com/nickprignano/avd-assess) | The assessment method, and the why behind it: collection, assessment, targets and benchmarks, scoring. A research index that links out to published sources |
| How we build it | [avd-landing-zone](https://github.com/nickprignano/avd-landing-zone) | Deploys the landing zone from Cloud Shell, with the deployment portal, and every change to it after that |

**On top**, the second brain and avd-swarm are how we automate it and make it smart and
self-improving, an intelligence and abstraction layer built on the foundation:

- [avd-swarm](https://github.com/nickprignano/avd-swarm) automates it: agents that read and
  propose, and change nothing until a person approves the exact plan.
- [avd-second-brain](https://github.com/nickprignano/avd-second-brain) makes it smart and
  self-improving: the why over the environment's whole life, what it looked like, what changed,
  what broke and why each rule is what it is.

## The rules

1. **avd-landing-zone and avd-current-state are a self-contained pair.** They work, and keep
   working, with no second brain and no avd-swarm. avd-landing-zone stays true to its original
   purpose: deploying and changing an AVD landing zone.
2. **Dependencies point down, never up.** The second brain and avd-swarm build on the pair and
   read what it produces. The pair never needs them: no deployment, check or script in the pair
   fails because the brain or avd-swarm is missing, renamed or down.
3. **avd-assess is methodology only.** It holds no tools and calls nothing in Azure. It's a
   research index that links out to the published sources, pinned to a version, and adds only
   what the family has observed. avd-current-state implements the method. Like the pair,
   avd-assess never depends on the brain or avd-swarm.
4. **The family ends at its contracts.** Work built on these repos from outside the family reads
   their published contracts and outputs at a pinned version, and never the reverse: no script,
   workflow, source list, test or doc step in the family fetches, imports or needs a repository
   outside it. A contract names who produces it by role, not by repository, and every format that
   crosses the line is a published contract, so nothing outside can change it silently. Family text
   may say that a piece of work is outside the family and stops there; it doesn't describe what
   that work does or plans ([decision 0003](knowledge/decisions/0003-the-family-ends-at-its-contracts.md)).

## What this means for a change

- A change to the brain or avd-swarm that needs something new from the pair is made in the pair
  first, in a way that is useful on its own, and the brain or avd-swarm follows.
- A pull request to avd-landing-zone or avd-current-state shouldn't add a required check, a
  script step or a template that only works when the brain or avd-swarm is there.
- When you're not sure which repo a piece of work belongs to, ask which of the three questions it
  answers. If it answers none of them, it belongs to the layer on top.

When the answer is an outside tool rather than a new repo, [build or adopt](build-or-adopt.md) decides
whether we use it.
