---
title: "Sandbox batches"
summary: "How test runs that cost money are queued, priced, approved once at an exact total, run one after another, and torn down with evidence"
topic: concepts
status: verified
last_reviewed: 2026-10-29
---

# Sandbox batches

Paid test runs go in batches: priced first, approved once at the exact total, torn down with proof.

<!-- more -->

Some changes can only be proven by deploying them: a landing zone round trip, a recovery test, a
teardown that must leave nothing behind. Those runs cost money and use shared resource names, so
the family runs them as **batches**, never one at a time on a whim. This page describes the method.
The repo that runs a test owns its steps, and the rules it builds on are the family's
[two spend decisions](../getting-started/cloud-shell.md).

The scripts ship with avd-landing-zone and run from Cloud Shell alone: the
[operator guide](https://github.com/avd-ops/avd-landing-zone/blob/master/docs/sandbox-runs.md) and
[decision 0020](https://github.com/avd-ops/avd-landing-zone/blob/master/build/decisions/0020-sandbox-runs-in-the-package.md).

## The shape

Queue items, build a batch, approve it once at its exact total, run its groups in order, keep
what must survive, tear down, and leave evidence.

## 1. Queue an item

Write each test down before anything runs: what it deploys, for how long, and what it must keep.

<!-- more -->

Each item is one test, written down before anything runs:

- **Source**, pinned to a commit, so what was approved is what runs.
- **Deployment key**: which deployment it needs. Items with the same key can share one deployment.
- **Attended or unattended.** An attended item needs a person in Cloud Shell, for example for a
  device code or a typed confirmation. An unattended item runs in CI with a federated identity (no
  stored secrets).
- **Rate and hours**: the hourly cost of what it deploys, and how long it holds it.
- **Keep**: the paths whose output must survive teardown.
- **Depends on**: items or merges that must land first.

## 2. Build a batch

A builder groups the tests that can share a deployment, prices them, and checks the caps.

<!-- more -->

A builder reads the ready items and:

- groups items that can share one deployment, so one deploy serves several tests;
- prices each group from its highest hourly rate times its hours, plus fixed costs, and adds them
  up to a batch total;
- checks the total against a per-batch cap, and the month's actual spend against a monthly cap,
  before anyone is asked;
- writes the batch as one file with a stable hash.

## 3. Approve once, at the exact total

A person types `go batch <id> $<total>`, exactly. A bare "go" is not an approval.

<!-- more -->

- One approval covers one batch at its printed total. The phrase is `go batch <id> $<total>`, and
  it has to match exactly. A bare "go" is not an approval.
- The approval is bound to the batch file's hash. Any change to the batch (an item, a pin, a
  price) voids it, and the batch is built and approved again.
- A model or an agent can build and price a batch, but only a person approves one.

## 4. Run groups one after another

Groups that share resource names run in order, with teardown evidence between them.

<!-- more -->

- Groups that use the same resource names run in sequence, with teardown evidence between them.
  Otherwise the second deploy collides with the first one's leftovers.
- Each group starts with a read-only health check (permissions, leftovers from an earlier run, the
  run store, the caps), and the runner checks the cost gate again. It stops on leftovers, a missed
  deadline or the monthly cap. Stopping is always safe, because nothing new is deployed.
- Before a group claims anything, it arms a deadline teardown on the run store, so a Cloud Shell
  that dies mid-run still leaves nothing billing ([brain decision 0026](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0026-runs-check-and-clean-before-they-spend.md)).

## 5. Keep, then tear down

What must survive is copied out and checked, then everything is torn down.

<!-- more -->

- Before any teardown, every Keep path is archived to a run store outside the deployment, read back
  and hash-checked. A group that keeps private output refuses to run without a run store
  ([never delete the last copy](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0016-never-delete-the-last-copy.md)).
- Teardown removes everything the group deployed, then checks that nothing is left billing
  ([never leave the meter running](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0017-never-leave-the-meter-running.md)).

## 6. Evidence

Each group leaves a record: the estimate, the actual cost, what ran, what was kept and the teardown result.

<!-- more -->

Each group leaves a record: estimate, actual cost once it settles, what ran at which commit, what
was kept and where, and the teardown result. The landing zone's
[run recorder spec](https://github.com/avd-ops/avd-landing-zone/blob/master/build/specs/run-recorder-spec.md)
defines the run record (contract C17).

## What real runs taught

Four things the first real runs got wrong, and what changed.

<!-- more -->

- **A runner identity needs more than Contributor.** The landing zone assigns Azure Policy, so an
  unattended runner also needs a role that can write policy assignments.
- **Teardown must clean Entra too.** Session hosts leave device objects behind. A runner that can't
  delete them makes the next deploy fail with "hostname already used"
  ([landing zone lesson 0029](https://github.com/avd-ops/avd-landing-zone/blob/master/build/lessons/0029-device-cleanup-rerun.md)).
- **Two writers to the same record race.** A batch built while another runs must not overwrite its
  results: rebase and retry before writing.
- **Cloud Shell can't grant admin consent with `az`.** The managed sign-in is refused. Use a Graph
  app role assignment instead.
