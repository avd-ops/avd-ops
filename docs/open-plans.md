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
| Sandbox skill for coding agents (batch runner first) | Plan in [avd-swarm #48](https://github.com/avd-ops/avd-swarm/pull/48), tracking issue #47 | Owner merges the plan and decides on roadmap labels; then write the skill offline | owner, then anyone | [avd-swarm `docs/sandbox-skill.md`](https://github.com/avd-ops/avd-swarm/blob/main/docs/sandbox-skill.md) |
| Tripwire kit | Spec merged | Build the landing zone and current-state plumbing first, on the owner's go | owner | [avd-swarm `docs/tripwires.md`](https://github.com/avd-ops/avd-swarm/blob/main/docs/tripwires.md) |
| Drift detection | Phase 1 built | First read-only run; plan phases 2 and 3 | owner | [avd-current-state `docs/drift-spec.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/drift-spec.md) |
| Shared read-only identity | Built | First real run | owner | [avd-current-state `docs/reader-identity.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/reader-identity.md) |
| Local collector (hosts, then devices) | Spec merged; the owner's answers are in [avd-current-state #42](https://github.com/avd-ops/avd-current-state/pull/42) | Merge #42, then build host mode with preflight | owner, then anyone | [avd-current-state `docs/local-collector-spec.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/local-collector-spec.md) |
| Assessment portal | Phases 1 to 4 merged; wizard layout in [avd-current-state #54](https://github.com/avd-ops/avd-current-state/pull/54) ([items below](#assessment-portal-on-the-wizard-layout)) | Merge avd-ops #65 and tag `ds-v2.7.0`, then avd-current-state #53, then #54; later phase 5, one costed sandbox walk-through | owner | [avd-current-state `docs/assessment-portal-spec.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/assessment-portal-spec.md) |
| Estate diagram | Spec merged | Phase 1 build offline | anyone | [avd-current-state `docs/diagram-spec.md`](https://github.com/avd-ops/avd-current-state/blob/main/docs/diagram-spec.md) |
| Shared portal engine | 1.0 released; 1.1.0 (`redact.js`) merged in avd-ops #59, current-state portal on it | Owner tags pe-v1.1.0 on `b96622a`; then the landing zone vendors it (PR 3), delegates (4), probe (5), then avd-linecheck v0 | owner, then anyone | [`docs/portal-engine-spec.md`](portal-engine-spec.md) |
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

## Assessment portal on the wizard layout

The assessment portal (avd-current-state `site/portal/`) still uses the old layout: a step strip on top, long intros and every discovery question on one screen. The deployment portal already uses the wizard (design system 2.5.0 and later, ["Wizard"](design-system.md)): steps listed down the left, one screen at a time, the bottom line first and detail behind "+ more". These items move the assessment portal onto it. Items 2 to 9 are built in [avd-current-state #54](https://github.com/avd-ops/avd-current-state/pull/54) (stacked on #53), waiting for review; they stay here so anyone can check the result against them. Each one is small and can be done and checked on its own, in this order, in avd-current-state unless it says otherwise. Check: `node --test "tests/portal/*.test.mjs"` in avd-current-state, then look at the page at 1440px and 390px wide, light and dark.

- [ ] **1. Design system 2.7.0 first** (owner). Merge avd-ops #65 and tag `ds-v2.7.0` in avd-ops on #65's merge commit; if that commit differs from the one avd-current-state #53's `design-system.lock.json` pins, re-pin #53 to it; then merge #53. Everything below builds on 2.7.0.
- [ ] **1a. Look and merge** (owner). Walk the portal from #54's branch (the PR lists what was checked in a browser). Merge #54 after #53.
- [x] **2. Page frame** (anyone). `main.wz-layout` with a `header.top.wz-rail` holding the portal's name, one `.purpose` line, `ol.wz-list`, `ol.wz-progress` and `.wz-tools` (Settings, Report a problem); `nav.wz-nav.wide` for Back and Next. Remove the old `ol.steps`, `.top-intro` and `.stepnav`. Copy the structure from the deployment portal, avd-landing-zone `site/portal/index.html`.
- [x] **3. Steps** (anyone). Keep the five stages as the list's groups (Collect, Discover, Analyze, Review, Plan) and split Discover into four screens: Regions, Network and identity, Working hours, Users and use cases (which builds `intake.json`). A saved `discover` step opens the first Discover screen. `portal.js`: one `STEPS` list with each step's stage, used by the list, the progress bar, Back and Next and the report's stage name.
- [x] **4. One idea per screen** (anyone). Each step: a large `h2`, one `.purpose` line that says what to do, the one action, then the rest (the long intro, the optional reader check, what a file holds) behind `details.more`.
- [x] **5. Run in as one line** (anyone). Replace the segmented Run in bar with the `.runline` over the command ("For Cloud Shell, PowerShell. Change"); Change opens Settings, which now holds the Run in choice.
- [x] **6. Settings and Report a problem as sheets** (anyone). `.sheet` with a `button.sheet-backdrop`; the backdrop and Escape close them and focus returns to the tool that opened them.
- [x] **7. Results as a reply** (anyone). A pasted output's answer is a `.reply`: the verdict first (`.bl` with `good`, `ok` or `poor`), the headline, then the table behind "+ more".
- [x] **8. Guards** (anyone). Update `tests/portal/site.test.mjs` (the notice test now splits on `wz-list`) and add a test that every step has a section, a title and a purpose line.
- [x] **9. Spec** (anyone). Update the layout section of avd-current-state `docs/assessment-portal-spec.md`, and the row above when #54 merges.

## Parked

| Plan | Resume when | Detail |
|---|---|---|
| avd-linecheck v0 | The owner runs spikes S1, S3 and S4 on the owner's own devices, then gives the go for v0 ([items below](#avd-linecheck-pick-up-list)) | [avd-linecheck `docs/spec.md`](https://github.com/avd-ops/avd-linecheck/blob/main/docs/spec.md) |

## avd-linecheck pick-up list

avd-linecheck ([spec](https://github.com/avd-ops/avd-linecheck/blob/main/docs/spec.md)) is parked. These items let the owner or any agent move it forward in small steps, each done and checked on its own. Part A is free and needs only a browser. Part B waits for the owner's go. Every change in avd-linecheck follows its [AGENTS.md](https://github.com/avd-ops/avd-linecheck/blob/main/AGENTS.md) and [CLAUDE.md](https://github.com/avd-ops/avd-linecheck/blob/main/CLAUDE.md), and its check is `node --test "tests/*.test.mjs"`.

### A. Device runs of the spikes (owner, free, no tenant)

Each page has one button and a "Copy the result" button. A result holds the browser name and timings only. Record it by editing [`spikes/README.md`](https://github.com/avd-ops/avd-linecheck/edit/main/spikes/README.md) on GitHub: paste it under that spike's heading as a fenced block with the date and the network type (home Wi-Fi, cellular, office), then "Commit changes" on a new branch, which opens a pull request. Never paste an IP address, a network or device name, or a location finer than a country.

- [ ] **A1. S1, browser sample against ping.** Open https://linecheck.avd-ops.dev/s1/ and press the button. On the same device and network, run `ping login.microsoftonline.com` (Windows Command Prompt or macOS Terminal). Record the page's result and the ping round-trip times only (delete the address ping prints); if ping gets no reply, write "ping blocked". Do it on three networks: home Wi-Fi, cellular (phone hotspot), and one more if you can. Checks spec section 4.1's "upper bound on the round trip" wording on real networks.
- [ ] **A2. S3, browser capabilities.** Open https://linecheck.avd-ops.dev/s3/ and press the button on each of: Safari on a Mac, Safari on the iPad, Firefox (any desktop), Chrome on Android if one is at hand. It makes no network request and asks for no permission. Record one block per browser.
- [ ] **A3. S4, the 8 MiB file.** Open https://linecheck.avd-ops.dev/s4/ and press the button right away (cold), then again a minute later (warm). Do it on a desktop browser and on a phone, on Wi-Fi and on cellular (it downloads 40 MiB a run, so mind a metered plan). Record both runs. This decides whether the 8 MiB blob is a steady reading (spec section 4.4).
- [ ] **A4. Optional: S2 from home.** On a laptop on a home network (not Cloud Shell, which runs in Azure), run `curl -sI https://rdweb.wvd.microsoft.com/`. Record only the status line and the `x-ms-wvd-service-region` header, under S2.
- [ ] **A5. Fold the readings in** (anyone, after A1 to A3). Update the status table at the top of `spikes/README.md` and, where a reading changes a number or a wording, the spec section it names (4.1, 4.4, 13). If S1's ping comparison shows the browser sample is far from a real round trip, say so in 4.1 rather than tuning the bands.

### B. v0 build (waits for the owner's go)

The v0 scope is spec section 12.5: the run of section 5 with the generic pack, a verdict, an export with no personal data, and the paste-a-result view. Rules for every item: client-side only, no build step, plain HTML, CSS and JavaScript; nothing leaves the browser unless the user copies or downloads it; strict CSP (spec 8.2) with no inline script or style; the avd-ops design system and its wizard rules (one screen at a time, bottom line first, detail behind "+ more"); the probe from the shared portal engine, never a copy; build the download check, do not adopt `@cloudflare/speedtest` (spike S1 found its defaults call Cloudflare); the notice first on every page; American English, ASCII scripts. Do them in this order.

- [ ] **B0. The owner's go for v0** (owner). Read A1 to A5 first. Until the go, nothing below is built.
- [ ] **B1. Page frame** (anyone). `site/index.html` with the shell (bar, notice first, footer) from the design system vendored at the newest `ds-v` tag (2.5.0 or later, for the wizard) with its lock file; a `<meta>` CSP starting `default-src 'none'` before every script; a linked stylesheet only; `pages.yml` publishes `site/`. Check: tests for the notice, the CSP, no inline script or style (including `style=` attributes) and no absolute URL to the page's own origin; the `served` workflow stays green.
- [ ] **B2. Vendor the engine** (anyone). `core.js`, `bands.js` and `probe.js` from avd-ops `site/assets/engine/` at the newest `pe-v` tag, with a lock file and a hash test, as the portal engine spec section 4 describes. Check: the hash test fails when a vendored file changes.
- [ ] **B3. Packs** (anyone). `site/packs/schema.json`, `generic.json` (the page's own origin only, "reached or not") and a validator that refuses IP literals, private ranges, localhost and `http:`, and requires a claim on every threshold row and a final `otherwise` (spec 7). A test rebuilds `connect-src` from the pack and fails on a mismatch (spec 8.2).
- [ ] **B4. Download sufficiency** (anyone). Our own small function in `site/engine.js`: fetch `blobs/8m.bin` (random bytes made by a script, checked in with a hash) with `cache: 'default'`, catch a browser cache hit with `transferSize`, measure first byte to last, loaded latency only when the download ran 3 seconds, informational only (spec 4.4). Use A3's readings for the size. Check: Node tests on a scripted network.
- [ ] **B5. The run** (anyone). Nothing on page load; the page lists what it will contact (spec 8.1) before "Check my connection"; steps and deadlines as spec section 5, run through `probe.run` phases (jitter and the target region alone); `?region=` and `?lite` the only parameters. Check: a scripted test where every host times out ends in a verdict inside the run deadline, never a spinner.
- [ ] **B6. Verdict** (anyone). `site/verdict.js`, pure: the four states (`pass`, `warn`, `blocked`, `unknown`, `fail` only for a measured value over the line), worst first, one sentence per finding and the "not tested" list (spec 6.2). Check: fixtures, including a blocked network.
- [ ] **B7. Export** (anyone). `site/export.js`, pure: the JSON and summary of spec 8.3, top three regions by default. Check: a fixture holding an IP, a host name, a user name and a full user agent in the raw measurements, and a test that none reaches the output.
- [ ] **B8. Paste a result** (anyone). Schema check, render only enumerated states and numbers, sentences looked up from the shipped pack (spec 8.4). Check: a crafted paste with its own sentences renders none of them.
- [ ] **B9. Screens and access** (anyone). The wizard layout at 390px and 1440px, light and dark; a live-region progress bar; every state with a word and an icon; 44px touch targets; a word-list reading-level test on the sentences (spec 12.4).
- [ ] **B10. Close out** (anyone). Take the spike pages off Pages, update the README status and spec status, and move this plan's row from Parked to the table above.

### C. Also waiting for the owner

- [ ] **C1. Listing on avd-ops.dev** (owner). avd-linecheck stays off `repos.json`, `docs/knowledge/repos/`, the switcher and the site checklist until the owner says.
- [ ] **C2. v1 and later** (owner). The AVD pack (v1) reads avd-assess's endpoint map at a pin (Q6) with avd-current-state #28 aligned; device-only guided steps need the owner's captures (spec 18); every v2 server piece needs its own cost estimate and the exact go, and only free pieces are built (Q9).
