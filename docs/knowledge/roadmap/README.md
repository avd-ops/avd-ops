---
title: "Roadmap"
summary: "Where each AVD repo is today and what these docs will cover next"
topic: roadmap
status: plan
last_reviewed: 2026-10-21
---

# Roadmap

Where each repo stands, in a line. Each repo's own roadmap and build order are the source of truth.

| Repo | Today |
|---|---|
| [avd-current-state](../repos/avd-current-state.md) | Built: collector, validator and the C11 facts snapshot |
| [avd-assess](../repos/avd-assess.md) | Public: the five methods, with sources pinned and observations growing |
| [avd-landing-zone](../repos/avd-landing-zone.md) | Built: the landing zone, its CI and the deployment portal |
| [avd-second-brain](../repos/avd-second-brain.md) | Built and growing: knowledge base, contracts and docs check |
| [avd-swarm](../repos/avd-swarm.md) | Design and spike: the S1a spike runs; the write path is designed, not scheduled |

## Next for these docs

- A walkthrough from an empty lab subscription to a validated landing zone.
- A glossary of the terms the repos share.
- Per-repo pages rendered from each README at the commit pinned in `repos.json`.

## A family roadmap page (proposed)

A public roadmap across every repo is designed in [docs/roadmap-spec.md](../../roadmap-spec.md), not built. What the prior-art check found, for the next page like it:

- Open source roadmaps that hold up are built from issues: one public tracking issue per item, a status label, and done closes the issue with a link to what shipped ([GitHub's public roadmap](https://github.com/github/roadmap), [Kubernetes enhancements](https://github.com/kubernetes/enhancements)). Hand-written roadmap pages go stale (the [Backstage roadmap](https://backstage.io/docs/overview/roadmap/) names an update date already past).
- Leave dates out. The roadmaps that give quarters also warn that dates move.
- Say maturity apart from progress (Kubernetes' alpha, beta, stable). Here that is proven, pre-beta and design, so an item in progress in a design-stage repo can't read as nearly ready.
- Issue titles are written by whoever opened the issue: a generated page shows only approved items, checks who added the approval label, and pulls an item whose title changed after approval.

## A one-button network check for desktop users (proposed)

A static page that measures from the user's own device and gives a plain-language verdict, designed in [docs/linecheck-spec.md](../../linecheck-spec.md), not built. What the prior-art and browser checks found, for the next page like it:

- A browser can time HTTPS requests, not ping: `fetch` with `mode: 'no-cors'` proves DNS, a connection, TLS and some answer, and nothing about the status (a proxy's block page counts as reached). Cross-origin `PerformanceResourceTiming` zeroes the DNS, connect and request fields unless the host sends `Timing-Allow-Origin`, which Microsoft's endpoints don't; `duration` stays readable. No ICMP, traceroute or UDP from a page; UDP only through WebRTC toward a STUN or TURN server the page names, and TURN needs credentials. `performance.now()` is coarsened per engine: Chrome to 100 microseconds (5 in a cross-origin isolated page), Firefox to 1 ms by default, WebKit coarser than Chrome, so a jitter of a millisecond or two can be quantization.
- A static host can't take an upload (GitHub Pages answers 405) and can't set headers (CSP by `<meta>` only, no `frame-ancestors`); GitHub Pages has a soft 100 GB a month bandwidth limit, Cloudflare Pages 25 MiB per file and a `_headers` file.
- The speed-test projects ([LibreSpeed](https://github.com/librespeed/speedtest), LGPL-3.0; [OpenSpeedTest](https://github.com/openspeedtest/Speed-Test), MIT) find the maximum and need a server that accepts large POST bodies; a desktop user needs "enough", which Microsoft's per-activity bandwidth estimates put at a few Mbit/s, so a fixed small blob from the page's own origin answers it with "at least N". [@cloudflare/speedtest](https://github.com/cloudflare/speedtest) (MIT) is the best browser engine (Resource Timing, loaded latency, loss through TURN) but defaults to Cloudflare's endpoints and reports results to Cloudflare, so it can only be adopted if it runs with zero contact. [Globalping](https://github.com/jsdelivr/globalping) and [Speedtest Tracker](https://github.com/alexjustesen/speedtest-tracker) measure from probes or servers, not the user's device.
- Microsoft's AVD Experience Estimator was decommissioned (Microsoft Q&A, 2025-01-21); `avdnettest.exe` checks STUN, TURN and NAT type from a Windows device; the Windows App's connection information shows the transport a session really uses. The family already has a browser latency method in avd-landing-zone's deployment portal (decisions 0003 and 0014) and a TCP endpoint probe in avd-current-state ([#28](https://github.com/avd-ops/avd-current-state/issues/28) tracks its drift from Learn); one probe map in avd-assess is proposed so all three read the same list.
