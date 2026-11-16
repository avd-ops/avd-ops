---
status: accepted
date: 2026-11-16
decision-makers: [owner]
---

# 0020. Frontend Microsoft AVD LZA via an optional C14-to-bicepparam starter export

Keep `avd-landing-zone` cloud-native and independent of Microsoft's Azure Virtual Desktop Landing Zone Accelerator (`Azure/avdaccelerator`), while offering an optional `C14`-to-`.bicepparam` starter export in `avd-migrate` for hybrid AD DS and brownfield estates.

## Context and Problem Statement

Hybrid AD DS and brownfield teams sometimes need Microsoft's broader AVD Landing Zone Accelerator (LZA) rather than `avd-landing-zone`'s cloud-native-only deployment path, without losing the `avd-ops` sizing, assessment, and Day-2 operations stack.

<!-- more -->

`avd-landing-zone` intentionally targets cloud-native, Entra ID-joined, Intune-managed deployments and points elsewhere for hybrid AD DS or broader brownfield patterns. Embedding or wrapping `Azure/avdaccelerator` inside `avd-landing-zone` would introduce an external repository dependency ([decision 0003](0003-the-family-ends-at-its-contracts.md)) and break the six-plane split, non-destructive brownfield stamping, and teardown guarantees. How should `avd-ops` offer an optional on-ramp to LZA without coupling the core landing zone to it?

## Considered Options

Three options were weighed:

- **Optional `C14` to `.bicepparam` starter export (`avd-migrate`):** Keep LZA outside the family, emit an optional LZA `.bicepparam` starter file with an explicit boundary notice from `avd-migrate`, and layer `avd-current-state`, `avd-second-brain`, `avd-remediate`, and `avd-swarm` on top post-deploy via `C11` facts.
- **Dedicated LZA adapter repo (like `avd-hcl`):** Wrap a pinned `Azure/avdaccelerator` release in a separate lane repo that emits `azure-outputs.json`.
- **Embed LZA inside `avd-landing-zone`:** Add LZA modules or runtime fetches as an optional mode in `avd-landing-zone`.

## Decision Outcome

Chosen option: "Optional `C14` to `.bicepparam` starter export (`avd-migrate`)".

<!-- more -->

Why: It gives hybrid AD DS and brownfield operators a low-friction on-ramp from `avd-current-state` (`C11`) and `avd-migrate` (`C14`) into LZA without taking a runtime dependency on `Azure/avdaccelerator`, chasing upstream parameter drift inside `avd-landing-zone`, or diluting `avd-landing-zone`'s cloud-native guarantees. Once LZA deploys, `avd-current-state`, `avd-second-brain`, `avd-remediate`, and `avd-swarm` still operate on top of the resulting estate through `C11` facts.

### Consequences

- Good, because `avd-landing-zone` and `avd-azure` stay strictly cloud-native with zero external repo dependencies ([decision 0003](0003-the-family-ends-at-its-contracts.md)).
- Good, because LZA adopters can still use `avd-current-state` -> `avd-second-brain` -> `avd-remediate` / `avd-swarm` post-deployment via redacted `C11` contracts.
- Good, because the exporter carries minimal maintenance overhead and can evolve independently if a dedicated adapter repo is ever needed later.
- Bad, because AD DS domain-join prerequisites, LZA-specific parameters, and LZA teardown remain outside `avd-ops` automation and must be documented via a clear boundary notice in the exported `.bicepparam` file.

## More Information

Links to related family decisions and repositories:

<!-- more -->

- [Decision 0003](0003-the-family-ends-at-its-contracts.md) establishes that the family ends at its contracts and never depends on external repositories.
- [Decision 0016](0016-terraform-as-enterprise-iac-option.md) establishes the separate-lane pattern (`avd-hcl`) if a full LZA wrapper repo is ever warranted later.
- [avd-migrate](../repos/avd-migrate.md) implements the `C14` baseline designer and optional LZA `.bicepparam` starter export.
