---
title: "Glossary"
summary: "One-line definitions of the terms and contracts the AVD repos share, with links to the repo or doc that owns each term"
topic: concepts
status: verified
last_reviewed: 2026-11-11
---

# Glossary

One-line definitions of the shared terms, contract IDs, and safety rules across the `avd-ops` family, each linked to the page that owns it.

<!-- more -->

Each term belongs to one repository or specification; follow the link for the schema or full rule.

## Shared contracts (`C1`–`C26`)

Versioned JSON contracts passed between repositories instead of shared code.

<!-- more -->

| Term | What it is | Owner |
|---|---|---|
| **Contract registry (`C1`–`C26`)** | The catalog of versioned JSON schemas and examples that connect the family repos without runtime code coupling | [avd-second-brain contracts](https://github.com/avd-ops/avd-second-brain/blob/main/docs/contracts.md) |
| **`C6` (`avd-knowledge-rule/v1`)** | Machine-readable sizing, threshold, and architecture rules harvested into the knowledge base | [avd-second-brain contracts](https://github.com/avd-ops/avd-second-brain/blob/main/docs/contracts.md) |
| **`C9` (`avd-playbook-proposal/v1`)** | A surface-aware remediation or operational plan proposed by the brain for human approval in `avd-swarm`, carrying a `dataLossGuard` block | [avd-second-brain decision 0027](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0027-desktop-devops-across-avd-win365-and-intune.md) |
| **`C10` (`avd-playbook-outcome/v1`)** | The redacted execution and verification outcome returned to the brain after `avd-swarm` runs or rejects an approved plan | [avd-second-brain contracts](https://github.com/avd-ops/avd-second-brain/blob/main/docs/contracts.md) |
| **`C11` (`avd-current-state-facts/v1`)** | A single-tenant, pseudonymized snapshot of counts, booleans, and public Azure values across all five control planes, with zero names or IDs | [avd-current-state README](https://github.com/avd-ops/avd-current-state/blob/main/README.md) |
| **`C12` (`avd-forensic-facts/v1`)** | Pseudonymized user-experience and sizing aggregates (logon duration, concurrency, CPU/RAM demand) from the optional forensic tier | [avd-swarm spec §6d](https://github.com/avd-ops/avd-swarm/blob/main/docs/spec.md) |
| **`C13` (`avd-doc-findings/v1`)** | Machine-readable documentation drift findings produced by the brain's sweep for the Scribe role to draft as PRs | [avd-second-brain docs-spec](https://github.com/avd-ops/avd-second-brain/blob/main/docs/docs-spec.md) |
| **`C14` (`avd-target-state/v1`)** | An approved target-state architecture manifest consumed by `avd-landing-zone`'s `ConvertFrom-AvdTargetState.ps1` | [avd-assess contracts](https://github.com/avd-ops/avd-assess/blob/main/contracts/README.md) |
| **`C15` (`avd-fact-register/v1`)** | The canonical dictionary of every `c11.*`, `c12.*`, `c19.*`, and `c25.*` fact ID, its type, plane, and privacy classification | [avd-assess `contracts/fact-register.json`](https://github.com/avd-ops/avd-assess/blob/main/contracts/fact-register.json) |
| **`C18` (`avd-environment-record/v1`)** | The lifecycle decision and event log for an environment, linking every change (`why`) to an accepted or drafted decision | [avd-swarm decision 0007](https://github.com/avd-ops/avd-swarm/blob/main/docs/decisions/0007-every-plan-says-why.md) |
| **`C19` (`avd-intake/v1`)** | Operator-answered business, residency, identity, and scope inputs that telemetry cannot observe | [avd-assess contracts](https://github.com/avd-ops/avd-assess/blob/main/contracts/README.md) |
| **`C21` (`avd-assessment/v1`)** | A scored, evidence-backed assessment report across the five control planes and eight architecture pillars | [avd-assess contracts](https://github.com/avd-ops/avd-assess/blob/main/contracts/README.md) |
| **`C23` (`avd-assessment-review/v1`)** | The operator's recorded disposition (`fix`, `accept`, `defer`) and rationale for each assessment finding | [avd-current-state portal](https://github.com/avd-ops/avd-current-state/blob/main/docs/assessment-portal-spec.md) |
| **`C24` (`avd-remediation-plan/v1`)** | An ordered remediation plan generated from an assessment report (`C21`), its review (`C23`), and the pinned method catalog | [avd-assess remediation method](https://github.com/avd-ops/avd-assess/blob/main/methods/remediation.md) |
| **`C25` (`avd-benchmark-result/v1`)** | Pseudonymous Tier 1 (active synthetic) and Tier 2 (passive Log Analytics / Graph) performance benchmark percentiles (`p50`, `p90`, `p95`, `p99`) | [avd-assess benchmark contract](https://github.com/avd-ops/avd-assess/blob/main/contracts/schemas/benchmark-result.schema.json) |
| **`C26` (`avd-cloud-environments/v1`)** | The canonical endpoint, Private DNS zone, region, and capability map for `commercial` (`AzureCloud`) and `usgov` (`AzureUSGovernment` / GCC High) across all five control planes | [decision 0013](../decisions/0013-azure-us-government-and-gcc-high-support.md) |

## Architecture, maturity, and governance terms

The operating model, maturity levels, and safety boundaries shared by all repositories.

<!-- more -->

| Term | What it is | Owner |
|---|---|---|
| **Five control planes** | The split of desktop estates into Entra ID (`avd-entra`), Intune (`avd-intune`), Microsoft 365 (`avd-m365`), Azure ARM (`avd-azure`), and Power Platform (`avd-power-platform`), orchestrated by `avd-landing-zone` | [decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md) |
| **Desktop DevOps** | Unified declarative engineering, assessment, and approval-gated operations across AVD Pooled, AVD Personal, Windows 365 Cloud PCs, and Microsoft Intune | [decision 0012](../decisions/0012-desktop-devops-for-avd-win365-and-intune.md) |
| **Maturity (`proven`, `pre-beta`, `design`)** | How far a repo has been validated: `proven` (repeated real Azure runs and guards), `pre-beta` (built and tested offline, fewer live runs), or `design` (spec and spikes only) | [roadmap spec §6](https://github.com/avd-ops/avd-ops/blob/main/docs/roadmap-spec.md) |
| **Standing (`run`, `guarded`, `built`, `designed`)** | How strong the evidence is for a single security or architecture claim in `avd-assess`'s security review map | [security review page](https://avd-ops.dev/security.html) |
| **Governance gate & `approve` environment** | `avd-swarm`'s check that validates evidence provenance, re-reads live state, verifies the approved plan hash, and requires a human approval before any write token is issued | [avd-swarm governance](https://github.com/avd-ops/avd-swarm/blob/main/docs/governance.md) |
| **Kill switch (`run`, `halt-actions`, `halt-agents`, `halt-all`)** | The layered tag and Conditional Access switch in `avd-swarm` that halts writes, model calls, or all automation immediately and can only be reset by the owner | [avd-swarm decision 0002](https://github.com/avd-ops/avd-swarm/blob/main/docs/decisions/0002-governance-and-kill-switch.md) |
| **Run record (`run-record/v1`)** | The local evidence bundle (`run-record.json`, `run-journal.jsonl`, `run-cost.json`) written by `avd-landing-zone` during a recorded deployment or sandbox batch | [avd-landing-zone sandbox runs](https://github.com/avd-ops/avd-landing-zone/blob/master/docs/sandbox-runs.md) |
| **Sandbox batch (`go batch <id> $<total>`)** | A priced queue of `sandbox-run/v1` test items that refuses to spend a cent without the owner's exact approval phrase bound to the batch hash | [sandbox batches](sandbox-batches.md) |
| **Never delete the last copy** | The family rule that no script, teardown, or agent deletes profiles, backups, or run evidence without a verified copy elsewhere or explicit `-DiscardLastCopy` | [never delete the last copy](https://github.com/avd-ops/avd-ops/blob/main/docs/never-delete-the-last-copy.md) |
| **Never leave the meter running** | The family rule that anything billing by time is torn down, stopped, or scheduled off at the end of a run unless opted in with an explicit expiry | [never leave the meter running](https://github.com/avd-ops/avd-ops/blob/main/docs/never-leave-the-meter-running.md) |
| **Private companion repo (`AVD_PRIVATE_REPO`)** | The operator's own private Git repository where unredacted run records, cost ledgers, and customer estate vaults are stored, never in public repos | [private companion repo](https://github.com/avd-ops/avd-ops/blob/main/docs/private-companion-repo.md) |
