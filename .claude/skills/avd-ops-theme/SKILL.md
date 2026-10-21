---
name: avd-ops-theme
description: Use when making a new web page or Claude artifact for the AVD family or avd-ops (a proposal, review, dashboard, plan, a sibling repo's first page), so it opens in the avd-ops look - tokens, shell, fonts, logo, light and dark.
---

# Start a page or artifact in the avd-ops look

The avd-ops design system lives in avd-ops (`site/assets/`, documented in `docs/design-system.md`). Two
starters in `templates/` carry a whole release; start from one of them instead of writing a palette, fonts or a
header by hand.

## 1. Get the starter

Pick the file: `artifact.html` for a Claude artifact, `page.html` for a page committed to a repo.

- In a clone of avd-ops: `templates/<file>`.
- Anywhere else, from the newest release tag (the owner tags `ds-v<version>` after a merge; fall back to `main`
  if the tag is not there yet):

```bash
rm -rf /tmp/avd-ops && { git clone -q --depth 1 --branch ds-v2.2.0 https://github.com/avd-ops/avd-ops.git /tmp/avd-ops \
  || git clone -q --depth 1 https://github.com/avd-ops/avd-ops.git /tmp/avd-ops; } && cp -n /tmp/avd-ops/templates/artifact.html page.html
```

Copy it with the shell; don't retype it.

## 2. Fill it

- Rename `<title>` (a two to four word name) and, for `page.html`, the description meta.
- Replace everything between `<!-- page:start ... -->` and `<!-- page:end -->` with the page. Leave the bar, the
  notice line, the footer and the credit line, and the inlined style and script blocks, as they are.
- Use the shared classes before writing new ones: `.eyebrow`, `.lede`, `.card`, `.chips .chip`, `.status.s-*`,
  `.cta`, `.cta.ghost`, `.tbl > table`, `pre`, `.segmented`, `.untested`, `.requires`. The full list and the
  tokens are in `docs/design-system.md` and live at https://avd-ops.dev/design/.
- Page styles: in an artifact, a second `<style>` after the inlined one; in a repo, the page's own stylesheet
  (no inline style or script). Colors only through tokens (`var(--accent)`, `var(--surface)`, `var(--good)`...);
  if a color is missing, it becomes a token in avd-ops first, with light and dark values.
- Results colors (`--good`, `--caution`, `--bad`, `--info`) mean results, never decoration, and always come with a
  word.
- `.col` keeps text to the reading column; a wide table, chart or map may sit outside it, directly in `main`.

## 3. Rules that still apply

- The research-only notice and the credit line stay on every family page and artifact. A repo whose own notice
  says more keeps its wording (avd-liquidware also names Liquidware).
- Private repos don't use the starters: they brand the page avd-ops and say every repo is open source.
- A repo page takes a pinned copy of `site/assets/` first (`docs/design-system.md`, "Take a pinned copy") and
  never loads avd-ops.dev or a CDN at run time.
- Public pages name no private repo, tenant, customer, ID or secret; avd-ops.dev names no partner for now.
- American English. Phone width (390px) without sideways scroll, 44px touch targets in the shell.
- For an artifact, the artifact-design skill's contract still applies; the starter already meets its token,
  theme, gutter and font rules.

## 4. Changing the theme itself

Change the files in avd-ops `site/assets/`, bump the version line in all four (`avd-ops.css`,
`avd-ops-shell.css`, `avd-ops-portal.css`, `theme.js`), then run `node scripts/site/design-manifest.mjs`,
`node scripts/site/build-kit.mjs` and `node --test "tests/*.test.mjs"`, and open a pull request. The owner tags
`ds-v<version>` after the merge; Claude sessions can't push tags.
