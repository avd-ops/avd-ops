---
title: "Concepts"
summary: "The ideas the AVD repos share: lifecycle stages, contracts, read-first agents, tenant data boundaries and knowledge capture"
topic: concepts
status: partial
last_reviewed: 2026-10-20
---

# Concepts

The repos share a handful of ideas. Each is explained in full in the repo that owns it; this page
is the short version with the links.

## One lifecycle, one repo per stage

| Stage | Repo |
|---|---|
| Inventory and validate | [avd-current-state](../repos/avd-current-state.md) |
| Deploy and operate | [avd-landing-zone](../repos/avd-landing-zone.md) |
| Optional Liquidware tier | [avd-liquidware](../repos/avd-liquidware.md) |
| Act and control | [avd-swarm](../repos/avd-swarm.md) |
| Remember and learn, under every stage | [avd-second-brain](../repos/avd-second-brain.md) |

## Contracts, not shared code

The repos pass versioned, redacted files to each other instead of importing each other's code.
Each format has a number (C6 knowledge, C11 current-state facts, C14 target state, C15 the fact
register and so on) and one JSON Schema. avd-second-brain holds the registry, and repos that read a
format keep a byte-identical copy pinned to a commit. See
[contracts](https://github.com/nickprignano/avd-second-brain/blob/main/docs/contracts.md).

## The brain thinks, the swarm acts

avd-second-brain never holds a write credential. Every change to an estate is a plan that
avd-swarm proposes, a person approves in a GitHub environment, and a governance gate checks against
live state. One layered kill switch stops it, and only the owner resets it. See
[decision 0003](https://github.com/nickprignano/avd-second-brain/blob/main/docs/knowledge/decisions/0003-brain-thinks-swarm-acts.md)
and [avd-swarm's governance](https://github.com/nickprignano/avd-swarm/blob/main/docs/governance.md).

## Tenant data stays with the tenant

Collectors and validators read an estate; what leaves it is redacted: counts, public values and
pseudonyms, never names or IDs. A customer's estate vault lives in that customer's private repo.
None of the public repos holds tenant data.

## Read first, change with approval

Scripts and agents read freely. Anything that creates, changes or deletes cloud resources runs only
after a person approves it, and every sandbox run comes with a cost estimate and a teardown.

## Knowledge capture

Each repo records what a change taught in a knowledge base in the shared format, or says why
there's nothing to record, and a pull request check asks for it. The format comes from the
[2ndbrain](https://github.com/nickprignano/2ndbrain) template; the AVD lessons live in
[avd-second-brain's knowledge base](https://github.com/nickprignano/avd-second-brain/tree/main/docs/knowledge)
and Liquidware lessons in [avd-liquidware's](https://github.com/nickprignano/avd-liquidware/tree/main/docs/knowledge).
These docs use the same format.

## What's out of scope

The repos use Bicep, PowerShell and native Azure, Entra and Microsoft 365 tooling only, and
Liquidware is the only partner they name. Asks outside that lane are referred elsewhere by
avd-second-brain's lane rules
([decision 0012](https://github.com/nickprignano/avd-second-brain/blob/main/docs/knowledge/decisions/0012-family-format-project-lanes.md)).
