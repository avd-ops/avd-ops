# avd-ops design system

One look for every public AVD page: avd-ops.dev and the avd-landing-zone deployment portal today, and any page a sibling repo adds later. It is one stylesheet, its fonts and the brand files, plus a second stylesheet for guided portal pages, in [`site/assets/`](../site/assets/). Version 1.1.0.

## Where the UI is

| Repo | Pages | Uses |
|---|---|---|
| avd-ops | `site/index.html`, `site/family/*.html` (avd-ops.dev) | `assets/avd-ops.css` + `assets/site.css` (the lifecycle layout) |
| avd-landing-zone | `site/portal/` (the deployment portal), `site/region-latency/`, the redirect pages | a vendored copy of `assets/` + the portal's own components (moving onto `avd-ops-portal.css`) |
| avd-current-state | `site/portal/` (the assessment portal) | a vendored copy of `assets/`, `avd-ops-portal.css` for its components |
| avd-swarm, avd-second-brain, avd-liquidware | none yet (READMEs and Markdown docs only) | adopt this when they add a page |

Private repos stay out of it.

## Rules

- **Colors only through tokens.** No hex values outside the token blocks in `avd-ops.css`. A page that needs a new color adds a token here first, with its light and dark values (a test checks both dark blocks define every color token).
- **Fonts come from `assets/fonts/`, never a font CDN.** The portal promises it contacts no other site except its latency test and reachability probe, and the site keeps the same promise.
- **No inline styles.** Page layout goes in the page's own stylesheet (`site.css` here, the portal's `<style>` block there), built on the tokens.
- **Dark mode follows the system** (`prefers-color-scheme`), and `<html data-theme="light|dark">` forces one.
- **The notice stays first.** Every page shows the research-only notice before its first section, in the `.warn` box (site) or the portal's `.disclaimer`.

## Tokens

| Group | Tokens | Use |
|---|---|---|
| Neutrals | `--bg` `--surface` `--sunken` `--fg` `--muted` `--line` `--line-strong` | page, cards, wells, text, borders |
| Accent | `--accent` `--accent-hover` `--on-accent` `--accent-soft` `--focus` | teal: links, primary actions, selected rows, focus rings |
| Brand | `--brand` (#1ca998) `--brand-ink` (#0d1015) | the logo's teal and shield; brand surfaces only, not text on light backgrounds (the accent is the readable teal) |
| Tier | `--tier` `--tier-soft` | the optional Liquidware tier only |
| Results | `--good` `--caution` `--bad` and their `-soft` backgrounds | latency, preflight and verify results; never decoration |
| Notice | `--warn-bg` `--warn-line` `--warn-fg` | the research-only notice |
| Terminal | `--term-bg` `--term-head` `--term-text` `--term-muted` `--term-border` `--prompt` | Cloud Shell blocks |
| Status | `--s-built-*` `--s-design-*` `--s-slice-*` | repo status pills |
| Type | `--display` (Schibsted Grotesk), `--body` (Source Sans 3), `--mono` (JetBrains Mono) | headings, text, code and labels |
| Shape | `--radius` 8px, `--radius-sm` 6px, `--pill`, `--shadow` | cards, controls, chips |
| Space | `--space-1` to `--space-6` (0.25 to 2.5rem), `--measure` 46rem, `--gutter` 16px | rhythm, reading column, phone gutter |
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

Images for places that take an upload rather than a page (GitHub avatars, slides), in `brand/` at the
repo root so they are not vendored with `site/assets/`. All 1024px square PNGs, rendered from the SVGs
in headless Chromium; the wordmark is `--display` (Schibsted Grotesk 700):

| File | Use |
|---|---|
| `avatar-teal-1024.png` | `mark.svg` as is; the avd-ops org avatar. |
| `avatar-white-1024.png` | The mark on white (`mark-on-white.svg`); the avd-ops-board GitHub App avatar. |
| `avatar-black-1024.png` | Teal shield on ink (`mark-on-black.svg`), for dark surfaces. |
| `logo-name-white-1024.png`, `logo-name-black-1024.png` | The white and black marks with "avd-ops" beneath. |

The mark needs no text; where a page names the brand, it sets "avd-ops" in `--display` beside the mark rather than using an image of the word. After changing a brand file here, copy `brand/` to the repos that vendor `assets/`.

## Use it in another repo

Pages that can't load avd-ops.dev at run time (the portal makes no requests to other sites) vendor a copy at a tagged version into their own Pages folder, as `site/assets/`. From Azure Cloud Shell, in a clone of the repo that adopts it:

```bash
git clone --depth 1 https://github.com/nickprignano/avd-ops.git /tmp/avd-ops && mkdir -p site/assets && cp -r /tmp/avd-ops/site/assets/avd-ops.css /tmp/avd-ops/site/assets/avd-ops-portal.css /tmp/avd-ops/site/assets/fonts /tmp/avd-ops/site/assets/brand site/assets/
```

Then link `assets/avd-ops.css` (relative to the page), drop the page's own `:root` palette and font faces, and keep only its own components. A portal page also links `assets/avd-ops-portal.css` and sets `class="portal"` on `<body>`. Each copy's first line names the version; bump it in every repo that vendors it together.
