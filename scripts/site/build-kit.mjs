// Writes the two starters in templates/ (docs/design-system.md, "Start a new page"): page.html, a page for a
// sibling repo that links a vendored copy of the design system and needs no inline script or style, and
// artifact.html, one self-contained file for a Claude artifact, with the tokens, the shell and theme.js inlined
// and the fonts from Google Fonts (the only font host an artifact may load). Both are built from the same
// stylesheets and shell pieces as avd-ops.dev, so they never drift from a release.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-kit.mjs           # write templates/
//   node scripts/site/build-kit.mjs --check   # fail if templates/ is out of date (CI)
import { readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NOTICE, CREDIT, SKIP, TRADEMARKS, brand, themeButton } from './shell.mjs';

const root = new URL('../../', import.meta.url).pathname;
const asset = (f) => readFileSync(join(root, 'site/assets', f), 'utf8');
const BASE = asset('avd-ops.css');
const SITE = 'https://avd-ops.dev/';
export const FONTS = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Schibsted+Grotesk:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap';

export const VERSION = (BASE.match(/^\/\* avd-ops design system v(\d+\.\d+\.\d+) /) || [])[1];

// The bar without the switcher and the menu: a single page has no side list. A page that wants the switcher
// copies it from avd-ops.dev (scripts/site/shell.mjs, SWITCHER).
const bar = (markSrc) => `${SKIP}
<header class="bar"><div class="bar-in">${brand(SITE, markSrc)}
${NOTICE(SITE)}
<div class="tools">${themeButton()}</div></div></header>`;

const foot = (own) => `<footer class="foot"><div class="in"><p>${own}</p>
${TRADEMARKS}
${CREDIT}</div></footer>`;

// The sample content both starters open with: real components, so the first view shows the look. Replace it.
const SAMPLE = `<!-- page:start (replace from here to page:end with the page's own content) -->
<p class="eyebrow">Repo name, one-line role</p>
<h1>Page title</h1>
<p class="lede">One sentence on what this page does and for whom.</p>
<div class="chips"><span class="chip">C11</span><span class="chip">PowerShell</span><span class="chip">Cloud Shell</span></div>
<p><a class="cta" href="#start">Primary action</a><a class="cta ghost" href="${SITE}">avd-ops.dev</a></p>
<h2 id="start">A section</h2>
<div class="card"><p class="eyebrow">Card</p><p>A surface with a border, for one thing that stands apart. Status pills: <span class="status s-built">built</span> <span class="status s-design">design</span> <span class="status s-slice">slice</span></p></div>
<div class="tbl"><table><thead><tr><th>Check</th><th>Result</th></tr></thead><tbody><tr><td>Round trip to the nearest region</td><td>42 ms</td></tr><tr><td>Fonts</td><td>served with the page</td></tr></tbody></table></div>
<pre><code>git clone https://github.com/avd-ops/avd-ops.git</code></pre>
<!-- page:end -->`;

export function page() {
  return `<!doctype html>
<!-- avd-ops page starter, design system v${VERSION} (avd-ops/avd-ops templates/page.html). Personal project, not for production, as is; not affiliated with the author's employer or Microsoft. -->
<!-- Needs a pinned copy of the design system in assets/ next to this page (docs/design-system.md, "Take a pinned copy"). No inline script or style, so it runs under a strict CSP. Page layout goes in the page's own stylesheet, built on the tokens. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Page title | avd-ops</title>
<meta name="description" content="One sentence on what this page does.">
<link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/avd-ops.css">
<link rel="stylesheet" href="assets/avd-ops-shell.css">
<script src="assets/theme.js"></script>
</head>
<body class="shell">
${bar('assets/brand/mark.svg')}
<div class="layout solo">
<main id="main">
<div class="col">
${SAMPLE}
</div>
</main>
</div>
${foot('Part of the avd-ops family. Something wrong? Open an issue or a pull request in this repo.')}
</body>
</html>
`;
}

// avd-ops.css without its @font-face rules (an artifact loads the same families from Google Fonts), then the shell.
const css = () => `${BASE.replace(/^\/\*[\s\S]*?\*\/\n+/, '').replace(/^@font-face\{.*\}\n/gm, '').trim()}\n${asset('avd-ops-shell.css').replace(/^\/\*[\s\S]*?\*\/\n+/, '').trim()}`;
const js = () => asset('theme.js').replace(/^\/\*[\s\S]*?\*\/\n/, '').trim();
const dataUri = (f) => `data:image/svg+xml;base64,${Buffer.from(asset(f)).toString('base64')}`;

export function artifact() {
  return `<!-- avd-ops artifact starter, design system v${VERSION} (avd-ops/avd-ops templates/artifact.html). Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
     Copy this file, rename the title, and replace the content between page:start and page:end. Keep the style and script blocks as they are: they are the release, inlined. -->
<title>Page title</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="icon" href="${dataUri('brand/favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>
/* avd-ops design system v${VERSION}: avd-ops.css and avd-ops-shell.css, inlined. Page styles go after this block, built on the tokens. */
${css()}
</style>
<script>
/* avd-ops theme.js v${VERSION}, inlined. */
${js()}
</script>
<div class="shell">
${bar(dataUri('brand/mark.svg'))}
<div class="layout solo">
<main id="main">
<div class="col">
${SAMPLE}
</div>
</main>
</div>
${foot('Built with the avd-ops design system.')}
</div>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const out = { 'templates/page.html': page(), 'templates/artifact.html': artifact() };
  if (process.argv.includes('--check')) {
    const stale = Object.entries(out).filter(([f, t]) => !existsSync(join(root, f)) || readFileSync(join(root, f), 'utf8') !== t).map(([f]) => f);
    if (stale.length) {
      console.error(`${stale.join(', ')} out of date; run node scripts/site/build-kit.mjs`);
      process.exit(1);
    }
    console.log('the starters in templates/ are up to date');
  } else {
    mkdirSync(join(root, 'templates'), { recursive: true });
    for (const [f, t] of Object.entries(out)) writeFileSync(join(root, f), t);
    console.log(`wrote ${Object.keys(out).join(', ')}`);
  }
}
