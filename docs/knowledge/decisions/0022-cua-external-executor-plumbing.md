---
status: proposed
date: 2026-11-16
decision-makers: [owner]
---

# 0022. Define public CUA and external-executor plumbing across the AVD family

Public AVD repositories define the generic plumbing for Computer-Use Agent (CUA) execution—isolated host pools in the foundation, an `external-executor` plan hook in `avd-swarm`, and `executor-evidence` records in `avd-second-brain`—while keeping private broker and policy-engine internals outside the family.

## Context and Problem Statement

How should the public AVD family support UI-only tasks that require a Computer-Use Agent (CUA) without coupling public repositories to a private broker or violating the family contract boundary?

<!-- more -->

`avd-swarm` and `avd-second-brain` operate through APIs, read-only MCP tools, and declarative `C9` plans approved in GitHub Environments ([decision 0012](0012-desktop-devops-for-avd-win365-and-intune.md)). Some Desktop DevOps tasks have no API—such as legacy line-of-business consoles, portal-only settings, or interactive end-to-end verification—and require a CUA running against an isolated Windows desktop. Previously, all CUA plumbing was excluded from the public family, leaving no contract or extension point for `avd-swarm` to hand off a bounded UI task or record its outcome. How do we add the minimal public plumbing while preserving [decision 0003](0003-the-family-ends-at-its-contracts.md)?

## Considered Options

Three options were weighed.

- Keep CUA and external-executor hooks completely out of public repositories, maintaining private forks of `avd-swarm`, `avd-second-brain`, and `avd-landing-zone`
- Build a full CUA broker, host input service, and UI-action policy engine directly inside `avd-swarm`
- Define minimal, contract-based CUA and external-executor plumbing in the public family (`isolated host pool` in the foundation, `external-executor` plan hook in `avd-swarm`, `executor-evidence` in `avd-second-brain`), while keeping private broker and policy-engine implementations outside the family

## Decision Outcome

Chosen option: "Define minimal, contract-based CUA and external-executor plumbing in the public family, while keeping private broker and policy-engine implementations outside the family".

<!-- more -->

Why: keeping the extension points in the public contracts avoids maintaining divergent forks of `avd-swarm`, `avd-second-brain`, and `avd-landing-zone`, while [decision 0003](0003-the-family-ends-at-its-contracts.md) ensures the public repos never depend on, fetch, or embed an external CUA runtime.

- **Foundation (`avd-landing-zone`, `avd-azure`, `avd-intune`):** Provide a standalone **isolated host pool** flavor (single-session ephemeral hosts, hardened image baseline, per-task egress allowlist fragment, and diagnostics) that is useful on its own and works with no `avd-swarm`, `avd-second-brain`, or CUA executor attached.
- **Execution (`avd-swarm`):** Adds an **`external-executor` (`cua`) plan type** alongside `C9` proposals. API-first remains the rule: CUA is proposed only when no API, Graph, ARM, or Bicep path exists. Every CUA plan passes through the same human approval in a GitHub Environment, budget guard, and layered kill switch (`halt-actions`, `halt-agents`, `halt-all`).
- **Intelligence (`avd-second-brain`):** Adds an **`executor-evidence` record** linked to `C10` execution outcomes and `C18` lifecycle history so completed CUA runs return redacted, hashed evidence (outcome status, scope, timestamps, and artifact hashes—never raw screenshots, credentials, or tenant identifiers).
- **Outside the family:** Any CUA broker, UI-element policy engine, host input/capture service, or commercial policy pack stays outside the public family and integrates solely by reading the published contracts at a pinned version.

### Consequences

- Good, because `avd-swarm` can propose and govern UI-only CUA tasks through the same human-approval gate and kill switch as API actions without duplicating public repos.
- Good, because the foundation's isolated host pool remains self-contained and testable with no external executor present.
- Bad, because `C9` and `C10` contract extensions and `avd-swarm` / `avd-second-brain` docs must land in lockstep.
- Bad, because adopters who enable an external CUA executor must supply and govern their own runtime outside the public family.

## More Information

- Full plumbing specification: [docs/cua-executor-spec.md](../../cua-executor-spec.md).
- Builds on [decision 0003](0003-the-family-ends-at-its-contracts.md), [decision 0012](0012-desktop-devops-for-avd-win365-and-intune.md), and [decision 0017](0017-platform-decisions-live-in-avd-ops.md).
