// Static public demo hub HTML for https://avd-ops.app/.
// Uses the shared avd-ops design system served via /assets/* (proxied from avd-ops.dev).
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.

import { PORTAL_ROUTES } from './routes.mjs';

export function renderHubHtml() {
  const cards = PORTAL_ROUTES.map(
    (r) => `<article class="card">
<h2><a href="${r.prefix}/">${r.title}</a></h2>
<p>${r.summary}</p>
<p class="meta">Repo: <a href="https://github.com/avd-ops/${r.repo}">${r.repo}</a></p>
<p><a class="cta ghost" href="${r.prefix}/">Open ${r.title} demo</a></p>
</article>`
  ).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>avd-ops public demo</title>
<meta name="description" content="Public interactive demo hub for avd-ops using static Contoso sample data. Zero auth, zero backend, zero Azure spend.">
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
</div></header>
<main id="main" class="home">
<section class="hero" aria-labelledby="h-demo">
<div class="hero-copy">
<h1 id="h-demo">avd-ops public demo</h1>
<p class="lede">Explore the browser portals on static Contoso sample data. Nothing authenticates to Azure, nothing is stored, and no cloud resources are created.</p>
<div class="actions"><a class="cta" href="/deploy/">Open Deploy demo</a><a class="cta ghost" href="/assess/">Open Assess demo</a><a class="cta ghost" href="https://avd-ops.dev/">Read the docs on avd-ops.dev</a></div>
</div>
</section>
<section aria-labelledby="h-portals">
<h2 id="h-portals">Interactive portals</h2>
<div class="path-grid">
${cards}
</div>
</section>
</main>
<footer class="foot"><div class="in"><p>Project documentation and architecture live at <a href="https://avd-ops.dev/">avd-ops.dev</a>.</p>
<p>Every repo is open source, under MIT unless a folder says otherwise. Azure, Azure Virtual Desktop, Microsoft Entra, Intune and FSLogix are trademarks of Microsoft.</p>
<p class="credit">A <a href="https://prignano.ai/">prignano.ai</a> production</p></div></footer>
</body>
</html>
`;
}
