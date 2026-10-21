---
status: accepted
date: 2026-10-21
decision-makers: [owner]
---

# 0005. One app shell for every avd-ops page, vendored as a pinned copy

## Context and Problem Statement

The avd-ops pages shared colors and fonts (design system 1.x), but avd-ops.dev, the docs, the
deployment portal and the assessment portal each had their own header and navigation. On a phone the
site's nav wrapped to three lines with 24px links, and the research notice was the largest thing on every
page. Moving from the site to a portal looked like changing products. How should every family UI share
one frame, without making avd-landing-zone and avd-current-state depend on avd-ops?

## Considered Options

- Tune-up: keep the 1.x layout, fix the nav, widths and touch sizes
- Control plane: one app shell (brand bar with a Docs, Deploy and Assess switcher, a side list that
  becomes a drawer, a one-line notice) for the site and every portal
- Cloud Shell: a dark-first, terminal-styled look across every page

## Decision Outcome

Chosen option: "Control plane", because only a shared shell makes the site and the portals one
product with one way to move between them, and it keeps the colors, fonts and logo already chosen.
The owner picked it from a rendered proposal with all three options on 2026-10-21.

- **One shell, written once.** `site/assets/avd-ops-shell.css` and `theme.js` in avd-ops; on
  avd-ops.dev, `scripts/site/shell.mjs` writes it into the docs and the hand-written pages, so the side
  list is the same everywhere (a test checks it).
- **Pinned copies, never a dependency.** Other repos vendor the files listed in
  `site/assets/MANIFEST.json` at a tag and record their hashes in their own lock file. Nothing loads
  from avd-ops.dev at run time or in CI, so the self-contained pair keeps working without avd-ops.
- **Touch first.** Controls in the shell are at least 44px on touch screens; the side list is a drawer
  below 64rem (iPad portrait and phones).
- **The notice stays whole.** It is one line under the bar that opens to the full text, and the full
  text stays in every page.

### Consequences

- Good, because the portals get the same frame by re-vendoring, one pull request per repo.
- Good, because a fork that hosts a portal itself can set its own switcher links.
- Bad, because the portals' headers change markup when they move onto the shell; their logic
  (`portal-core.js`, the state line, report redaction) must not change in the same pull request.

## More Information

- [Design system](../../design-system.md) has the tokens, components, files and the copy steps.
- The switcher leaves out avd-buddy until the app exists (owner, 2026-10-21).
- The footer carries the owner's credit line, "A prignano.ai production" (owner, 2026-10-21).
- Design system 2.3.0 (owner, 2026-10-21): the notice moved into the brand bar as a pill that opens
  to the full text under the bar, because a row of its own took too much space. The full text still
  stays in every page (a test checks it sits inside `header.bar`). The bar grew to 72px with the
  brand as in the horizontal lockup (mark, word, "Deploy quietly"); on phones it is 60px and the
  notice is a round button, so the switcher, notice and both buttons fit 360px. The page column now
  starts on the same line as the side list, and the menu button no longer shows on wide screens
  (`.shell .menu` lost to the more specific bar button rule; it is now `.shell header.bar .menu`).
- Also in 2.3.0 (owner, 2026-10-21): the theme moved to a mechanical, typewriter type: Space Mono
  for headings and IBM Plex Mono for text, controls and code. The logo keeps its own faces
  (Schibsted Grotesk for the word, JetBrains Mono for the tagline, as `--wordmark` and `--tagline`).
  Labels lost their tracked capitals, and pages no longer put a label above their title, after a
  frontend design pass.
