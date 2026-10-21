# avd-ops brand kit

Every avd-ops logo and brand image, and the profile that describes them. Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.

- [`profile.json`](profile.json) is the brand profile: colors for light and dark, type, every file below with what it is for, the starters, the lines every page carries, and the rules. The `brand-profile` Claude skill reads it before making anything for avd-ops. A test keeps it equal to the design system ([`docs/design-system.md`](../docs/design-system.md)), which stays the source of truth.
- [`profile.schema.json`](profile.schema.json) is the profile's format. Nothing in it is specific to avd-ops, so any repo can keep a profile in the same shape at `brand/profile.json`.

## Vector (use these first)

In [`site/assets/brand/`](../site/assets/brand/), so pages and the repos that take a pinned copy have them too.

| File | Background | For |
|---|---|---|
| ![](../site/assets/brand/mark.svg) `mark.svg` | any | the square mark: brand bar, app icons, avatars |
| `favicon.svg` | any | the browser tab |
| `mark-white.svg` | dark | one color: photos, stickers, slides |
| ![](../site/assets/brand/lockup.svg) `lockup.svg` | light | README headers, slides, documents |
| `lockup-dark.svg` | ink or darker | the same on dark |
| `lockup-white.svg` | dark, photos | one-color printing |

The lockups are written by [`scripts/site/brand_lockups.py`](../scripts/site/brand_lockups.py) with the word and the tagline outlined from the design system's own fonts (Schibsted Grotesk 700, JetBrains Mono 600), so they look the same anywhere without a font installed.

## Pictures

In [`png/`](png/), for places that don't take SVG.

| File | Size | For |
|---|---|---|
| `avd-ops-avatar-1024.png` | 1024 | profile picture, teal field (GitHub org, social) |
| `avd-ops-avatar-black-1024.png` | 1024 | profile picture on ink |
| `avd-ops-app-avatar-white-1024.png` | 1024 | app icon or avatar on white |
| `avd-ops-logo-name-black-1024.png` | 1024 | shield over the word, on ink |
| `avd-ops-logo-name-white-1024.png` | 1024 | shield over the word, on white |
| `lockup-light-2400.png`, `lockup-dark-2400.png`, `lockup-transparent-2400.png` | 2400x600 | the lockups as pictures |
| `mark-512.png`, `favicon-180.png` | 512, 180 | the mark; the touch icon |
| `social-1200x630.png` | 1200x630 | link previews (Open Graph) |
| `github-social-1280x640.png` | 1280x640 | GitHub social preview for the public repos |

The 1024px tiles are the owner's originals. The rest are rendered from the vector files by [`scripts/site/brand-png.mjs`](../scripts/site/brand-png.mjs); run it after changing a brand file.

## Source

[`source/avd-ops-logo-concept.jpg`](source/avd-ops-logo-concept.jpg) is the owner's original concept (2026-10-20): the icon-only mark, the horizontal lockup and the one-color white version. It is reference only; the SVGs are the logo.

## Rules

- Use the files; never redraw, recolor, stretch or add effects to the mark.
- Clear space around the mark of at least a quarter of its height. Never smaller than 16px; below 24px use `favicon.svg`.
- On light backgrounds use `mark.svg` or `lockup.svg`; on ink or darker, `lockup-dark.svg` or `mark-white.svg`.
- The brand is always lowercase: avd-ops. The tagline is "Deploy quietly", set in uppercase mono in the lockups.
- Brand teal (`--brand`, #1ca998) is for brand surfaces; text and links use the accent.
- Private repos don't use this brand.
