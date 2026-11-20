---
status: accepted
date: 2026-11-20
decision-makers: [owner]
---

# 0029. Platform release standard and central release notes on avd-ops.dev

Standardize SemVer tagging, provenance-attested GitHub Releases, and a central release notes page at `avd-ops.dev/releases.html` across all public repositories.

## Context and Problem Statement

Release practices across the public `avd-ops` repositories are inconsistent, leaving most repositories without published releases or public release notes.

<!-- more -->

An audit of the 18 public repositories in `repos.json` showed that only `avd-assess` (`release.yml`) and `avd-current-state` (`release-local.yml`) had release workflows, only `avd-assess` and `avd-ops` had published GitHub Releases, and the four `CHANGELOG.md` files stopped at `## Unreleased`. Without a shared release contract and a central release notes page on `avd-ops.dev`, adopters cannot see what shipped or verify release integrity uniformly.

## Considered Options

Three options were weighed:

- **Shared release standard, reusable workflow, and central `avd-ops.dev/releases.html` aggregator:** Define one platform release standard, provide `.github/workflows/reusable-release.yml` in `avd-ops`, and aggregate every public repo's GitHub Releases onto `avd-ops.dev/releases.html` and `releases-feed.xml`.
- **Keep per-repo ad-hoc releases and rely only on the weekly blog digest:** Low effort, but leaves most repositories unversioned and forces adopters to hunt across 18 GitHub repositories.
- **Force every repo onto `avd-assess`'s bundle-diffing workflow:** Too heavy for infrastructure, Bicep, and docs-only repositories that do not ship versioned JSON schemas.

## Decision Outcome

Chosen option: "Shared release standard, reusable workflow, and central `avd-ops.dev/releases.html` aggregator".

<!-- more -->

Why: A lightweight reusable workflow plus one central aggregator gives every repository consistent SemVer tags, leak scanning, provenance attestation, and public release notes without forcing schema-bundle complexity on repos that do not need it.

### 1. Platform release contract

Every public repository in `repos.json` follows these release rules:

1. **SemVer tags on the default branch:** Release tags use `vMAJOR.MINOR.PATCH` (or `<component>-vMAJOR.MINOR.PATCH` in multi-artifact repos such as `avd-ops` for `ds-v*` and `pe-v*`), tagged on commits that are ancestors of `main` (or `master` in `avd-landing-zone`), protected by owner-only tag rulesets.
2. **Pre-release gates:** CI tests pass at the tagged commit, and generated release notes pass a leak scan before publishing.
3. **Immutable draft-then-publish with provenance:** Releases are created as drafts with `--verify-tag`, attached artifacts carry `.sha256` checksums and `actions/attest-build-provenance` attestations, and the release is published only after all uploads succeed.
4. **Keep a Changelog:** Repositories maintain `CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format, promoting `## Unreleased` entries into `## [X.Y.Z] - YYYY-MM-DD` on release.

### 2. Reusable workflow vs. specialized workflows

Standard repositories call `avd-ops/avd-ops/.github/workflows/reusable-release.yml@main` from `.github/workflows/release.yml` after their own test/build job. Repositories with specialized release pipelines keep them while aligning to the same gates:

- **`avd-assess`** keeps `release.yml` (bundle determinism, schema diffing, deprecation gate, and dual Python/PowerShell verifiers).
- **`avd-current-state`** keeps `release-local.yml` (Windows runner for Azure Artifact Signing of `avd_current_state_local.ps1`), adding `main`-ancestry verification and release-note leak scanning.

### 3. Monthly release train cadence (Patch Tuesday + 7 days) and BOM

A single platform release train runs monthly on **Patch Tuesday + 7 days** (the 3rd Tuesday of each month), giving Windows, FSLogix, Intune, and gallery-image updates a 7-day soak window before cutting. `platform-release.json` pins the compatible release tag (`platform-vYYYY.MM.PATCH`) across every repository in `repos.json`, audited by `.github/workflows/release-train.yml` (`scripts/ops/release_train.py`). Urgent security or regression fixes ship out-of-band as `.PATCH` releases.

### 4. Central release notes on `avd-ops.dev`

`scripts/site/fetch-releases.mjs` collects published GitHub Releases across `repos.json` into `site/data/releases.json`, and `scripts/site/build-releases.mjs` renders `site/releases.html` (showing the current platform release BOM, per-repo coverage, and layer/repo/channel filters) and `site/releases-feed.xml` (Atom 1.0). `.github/workflows/pages.yml` refreshes them on push, daily schedule, `workflow_dispatch`, and `repository_dispatch` (`release-published`).

### Consequences

- Good, because adopters get one release notes feed and coverage matrix across all 18 public repositories on `avd-ops.dev`.
- Good, because any repository can adopt SemVer, provenance attestation, and leak-scanned release notes with a minimal caller workflow.
- Bad, because each sibling repository still needs its own caller workflow PR and `v*` tag ruleset enabled by the owner.

## More Information

Related platform decisions:

- [Decision 0008: Code signing](0008-code-signing.md)
- [Decision 0017: Platform decisions live in avd-ops](0017-platform-decisions-live-in-avd-ops.md)
