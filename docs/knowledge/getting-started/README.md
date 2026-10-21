---
title: "Start here"
summary: "What the AVD repos do, which one to open first, and how to try them safely in a lab"
topic: getting-started
status: partial
last_reviewed: 2026-10-20
---

# Start here

avd-ops is the front door for a set of open-source repos that take an Azure Virtual Desktop estate
from inventory to operations, as Bicep and PowerShell you can read and run from Azure Cloud Shell.
These pages explain how the repos fit together. Each repo stays the source of truth for itself, so
for anything detailed (parameters, scripts, specs, lessons) follow the link into that repo. Why the
docs live here, and how they're kept, is [decision 0002](../decisions/0002-avd-ops-is-the-front-door.md).

Everything here is a personal research project: not for production, provided as is, and not
affiliated with the author's employer or Microsoft. Use a dedicated lab subscription and
tenant.

## Pick your starting point

| You want to | Start with | Then |
|---|---|---|
| See what an existing AVD environment holds, read-only | [avd-current-state](../repos/avd-current-state.md) | Feed its redacted facts to [avd-second-brain](../repos/avd-second-brain.md) |
| Deploy a new, cloud-native AVD landing zone | [avd-landing-zone](../repos/avd-landing-zone.md) | Check it with [avd-current-state](../repos/avd-current-state.md)'s validator |
| Run the estate through agents a person approves | [avd-swarm](../repos/avd-swarm.md) | Design and spike stage today |
| Learn what past deployments taught | [avd-second-brain](../repos/avd-second-brain.md) | Its knowledge base |

New to the vocabulary? Read [concepts](../concepts/README.md) first.

## Before you run anything

- Use a lab subscription and tenant you can throw away. Every repo assumes it.
- Run from Azure Cloud Shell (PowerShell). Each repo's quick start is one block you paste there; the
  conventions behind that are in [working from Cloud Shell](cloud-shell.md).
- Expect Azure charges and tear down when you're done. The repos that deploy say how, and
  [sandbox batches](../concepts/sandbox-batches.md) is how several paid test runs are approved and run.
- Never paste a secret into chat, an issue or a pull request. The scripts read secrets with managed
  identities or prompt for them locally.

## Contributing

Fork any repo, open an issue or a pull request. Put a change in the repo that owns it; these pages
only link. A page here that is wrong or out of date is a pull request to
[avd-ops](https://github.com/nickprignano/avd-ops).
