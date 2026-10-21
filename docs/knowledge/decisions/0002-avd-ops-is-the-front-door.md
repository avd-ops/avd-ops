---
status: accepted
date: 2026-10-20
decision-makers: [owner]
---

# 0002. avd-ops is the front door for the AVD repos

## Context and Problem Statement

The AVD repos each document themselves, and a reader arriving from outside has no single place
that says what they are, how they fit and where to start. Several repos also repeated the same
map. Where should onboarding and user-facing docs for the whole set live, and how should the
repos present themselves?

## Considered Options

- avd-ops holds the onboarding and user docs, in the shared knowledge base format, and every public
  repo presents as part of avd-ops
- Each repo carries its own onboarding, with the site only linking
- avd-second-brain's generated handbook doubles as the user docs

## Decision Outcome

Chosen option: "avd-ops holds the onboarding and user docs", because people need one front door,
while each repo stays the source of truth for its own code, specs and lessons.

- avd-ops is the brand in front of the public AVD repos. Their names don't change. Each README
  carries one line under its title: "Part of avd-ops (avd-ops.dev), the open toolkit for Azure
  Virtual Desktop." Private repos stay unbranded and off the site.
- The docs are a knowledge base in the shared format from the 2ndbrain template (decision 0001),
  with relative Markdown links, so the folder opens as an Obsidian vault with a graph, and the site
  renders the same pages and the same graph.
- avd-ops pages explain and link; they don't copy a repo's docs. A detail belongs in the repo that
  owns it.
- `repos.json` is the one list of family repos. The family check reads it.

### Consequences

- Good, because a reader has one place to start and every page links to the source of truth.
- Good, because the docs use the same format and checks as the other knowledge bases.
- Bad, because a repo page here can drift from its README; the family check and the review that
  changes a repo are what catch it.

## More Information

avd-second-brain's handbook (its `wiki/`, decision 0004 there) was the index agents searched until it was retired on 2026-10-21 (its decision 0024, [PR #76](https://github.com/avd-ops/avd-second-brain/pull/76)). The repo pages here are now the one place to read each repo, and agents search the brain's knowledge base.
