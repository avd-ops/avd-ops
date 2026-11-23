// Builds site/metrics.html (https://avd-ops.dev/metrics.html) from repos.json and site/data/metrics.json.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-metrics.mjs           # write site/metrics.html
//   node scripts/site/build-metrics.mjs --check   # fail if site/metrics.html is out of date (CI)
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { applyShell } from './apply-shell.mjs';
import { LAYERS } from './shell.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const OUT_HTML = 'site/metrics.html';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MATURITY = { proven: 'Proven', 'pre-beta': 'Pre-beta', design: 'Design' };

function repoGuideHref(repoName) {
  return repoName === 'avd-ops' ? 'docs/index.html' : `family/${repoName}.html`;
}

function ciChip(conclusion) {
  if (conclusion === 'success') return '<span class="chip mx-ci-pass">CI passing</span>';
  if (conclusion === 'failure') return '<span class="chip mx-ci-fail">CI failing</span>';
  return '<span class="chip">CI unknown</span>';
}

export function buildMetricsHtml(metricsDoc) {
  const totals = metricsDoc.totals || {};
  const layers = metricsDoc.layers || [];
  const repos = metricsDoc.repos || [];
  const layerLabels = new Map(LAYERS.map(([id, label]) => [id, label]));
  layerLabels.set('front-door', 'Front door');

  const kpisHtml = `<div class="mx-kpis" data-metrics-kpis>
<article class="card rm-mat-card"><span class="rm-role">Platform XP (30d)</span><b>${esc(totals.totalScore ?? 0)} XP</b></article>
<article class="card rm-mat-card"><span class="rm-role">Merged PRs (30d)</span><b>${esc(totals.mergedPrs30d ?? 0)}</b></article>
<article class="card rm-mat-card"><span class="rm-role">Commits (30d)</span><b>${esc(totals.commits30d ?? 0)}</b></article>
<article class="card rm-mat-card"><span class="rm-role">Published Releases</span><b>${esc(totals.releasesCount ?? 0)}</b></article>
<article class="card rm-mat-card"><span class="rm-role">Green CI Rate</span><b>${esc(totals.greenCiPct ?? 0)}% (${esc(totals.greenCiCount ?? 0)}/${esc(totals.repos ?? 0)})</b></article>
<article class="card rm-mat-card"><span class="rm-role">Active Repos (7d)</span><b>${esc(totals.active7dCount ?? 0)} of ${esc(totals.repos ?? 0)}</b></article>
</div>`;

  const top3 = repos.slice(0, 3);
  const podiumHtml = top3.length
    ? `<div class="mx-podium" data-metrics-podium>
${top3.map((r) => {
        const badgeHtml = (r.badges || []).map((b) => `<span class="chip">${esc(b)}</span>`).join(' ');
        return `<article class="card rm-card mx-podium-card">
<div class="rm-top"><span class="mx-rank">#${esc(r.rank)}</span> <span class="chip mono">${esc(r.score)} XP</span> ${ciChip(r.ciConclusion)}</div>
<h3><a class="mono" href="${esc(repoGuideHref(r.name))}">${esc(r.name)}</a></h3>
<p class="rm-meta">${esc(r.mergedPrs30d)} merged PRs &middot; ${esc(r.commits30d)} commits &middot; ${esc(r.releasesCount)} release${r.releasesCount === 1 ? '' : 's'}</p>
<div class="rm-top">${badgeHtml}</div>
</article>`;
      }).join('\n')}
</div>`
    : '<p>No repository activity recorded yet.</p>';

  const maxLayerScore = Math.max(1, ...layers.map((l) => l.score));
  const layersHtml = `<div class="rm-repo-grid" data-metrics-layers>
${layers.map((l) => `<article class="card rm-repo-card">
<div class="rm-top"><span class="mx-rank">#${esc(l.rank)}</span> <strong>${esc(layerLabels.get(l.layer) || l.layer)}</strong> <span class="chip mono">${esc(l.score)} XP</span></div>
<progress max="${esc(maxLayerScore)}" value="${esc(l.score)}"></progress>
<p class="rm-meta">${esc(l.repoCount)} repo${l.repoCount === 1 ? '' : 's'} &middot; ${esc(l.mergedPrs30d)} PRs &middot; ${esc(l.commits30d)} commits &middot; ${esc(l.releasesCount)} releases</p>
</article>`).join('\n')}
</div>`;

  const allLayers = [...new Set(repos.map((r) => r.layer))].sort();
  const filtersHtml = `<div class="rm-filters" data-metrics-filters>
<div class="rm-filter-row" role="group" aria-label="Filter by layer">
<span class="rm-filter-label">Layer</span>
<button class="chip rm-chip-btn" type="button" data-filter-layer="all" aria-pressed="true">All layers</button>
${allLayers.map((l) => `<button class="chip rm-chip-btn" type="button" data-filter-layer="${esc(l)}" aria-pressed="false">${esc(layerLabels.get(l) || l)}</button>`).join('\n')}
</div>
<div class="rm-filter-row" role="group" aria-label="Filter by maturity">
<span class="rm-filter-label">Maturity</span>
<button class="chip rm-chip-btn" type="button" data-filter-maturity="all" aria-pressed="true">All</button>
<button class="chip rm-chip-btn" type="button" data-filter-maturity="proven" aria-pressed="false">Proven</button>
<button class="chip rm-chip-btn" type="button" data-filter-maturity="pre-beta" aria-pressed="false">Pre-beta</button>
<button class="chip rm-chip-btn" type="button" data-filter-maturity="design" aria-pressed="false">Design</button>
</div>
<div class="rm-filter-row" role="group" aria-label="Sort leaderboard">
<span class="rm-filter-label">Sort</span>
<button class="chip rm-chip-btn" type="button" data-sort="score" aria-pressed="true">Score (XP)</button>
<button class="chip rm-chip-btn" type="button" data-sort="prs" aria-pressed="false">Merged PRs</button>
<button class="chip rm-chip-btn" type="button" data-sort="commits" aria-pressed="false">Commits</button>
<button class="chip rm-chip-btn" type="button" data-sort="releases" aria-pressed="false">Releases</button>
</div>
<div class="rm-filter-status" hidden>
<span class="rm-filter-summary" data-filter-summary></span>
<button class="chip rm-chip-btn" type="button" data-filter-reset>Clear filters</button>
</div>
</div>`;

  const cardsHtml = repos.map((r) => {
    const badges = (r.badges || []).map((b) => `<span class="chip">${esc(b)}</span>`).join(' ');
    const relText = r.latestRelease ? `Latest: <code>${esc(r.latestRelease)}</code>` : 'No release yet';
    return `<article class="card rm-card" data-metrics-card data-layer="${esc(r.layer)}" data-maturity="${esc(r.maturity)}" data-score="${esc(r.score)}" data-prs="${esc(r.mergedPrs30d)}" data-commits="${esc(r.commits30d)}" data-releases="${esc(r.releasesCount)}">
<div class="rm-top"><span class="mx-rank">#${esc(r.rank)}</span> <a class="mono" href="${esc(repoGuideHref(r.name))}"><strong>${esc(r.name)}</strong></a> <span class="mark-badge m-${esc(r.maturity)}">${esc(MATURITY[r.maturity] || r.maturity)}</span> <span class="chip">${esc(layerLabels.get(r.layer) || r.layer)}</span> ${ciChip(r.ciConclusion)} <span class="chip mono">${esc(r.score)} XP</span></div>
<p class="rm-meta"><strong>30d:</strong> ${esc(r.mergedPrs30d)} merged PRs (${esc(r.mergedPrs7d)} in 7d) &middot; ${esc(r.commits30d)} commits &middot; ${esc(r.releasesCount)} published release${r.releasesCount === 1 ? '' : 's'} (${relText}) &middot; ${esc(r.openIssues)} open issues</p>
<div class="rm-top">${badges} <a class="rm-meta" href="https://github.com/${esc(r.repo)}">GitHub</a></div>
</article>`;
  }).join('\n');

  const bodyHtml = `<p class="eyebrow">Activity &amp; leaderboard</p>
<h1>Platform activity and repo leaderboard.</h1>
<p class="lede" data-metrics-lede>Live 30-day engineering velocity, release cadence, and CI health across all ${esc(totals.repos ?? repos.length)} public repositories in <code>repos.json</code> (snapshot as of ${esc(metricsDoc.fetchedAt || 'unknown')}).</p>
<section aria-labelledby="metrics-kpi-heading">
<h2 id="metrics-kpi-heading">Platform scoreboard</h2>
${kpisHtml}
</section>
<section aria-labelledby="metrics-podium-heading">
<h2 id="metrics-podium-heading">Top 3 repositories (30-day XP)</h2>
${podiumHtml}
</section>
<section aria-labelledby="metrics-layers-heading">
<h2 id="metrics-layers-heading">Layer standings</h2>
${layersHtml}
</section>
<section aria-labelledby="metrics-board-heading">
<h2 id="metrics-board-heading">Repository leaderboard</h2>
<details class="more"><summary>How XP &amp; badges are scored</summary>
<ul>
<li><strong>+10 XP</strong> per merged PR (30d), <strong>+2 XP</strong> per commit on default branch (30d), <strong>+25 XP</strong> per published GitHub Release, and <strong>+50 XP</strong> when the latest default-branch CI run passes.</li>
<li><strong>Badges:</strong> <em>Proven</em> (maturity = proven), <em>Green CI</em> (latest default-branch run passed), <em>Shipped</em> (&ge;1 published release), <em>High Velocity</em> (&ge;5 merged PRs in 30d), <em>Zero Backlog</em> (0 open issues).</li>
</ul>
</details>
${filtersHtml}
<div class="rm-list" data-metrics-list>
${cardsHtml}
</div>
</section>`;

  const shell = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Metrics &amp; leaderboard | avd-ops</title>
<meta name="description" content="Gamified 30-day activity leaderboard, CI health, and layer standings across the avd-ops repositories.">
<script src="assets/metrics.js" defer></script>
<!-- shell:head -->
<!-- /shell:head -->
</head>
<body class="shell">
<!-- Generated by scripts/site/build-metrics.mjs from site/data/metrics.json. Do not edit; rebuild instead. -->
<!-- shell:top -->
<!-- /shell:top -->
<main id="main" class="roadmap">
${bodyHtml}
</main>
<!-- shell:foot -->
<!-- /shell:foot -->
</body>
</html>
`;
  return applyShell(shell, 'metrics.html');
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  const metricsPath = join(root, 'site/data/metrics.json');
  const metricsDoc = existsSync(metricsPath)
    ? JSON.parse(readFileSync(metricsPath, 'utf8'))
    : { schema: 'avd-ops-metrics/v1', fetchedAt: '2026-01-01', windowDays: 30, totals: {}, layers: [], repos: [] };

  const expectedHtml = buildMetricsHtml(metricsDoc);
  const target = join(root, OUT_HTML);

  if (check) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== expectedHtml) {
      console.error(`${OUT_HTML} is out of date; run node scripts/site/build-metrics.mjs`);
      process.exit(1);
    }
    console.log(`${OUT_HTML} is up to date (${(metricsDoc.repos || []).length} repos)`);
    process.exit(0);
  }

  writeFileSync(target, expectedHtml);
  console.log(`wrote ${OUT_HTML} (${(metricsDoc.repos || []).length} repos)`);
}
