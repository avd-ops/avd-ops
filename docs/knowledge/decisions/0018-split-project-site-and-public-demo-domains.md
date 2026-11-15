---
status: accepted
date: 2026-11-15
decision-makers: [owner]
---

# 0018. Split project site (avd-ops.dev) and public demo hub (avd-ops.app)

`avd-ops.dev` is the project site and documentation, while `avd-ops.app` is the unified public demo hub powered by a Cloudflare Worker.

## Context and Problem Statement

The family's interactive portals were spread across five `*.avd-ops.dev` subdomains and a raw GitHub Pages URL.

<!-- more -->

Visitors evaluating the toolkit expect a clear boundary between project documentation and the interactive demo, and a single entry point for the browser portals rather than five subdomains. Where should the public demo live, and how should it relate to the existing repo-hosted portals?

## Considered Options

Three options were weighed:

- Route `avd-ops.app/*` through a Cloudflare Worker to the existing repo-hosted GitHub Pages portals, keeping `avd-ops.dev` for the project site and docs
- Move all portal subdomains to `*.avd-ops.app` (`deploy.avd-ops.app`, `assess.avd-ops.app`, etc.)
- Build a separate demo application in a new repository and duplicate the portal code

## Decision Outcome

Chosen option: "Route `avd-ops.app/*` through a Cloudflare Worker to the existing repo-hosted GitHub Pages portals, keeping `avd-ops.dev` for the project site and docs".

<!-- more -->

Why: each repo keeps ownership of its own portal code (`avd-landing-zone`, `avd-current-state`, `avd-migrate`, `avd-benchmark`, `avd-linecheck`) per [decision 0002](0002-avd-ops-is-the-front-door.md), while `avd-ops.app` presents one unified demo hub (`/`, `/deploy/`, `/assess/`, `/migrate/`, `/status/`, `/benchmark/`, `/linecheck/`) backed by static Contoso-style sample data with zero auth, zero backend state, and zero Azure spend.

### Consequences

- Good, because `avd-ops.dev` stays strictly static documentation and governance on GitHub Pages, while `avd-ops.app` gives visitors one URL for every interactive demo.
- Good, because shared `/assets/*` on `avd-ops.app` proxy cleanly to `https://avd-ops.dev/assets/*`, keeping the design system in one place ([decision 0005](0005-one-app-shell-for-every-page.md)).
- Bad, because the `avd-ops.app` Cloudflare Worker (`workers/app-router/`) must be deployed and bound to the `avd-ops.app` zone before the new switcher links resolve live.

## More Information

Canonical portal URLs and the Cloudflare Worker router live in this repository.

- [repos.json](../../../repos.json) defines the canonical portal URLs (`https://avd-ops.app/...`) consumed by `scripts/site/shell.mjs`.
- `workers/app-router/` contains the Cloudflare Worker source, `wrangler.jsonc`, and unit tests.
