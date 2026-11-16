# CUA and External-Executor Plumbing Specification

Status: proposed (2026-11-16, [decision 0022](knowledge/decisions/0022-cua-external-executor-plumbing.md)).

`avd-swarm` and `avd-second-brain` are API-first: whenever an Azure ARM, Microsoft Graph, Intune policy-as-code, or `avd-landing-zone` Bicep/PowerShell path exists, agents use it. When a Desktop DevOps task has no API (legacy line-of-business consoles, portal-only settings, or interactive verification), `avd-swarm` needs a governed way to hand off a bounded task to an **external CUA executor** running against an isolated desktop and record the outcome in `avd-second-brain`.

This specification defines the public plumbing across `avd-ops`, `avd-landing-zone`, `avd-swarm`, and `avd-second-brain` while keeping external broker, policy-engine, and host-agent implementations outside the family per [decision 0003](knowledge/decisions/0003-the-family-ends-at-its-contracts.md).

---

## 1. Boundaries and Non-Goals

1. **API-first invariant.** CUA execution is a fallback for UI-only tasks, never a replacement for ARM, Graph, Bicep, or PowerShell automation.
2. **Contract boundary (`0003`).** Public repositories define only the generic extension points: isolated host pool infrastructure, the `external-executor` (`cua`) plan hook, kill-switch semantics, and the redacted `executor-evidence` record. No public repo depends on, fetches, or embeds an external CUA broker, UI-action policy engine, or host input service.
3. **No secrets or standing privilege.** Public contracts and plans never carry credentials, tenant/subscription GUIDs, or raw desktop screenshots.

---

## 2. Adopt from Microsoft vs. Build in the AVD Family

Per [build or adopt](build-or-adopt.md), the AVD family adopts Microsoft's identity and agent-desktop primitives as they ship and focuses engineering effort on the cross-plane governance and AVD-specific gaps Microsoft does not provide:

| Capability | Owner | Role |
|---|---|---|
| **Agent identity & auth logs** | Microsoft (adopt) | Entra Agent ID (`Agent ID user`, `agentType` in `SigninLogs`, Conditional Access for agents) |
| **Managed agent desktops (PAYGO)** | Microsoft (adopt) | Windows 365 for Agents (stateless PAYGO Cloud PCs, `mcp_W365ComputerUse`, Intune agent baselines) |
| **Endpoint security & DLP** | Microsoft (adopt) | Defender for Endpoint (ASR, EDR, device isolation), WDAC/App Control, Purview Endpoint DLP |
| **Same-tenant human + CUA split** | AVD family (build) | Humans on AVD (`avd-landing-zone`), CUAs on Windows 365 for Agents (PAYGO) by default—or on `avd-landing-zone` **isolated host pools** when custom VNet, image, or sovereign-cloud control is required |
| **Out-of-chat human approval** | `avd-swarm` (build) | Declarative `C9` plan approved in a GitHub Environment with no standing write credential and a pre-execution re-read |
| **Cross-plane kill switch** | `avd-swarm` (build) | Single `halt-actions` / `halt-agents` / `halt-all` switch stopping agents, API writes, and external CUA executors together |
| **Cross-lane & rogue-CUA detection** | `avd-swarm` (build) | KQL / watchdog correlation across `SigninLogs`, `WVDConnections`, MDE synthetic-input signals, and approved `C9` plans |
| **Decision-linked evidence** | `avd-second-brain` (build) | Redacted, hashed `executor-evidence` (`C10`) linked to `C18` lifecycle decisions |

---

## 3. Plumbing by Layer

| Layer | Repo(s) | Public Plumbing | Standalone Invariant |
|---|---|---|---|
| **Foundation** | `avd-landing-zone`, `avd-azure`, `avd-intune` | **Isolated host pool** flavor: single-session ephemeral AVD host pool, hardened image baseline (restricted shells, no clipboard/drive/USB redirection), per-task egress allowlist fragment, and Log Analytics diagnostics | Deploys and validates with zero dependency on `avd-swarm`, `avd-second-brain`, or any CUA executor |
| **Execution** | `avd-swarm` | **`external-executor` (`cua`) plan type** in the `C9` proposal path: declares target isolated host pool, bounded task intent, token/time budget, and rollback/cleanup step; gated by human approval in a GitHub Environment and the layered kill switch | `avd-swarm` CI, evals, and core write path run and pass with no external executor registered |
| **Intelligence** | `avd-second-brain` | **`executor-evidence` record** extending `C10` execution outcomes and `C18` lifecycle history with task status, target scope, timestamps, and artifact hashes | Brain builds and validates without any external executor present |

---

## 4. Governance and Safety Invariants

Every CUA task proposed through `avd-swarm` must satisfy the same controls as any other write action:

1. **Human approval outside chat.** A CUA plan (`external-executor`) is proposed via `C9` and executes only after a person approves that exact plan in a GitHub Environment. There is no autonomous or "confirm in chat" execution.
2. **Layered kill switch.** An external executor reading `avd-swarm` contracts must honor all three halt levels (`halt-actions`, `halt-agents`, `halt-all`). At `halt-actions` or above, no new CUA task may start and active tasks must stop cleanly.
3. **Single-session ephemeral isolation.** CUA tasks target single-session hosts only (never shared multi-session pools with human users) and reimage or deallocate at task end ([never leave the meter running](never-leave-the-meter-running.md)).
4. **Redacted evidence only.** Evidence returned to `avd-second-brain` (`executor-evidence`) records structured status, step counts, policy-check results, and SHA-256 hashes of external artifacts—never raw screenshots, keystrokes, PII, or tenant identifiers.
5. **Data-loss guard.** Any CUA task that reprovisions or deletes a session host or Cloud PC obeys [never delete the last copy](never-delete-the-last-copy.md).

---

## 5. Rollout Sequence

1. **`avd-ops` (this spec + ADR `0022`):** Establishes the public boundary and naming (`isolated host pool`, `external-executor`, `executor-evidence`).
2. **`avd-landing-zone`:** Adds the standalone isolated host pool flavor and image-baseline parameters, tested independently via Cloud Shell and Pester/Bicep checks.
3. **`avd-second-brain` and `avd-swarm` (together):** Add the `executor-evidence` schema extension (`C10`) and the `external-executor` (`cua`) plan type in `avd-swarm`'s gate and action catalog, keeping all existing core tests green with no external executor attached.
