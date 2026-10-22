---
status: proposed
date: 2026-10-21
decision-makers: [owner]
---

# 0007. The theme ships as starters and a brand profile in avd-ops, not as its own repo or package

New pages and artifacts start from two starters in avd-ops. No theme repo, no package.

## Context and Problem Statement

A new page or a Claude artifact had nowhere to start from, so each rebuilt the look by hand.

<!-- more -->

The design system (decision 0005) reaches the two portals as pinned copies, but a new repo (avd-linecheck)
or a Claude artifact had no starting point: each would rebuild the bar, the notice, the fonts and the theme
switch by hand, and an artifact can't load a stylesheet from avd-ops.dev at all. What is the smallest thing
that lets any new page or artifact open in the avd-ops look, and does it need a repo of its own?

## Considered Options

Three options were weighed.

- Starters in avd-ops: `templates/page.html` and `templates/artifact.html`, generated from the release,
  plus a Claude skill that starts from them
- A separate theme repo, vendored the same way
- A package (npm) or a tokens file in the Design Tokens Community Group format, built with Style Dictionary

## Decision Outcome

Chosen option: "Starters in avd-ops".

<!-- more -->

Why: the release, its tags, its manifest, the reference page and
the tests that keep the pieces equal are already there; a second repo would split the source of truth and
add a second tag to keep in step, and a package would make the self-contained pair (avd-landing-zone,
avd-current-state) depend on a registry.

- **Generated, never hand-copied.** `scripts/site/build-kit.mjs` writes both starters from the same
  stylesheets and shell pieces as avd-ops.dev; `tests/kit.test.mjs` fails if they fall behind.
- **The page starter is CSP-strict.** It links the pinned copy and has no inline script or style, so a page
  with a strict policy (avd-linecheck's rule) can use it as is.
- **The artifact starter is one file.** Tokens, shell and theme switch inlined; fonts from Google Fonts, the
  only font host an artifact may load; the shell on a wrapper because the artifact host writes `<body>`.
- **A brand profile, in a format any project can use.** `brand/profile.json` sums up the brand (colors in
  both themes and their roles, type, every logo and brand image, starters, required lines, rules) to the schema
  in `brand/profile.schema.json`; `tests/brand.test.mjs` keeps it equal to the stylesheets. The owner asked
  for it to work for any project (2026-10-21), so nothing in the schema is specific to avd-ops.
- **A skill makes it the default.** The `brand-profile` skill (`.claude/skills/brand-profile/`, also in the
  owner's account) reads a project's profile before making a page, artifact or image, starts from its
  starters, and sets up or updates profiles for other projects.
- **Every brand file in the repo.** Vector logos and lockups in `site/assets/brand/` (pinned with the rest);
  avatars, PNG exports, social images and the original concept in `brand/`, outside the pinned copy.

### Consequences

- Good, because a new repo gets the look with one copy and one download, and an artifact with one copy.
- Good, because a release changes the starters in the same pull request.
- Bad, because an artifact made from an old starter keeps the old look; it is a copy, like any vendored file.
- Good, because tools outside a browser (slides, charts, images) read the colors and files from one JSON file.
- Bad, because the profile repeats the tokens; the test is what keeps it honest. If a tool needs the Design
  Tokens Community Group format, generate it from the profile rather than keep a third copy.

## More Information

Links, open questions and what changed later.

<!-- more -->

- [Design system](../../design-system.md), section "Start a new page".
- Prior art looked at: Style Dictionary and the DTCG token format (open source; no non-CSS reader here yet),
  copy-the-source component kits (the same vendoring idea this repo already uses).
