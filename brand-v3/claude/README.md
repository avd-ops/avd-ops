# Brand v3: Claude's run (`brand-v3-claude`)

One of two side-by-side implementations of the same brief (the other is in `brand-v3/gemini/` on its own branch). The real changes are applied across the repo on branch `brand-v3-claude`; this folder holds only the comparison card and screenshots. Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.

## Comparison card

**Branch:** `brand-v3-claude`, from `main`. The commit SHA is the PR's head commit.

### Design thesis

"Deploy quietly" as an instrument, not a brochure. The surfaces become a cool, teal-tinted neutral hierarchy drawn with three weights of 1px hairline instead of shadows, so the pages read as calm and exact. The bold moment is spent in one place: a system figure on a drafting grid that shows the whole ecosystem as layers (optional intelligence on top, assess, build and operate in the middle, five control planes on the platform ground) in the same diagram language as the architecture page and the exported diagrams. Everything structural (side list, figure, matrix) is written from `repos.json`, so the IA can't drift from the family.

### Token diff

| | 2.7.0 light / dark | 3.0.0 light / dark |
|---|---|---|
| `--bg` | #f4f6f9 / #0f1620 (blue slate) | #f5f7f7 / #0a0f11 (teal-tinted, deeper dark) |
| `--surface` | #ffffff / #16202c | #ffffff / #10171a |
| `--sunken` | #eef2f6 / #121b25 | #edf1f1 / #0c1315 |
| `--fg` | #152232 / #e4ebf3 | #0f1c1e / #e6eeee (16.2:1 / 16.4:1) |
| `--muted` | #566578 / #9aa9ba | #4e5e62 / #96a8ac (6.3:1 / 7.8:1) |
| `--line`, `--line-strong` | #d7dee8, #bfc9d6 / #2a3646, #3a4859 | #dae1e2, #b8c3c5 / #1f2a2e, #33434a |
| `--accent-hover`, `--accent-soft` | #09635a, #e0f2ef / #7fe0d2, #123331 | #075f56, #e1f2ef / #7fe0d2, #0f2e2b |
| `--shell` (dark) | #070a0d | #070a0c |
| New colors | | `--raised` #fbfcfc / #151e22, `--hairline` #e7ecec / #172024, `--grid` #e3eaea / #141d21, `--accent-line` #a9dbd3 / #1f5a52 |
| Shadows | soft gray cards | `--shadow` is a 1px hairline; `--shadow-2` only for what floats |
| Type scale | ad hoc sizes | `--fs-xs` .75 to `--fs-3xl` fluid 3.4rem (major third), `--lh-tight`, `--lh-snug`, `--track-display` -.024em, `--track-label` |
| Shape and space | 3 radii, 6 spaces | `--radius-xs` added (4 radii by object size), `--space-7` 4rem between page sections |
| Case | uppercase status, maturity, standing, verdict, portal result pills | sentence case everywhere but the logo's tagline |
| Maturity | outlined uppercase pill | a ring that fills: empty design, half pre-beta, full proven (`.mark-badge`, `.dot`) |

Brand teal `#1ca998`, brand ink `#0d1015`, the accent `#0b7a6e` / `#3cc8b4`, the result, notice, terminal and tier colors, and all four faces are unchanged. The mark and lockups are unchanged (so `brand_lockups.py` did not need to run).

### IA and layout

Side list `GROUPS`, four tiers:

- **Platform:** Overview, Start here, Concepts, Architecture
- **Ecosystem:** Repo guides first, then one group per architectural layer (`repos.json` `layer`, `shell.mjs` `LAYERS`):
  - Assess and plan: avd-current-state, avd-assess, avd-migrate, avd-benchmark
  - Build and change: avd-landing-zone
  - Control planes: avd-entra, avd-intune, avd-m365, avd-azure, avd-networking, avd-power-platform
  - Operate and support: avd-remediate, avd-linecheck
  - Intelligence, on top: avd-swarm, avd-second-brain
- **Governance and standards:** Security review, Standards library, Decisions, Roadmap, Docs roadmap, Research projects
- **System:** Design system, Graph, Credits

Switcher: Docs, Deploy, Assess, **Migrate** (new), Status. Below 60rem it takes its own row of equal 44px tabs, so all five fit a 360px phone.

`site/index.html`:

1. Hero: the thesis, three actions (Deploy a lab, Assess an estate, Read the architecture), three plain facts, and the system figure beside it (generated).
2. Where to start: three ordered paths, for evaluating, running a lab, and contributing.
3. The ecosystem, by layer: the matrix, one row per layer with every repo, its role, its maturity ring and its portal (generated).
4. What they share, then Contribute (kept).

`site/design/index.html` became a brand and design system showcase: principles, live swatches that show each value and its WCAG contrast in the current theme and copy `var(--token)` on press (`assets/design.js`), the four faces and the type scale, space and radii, shell anatomy, maturity, components, the diagram language, and the logo.

### Files changed

Brand and docs: `brand/profile.json`, `brand/profile.schema.json` (shape description), `brand/README.md`, `docs/design-system.md` (identity, diagrams, tokens, shell), `docs/knowledge/decisions/0005-one-app-shell-for-every-page.md` (3.0.0 entry), `docs/knowledge/troubleshooting/known-errors.yaml` and its generated README (one lesson).

Design system: `site/assets/avd-ops.css`, `avd-ops-shell.css`, `avd-ops-portal.css` (version and pill case), `theme.js` (version), `site.css`, new `design.js`, `MANIFEST.json`.

Generators and data: `repos.json` (`layer` per repo), `scripts/site/shell.mjs` (`LAYERS`, tiered `GROUPS`, Migrate, `systemFigure`, `layerMatrix`), `scripts/site/apply-shell.mjs` (family markers), `scripts/site/build-diagrams.mjs` (exports take brand token values).

Pages and outputs: `site/index.html`, `site/design/index.html`, every other page's shell (regenerated), `site/assets/diagrams/*`, `templates/page.html`, `templates/artifact.html`.

Tests: `tests/site.test.mjs` (the switcher with Migrate, 44px switcher tabs, and a new test that every repo appears in its layer in the matrix and the figure, and that the side list has its four tiers).

### Verification

```text
$ node --test "tests/*.test.mjs"
# tests 93
# pass 93
# fail 0

$ python3 scripts/kb/build.py && python3 scripts/kb/validate.py && python3 -m unittest discover -s scripts/kb
knowledge base is valid
Ran 56 tests
OK (skipped=3)
```

Also run: `apply-shell.mjs --check`, `build-docs.mjs`, `build-credits.mjs`, `design-manifest.mjs`, `build-kit.mjs`, `build-diagrams.mjs`, `engine-manifest.mjs --check`, `build-llms.mjs` and `check-llms-route.mjs`, all clean. No horizontal scroll at 360, 390, 820 or 1440 in either theme.

## Screens

| | |
|---|---|
| Home, 1440, light | [screens/home-1440-light.png](screens/home-1440-light.png) |
| Home, 1440, dark | [screens/home-1440-dark.png](screens/home-1440-dark.png) |
| Home, 390, light | [screens/home-390-light.png](screens/home-390-light.png) |
| Home, 360, dark | [screens/home-360-dark.png](screens/home-360-dark.png) |
| Layer matrix, 390 | [screens/matrix-390.png](screens/matrix-390.png) |
| Design system, 1440, dark | [screens/design-1440-dark.png](screens/design-1440-dark.png) |
| Docs, 1440, light | [screens/docs-1440-light.png](screens/docs-1440-light.png) |

## What a merge would mean

3.0.0 is a major release: the side list markup and the bar's height below 60rem change for every page that vendors the shell. After a merge the owner tags `ds-v3.0.0`; avd-landing-zone and avd-current-state re-vendor in their own PRs (their own switchers would add Migrate then).
