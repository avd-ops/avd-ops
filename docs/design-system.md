# avd-ops design system

One look for every public AVD page: avd-ops.dev and the avd-landing-zone deployment portal today, and any page a sibling repo adds later. It is one stylesheet, its fonts and the brand files, in [`site/assets/`](../site/assets/). Version 1.0.0.

## Where the UI is

| Repo | Pages | Uses |
|---|---|---|
| avd-ops | `site/index.html`, `site/family/*.html` (avd-ops.dev) | `assets/avd-ops.css` + `assets/site.css` (the lifecycle layout) |
| avd-landing-zone | `site/portal/` (the deployment portal), `site/region-latency/`, the redirect pages | a vendored copy of `assets/` + the portal's own components |
| avd-current-state, avd-swarm, avd-second-brain, avd-liquidware | none yet (READMEs and Markdown docs only) | adopt this when they add a page |

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
| Accent | `--accent` `--accent-hover` `--on-accent` `--accent-soft` `--focus` | links, primary actions, selected rows, focus rings |
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
| `header.top` | The top bar. `.brand` holds the logo slot (`img.mark`) and the word avd-ops; a page may follow it with `.sep` and its own title (the portal: avd-ops / AVD deployment portal), then `nav` or its own links. |
| `.warn` | The research-only notice box. |
| `.eyebrow` | Small mono uppercase label above a title or card. |
| `.chip`, `.chips` | Contract and tag chips. |
| `.status.s-built` / `.s-design` / `.s-slice` | Repo status pills. |
| `.card` | Surface with a border. |
| `.cta`, `.cta.ghost` | Primary and secondary link buttons. |
| `.tbl` + `table` | Scrollable table. |
| `pre`, `code` | Code; command blocks still follow the standalone Cloud Shell rule. |
| `footer.site` | Footer with the license and trademark lines. |

## Logo slot

The brand is `site/assets/brand/mark.svg`, a square mark shown at 26px beside the word "avd-ops", and `favicon.svg`. Both are a placeholder until the real logo lands. To swap it in, replace those two files (square SVG, legible at 16px, works on the light and the dark top bar) and copy them to the repos that vendor `assets/`. A wider wordmark, if there is one, goes in `brand/wordmark.svg`; the top bar keeps the square mark.

## Use it in another repo

Pages that can't load avd-ops.dev at run time (the portal makes no requests to other sites) vendor a copy at a tagged version into their own Pages folder, as `site/assets/`. From Azure Cloud Shell, in a clone of the repo that adopts it:

```bash
git clone --depth 1 https://github.com/nickprignano/avd-ops.git /tmp/avd-ops && mkdir -p site/assets && cp -r /tmp/avd-ops/site/assets/avd-ops.css /tmp/avd-ops/site/assets/fonts /tmp/avd-ops/site/assets/brand site/assets/
```

Then link `assets/avd-ops.css` (relative to the page), drop the page's own `:root` palette and font faces, and keep only its own components. The copy's first line names the version; bump it in both repos together.
