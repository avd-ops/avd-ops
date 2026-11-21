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

1. **SemVer tags on the default branch:** Release tags use `vMAJOR.MINOR.PATCH` (or `vMAJOR.MINOR.PATCH-prerelease` for pre-releases, and `<component>-vMAJOR.MINOR.PATCH` in multi-artifact repos such as `avd-ops` for `ds-v*` and `pe-v*`), tagged on commits that are ancestors of `main` (or `master` in `avd-landing-zone`), protected by owner-only tag rulesets.
2. **Pre-release code and tags:** Day-to-day changes merge to `main` (`master` in `avd-landing-zone`) and accumulate under `## Unreleased` in `CHANGELOG.md` without moving `platform-release.json`. When an explicit pre-release is needed (`-alpha.N`, `-beta.N`, `-rc.N`), `reusable-release.yml` detects `-` in the tag, passes `--prerelease` to `gh release create`, and `avd-ops.dev/releases.html` labels it `Pre-release` while keeping `platform-release.json` pinned to stable `/releases/latest` tags.
3. **Pre-release gates:** CI tests pass at the tagged commit, and generated release notes pass a leak scan before publishing.
4. **Immutable draft-then-publish with provenance:** Releases are created as drafts with `--verify-tag`, attached artifacts carry `.sha256` checksums and `actions/attest-build-provenance` attestations, and the release is published only after all uploads succeed.
5. **Keep a Changelog:** Repositories maintain `CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format, keeping entries under `## Unreleased` during pre-releases and promoting `## Unreleased` into `## [X.Y.Z] - YYYY-MM-DD` on stable release.

### 2. Reusable workflow vs. specialized workflows

Standard repositories call `avd-ops/avd-ops/.github/workflows/reusable-release.yml@main` from `.github/workflows/release.yml` after their own test/build job. Repositories with specialized release pipelines or stricter workflow guards keep them while aligning to the same gates:

- **`avd-assess`** keeps `release.yml` (bundle determinism, schema diffing, deprecation gate, dual Python/PowerShell verifiers, and strict 3-part SemVer without `-rc` suffixes).
- **`avd-current-state`** keeps `release-local.yml` (Windows runner for Azure Artifact Signing of `avd_current_state_local.ps1`), adding `main`-ancestry verification and release-note leak scanning.
- **`avd-swarm`** keeps a standalone `contents: write`-only `release.yml` (no `id-token: write`, SHA-pinned actions) to satisfy its `W1` workflow guard while running the same SemVer, ancestry, leak-scan, and draft-then-publish gates.

### 3. Monthly release train cadence (Patch Tuesday + 7 days) and BOM

A single platform release train runs monthly on **Patch Tuesday + 7 days** (the 3rd Tuesday of each month), giving Windows, FSLogix, Intune, and gallery-image updates a 7-day soak window before cutting. `platform-release.json` pins the compatible release tag (`platform-vYYYY.MM.PATCH`) across every repository in `repos.json`, audited by `.github/workflows/release-train.yml` (`scripts/ops/release_train.py`). Urgent security or regression fixes ship out-of-band as `.PATCH` releases.

### 4. Central release notes on `avd-ops.dev`

`scripts/site/fetch-releases.mjs` collects published GitHub Releases across `repos.json` into `site/data/releases.json`, and `scripts/site/build-releases.mjs` renders `site/releases.html` (showing the current platform release BOM, per-repo coverage, and layer/repo/channel filters) and `site/releases-feed.xml` (Atom 1.0). `.github/workflows/pages.yml` refreshes them on push, daily schedule, `workflow_dispatch`, and `repository_dispatch` (`release-published`).

### Consequences

- Good, because adopters get one release notes feed and coverage matrix across all 19 public repositories on `avd-ops.dev`.
- Good, because any repository can adopt SemVer, provenance attestation, and leak-scanned release notes with a minimal caller workflow.
- Bad, because each sibling repository still needs its own caller workflow PR and `v*` tag ruleset enabled by the owner.

## More Information

Related platform decisions:

- [Decision 0008: Code signing](0008-code-signing.md)
- [Decision 0017: Platform decisions live in avd-ops](0017-platform-decisions-live-in-avd-ops.md)
