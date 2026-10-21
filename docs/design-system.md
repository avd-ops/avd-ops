# avd-ops design system

One look and one frame for every public AVD page: avd-ops.dev, the deployment portal in avd-landing-zone, the assessment portal in avd-current-state, and any page a sibling repo adds later. It is a token stylesheet, the app shell every page opens in, a stylesheet for guided portal pages, a small theme script, the fonts and the brand files, in [`site/assets/`](../site/assets/). Version 2.0.1. Why it is a shell, and why other repos take a copy instead of a dependency: [decision 0005](knowledge/decisions/0005-one-app-shell-for-every-page.md). Every token and component, live in both themes: [avd-ops.dev/design/](https://avd-ops.dev/design/).

## Where the UI is

| Repo | Pages | Uses |
|---|---|---|
| avd-ops | every page of avd-ops.dev: home, architecture, `family/`, `docs/`, `design/` | 2.0.1: `avd-ops.css` + `avd-ops-shell.css` + `theme.js`, and `site.css` for its own layouts |
| avd-landing-zone | `site/portal/` (the deployment portal), `site/region-latency/`, the redirect pages | a vendored copy of 1.1.0; moves onto the shell next |
| avd-current-state | `site/portal/` (the assessment portal) | a vendored copy of 1.1.0; moves onto the shell after the deployment portal |
| avd-swarm, avd-second-brain, avd-liquidware | none yet (READMEs and Markdown docs only) | adopt this when they add a page |

Private repos stay out of it.

## Rules

- **Colors only through tokens.** No hex values outside the token blocks in `avd-ops.css`. A page that needs a new color adds a token here first, with its light and dark values (a test checks both dark blocks define every color token).
- **Fonts come from `assets/fonts/`, never a font CDN.** The portal promises it contacts no other site except its latency test and reachability probe, and the site keeps the same promise.
- **No inline styles.** Page layout goes in the page's own stylesheet (`site.css` here, the portal's `<style>` block there), built on the tokens.
- **Dark mode follows the system** (`prefers-color-scheme`), and `<html data-theme="light|dark">` forces one. The shell's theme button sets it and remembers the choice in that browser only (`theme.js`).
- **Touch first.** Every control in the shell is at least `--tap` (44px) on a touch screen, and no page scrolls sideways at 390px.
- **The notice stays first.** Every page shows the research-only notice before its first section: the shell's notice line (`details.notice`, one line that opens to the full text, which stays in the page), the `.warn` box on a page without the shell, or the portal's `.disclaimer` until the portals move.

## Tokens

| Group | Tokens | Use |
|---|---|---|
| Neutrals | `--bg` `--surface` `--sunken` `--fg` `--muted` `--line` `--line-strong` | page, cards, wells, text, borders |
| Accent | `--accent` `--accent-hover` `--on-accent` `--accent-soft` `--focus` | teal: links, primary actions, selected rows, focus rings |
| Shell | `--shell` `--shell-fg` `--shell-muted` `--shell-line` `--shell-hover` | the brand bar: the shield's ink in both themes, so every page opens on the same frame |
| Brand | `--brand` (#1ca998) `--brand-ink` (#0d1015) | the logo's teal and shield; brand surfaces only, not text on light backgrounds (the accent is the readable teal) |
| Tier | `--tier` `--tier-soft` | the optional Liquidware tier only |
| Results | `--good` `--caution` `--bad` `--info` and their `-soft` backgrounds | latency, preflight and verify results, and info for work in progress; never decoration |
| Notice | `--warn-bg` `--warn-line` `--warn-fg` | the research-only notice |
| Terminal | `--term-bg` `--term-head` `--term-text` `--term-muted` `--term-border` `--prompt` | Cloud Shell blocks |
| Status | `--s-built-*` `--s-design-*` `--s-slice-*` | repo status pills (design uses the info hue; there is no purple) |
| Type | `--display` (Schibsted Grotesk), `--body` (Source Sans 3), `--mono` (JetBrains Mono) | headings, text, code and labels |
| Shape | `--radius` 8px, `--radius-sm` 6px, `--radius-lg` 14px, `--pill`, `--shadow`, `--shadow-2` | cards, controls, chips, the family map, the drawer |
| Space | `--space-1` to `--space-6` (0.25 to 2.5rem), `--measure` 46rem, `--page` 76rem, `--side` 15rem, `--gutter` 16px, `--tap` 44px | rhythm, reading column, the shell's width and side list, phone gutter, touch targets |
| Motion | `--ease`, `--fast` 120ms, `--slow` 220ms | short state changes; off under reduced motion |

## Components

| Class | What it is |
|---|---|
| `header.top` | The top bar. `.brand` holds the mark (`img.mark`, `brand/mark.svg`) and the word avd-ops; a page may follow it with `.sep` and its own title (the portal: avd-ops / AVD deployment portal), then `nav` or its own links. |
| `.warn` | The research-only notice box. |
| `.eyebrow` | Small mono uppercase label above a title or card. |
| `.chip`, `.chips` | Contract and tag chips. |
| `.status.s-built` / `.s-design` / `.s-slice` | Repo status pills. |
| `.card` | Surface with a border. |
| `.cta`, `.cta.ghost` | Primary and secondary link buttons. |
| `.tbl` + `table` | Scrollable table. |
| `pre`, `code` | Code; command blocks still follow the standalone Cloud Shell rule. |
| `footer.site` | Footer with the license and trademark lines. |

## Shell

`avd-ops-shell.css` is the frame every page opens in. Load it after `avd-ops.css`, load `theme.js` in `<head>` without `defer`, and put `class="shell"` on `<body>`; every rule is scoped to `.shell`, so a page without it never changes (a test checks the scoping, the tokens and that the shell, `theme.js` and the tokens carry one version).

| Piece | What it is |
|---|---|
| `header.bar` | The brand bar, sticky, in `--shell` in both themes: the mark and the word avd-ops, then `nav.switcher` (Docs, Deploy, Assess; the current one carries `aria-current`), then the theme button and, below 64rem, the menu button. The word hides below 30rem. |
| `details.notice` | The research notice as one line (a shorter one on phones) that opens to the full text. The full text stays in the page. |
| `.layout` > `nav.side` + `main` | The side list and the page. Below 64rem the side list is a drawer the menu button opens (`body.drawer-open`, Escape or the backdrop closes it); without JavaScript it sits below the page. `main > .col` keeps text to the reading column; a page may use the full width (the home page's map, the architecture page). |
| `footer.foot` | The license and trademark lines, the page's own line, and the credit line (`.credit`). |
| `.skip` | Skip to content, visible on focus. |

A portal uses the bar, the notice and the footer and leaves out the side list and the menu button (it has its own stage rail); `theme.js` then wires only the theme button. The bar is matched as `header.bar`, so a portal's own `.bar` (the latency chart's bars) keeps its look (2.0.1).

On avd-ops.dev, `scripts/site/shell.mjs` writes the shell: `build-docs.mjs` wraps the docs in it, and `apply-shell.mjs` writes it into the hand-written pages between their `<!-- shell:head -->`, `<!-- shell:top -->` and `<!-- shell:foot -->` markers (`--check` in the tests). The switcher's Deploy and Assess links come from `portal` in [`repos.json`](../repos.json). A copy hosted somewhere else sets its own links, or leaves the switcher out.

## Portal components

`avd-ops-portal.css` holds what a guided, step-by-step page needs: the deployment portal drew these first, and they live here so the assessment portal and any later portal vendor one copy instead of copying each other (code flows one way between the landing zone and avd-current-state). Load it after `avd-ops.css` and put `class="portal"` on `<body>`; every rule is scoped to `.portal`, so the avd-ops.dev pages never change (a test checks the scoping, the tokens and that both files carry one version).

| Class | What it is |
|---|---|
| `ol.steps` | The progress rail: one numbered stop per stage, `li.done`, `li.current`, `li.locked`, an optional `data-phase` label; circles only on phones, plus the current label. |
| `.panel`, `.stage` | A surface for a stage or a collapsible block (`details.panel`); `.panel.accent` for Settings. One `.stage` shows at a time. |
| `.slot` > `.stop` | The "Run in Cloud Shell, then paste the output" timeline; a stop takes `.good`, `.ok` or `.poor` once its result is known. `.stop > .label` is the stop's name. |
| `.term` | A Cloud Shell block with its own Copy button (`.term-head`, `.term-label`, `pre`). |
| `textarea.paste` | The paste box. |
| `.row`, `.field`, `fieldset`, `label.switch` | Form layout, a labeled field with an optional hint (`small`), a group, a toggle. `textarea.prose` for notes. |
| `button`, `.secondary`, `.linkbtn`, `a.btnlink` | Primary, secondary and link-style actions. |
| `.stepnav` | Back and Next, sticky at the bottom; `.where` names the stage. |
| `.result.good` / `.ok` / `.poor` | A run's overall result. |
| `.outcome.o-pass` / `.o-warn` / `.o-gap` / `.o-unknown` | A check's outcome. Each pill carries its word, never color alone. |
| `.segmented` | A radio group drawn as joined buttons (`role="radiogroup"`, `label > input[type=radio] + span`), such as Fix, Accept, Defer. |
| `.filedrop` | A file input with a drop zone; the page fills `.file` and `.error`. The hint says the file is read in the browser and never uploaded. |
| `.table-wrap`, `table.kv`, `td.num` | A table in its own border, a key and value table, numbers. |

## Logo

The mark is a shield holding a desktop with a cloud, and the >< of a remote session (Nick's logo, 2026-10-20, rebuilt as vector; tagline "Deploy quietly"). Files in `site/assets/brand/`:

| File | Use |
|---|---|
| `mark.svg` | Full-color square mark: teal field, ink shield. The top bar shows it at 26px beside the word "avd-ops". |
| `favicon.svg` | The same mark with rounded corners, for the browser tab. |
| `mark-white.svg` | One-color white shield, for dark backgrounds (stickers, slides, social images). |

The mark needs no text; where a page names the brand, it sets "avd-ops" in `--display` beside the mark rather than using an image of the word. After changing a brand file here, copy `brand/` to the repos that vendor `assets/`.

## Take a pinned copy

Pages that can't load avd-ops.dev at run time (the portals make no requests to other sites) vendor a copy, and avd-landing-zone and avd-current-state must keep working with no other repo, so the copy is a copy, never a dependency: no runtime request, no fetch in CI, no package. [`site/assets/MANIFEST.json`](../site/assets/MANIFEST.json) lists every file to vendor with its SHA-256 (`scripts/site/design-manifest.mjs`; the tests fail if it is stale), and each release is tagged `ds-v<version>` on its merge commit in avd-ops (the owner tags it after the merge).

A repo that takes a copy keeps it in `site/assets/` and records the tag and the manifest's hashes in `site/assets/design-system.lock.json`; its own design-system test checks the files still match, so local changes go in that repo's own stylesheet. From Azure Cloud Shell, in a clone of the repo that adopts it (set the tag first):

```bash
TAG=ds-v2.0.1; rm -rf /tmp/avd-ops && git clone -q --depth 1 --branch "$TAG" https://github.com/avd-ops/avd-ops.git /tmp/avd-ops && mkdir -p site/assets && (cd /tmp/avd-ops/site/assets && cp -r avd-ops.css avd-ops-shell.css avd-ops-portal.css theme.js fonts brand "$OLDPWD/site/assets/") && jq --arg tag "$TAG" --arg commit "$(git -C /tmp/avd-ops rev-parse HEAD)" '{tag:$tag,commit:$commit,files:.files}' /tmp/avd-ops/site/assets/MANIFEST.json > site/assets/design-system.lock.json
```

Then link `assets/avd-ops.css`, `assets/avd-ops-shell.css` and `assets/theme.js` (relative to the page), drop the page's own `:root` palette and font faces, and keep only its own components. A portal page also links `assets/avd-ops-portal.css` and sets `class="portal shell"` on `<body>`. Bump in each repo with its own pull request, with before and after screenshots at 390, 820 and 1440 in both themes.
