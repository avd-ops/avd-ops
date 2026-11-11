---
title: "avd-migrate"
summary: "Single-pool target-state baseline designer and C14 manifest writer: turns C11 facts, C19 intake and optional C27 measured usage into a single pooled desktop pool for avd-landing-zone"
topic: repos
status: verified
last_reviewed: 2026-11-11
---

# avd-migrate

The single-pool target-state baseline designer and `C14` manifest writer for Azure Virtual Desktop.

<!-- more -->

It combines a 5-step client-side portal (`site/portal/`) in the `avd-ops` design system with an offline PowerShell CLI (`ConvertTo-AvdTargetState.ps1`) that joins single-tenant Azure current-state facts (`C11`), operator intake (`C19`) and optional measured Insights usage (`C27`) into a single pooled desktop target-state manifest (`C14`) and approval (`manifest.approval.json`).

The repo is the source of truth: [avd-ops/avd-migrate](https://github.com/avd-ops/avd-migrate). This page says where it fits.

## What it does

It sizes one baseline pooled desktop pool (`tp-01`, up to 180 session hosts in one Azure stamp) and emits a schema-valid `C14` manifest completely offline.

<!-- more -->

- Reads pseudonymous `C11` (`avd-current-state-facts/v1`) from [avd-current-state](avd-current-state.md), `C19` (`avd-estate-intake/v1`) from [avd-assess](avd-assess.md), and optional 28-day `C27` (`avd-measured-usage/v1`) percentiles from `Export-AvdInsightsUsage.ps1`.
- Auto-merges source host pools into a single baseline pooled desktop pool (`tp-01`, `Pooled`, `Desktop`), capping at 180 session hosts and 1,000 concurrent sessions with transparent `boundaryNotices` whenever multiple source pools or delivery types were flattened.
- Enforces `connect-src 'none'` in the browser portal (`site/portal/`) and scrubs pasted or uploaded files locally via `redact.js` before emitting `manifest.json` and `manifest.approval.json`.

## How it fits

It bridges [avd-current-state](avd-current-state.md) and [avd-assess](avd-assess.md) to [avd-landing-zone](avd-landing-zone.md) for single-pool cloud-native AVD deployments.

<!-- more -->

- Consumes pinned schemas and workload-tier rules from [avd-assess](avd-assess.md), [avd-current-state](avd-current-state.md), [avd-second-brain](avd-second-brain.md) and [avd-landing-zone](avd-landing-zone.md).
- Emits `C14` (`avd-target-state/v1`) and `avd-target-approval/v1` files consumed directly by `ConvertFrom-AvdTargetState.ps1` in [avd-landing-zone](avd-landing-zone.md) (`avd-azure`, `avd-entra`, `avd-intune`, `avd-m365`, `avd-power-platform`).

## Read more in the repo

The repo has the full detail. Start here:

<!-- more -->

- [README and quick start](https://github.com/avd-ops/avd-migrate/blob/main/README.md)
- [Threat model and privacy boundary](https://github.com/avd-ops/avd-migrate/blob/main/docs/threat-model.md)
