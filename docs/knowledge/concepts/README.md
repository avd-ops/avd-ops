---
title: "Concepts"
summary: "The ideas the AVD repos share: lifecycle stages, contracts, read-first agents, tenant data boundaries and knowledge capture"
topic: concepts
status: verified
last_reviewed: 2026-10-29
---

# Concepts

A handful of ideas run through every repo. Each screen here is the short version, with a link to the full one.

<!-- more -->

Each idea is explained in full in the repo that owns it; this page is the short version with the links.

## Three questions, three repos, and a layer on top

Three repos each answer one question about an estate, and two more sit on top of them.

| Question | Repo | Role |
|---|---|---|
| How it's built and changed from here | [avd-landing-zone](../repos/avd-landing-zone.md) | The deployment orchestrator and portal (over `avd-entra`, `avd-intune`, `avd-m365`, `avd-azure` and `avd-power-platform`, [decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)) |
| What is there now | [avd-current-state](../repos/avd-current-state.md) | The collector and validator |
| What it should be, and why | [avd-assess](../repos/avd-assess.md) | The map and the dictionary |

<!-- more -->

The roles are set in [family roles](https://github.com/avd-ops/avd-ops/blob/main/docs/family-roles.md).

On top of those sits an intelligence and abstraction layer:
[avd-second-brain](../repos/avd-second-brain.md) is the why over the environment's whole life, and
[avd-swarm](../repos/avd-swarm.md) is the how of operating it.

Dependencies point down, never up: avd-landing-zone and avd-current-state are a self-contained pair
that keeps working with no second brain and no avd-swarm.

## Contracts, not shared code

The repos hand each other versioned, redacted files, never each other's code.

<!-- more -->

The repos pass versioned, redacted files to each other instead of importing each other's code.
Each format has a number (C6 knowledge, C11 current-state facts, C14 target state, C15 the fact
register and so on) and one JSON Schema. avd-assess holds the foundation contracts (C11, C15 and
the others the foundation reads), avd-second-brain holds the upper layers' own (C14 among them), and
repos that read a format keep a byte-identical copy pinned to a commit
([brain decision 0021](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0021-foundation-contracts-live-in-avd-assess.md)). See avd-assess
[contracts](https://github.com/avd-ops/avd-assess/blob/main/contracts/README.md) and avd-second-brain
[contracts](https://github.com/avd-ops/avd-second-brain/blob/main/docs/contracts.md).

## The brain thinks, the swarm acts

The brain can't change anything. Every change is a plan a person approves, with one kill switch.

<!-- more -->

avd-second-brain never holds a write credential. Every change to an estate is a plan that
avd-swarm proposes, a person approves in a GitHub environment, and a governance gate checks against
live state. One layered kill switch stops it, and only the owner resets it. See
[decision 0003](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0003-brain-thinks-swarm-acts.md)
and [avd-swarm's governance](https://github.com/avd-ops/avd-swarm/blob/main/docs/governance.md).

## Tenant data stays with the tenant

Only redacted facts leave an estate, and no public repo holds tenant data.

<!-- more -->

Collectors and validators read an estate; what leaves it is redacted: counts, public values and
pseudonyms, never names or IDs. A customer's estate vault lives in that customer's private repo.
None of the public repos holds tenant data.

## Read first, change with approval

Reading is free. Changing anything in the cloud waits for a person's yes.

<!-- more -->

Scripts and agents read freely. Anything that creates, changes or deletes cloud resources runs only
after a person approves it, and every sandbox run comes with a cost estimate and a teardown.

## Keep the last copy, stop the meter

A teardown keeps your data and leaves nothing billing, unless you say otherwise.

<!-- more -->

Teardown removes what a redeploy recreates and keeps the data. Logs and teardown proof go to one run
store outside the deployment, kept by default (`-TeardownLogs Keep`), and deleting data with no
checked copy elsewhere needs `-DiscardLastCopy`, which `-Force` never implies
([never delete the last copy](https://github.com/avd-ops/avd-ops/blob/main/docs/never-delete-the-last-copy.md),
avd-second-brain [decision 0016](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0016-never-delete-the-last-copy.md)).
Anything that bills by time is removed, stopped or scheduled at the end of a run unless you opt in
with `-KeepRunning <until>`, and recurring commitments such as licenses and Marketplace offers are
recorded with their cancel windows, never bought by a script
([never leave the meter running](https://github.com/avd-ops/avd-ops/blob/main/docs/never-leave-the-meter-running.md),
[decision 0017](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0017-never-leave-the-meter-running.md)).
Your own copies go to a separate
[private companion repo](https://github.com/avd-ops/avd-ops/blob/main/docs/private-companion-repo.md).

## Runs anywhere

Every script runs from either Cloud Shell prompt, and on Windows, macOS and Linux.

<!-- more -->

Every operator script runs from either Cloud Shell prompt, PowerShell or Bash, and anything a person
runs on their own machine runs on Windows, macOS and Linux. PowerShell 7 is the baseline; each tool
is written once and every command comes in a PowerShell and a Bash form that call it. Each repo
lists, per script, which of those are proven by a test or a real run, and the portals offer only
those. See [decision 0006](../decisions/0006-run-anywhere.md); the rule, the audit and the
gaps are in [run anywhere](https://github.com/avd-ops/avd-ops/blob/main/docs/run-anywhere.md).

## Knowledge capture

Every change records what it taught, or says why there's nothing to record.

<!-- more -->

Each repo records what a change taught in a knowledge base in the shared format, or says why
there's nothing to record, and a pull request check asks for it. The format comes from the
[2ndbrain](https://github.com/nickprignano/2ndbrain) template; the AVD lessons live in
[avd-second-brain's knowledge base](https://github.com/avd-ops/avd-second-brain/tree/main/docs/knowledge).
These docs use the same format.

## What's out of scope

Bicep, PowerShell and native Microsoft tooling only. Anything else goes to another project.

<!-- more -->

The repos use Bicep, PowerShell and native Azure, Entra and Microsoft 365 tooling only. Asks outside that lane are referred elsewhere by
avd-second-brain's lane rules
([decision 0012](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0012-family-format-project-lanes.md)).
