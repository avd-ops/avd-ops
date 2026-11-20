// Builds site/releases.html (https://avd-ops.dev/releases.html) and site/releases-feed.xml
// from repos.json and site/data/releases.json.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-releases.mjs           # write site/releases.html and site/releases-feed.xml
//   node scripts/site/build-releases.mjs --check   # fail if either file is out of date (CI)
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { applyShell } from './apply-shell.mjs';
import { LAYERS } from './shell.mjs';
import { sanitizeReleaseBody } from './fetch-releases.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const OUT_HTML = 'site/releases.html';
const OUT_FEED = 'site/releases-feed.xml';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MATURITY = { proven: 'Proven', 'pre-beta': 'Pre-beta', design: 'Design' };

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function repoGuideHref(repoName) {
  return repoName === 'avd-ops' ? 'docs/index.html' : `family/${repoName}.html`;
}

export function buildReleasesHtml(reposDoc, releasesDoc, platformDoc = null) {
  const repos = reposDoc.repos || [];
  const banned = reposDoc.banned || [];
  const releases = (releasesDoc.releases || []).map((r) => ({
    ...r,
    body: sanitizeReleaseBody(r.body || '', banned),
  }));

  const latestByRepo = new Map();
  for (const r of releases) {
    if (!latestByRepo.has(r.repo)) latestByRepo.set(r.repo, r);
  }

  const platformHtml = platformDoc
    ? `<section aria-labelledby="platform-release-heading">
<h2 id="platform-release-heading">Current platform release: <code>platform-v${esc(platformDoc.platformVersion)}</code></h2>
<div class="card rm-card">
<div class="rm-top"><span class="chip mono">platform-v${esc(platformDoc.platformVersion)}</span> <span class="chip">Cadence: Patch Tuesday + 7 days (3rd Tuesday)</span> <span class="chip mono">${esc(platformDoc.releasedAt)}</span></div>
<p>One monthly platform release train pins the compatible release tag for every public repository in <code>repos.json</code>. Out-of-band security or regression fixes ship as <code>platform-vYYYY.MM.PATCH</code>.</p>
</div>
</section>`
    : '';

  const releasedReposCount = latestByRepo.size;
  const coverageCards = repos.map((repo) => {
    const latest = latestByRepo.get(repo.name);
    const guide = repoGuideHref(repo.name);
    const statusHtml = latest
      ? `<span class="rm-stage"><a href="${esc(latest.url)}">${esc(latest.tagName)}</a> &middot; ${esc(latest.publishedAt)}</span>`
      : '<span class="rm-stage">No published release yet</span>';
    return `<article class="card rm-repo-card">
<div class="rm-top"><a class="mono" href="${esc(guide)}"><strong>${esc(repo.name)}</strong></a> <span class="mark-badge m-${esc(repo.maturity)}">${esc(MATURITY[repo.maturity] || repo.maturity)}</span> <span class="chip">${esc(repo.layer)}</span></div>
<p>${statusHtml}</p>
<p class="rm-links"><a href="https://github.com/${esc(repo.repo)}/releases">GitHub Releases</a> &middot; <a href="https://github.com/${esc(repo.repo)}/blob/${esc(repo.branch || 'main')}/CHANGELOG.md">Changelog</a></p>
</article>`;
  }).join('\n');

  const releaseLayers = [...new Set(releases.map((r) => r.layer))].sort();
  const releaseRepos = [...new Set(releases.map((r) => r.repo))].sort();
  const layerLabels = new Map(LAYERS.map(([id, label]) => [id, label]));
  layerLabels.set('front-door', 'Front door');

  const filtersHtml = releases.length
    ? `<div class="rm-filters" data-release-filters>
<div class="rm-filter-row" role="group" aria-label="Filter by layer">
<span class="rm-filter-label">Layer</span>
<button class="chip rm-chip-btn" type="button" data-filter-layer="all" aria-pressed="true">All layers</button>
${releaseLayers.map((l) => `<button class="chip rm-chip-btn" type="button" data-filter-layer="${esc(l)}" aria-pressed="false">${esc(layerLabels.get(l) || l)}</button>`).join('\n')}
</div>
<div class="rm-filter-row" role="group" aria-label="Filter by repo">
<span class="rm-filter-label">Repo</span>
<button class="chip rm-chip-btn" type="button" data-filter-repo="all" aria-pressed="true">All repos</button>
${releaseRepos.map((r) => `<button class="chip rm-chip-btn mono" type="button" data-filter-repo="${esc(r)}" aria-pressed="false">${esc(r)}</button>`).join('\n')}
</div>
<div class="rm-filter-row" role="group" aria-label="Filter by channel">
<span class="rm-filter-label">Channel</span>
<button class="chip rm-chip-btn" type="button" data-filter-channel="all" aria-pressed="true">All</button>
<button class="chip rm-chip-btn" type="button" data-filter-channel="stable" aria-pressed="false">Stable</button>
<button class="chip rm-chip-btn" type="button" data-filter-channel="prerelease" aria-pressed="false">Pre-release</button>
</div>
<div class="rm-filter-status" hidden>
<span class="rm-filter-summary" data-filter-summary></span>
<button class="chip rm-chip-btn" type="button" data-filter-reset>Clear filters</button>
</div>
</div>`
    : '';

  const releaseCards = releases.length
    ? releases.map((r) => {
        const channel = r.prerelease ? 'prerelease' : 'stable';
        const channelLabel = r.prerelease ? 'Pre-release' : 'Stable';
        const title = r.name && r.name !== r.tagName ? `${r.repo} ${r.tagName} — ${r.name}` : `${r.repo} ${r.tagName}`;
        const notesHtml = r.body ? marked.parse(r.body, { gfm: true }) : '<p>No release notes provided.</p>';
        const assetsHtml = r.assets && r.assets.length
          ? `<div class="rel-assets"><p class="rm-meta"><strong>Assets:</strong> ${r.assets.map((a) => `<a class="mono" href="${esc(a.downloadUrl)}">${esc(a.name)}</a> (${esc(formatBytes(a.size))})`).join(' &middot; ')}</p></div>`
          : '';
        return `<article class="card rm-card" id="release-${esc(r.repo)}-${esc(r.tagName)}" data-release-card data-layer="${esc(r.layer)}" data-repo="${esc(r.repo)}" data-channel="${channel}">
<div class="rm-top"><span class="chip mono">${esc(r.publishedAt)}</span> <span class="chip mono">${esc(r.repo)}</span> <span class="chip">${esc(r.layer)}</span> <span class="rm-stage">${esc(channelLabel)}</span></div>
<h3><a href="${esc(r.url)}">${esc(title)}</a></h3>
<div class="blog-post">
${notesHtml}
</div>
${assetsHtml}
<p class="rm-meta"><a href="${esc(r.url)}">View release on GitHub</a> &middot; <a href="${esc(repoGuideHref(r.repo))}">Repo guide</a></p>
</article>`;
      }).join('\n')
    : '<p>No published releases yet.</p>';

  const bodyHtml = `<p class="eyebrow">Release notes</p>
<h1>Published releases across avd-ops.</h1>
<p class="lede">Versioned releases, provenance-attested bundles, and changelogs across the ${repos.length} public repositories in the avd-ops platform. ${releasedReposCount} of ${repos.length} repositories currently have published GitHub Releases.</p>
<p class="actions"><a class="chip" href="releases-feed.xml">Atom feed (releases-feed.xml)</a> <a class="chip" href="docs/decisions/0029-platform-release-standard.html">Platform release standard (ADR 0029)</a></p>
${platformHtml}
<section aria-labelledby="release-coverage-heading">
<h2 id="release-coverage-heading">Platform release coverage</h2>
<p class="rm-meta">Latest published release per repository from <code>repos.json</code> (snapshot as of ${esc(releasesDoc.fetchedAt || 'unknown')}).</p>
<div class="rm-repo-grid">
${coverageCards}
</div>
</section>
<section aria-labelledby="release-notes-heading">
<h2 id="release-notes-heading">All releases (${releases.length})</h2>
${filtersHtml}
<div class="rm-list">
${releaseCards}
</div>
</section>`;

  const shell = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Release notes | avd-ops</title>
<meta name="description" content="Published releases, changelogs, and attested artifacts across the avd-ops repositories.">
<link rel="alternate" type="application/atom+xml" title="avd-ops release notes" href="releases-feed.xml">
<script src="assets/releases.js" defer></script>
<!-- shell:head -->
<!-- /shell:head -->
</head>
<body class="shell">
<!-- Generated by scripts/site/build-releases.mjs from repos.json and site/data/releases.json. Do not edit; rebuild instead. -->
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
  return applyShell(shell, 'releases.html');
}

export function buildReleasesFeedXml(reposDoc, releasesDoc) {
  const banned = reposDoc.banned || [];
  const latest = (releasesDoc.releases || []).slice(0, 30);
  const updated = latest[0]?.publishedAtRaw || (latest[0]?.publishedAt ? `${latest[0].publishedAt}T00:00:00Z` : '2026-01-01T00:00:00Z');
  const entries = latest.map((r) => {
    const body = sanitizeReleaseBody(r.body || '', banned);
    const html = body ? marked.parse(body, { gfm: true }) : '<p>No release notes provided.</p>';
    const title = r.name && r.name !== r.tagName ? `${r.repo} ${r.tagName} — ${r.name}` : `${r.repo} ${r.tagName}`;
    const entryUpdated = r.publishedAtRaw || `${r.publishedAt || '2026-01-01'}T00:00:00Z`;
    return `  <entry>
    <title>${esc(title)}</title>
    <link href="${esc(r.url)}"/>
    <id>${esc(r.url)}</id>
    <updated>${esc(entryUpdated)}</updated>
    <summary>${esc(`${r.repo} ${r.tagName} (${r.layer})`)}</summary>
    <content type="html">${esc(html)}</content>
  </entry>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>avd-ops release notes</title>
  <subtitle>Versioned releases across the avd-ops repositories.</subtitle>
  <link href="https://avd-ops.dev/releases-feed.xml" rel="self"/>
  <link href="https://avd-ops.dev/releases.html"/>
  <id>https://avd-ops.dev/releases.html</id>
  <updated>${esc(updated)}</updated>
${entries}
</feed>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const releasesPath = join(root, 'site/data/releases.json');
  const releasesDoc = existsSync(releasesPath)
    ? JSON.parse(readFileSync(releasesPath, 'utf8'))
    : { schema: 'avd-ops-releases/v1', fetchedAt: '2026-01-01', releases: [] };
  const platformPath = join(root, 'platform-release.json');
  const platformDoc = existsSync(platformPath)
    ? JSON.parse(readFileSync(platformPath, 'utf8'))
    : null;

  const expectedHtml = buildReleasesHtml(reposDoc, releasesDoc, platformDoc);
  const expectedFeed = buildReleasesFeedXml(reposDoc, releasesDoc);

  if (check) {
    const stale = [];
    for (const [relPath, content] of [[OUT_HTML, expectedHtml], [OUT_FEED, expectedFeed]]) {
      const target = join(root, relPath);
      if (!existsSync(target) || readFileSync(target, 'utf8') !== content) stale.push(relPath);
    }
    if (stale.length) {
      console.error(`release notes out of date (${stale.join(', ')}); run node scripts/site/build-releases.mjs`);
      process.exit(1);
    }
    console.log(`site/releases.html and site/releases-feed.xml are up to date (${(releasesDoc.releases || []).length} releases)`);
    process.exit(0);
  }

  writeFileSync(join(root, OUT_HTML), expectedHtml);
  writeFileSync(join(root, OUT_FEED), expectedFeed);
  console.log(`wrote ${OUT_HTML} and ${OUT_FEED} (${(releasesDoc.releases || []).length} releases)`);
}
