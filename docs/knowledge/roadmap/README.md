---
title: "Roadmap"
summary: "Where each AVD repo is today and what these docs will cover next"
topic: roadmap
status: plan
last_reviewed: 2026-10-27
---

# Roadmap

Where each repo stands today, in one line each.

| Repo | Today |
|---|---|
| [avd-current-state](../repos/avd-current-state.md) | Built: collector, validator and the C11 facts snapshot; expanding across all five control planes ([decision 0010](../decisions/0010-expand-assess-and-current-state-across-five-control-planes.md)) |
| [avd-assess](../repos/avd-assess.md) | Public: the methods, with sources pinned, observations growing, and five-plane standards specified ([decision 0010](../decisions/0010-expand-assess-and-current-state-across-five-control-planes.md)) |
| [avd-landing-zone](../repos/avd-landing-zone.md) | Built: top-level orchestrator and deployment portal over the five control-plane repos ([decision 0009](../decisions/0009-split-landing-zone-into-five-control-planes.md)) |
| [avd-entra](../repos/avd-entra.md) | Bootstrapped: Entra ID groups, Conditional Access and Entra Kerberos control plane |
| [avd-intune](../repos/avd-intune.md) | Bootstrapped: Intune session-host MDM enrollment and Settings Catalog control plane |
| [avd-m365](../repos/avd-m365.md) | Bootstrapped: greenfield M365, OneDrive Known Folder Move and Teams VDI control plane |
| [avd-azure](../repos/avd-azure.md) | Bootstrapped: Azure ARM and Bicep infrastructure control plane |
| [avd-power-platform](../repos/avd-power-platform.md) | Bootstrapped: Power Platform governance and Power Automate day-2 workflow control plane |
| [avd-second-brain](../repos/avd-second-brain.md) | Built and growing: knowledge base, contracts and docs check |
| [avd-swarm](../repos/avd-swarm.md) | Design and spike: the S1a spike runs; the write path is designed, not scheduled |

<!-- more -->

Each repo's own roadmap and build order are the source of truth.

## Next for these docs

Three pages come next: a lab walkthrough, a glossary, and repo pages built from each README.

- A walkthrough from an empty lab subscription to a validated landing zone.
- A glossary of the terms the repos share.
- Per-repo pages rendered from each README at the commit pinned in `repos.json`.

## A family roadmap page (proposed)

A public roadmap built from issues is designed, not built yet.

<!-- more -->

A public roadmap across every repo is designed in [docs/roadmap-spec.md](../../roadmap-spec.md), not built. What the prior-art check found, for the next page like it:

- Open source roadmaps that hold up are built from issues: one public tracking issue per item, a status label, and done closes the issue with a link to what shipped ([GitHub's public roadmap](https://github.com/github/roadmap), [Kubernetes enhancements](https://github.com/kubernetes/enhancements)). Hand-written roadmap pages go stale (the [Backstage roadmap](https://backstage.io/docs/overview/roadmap/) names an update date already past).
- Leave dates out. The roadmaps that give quarters also warn that dates move.
- Say maturity apart from progress (Kubernetes' alpha, beta, stable). Here that is proven, pre-beta and design, so an item in progress in a design-stage repo can't read as nearly ready.
- Issue titles are written by whoever opened the issue: a generated page shows only approved items, checks who added the approval label, and pulls an item whose title changed after approval.

## A one-button network check for desktop users (proposed)

A page that checks a desktop user's network from their own device is designed, not built yet.

<!-- more -->

A static page that measures from the user's own device and gives a plain-language verdict, with a companion script that zips Windows App, Teams and performance logs to the user's Downloads folder. Designed, not built; it gets a link here when it is listed on this site. What the prior-art and browser checks found, for the next page like it:

- A browser can time HTTPS requests, not ping: `fetch` with `mode: 'no-cors'` proves DNS, a connection, TLS and some answer, and nothing about the status (a proxy's block page counts as reached). Cross-origin `PerformanceResourceTiming` zeroes the DNS, connect and request fields unless the host sends `Timing-Allow-Origin`, which Microsoft's endpoints don't; `duration` stays readable. No ICMP, traceroute or UDP from a page; UDP only through WebRTC toward a STUN or TURN server the page names, and TURN needs credentials. `performance.now()` is coarsened per engine: Chrome to 100 microseconds (5 in a cross-origin isolated page), Firefox to 1 ms by default, WebKit coarser than Chrome, so a jitter of a millisecond or two can be quantization.
- A static host can't take an upload (GitHub Pages answers 405) and can't set headers (CSP by `<meta>` only, no `frame-ancestors`); GitHub Pages has a soft 100 GB a month bandwidth limit, Cloudflare Pages 25 MiB per file and a `_headers` file.
- The speed-test projects ([LibreSpeed](https://github.com/librespeed/speedtest), LGPL-3.0; [OpenSpeedTest](https://github.com/openspeedtest/Speed-Test), MIT) find the maximum and need a server that accepts large POST bodies; a desktop user needs "enough", which Microsoft's per-activity bandwidth estimates put at a few Mbit/s, so a fixed small blob from the page's own origin answers it with "at least N". [@cloudflare/speedtest](https://github.com/cloudflare/speedtest) (MIT) is the best browser engine (Resource Timing, loaded latency, loss through TURN) but defaults to Cloudflare's endpoints and reports results to Cloudflare, so it can only be adopted if it runs with zero contact. [Globalping](https://github.com/jsdelivr/globalping) and [Speedtest Tracker](https://github.com/alexjustesen/speedtest-tracker) measure from probes or servers, not the user's device.
- Microsoft's AVD Experience Estimator was decommissioned (Microsoft Q&A, 2025-01-21); `avdnettest.exe` checks STUN, TURN and NAT type from a Windows device; the Windows App's connection information shows the transport a session really uses. The family already has a browser latency method in avd-landing-zone's deployment portal (decisions 0003 and 0014) and a TCP endpoint probe in avd-current-state ([#28](https://github.com/avd-ops/avd-current-state/issues/28) tracks its drift from Learn); one probe map is proposed so all three read the same list (in avd-current-state, each row citing the Learn pin, since avd-assess holds methodology and no copied tables).
- A browser cannot read local files, event logs or performance counters, so full log collection for an AVD issue needs a script on the device or in the session. Microsoft documents where each log lives (Windows App per platform, Teams in the session and its new VDI optimization on the endpoint, the event channels AVD Insights collects) and ships TSS with MSRD-Collect as the broad, elevated collector. Logs hold user, device and tenant names, so a bundle stays local and goes only to the user's own helpdesk; Downloads beats Documents as the destination because a OneDrive-synced Documents folder uploads it on arrival.
