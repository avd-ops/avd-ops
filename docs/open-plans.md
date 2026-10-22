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
| Square favicon and installable app icon | Logged, nothing built | Items 1 to 5 below in avd-ops, then 6 and 7 in the portals | anyone, owner tags | [items below](#favicon-and-app-icon-pick-up-list) |

## Favicon and app icon pick-up list

The owner's ask (2026-10-22): the square logo becomes the favicon in the design system, and the app icon when a page is installed as a web app. Nothing is built yet. The square logo is `site/assets/brand/mark.svg` (teal field, ink shield, square corners), the vector of the owner's `brand/png/avd-ops-avatar-1024.png`; make every icon from the SVG and never scale, crop or redraw the PNG. Today `favicon.svg` is the same mark with rounded corners (`rx="14"`), and no page has a web app manifest, a touch icon link or a theme color. Each item is small and checked on its own, in this order. Items 1 to 5 are one avd-ops PR; 6 and 7 are one PR each in their repo. Every page keeps the notice first; American English; no inline style.

- [ ] **1. Square favicon** (anyone). In `site/assets/brand/favicon.svg`, remove `rx="14"` from the first `<rect>`. Keep the file name, so every existing `<link rel="icon">` keeps working (`scripts/site/shell.mjs` `shellHead()`, `templates/page.html`, `scripts/site/build-kit.mjs`, and the vendored copies in the portals). Change its line in `brand/profile.json` ("The square mark, for the browser tab"), in the brand table in `docs/design-system.md` and in `brand/README.md`. Add to `tests/brand.test.mjs` that `favicon.svg` and `mark.svg` draw the same shapes. Check: `diff site/assets/brand/mark.svg site/assets/brand/favicon.svg` prints nothing, and `node --test "tests/*.test.mjs"` passes.
- [ ] **2. Icon pictures** (anyone). Render from `mark.svg` with `scripts/site/brand-png.mjs` (give each row an output folder; these four go to `site/assets/brand/`, not `brand/png/`, so the portals' pinned copy carries them):
  - `icon-192.png`, 192x192, the mark filling the canvas;
  - `icon-512.png`, 512x512, the same;
  - `icon-maskable-512.png`, 512x512, background `--brand` (#1ca998) with the mark at 75% of the canvas, so the shield stays inside the 80% circle a launcher may crop to;
  - `apple-touch-icon.png`, 180x180, opaque, the mark filling the canvas (iOS paints transparent corners black).

  Then retire `brand/png/favicon-180.png`, which is the rounded favicon on a transparent canvas: take its row out of the script, `brand/profile.json` and `brand/README.md`. List the four new files in `brand/profile.json` (`kind` `favicon`, `size`, `background` `brand` for the maskable one, `generated` naming the script) and in the brand README. The script needs Playwright with a Chromium (its header says how); a Claude cloud session already has one. Check: `file site/assets/brand/*.png` shows each size; `node --test tests/brand.test.mjs` passes (it fails on a brand file the profile doesn't list); look at `icon-maskable-512.png` through a circle mask in Chrome DevTools (Application, Manifest, "Show only the minimum safe area for maskable icons").
- [ ] **3. Manifest for avd-ops.dev** (anyone). `site/manifest.webmanifest`:
  ```json
  {
    "name": "avd-ops",
    "short_name": "avd-ops",
    "description": "Docs for the AVD repos. Personal project, research only, not for production.",
    "start_url": "./",
    "scope": "./",
    "display": "standalone",
    "background_color": "#f4f6f9",
    "theme_color": "#0d1015",
    "icons": [
      { "src": "assets/brand/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
      { "src": "assets/brand/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
      { "src": "assets/brand/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
  }
  ```
  `background_color` is `--bg` light and `theme_color` is `--shell` light, the ink of the brand bar in both themes; take both from `brand/profile.json`, never new hex values. Paths inside a manifest resolve from the manifest's own URL. No service worker: Chrome and Edge offer to install without one, and one would cache pages that must stay current. Check: a test in `tests/site.test.mjs` that parses the file, finds every icon on disk at its stated size (PNG width and height are bytes 16 to 23) and compares the two colors with the profile.
- [ ] **4. Head links** (anyone). In `shellHead()` in `scripts/site/shell.mjs`, after the icon link:
  ```html
  <link rel="apple-touch-icon" href="${up}assets/brand/apple-touch-icon.png">
  <link rel="manifest" href="${up}manifest.webmanifest">
  <meta name="theme-color" content="#0d1015">
  ```
  Then run `node scripts/site/apply-shell.mjs`, `node scripts/site/build-docs.mjs` and `node scripts/site/build-standards.mjs` so every page picks them up. Add the touch icon and theme color (not the manifest, which is per site) to the starter `templates/page.html` and the starter page in `scripts/site/build-kit.mjs`, then `node scripts/site/build-kit.mjs`. Check: extend the favicon assertion in `tests/site.test.mjs` to the touch icon and the manifest link; after Pages publishes, Chrome on https://avd-ops.dev/ shows the install button and DevTools, Application, Manifest lists no errors; on the iPad, Share, Add to Home Screen shows the square mark.
- [ ] **5. Design system release** (anyone, then owner). Raise the version line at the top of `avd-ops.css`, `avd-ops-shell.css`, `avd-ops-portal.css` and `theme.js` to the next minor after the newest one (2.7.0 is in avd-ops #65 at the time of writing), add an "Installable pages" paragraph to `docs/design-system.md` (the files above, the head lines, a manifest per site with its own name and `start_url`, `manifest-src 'self'` in a page's CSP), and run `node scripts/site/design-manifest.mjs`: the new pictures land in `site/assets/MANIFEST.json` on their own because `brand/` is vendored whole. Check: `node scripts/site/design-manifest.mjs --check` and `node --test "tests/*.test.mjs"`. Then the owner merges and tags `ds-v<version>` on the merge commit.
- [ ] **6. Deployment portal** (anyone, in avd-landing-zone, after the tag). Re-vendor with the Cloud Shell block in [Take a pinned copy](design-system.md#take-a-pinned-copy) at the new tag (it copies `brand/` with the new pictures and rewrites `site/assets/design-system.lock.json`). Add `site/portal/manifest.webmanifest` like item 3 with `"name": "AVD Deployment Portal"`, `"short_name": "Deploy"`, `start_url` and `scope` `"./"`, and icon paths `../assets/brand/...`. In `site/portal/index.html` add the three head lines from item 4 with `../` paths, and add `manifest-src 'self'` to its Content-Security-Policy meta tag, because `default-src 'none'` blocks the manifest otherwise (a copy published with the policy as a response header, as the page's comment describes, needs it there too). Pages that are not installable (`site/region-latency/`, the redirect pages) take only the touch icon line. Check: add the new links to `build/tests/portal/design-system.test.mjs`; `node --test "build/tests/portal/*.test.mjs"`; after Pages publishes, DevTools on https://deploy.avd-ops.dev/portal/ shows the manifest with no errors and no CSP error in the console.
- [ ] **7. Assessment portal** (anyone, in avd-current-state, after the tag). The same as item 6 in `site/portal/`, with `"name": "AVD Assessment Portal"` and `"short_name": "Assess"`; if the page has or gains a CSP, it carries `manifest-src 'self'`. Check: `node --test "tests/portal/*.test.mjs"` (its `site.test.mjs` checks the lock file) and the same DevTools look where the portal is published.

## Parked

| Plan | Resume when | Detail |
|---|---|---|
| avd-linecheck v0 | The owner runs spikes S1, S3 and S4 on the owner's own devices | [avd-linecheck `docs/spec.md`](https://github.com/avd-ops/avd-linecheck/blob/main/docs/spec.md) |
