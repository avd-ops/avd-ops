---
title: "avd-linecheck"
summary: "End-user browser network check: measures reachability, regional latency, jitter, setup overhead and download sufficiency from the user's device with zero sign-in"
topic: repos
status: verified
last_reviewed: 2026-10-28
---

# avd-linecheck

A one-button browser network check for people who work on a virtual desktop, running entirely on the user's device with no sign-in or server.

<!-- more -->

Published at [linecheck.avd-ops.dev](https://linecheck.avd-ops.dev/), it measures HTTPS reachability, regional round-trip latency, serial jitter, cold connection setup time and download sufficiency from the browser, then builds a scrubbed summary or JSON export a user can share with a helpdesk.

The repo is the source of truth: [avd-ops/avd-linecheck](https://github.com/avd-ops/avd-linecheck). This page says where it fits.

## What it does

It measures what a browser can honestly test from the user's network and names what it could not test.

<!-- more -->

- Ships workload packs for Azure Virtual Desktop in Commercial (`avd`) and US Government (`avd-gov`), Windows 365 (`w365`), Microsoft Teams VDI (`teams`), Microsoft 365 Core (`m365`), and a generic check (`generic`).
- Ranks Azure regions by browser HTTPS round-trip time, judges the target region against cited round-trip bands, and flags proxy, tunnel, TLS-inspection setup overhead and inside-the-session vantage caveats.
- Exports a scrubbed helpdesk JSON result (with optional before-and-after comparison and pre-filled helpdesk link builder) and an assessment intake record (`avd-assess-user-network/v1`), plus text-first guided steps for client logs and Shortpath verification.

## How it fits

It reuses the shared portal engine and feeds client-network evidence into assessments and support tickets.

<!-- more -->

- Shares the portal engine (`core.js`, `bands.js`, `probe.js`, `redact.js`) and design system with the [avd-landing-zone](avd-landing-zone.md) and [avd-current-state](avd-current-state.md) portals.
- Reads its pinned AVD endpoint map and round-trip threshold claims from [avd-assess](avd-assess.md), and exports `network.client` intake records that an administrator can attach to an assessment.

## Read more in the repo

The repo has the full detail. Start here:

<!-- more -->

- [Live network check portal](https://linecheck.avd-ops.dev/)
- [README and quick start](https://github.com/avd-ops/avd-linecheck/blob/main/README.md)
- [Design specification](https://github.com/avd-ops/avd-linecheck/blob/main/docs/spec.md)
