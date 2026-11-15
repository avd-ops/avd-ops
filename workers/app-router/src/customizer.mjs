// Standalone Adopter Theme Customizer (v4.0.0) page for https://avd-ops.app/customizer/.
// Uses the shared avd-ops design system served via /assets/* (proxied from avd-ops.dev) so avd-ops.dev stays pure Brand v3.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.

export function renderCustomizerHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Adopter Theme Customizer | avd-ops</title>
<meta name="description" content="Customize color palettes, typography pairings, and brand marks for avd-ops forks and portals, and export adopter-theme.css.">
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/avd-ops.css">
<link rel="stylesheet" href="/assets/avd-ops-shell.css">
<link rel="stylesheet" href="/assets/site.css">
<script src="/assets/theme.js"></script>
</head>
<body class="shell">
<a class="skip" href="#main">Skip to content</a>
<header class="bar"><div class="bar-in"><a class="brand" href="/"><img class="mark" src="/assets/brand/mark.svg" alt="" width="44" height="44"><span class="name"><span class="word">avd-ops</span><span class="tag">Public demo</span></span></a>
<nav class="switcher" aria-label="avd-ops tools"><a href="https://avd-ops.dev/">Docs</a><a href="/deploy/">Deploy</a><a href="/assess/">Assess</a><a href="/migrate/">Migrate</a><a href="/status/">Status</a></nav>
<details class="notice"><summary><strong class="long">Personal project. Research and learning only. Not for production. No warranty.</strong><strong class="short">Not for production</strong></summary>
<div class="full"><ul><li>Built on my own time for research and learning. Not affiliated with, endorsed by or supported by my employer or Microsoft.</li>
<li>Public demo runs on static Contoso sample data in your browser. Zero sign-in, zero backend storage, zero Azure spend.</li>
<li>Provided "as is", without warranty of any kind, under each repo's license.</li>
<li><strong>Contributions and forks are welcome and encouraged.</strong> See <a href="https://avd-ops.dev/index.html#contribute">Contribute</a>.</li></ul></div></details>
<div class="tools"><button class="iconbtn theme" type="button" aria-label="Switch theme"><svg class="sun" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.5"/><path d="M10 1.8v2.2M10 16v2.2M1.8 10H4M16 10h2.2M4.2 4.2l1.6 1.6M14.2 14.2l1.6 1.6M4.2 15.8l1.6-1.6M14.2 5.8l1.6-1.6"/></svg><svg class="moon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z"/></svg></button><button class="iconbtn customize" type="button" aria-label="Customize theme and palette" title="Customize theme and palette" aria-expanded="false" data-design-href="/customizer/#customize"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="2.7"/><path d="M10 2.2v1.9M10 15.9v1.9M2.2 10h1.9M15.9 10h1.9M4.5 4.5l1.3 1.3M14.2 14.2l1.3 1.3M4.5 15.5l1.3-1.3M14.2 5.8l1.3-1.3"/></svg></button></div>
</div></header>
<div class="layout solo">
<main id="main" class="ds">
<div class="col">
<h1 id="customize">Adopter Theme Customizer</h1>
<p class="lede">Override only CSS custom properties in an optional <code>adopter-theme.css</code> layer loaded after <code>avd-ops.css</code>, keeping core v3 stylesheets untouched and upgradable. The research-only notice, license, and attribution remain intact.</p>
<div class="customizer" id="customizer-panel">
<fieldset>
<legend>1. Color palette</legend>
<div class="cust-presets" role="radiogroup" aria-label="Palette presets">
<label><input type="radio" name="cust-preset" value="teal" checked><span>avd-ops Teal (Default)</span></label>
<label><input type="radio" name="cust-preset" value="cobalt"><span>Azure Cobalt</span></label>
<label><input type="radio" name="cust-preset" value="slate"><span>Slate Monochrome</span></label>
<label><input type="radio" name="cust-preset" value="forest"><span>Forest</span></label>
<label><input type="radio" name="cust-preset" value="amber"><span>Amber</span></label>
</div>
<div class="cust-colors">
<div class="cust-field"><label for="cust-accent-light">Light --accent</label><input id="cust-accent-light" type="color" value="#0b7a6e"></div>
<div class="cust-field"><label for="cust-accent-dark">Dark --accent</label><input id="cust-accent-dark" type="color" value="#3cc8b4"></div>
<div class="cust-field"><label for="cust-brand">--brand (logo/surface)</label><input id="cust-brand" type="color" value="#1ca998"></div>
<div class="cust-field"><label for="cust-shell">--shell (brand bar)</label><input id="cust-shell" type="color" value="#0d1015"></div>
</div>
<div class="cust-wcag is-pass" id="cust-wcag" role="status" aria-live="polite"><strong>WCAG AA pass</strong></div>
</fieldset>

<fieldset>
<legend>2. Typography pairing (zero external CDN)</legend>
<div class="cust-presets" role="radiogroup" aria-label="Font pairings">
<label><input type="radio" name="cust-font" value="grotesk-plex" checked><span>Grotesk + IBM Plex Mono (Default)</span></label>
<label><input type="radio" name="cust-font" value="system-sans"><span>System Sans + System Mono</span></label>
<label><input type="radio" name="cust-font" value="editorial-serif"><span>Editorial Serif + Mono</span></label>
<label><input type="radio" name="cust-font" value="grotesk-sans"><span>Grotesk + System Sans</span></label>
</div>
</fieldset>

<fieldset>
<legend>3. Logo and brand slot (44x44 mark in header.bar)</legend>
<div class="cust-brand-grid">
<div class="cust-field"><label for="cust-wordmark">Wordmark text</label><input id="cust-wordmark" type="text" value="avd-ops" maxlength="40"></div>
<div class="cust-field"><label for="cust-tagline">Tagline (optional)</label><input id="cust-tagline" type="text" value="Deploy quietly" maxlength="60"></div>
</div>
<div class="cust-brand-grid">
<div class="cust-field"><label for="cust-svg">Inline SVG mark (paste &lt;svg&gt;...&lt;/svg&gt;)</label><textarea id="cust-svg" placeholder="&lt;svg viewBox=&quot;0 0 44 44&quot; ...&gt;...&lt;/svg&gt;"></textarea></div>
<div class="cust-field"><label for="cust-mark-file">Or choose local .svg / .png (never uploaded)</label><input id="cust-mark-file" type="file" accept=".svg,.png,image/svg+xml,image/png"></div>
</div>
<div class="cust-actions"><button class="cust-btn ghost" type="button" id="cust-reset">Reset to avd-ops defaults</button></div>
</fieldset>

<div class="cust-out">
<div class="cust-actions">
<span class="cust-copy"><button class="cust-btn" type="button" data-copy-target="adopter-css-out">Copy adopter-theme.css</button><span class="cust-tip" role="status"></span></span>
<button class="cust-btn ghost" type="button" id="cust-download">Download adopter-theme.css</button>
</div>
<textarea id="adopter-css-out" class="cust-code" readonly aria-label="Generated adopter-theme.css"></textarea>
</div>

<div class="cust-out">
<div class="cust-actions">
<span class="cust-copy"><button class="cust-btn ghost" type="button" data-copy-target="adopter-dropin-out">Copy 3-line drop-in</button><span class="cust-tip" role="status"></span></span>
<span class="note">For <code>templates/page.html</code> and vendored portals (<code>avd-landing-zone</code>, <code>avd-current-state</code>, <code>avd-migrate</code>). Load portals' <code>avd-ops-portal.css</code> before <code>avd-ops-shell.css</code>.</span>
</div>
<textarea id="adopter-dropin-out" class="cust-code cust-code-sm" readonly aria-label="Drop-in HTML snippet"></textarea>
</div>
</div>

<h2>Live component preview</h2>
<div class="demo"><div class="actions"><a class="cta" href="#customize">Primary action</a><a class="cta ghost" href="/">Back to demo hub</a></div></div>
<div class="demo"><div class="row"><span class="status s-built">Built</span><span class="status s-design">Being specified</span><span class="status s-slice">Slice</span><span class="mark-badge m-proven">Proven</span></div></div>
<div class="card"><p class="eyebrow">Card</p><p>A surface with a border, using your active palette and font pairing.</p></div>
</div>
</main>
</div>
<footer class="foot"><div class="in"><p>Project documentation and the Brand v3 reference live at <a href="https://avd-ops.dev/">avd-ops.dev</a>.</p>
<p>Every repo is open source, under MIT unless a folder says otherwise. Azure, Azure Virtual Desktop, Microsoft Entra, Intune and FSLogix are trademarks of Microsoft.</p>
<p class="credit">A <a href="https://prignano.ai/">prignano.ai</a> production</p></div></footer>
<script type="module" src="/assets/customizer.js"></script>
</body>
</html>
`;
}
