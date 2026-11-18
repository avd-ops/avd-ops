---
status: proposed
date: 2026-11-18
decision-makers: [owner]
---

# 0027. Separate helpdesk simulator kit and normalized ticket-adapter boundary

Keep synthetic ticket simulation in a standalone kit and wire remediation via a five-method adapter, starting with Jira Service Management Cloud Free and adding `avd-servicenow` later.

## Context and Problem Statement

Testing end-to-end incident triage requires simulating user-reported helpdesk tickets and working them over an API without coupling `avd-remediate` to a single ITSM vendor or paid license.

<!-- more -->

Adopters want to exercise how [avd-remediate](../repos/avd-remediate.md), [avd-linecheck](../repos/avd-linecheck.md), [avd-power-platform](../repos/avd-power-platform.md), and [avd-swarm](../repos/avd-swarm.md) respond to realistic helpdesk incidents (FSLogix temporary profiles, reconnect black screens, Teams audio jitter, and pool access requests) at near-\$0 cost. Embedding synthetic ticket generators or vendor-specific Jira/ServiceNow payloads directly inside `avd-remediate` would bloat the troubleshooting workbench and lock workflows to one ticketing API. How should `avd-ops` separate simulated helpdesk intake from remediation tooling while supporting Jira first and `avd-servicenow` later?

## Considered Options

Three options were weighed:

- **Separate helpdesk simulator kit + normalized five-method ticket adapter (Jira Service Management Cloud Free first, `avd-servicenow` later):** Keep synthetic user-issue generation and offline mock storage in a standalone kit, and define a minimal five-method adapter contract (`createTicket`, `listOpenTickets`, `getTicket`, `addWorkNote`, `transitionTicket`) so `avd-remediate` and `avd-swarm` work tickets identically across `mock`, `jira-jsm`, and future `servicenow` providers.
- **Build Jira and synthetic ticket seeding directly inside `avd-remediate`:** Fewer moving parts initially, but mixes test-simulation scaffolding with production triage logic and couples `avd-remediate` to Jira's REST v3 schema.
- **Wait for `avd-servicenow` and require a ServiceNow PDI from day one:** Aligns with the enterprise ServiceNow tier, but ServiceNow Personal Developer Instances hibernate after inactivity and require heavier setup than a near-\$0 Jira Service Management Cloud Free or local `mock` queue.

## Decision Outcome

Chosen option: "Separate helpdesk simulator kit + normalized five-method ticket adapter (Jira Service Management Cloud Free first, `avd-servicenow` later)".

<!-- more -->

Why: Isolating ticket simulation keeps `avd-remediate` focused on read-only host diagnostics, redaction, and human-approved remediation plans, while the five-method adapter lets teams start at \$0 with offline `mock` or Jira Service Management Cloud Free and swap in `avd-servicenow` without changing triage or `C24`/`C9` handoff logic.

### 1. Normalized five-method ticket adapter

Every ticketing provider implements the same five operations against normalized states (`new`, `triaging`, `awaiting_approval`, `resolved`):

| Method | Purpose | Who calls it |
|---|---|---|
| `createTicket(payload)` | Submit a simulated user incident or service request | Standalone helpdesk simulator |
| `listOpenTickets(filter)` | Poll open tickets awaiting triage | Triage worker / automation trigger |
| `getTicket(id)` | Read ticket summary, description, labels, and reporter | `avd-remediate` / triage worker |
| `addWorkNote(id, body, { internal })` | Post redacted diagnosis and `C24`/`C9` plan as an internal note | `avd-remediate` / `avd-swarm` |
| `transitionTicket(id, targetState)` | Move ticket across `new` → `triaging` → `awaiting_approval` → `resolved` | Triage worker / approval gate |

### 2. Provider rollout

- **Phase 1 (`mock` + `jira-jsm`):** Offline `mock` mode for \$0 local/CI runs and **Jira Service Management (Cloud Free)** (up to 3 agents, unlimited portal reporters) via REST v3 (`/rest/api/3/issue`, `/rest/api/3/search/jql`, internal comments via `sd.public.comment`, and workflow transitions).
- **Phase 2 (`avd-servicenow`):** Implement the same five-method contract against ServiceNow's Incident/Change Table API (`/api/now/table/incident`) when the enterprise ITSM tier is wired.

### Consequences

- Good, because `avd-remediate` stays focused on diagnostics, redaction, and `C24`/`C9` remediation plans instead of carrying synthetic ticket generators.
- Good, because Jira Service Management Cloud Free provides a real end-user helpdesk portal and REST API at \$0/month without ServiceNow PDI hibernation.
- Good, because swapping `jira-jsm` for `avd-servicenow` later only changes the adapter module, not the triage or approval workflow.
- Bad, because maintaining a separate simulator kit adds one extra component to keep aligned with `avd-remediate` plane classifications.

## More Information

Related assistant, remediation, and near-\$0 hosting decisions.

<!-- more -->

- Unified assistant protocol and `avd-remediate` / `avd-swarm` boundary: [decision 0025](0025-unify-remediate-and-swarm-assistants.md).
- Near-\$0 hosting and GitHub Free limits: [decision 0026](0026-github-free-limits-and-near-zero-azure-hosting.md).
- Troubleshooting workbench: [avd-remediate](../repos/avd-remediate.md).
