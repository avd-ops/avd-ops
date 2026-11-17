---
status: accepted
date: 2026-11-17
decision-makers: [owner]
---

# 0025. Unify the avd-remediate and avd-swarm assistants at the protocol, UX, and corpus layers

`avd-remediate` adopts `avd-assistant`'s 4-stage deterministic-first router, modes, and brand while staying `$0` offline-first locally, and `avd-swarm`'s `Guru` mode indexes `avd-remediate` playbook summaries without hosting or executing local probes.

## Context and Problem Statement

`avd-remediate` and `avd-swarm` each grew an interactive assistant with different routing rules, personas, and safety controls.

<!-- more -->

`avd-swarm` defines `avd-assistant` (formerly `avd-buddy`): a 4-stage deterministic-first PWA hosted on an Azure Container App with Entra ID Easy Auth, four interactive modes (`chief_of_staff`, `red_team`, `guru`, `buddy`), explicit opt-in before LLM synthesis, a verdict-phrase filter, and a pinned SQLite FTS5 index. `avd-remediate` ships a docked local Chat Assistant (`aside#chat-drawer`) that runs deterministic playbook matching over local `--vault` notes, `C11`/`C21`/`C25` artifacts, and live `<<<AVDREM-STATE ...>>>` probes, and auto-calls a redacted BYO-LLM whenever configured. How should both assistants present one coherent experience without forcing `avd-remediate` to require Azure hosting or exposing unredacted `--vault` data to `avd-swarm`?

## Considered Options

Three options were weighed.

- Merge into `avd-swarm`: move all troubleshooting chat into `avd-assistant` and remove the local assistant from `avd-remediate`
- Leave separate: keep two independent chat protocols, prompts, and UIs
- Protocol, UX, and corpus unification: share the 4-stage deterministic-first router, modes, guardrails, and playbook summaries while keeping `avd-remediate` local-first and `$0` offline-capable

## Decision Outcome

Chosen option: "Protocol, UX, and corpus unification".

<!-- more -->

Why: operators get one assistant experience and consistent safety guardrails across diagnosis (`avd-remediate`) and fleet operations (`avd-swarm`), while `avd-remediate` preserves `$0` offline troubleshooting and local `--vault` privacy.

- **4-stage deterministic-first routing in `avd-remediate`:** Adopt `avd-assistant`'s Stage 0 scope gate and Stage 2 "no retrieval, no synthesis" rule with an explicit **"Synthesize with AI"** button instead of auto-invoking BYO-LLM on every `/api/chat` request. Retain `redact.js` scrubbing (`buildRedactedLlmPrompt`) before any external model call.
- **Shared brand, modes, and `F4` verdict filter:** `avd-remediate`'s drawer adopts `avd-assistant` branding and exposes `Guru` (default for Steps 1–3), `Red Team` (Step 4 plan review with no pass state), and `Chief of Staff` (local `C11`/`C21`/probe triage, explicitly badged as `Local Estate` when offline). Both enforce the protected verdict-phrase filter (`safe`, `approved`, `approve it`, `ok to approve`, `no issues`, `looks good`, `go ahead`).
- **Simple `Guru` corpus sharing:** `avd-swarm` pins `avd-remediate` by commit SHA in `governance/assistant-index.yml` and indexes `playbooks/catalog.json` summaries and citations only—linking to `avd-remediate` Step 4 for executable Day-2 fix blocks so `F1` (`catalog/snippets/`) remains untouched.
- **Optional fail-closed connected adapter:** `avd-remediate/scripts/server.mjs` may optionally forward Stage 3 synthesis or Path C (`avd-swarm` plan handoff) queries to `avd-assistant`'s `POST /api/turns`, sending **only** `buildRedactedLlmPrompt()` output after a fail-closed leak check (no raw `C11`, probes, or `--vault` notes).
- **Local BYO-LLM transparency:** When running local BYO-LLM without `avd-assistant`, badge replies as unshielded local BYO-LLM (redacted) to distinguish them from `avd-assistant`'s Prompt Shields and kill-switch-enforced path.

### Consequences

- Good, because `avd-remediate` stays `$0` and offline-capable with zero Azure Container App or Entra Easy Auth dependency.
- Good, because unredacted `--vault` notes and host probe outputs never leave the operator's workstation.
- Good, because `Guru` mode in `avd-swarm` stays simple and `F1` snippet-gate guarantees stay intact.
- Bad, because `avd-remediate` must maintain its own local implementation of the 4-stage router and verdict-phrase filter in JavaScript alongside `avd-swarm`'s Python router.

## More Information

Links and rollout sequence.

<!-- more -->

- `avd-swarm` assistant spec: `docs/assistant-spec.md` (`avd-ops/avd-swarm`).
- `avd-remediate` workbench spec: `docs/spec.md` (`avd-ops/avd-remediate`).
- Rollout order: (1) this ADR in `avd-ops`, (2) 4-stage router, modes, and `F4` filter in `avd-remediate`, (3) pinned `playbooks/catalog.json` summary indexing in `avd-swarm`, and (4) optional fail-closed `avd-assistant` adapter in `avd-remediate`.
