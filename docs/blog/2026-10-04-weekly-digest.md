---
title: "Weekly digest: 2026-09-28 to 2026-10-04"
date: "2026-10-04"
summary: "Weekly digest (2026-09-28 to 2026-10-04): 32 feature updates, 1 fix across 2 repos."
repos: ["avd-current-state", "avd-landing-zone"]
tags: ["weekly-digest", "features", "fixes"]
---

Summary of public updates merged, released, or recorded across the **avd-ops** repositories for **2026-09-28 to 2026-10-04**.

## Features and updates

- **`avd-landing-zone`** (2026-09-28): [Portal issue reports (redacted in the browser) + Well-Architected review of the deployed landing zone (#19)](https://github.com/avd-ops/avd-landing-zone/pull/19) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Deployment portal: paste Cloud Shell output, get the next command (#18)](https://github.com/avd-ops/avd-landing-zone/pull/18) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Second brain: lessons, decisions, CLAUDE.md, offline scenarios as a CI gate, retro skill, session hook (#17)](https://github.com/avd-ops/avd-landing-zone/pull/17) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Profile share ACL: treat a missing permission key as the default root ACL (#16)](https://github.com/avd-ops/avd-landing-zone/pull/16) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Profile share ACL: list the response headers when the permission key is missing (#15)](https://github.com/avd-ops/avd-landing-zone/pull/15) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Profile share ACL: send x-ms-date; read the permission key and error body reliably (#14)](https://github.com/avd-ops/avd-landing-zone/pull/14) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Post-deployment fixes: private endpoint lookup, share ACL diagnostics, deploy.sh next-step message (#13)](https://github.com/avd-ops/avd-landing-zone/pull/13) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Preflight: stop Graph paging loops, self-heal a broken Graph sign-in, fix Cloud Shell account check (#11)](https://github.com/avd-ops/avd-landing-zone/pull/11) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Preflight: register providers without blocking; flag a Graph/Azure account mismatch (#10)](https://github.com/avd-ops/avd-landing-zone/pull/10) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Preflight: wait for registrations, -AddMeToGroups, host pool region fix; region page top 5 (#9)](https://github.com/avd-ops/avd-landing-zone/pull/9) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Add a region latency page and a region override for preflight and deploy (#8)](https://github.com/avd-ops/avd-landing-zone/pull/8) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Default the landing zone to North Central US (#7)](https://github.com/avd-ops/avd-landing-zone/pull/7) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Show the Microsoft Graph device-code prompt instead of discarding it (#6)](https://github.com/avd-ops/avd-landing-zone/pull/6) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Preflight: pre-deployment stage, caller-permission fix, clearer missing-landing-zone result (#5)](https://github.com/avd-ops/avd-landing-zone/pull/5) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Add Cloud Shell ops scripts: preflight with fix mode, demo deploy, cleanup (#4)](https://github.com/avd-ops/avd-landing-zone/pull/4) (merged PR)
- **`avd-landing-zone`** (2026-09-28): [Resolve PSRule findings and make PSRule a CI gate (#3)](https://github.com/avd-ops/avd-landing-zone/pull/3) (merged PR)
- **`avd-current-state`** (2026-09-29): [Report network checks a preceding failure prevented, instead of omitting them (#5)](https://github.com/avd-ops/avd-current-state/pull/5) (merged PR)
- **`avd-landing-zone`** (2026-09-29): [Portal: Cost step after sizing, with Start VM on Connect and auto shutdown toggles (#28)](https://github.com/avd-ops/avd-landing-zone/pull/28) (merged PR)
- **`avd-landing-zone`** (2026-09-29): [Portal: Deployment settings opens from a link in the header (#27)](https://github.com/avd-ops/avd-landing-zone/pull/27) (merged PR)
- **`avd-landing-zone`** (2026-09-29): [Portal sizer: minimum viable kit by default, choose the host count; American English (#26)](https://github.com/avd-ops/avd-landing-zone/pull/26) (merged PR)
- **`avd-landing-zone`** (2026-09-29): [Preflight -Fix recovers a soft-deleted Key Vault so a redeploy keeps its prefix (#25)](https://github.com/avd-ops/avd-landing-zone/pull/25) (merged PR)
- **`avd-landing-zone`** (2026-09-29): [Portal: horizontal steps, latency check first, later steps hidden until reached (#24)](https://github.com/avd-ops/avd-landing-zone/pull/24) (merged PR)
- **`avd-landing-zone`** (2026-09-29): [Cleanup: accurate Key Vault wording under -WhatIf; report deleted deployment records (#23)](https://github.com/avd-ops/avd-landing-zone/pull/23) (merged PR)
- **`avd-landing-zone`** (2026-09-29): [Auto shutdown: runbook on a schedule and on the budget (Stop / Lock / Resume) (#22)](https://github.com/avd-ops/avd-landing-zone/pull/22) (merged PR)
- **`avd-landing-zone`** (2026-09-29): [Portal sizing and cost step; E-series on Premium SSD by default (#21)](https://github.com/avd-ops/avd-landing-zone/pull/21) (merged PR)
- **`avd-landing-zone`** (2026-09-29): [Well-Architected review: fixes from the first live run (#20)](https://github.com/avd-ops/avd-landing-zone/pull/20) (merged PR)
- **`avd-landing-zone`** (2026-09-30): [Rebuild spec: one prompt to rebuild the landing zone, and how to count the prompts (#34)](https://github.com/avd-ops/avd-landing-zone/pull/34) (merged PR)
- **`avd-landing-zone`** (2026-09-30): [Disclaimers (personal project, not for production, as is) and preflight price matching by product (#33)](https://github.com/avd-ops/avd-landing-zone/pull/33) (merged PR)
- **`avd-landing-zone`** (2026-09-30): [Redeploy after cleanup: permanent Log Analytics delete, quota check fix, portal recognizes InvalidOutputTable (#32)](https://github.com/avd-ops/avd-landing-zone/pull/32) (merged PR)
- **`avd-landing-zone`** (2026-09-30): [Demo: test landing zone beside dev, cleanup that keeps what dev uses, demo script (#29)](https://github.com/avd-ops/avd-landing-zone/pull/29) (merged PR)
- **`avd-landing-zone`** (2026-10-04): [Specs: second brain (0012) and golden image pipeline (0013), both red-teamed; advisory Claude review workflow (#36)](https://github.com/avd-ops/avd-landing-zone/pull/36) (merged PR)
- **`avd-landing-zone`** (2026-10-04): [Cleanup purges the storage app from Entra's deleted items (spec rule 26) (#35)](https://github.com/avd-ops/avd-landing-zone/pull/35) (merged PR)

## Fixes and hardening

- **`avd-landing-zone`** (2026-09-28): [Fix NAT Gateway public IP in zoneless regions; random break-glass password; preflight provider progress (#12)](https://github.com/avd-ops/avd-landing-zone/pull/12) (merged PR)
