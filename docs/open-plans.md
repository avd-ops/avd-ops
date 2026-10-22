# Open plans across the public AVD repos

Research project, not for production. Anyone may contribute or fork.

The one list of plans that are designed or being built in the public avd-ops repos, with where each plan's detail lives. Each repo stays the source of truth for its own plan; this page only points. As of 2026-10-22.

- **Rule:** a plan, spec or cost estimate for a public repo lives in that repo, never only in a chat or a private note. A PR that opens, finishes or parks a plan updates its row here in the same PR, or in a follow-up the same day.
- **Who:** `owner` means only the repo owner can do the next step (a decision, a merge, a release tag, a costed run); `anyone` means a contributor or a Claude session can pick it up.
- **Costed runs:** every run in a real Azure subscription needs a written estimate and the owner's go first ([sandbox runs](https://github.com/avd-ops/avd-landing-zone/blob/master/docs/sandbox-runs.md)).
- Settled outcomes and items that are on the [public roadmap](roadmap-spec.md) stay there; this page is for work still open.

## Designed or being built

| Plan | State | Next step | Who | Detail |
|---|---|---|---|---|
| avd-swarm core and adapters (WP0 to WP8) | Decision 0009 accepted; check runner, alert path and runbook endpoint merged | First runbook sandbox run, then one estimate for the check runner and alert path, red team before build step 3 | owner | [avd-swarm `docs/core-and-adapters.md`](https://github.com/avd-ops/avd-swarm/blob/main/docs/core-and-adapters.md) |
| Tripwire kit | Spec merged | Build the landing zone and current-state plumbing first, on the owner's go | owner | [avd-swarm `docs/tripwires.md`](https://github.com/avd-ops/avd-swarm/blob/main/docs/tripwires.md) |
| Drift detection | Phase 1 built | First read-only run; plan phases 2 and 3 | owner | [avd-current-state `docs/drift-spec.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/drift-spec.md) |
| Shared read-only identity | Built | First real run | owner | [avd-current-state `docs/reader-identity.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/reader-identity.md) |
| Local collector (hosts, then devices) | Spec merged; the owner's answers are in [avd-current-state #42](https://github.com/avd-ops/avd-current-state/pull/42) | Merge #42, then build host mode with preflight | owner, then anyone | [avd-current-state `docs/local-collector-spec.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/local-collector-spec.md) |
| Assessment portal | Phases 1 to 3 merged; phase 4 in [avd-current-state #51](https://github.com/avd-ops/avd-current-state/pull/51) | Review and merge #51 | anyone | [avd-current-state `docs/assessment-portal-spec.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/assessment-portal-spec.md) |
| Estate diagram | Spec merged | Phase 1 build offline | anyone | [avd-current-state `docs/diagram-spec.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/diagram-spec.md) |
| Shared portal engine | 1.0 released; current-state portal on it; 1.1.0 in [avd-ops #59](https://github.com/avd-ops/avd-ops/pull/59) | Landing zone vendors it (PR 3), delegates (4), probe (5), then avd-linecheck v0 | anyone | [`docs/portal-engine-spec.md`](portal-engine-spec.md) |
| avd-assess map | All 22 pillars merged; release v1.0.0 published | Evidence runs for the map (costed), wiring the standards library to `map.json` | owner | [avd-assess `docs/assess-spec.md`](https://github.com/avd-ops/avd-assess/blob/main/docs/assess-spec.md), [`docs/distribution-spec.md`](https://github.com/avd-ops/avd-assess/blob/main/docs/distribution-spec.md) |
| Standards library | Phase 1 merged | Phase 2: read the map's `map.json` | anyone | `site/standards/`, `scripts/site/build-standards.mjs` |
| Public roadmap page | Design merged; tracking issues #51 to #55 open | Owner labels the items, then build | owner | [`docs/roadmap-spec.md`](roadmap-spec.md) |
| Security review gaps | Issues open | Work the issues | anyone | avd-ops #45 to #49, avd-landing-zone #115 and #116, avd-current-state #45 |
| Code signing and releases | Decision 0008 accepted | First landing zone release tag; signing account issue | owner | [`docs/code-signing.md`](code-signing.md), avd-current-state #41 |
| Disaster recovery (same tenant) | Built offline | First recovery test (costed); check profile backup with shared key access off | owner | [avd-landing-zone `build/specs/recovery-spec.md`](https://github.com/avd-ops/avd-landing-zone/blob/master/build/specs/recovery-spec.md) |
| Blue/green host rotation | Rotation and pause merged | First rotation test (costed); decide whether a second-region ring joins the image pipeline spec | owner | [avd-landing-zone `build/specs/image-pipeline-spec.md`](https://github.com/avd-ops/avd-landing-zone/blob/master/build/specs/image-pipeline-spec.md) |
| Image pipeline | Built, never run | First image build | owner | same spec |
| Run recorder | Phases built | `-TeardownLogs` on cleanup; portal classification log | anyone | [avd-landing-zone `build/specs/run-recorder-spec.md`](https://github.com/avd-ops/avd-landing-zone/blob/master/build/specs/run-recorder-spec.md) |
| Never delete the last copy, never leave the meter running | Rules merged | Costed test run of the checks | owner | [`docs/never-delete-the-last-copy.md`](never-delete-the-last-copy.md), [`docs/never-leave-the-meter-running.md`](never-leave-the-meter-running.md) |
| Estate RAID log (C25) | Spec merged | Build after the open questions R2 to R6 (defaults in the spec) | owner | [avd-second-brain `docs/raid-spec.md`](https://github.com/avd-ops/avd-second-brain/blob/main/docs/raid-spec.md) |
| Brain and swarm v1 decisions D1 to D18 | Defaults stand until answered | Owner answers or keeps the defaults | owner | [avd-second-brain `docs/v1-review.md`](https://github.com/avd-ops/avd-second-brain/blob/main/docs/v1-review.md) |
| Outside coding agents | Hard rules in AGENTS.md; setup and review steps written | Owner sets up the agent account and fork, and tightens the main ruleset | owner | [`docs/outside-agents.md`](outside-agents.md) |
| Add pick-up items without Claude | To do, not started (owner, 2026-10-22: log it, no build yet) | Build later: a "Pick-up item" issue form (title, repo, goal, acceptance check) with a `pick-up` label, here for public items and in the owner's private repo for private ones; `checklist.html` lists open `pick-up` issues through the anonymous GitHub API it already uses, so no workflow, secret or paid service is needed. Check the existing issue forms and the org board sync first so nothing is duplicated; private items never land in a public repo | anyone | this row |

## Parked

| Plan | Resume when | Detail |
|---|---|---|
| avd-linecheck v0 | The owner runs spikes S1, S3 and S4 on the owner's own devices | [avd-linecheck `docs/spec.md`](https://github.com/avd-ops/avd-linecheck/blob/main/docs/spec.md) |
