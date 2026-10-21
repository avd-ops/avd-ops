# Three questions, three repos

A convention for every repo in the family: which repo answers which question, and which way the
repos are allowed to depend on each other. avd-swarm writes the same roles in its spec, section 2
([avd-swarm #25](https://github.com/avd-ops/avd-swarm/pull/25)), and the second brain in its
operations spec, section 3.0
([avd-second-brain #44](https://github.com/avd-ops/avd-second-brain/pull/44)).

## Two layers

**The foundation** is three repos, each answering one question:

| Question | Repo | Role | What it does |
|---|---|---|---|
| What it is | [avd-current-state](https://github.com/avd-ops/avd-current-state) | The collector and validator | Collects facts about an environment offline and validates them, read-only |
| What it should be | [avd-assess](https://github.com/avd-ops/avd-assess) | The map and the dictionary | The assessment method, and the why behind it: collection, assessment, targets and benchmarks, scoring. A research index that links out to published sources, the map of every detail an estate is built and assessed by, and the shared reference data the tools read, such as the endpoint map, each entry pinned to its source |
| How we build it | [avd-landing-zone](https://github.com/avd-ops/avd-landing-zone) | The deployment engine | Deploys the landing zone from Cloud Shell, with the deployment portal, and every change to it after that |

Roles as the owner named them on 2026-10-21.

**On top**, the second brain and avd-swarm are how we automate it and make it smart and
self-improving, an intelligence and abstraction layer built on the foundation:

- [avd-swarm](https://github.com/avd-ops/avd-swarm) automates it: agents that read and
  propose, and change nothing until a person approves the exact plan.
- [avd-second-brain](https://github.com/avd-ops/avd-second-brain) makes it smart and
  self-improving: the why over the environment's whole life, what it looked like, what changed,
  what broke and why each rule is what it is.

## Beside the foundation: the end-user portal

[avd-linecheck](https://github.com/avd-ops/avd-linecheck) is **the end-user portal**: a page a user
opens to check the network they connect from, with a result they can share with their helpdesk. It
reads avd-assess's endpoint map at a pinned commit and needs nothing else from the family. It is
always hosted on GitHub Pages, so anyone who clones or forks it runs their own copy for free; an
optional server probe stays optional, and free.

## The rules

1. **avd-landing-zone and avd-current-state are a self-contained pair.** They work, and keep
   working, with no second brain and no avd-swarm. avd-landing-zone stays true to its original
   purpose: deploying and changing an AVD landing zone.
2. **Dependencies point down, never up.** The second brain and avd-swarm build on the pair and
   read what it produces. The pair never needs them: no deployment, check or script in the pair
   fails because the brain or avd-swarm is missing, renamed or down.
3. **avd-assess is the map and the dictionary, never a tool.** It holds no tools, runs no probe
   and calls nothing in Azure. It's a research index that links out to the published sources,
   pinned to a version, and adds only what the family has observed. Data the tools read, such as
   the endpoint map, is allowed when every entry points at its pinned source and restates no table.
   avd-current-state implements the method; avd-linecheck and the pair read the shared data at a
   pinned commit. Like the pair, avd-assess never depends on the brain or avd-swarm.
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
