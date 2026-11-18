// Builds site/roadmap.html (https://avd-ops.dev/roadmap.html) and site/data/roadmap.json from repos.json,
// roadmap.json and site/data/issues.json (docs/roadmap-spec.md).
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-roadmap.mjs           # write site/roadmap.html and site/data/roadmap.json
//   node scripts/site/build-roadmap.mjs --check   # fail if either file is out of date (CI)
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { applyShell } from './apply-shell.mjs';
import { LAYERS } from './shell.mjs';
import { submissionUrl } from '../../submissions/links.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const OUT_HTML = 'site/roadmap.html';
const OUT_DATA = 'site/data/roadmap.json';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (url, text) => `<a href="${esc(url)}">${esc(text)}</a>`;

export const STATUS = {
  'status:in-progress': { key: 'in-progress', label: 'In progress', column: 'now', cls: 's-in-progress' },
  'status:planned': { key: 'planned', label: 'Planned', column: 'next', cls: 's-planned' },
  'status:exploring': { key: 'exploring', label: 'Exploring', column: 'later', cls: 's-exploring' },
  'status:done': { key: 'done', label: 'Done', column: 'done', cls: 's-done' },
  'status:parked': { key: 'parked', label: 'Parked', column: 'parked', cls: 's-parked' },
};

export const MATURITY = {
  proven: { label: 'Proven', cls: 'm-proven', desc: 'Run for real end to end, more than once, with public lessons and CI guards.' },
  'pre-beta': { label: 'Pre-beta', cls: 'm-pre-beta', desc: 'Built and tested offline, partly run for real; expect breaking changes.' },
  design: { label: 'Design', cls: 'm-design', desc: 'Specified, spikes only; not ready to run.' },
};

export function resolveRoadmap(reposDoc, roadmapDoc, issuesDoc, { now = '2026-11-09' } = {}) {
  const publicRepos = new Map(reposDoc.repos.map((r) => [r.name, r]));
  const repoByFull = new Map(reposDoc.repos.map((r) => [r.repo, r]));
  const approvers = new Set(roadmapDoc.approvers || []);
  const bannedList = [...(reposDoc.banned || []), 'nerdio', 'goliath', 'terraform', 'packer'];
  const bannedRe = new RegExp(`(?<![\\w-])(${bannedList.join('|')})(?![\\w-])`, 'i');

  const checkUrl = (u) => {
    const m = String(u || '').match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/(?:issues|pull)\/(\d+)$/);
    if (!m || !repoByFull.has(m[1])) throw new Error(`roadmap.json: ${u} is not an issue or PR in a repos.json repo`);
    return { repoFull: m[1], repo: repoByFull.get(m[1]).name, number: Number(m[2]) };
  };

  const curatedByUrl = new Map();
  for (const item of roadmapDoc.items || []) {
    checkUrl(item.issue);
    if (item.summary && bannedRe.test(item.summary)) throw new Error(`roadmap.json: summary for ${item.issue} names banned term`);
    curatedByUrl.set(item.issue, item);
  }
  const parkedByUrl = new Map();
  for (const p of roadmapDoc.parked || []) {
    checkUrl(p.issue);
    if (!p.reason) throw new Error(`roadmap.json: parked item ${p.issue} needs a reason`);
    if (bannedRe.test(p.reason)) throw new Error(`roadmap.json: parked reason for ${p.issue} names banned term`);
    parkedByUrl.set(p.issue, p);
  }
  const repoOverrides = roadmapDoc.repos || {};
  for (const [name, meta] of Object.entries(repoOverrides)) {
    if (!publicRepos.has(name)) throw new Error(`roadmap.json: repos.${name} is not a repos.json repo`);
    for (const field of ['stage', 'status', 'backlog']) {
      if (meta?.[field] && bannedRe.test(meta[field])) throw new Error(`roadmap.json: repos.${name}.${field} names banned term`);
    }
  }

  const dropped = [];
  const resolved = [];
  const nowMs = Date.parse(`${now}T00:00:00Z`);
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  for (const iss of issuesDoc.issues || []) {
    if (iss.private || !publicRepos.has(iss.repo)) {
      dropped.push({ url: iss.url, reason: 'private-or-unknown-repo' });
      continue;
    }
    const labels = iss.labels || [];
    const rmLabel = labels.find((l) => l.name === 'roadmap');
    const accLabel = labels.find((l) => l.name === 'accepted');
    if (!rmLabel || !accLabel) continue;
    if (!approvers.has(rmLabel.by) || !approvers.has(accLabel.by)) {
      dropped.push({ url: iss.url, reason: 'unapproved-labeler' });
      continue;
    }
    if (iss.lastTitleChange && accLabel.at && Date.parse(iss.lastTitleChange) > Date.parse(accLabel.at)) {
      dropped.push({ url: iss.url, reason: 'title-edited-after-approval' });
      continue;
    }
    if (iss.state === 'closed' && iss.stateReason === 'not_planned') {
      dropped.push({ url: iss.url, reason: 'not-planned' });
      continue;
    }
    const cur = curatedByUrl.get(iss.url) || {};
    const summary = cur.summary || '';
    if (bannedRe.test(iss.title) || bannedRe.test(summary)) {
      throw new Error(`roadmap item ${iss.url}: title or summary contains a banned term`);
    }

    const stLabel = labels.find((l) => l.name in STATUS)?.name;
    let statusInfo = STATUS[stLabel] || STATUS['status:exploring'];
    if (parkedByUrl.has(iss.url) || stLabel === 'status:parked') {
      statusInfo = STATUS['status:parked'];
    } else if (iss.state === 'closed') {
      statusInfo = STATUS['status:done'];
      if (iss.closedAt) {
        const closedMs = Date.parse(`${iss.closedAt}T00:00:00Z`);
        if (nowMs - closedMs > ninetyDaysMs) {
          dropped.push({ url: iss.url, reason: 'closed-over-90-days' });
          continue;
        }
      }
    }

    const repoMeta = publicRepos.get(iss.repo);
    resolved.push({
      url: iss.url,
      repo: iss.repo,
      layer: repoMeta.layer || 'front-door',
      maturity: repoMeta.maturity || 'pre-beta',
      number: iss.number,
      title: iss.title,
      summary,
      theme: cur.theme || 'other',
      order: cur.order ?? 999,
      status: statusInfo.key,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.cls,
      column: statusInfo.column,
      updatedAt: iss.updatedAt || issuesDoc.fetchedAt,
      closedAt: iss.closedAt || null,
      closingPr: iss.closingPr || null,
      provenBy: cur.proven_by || null,
      parkedReason: parkedByUrl.get(iss.url)?.reason || null,
      communityRequest: labels.some((l) => l.name === 'type:feature' || l.name === 'submission'),
      requester: iss.requester || null,
    });
  }

  const themeOrder = new Map((roadmapDoc.themes || []).map((t, i) => [t.id, i]));
  resolved.sort((a, b) => {
    const ta = themeOrder.get(a.theme) ?? 99;
    const tb = themeOrder.get(b.theme) ?? 99;
    if (ta !== tb) return ta - tb;
    if (a.order !== b.order) return a.order - b.order;
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });

  const reposSummary = reposDoc.repos.map((r) => {
    const ov = repoOverrides[r.name] || {};
    const itemsForRepo = resolved.filter((i) => i.repo === r.name);
    return {
      name: r.name,
      repo: r.repo,
      layer: r.layer,
      maturity: r.maturity || 'pre-beta',
      stage: ov.stage || null,
      status: ov.status || r.role,
      backlog: ov.backlog || null,
      portal: r.portal || null,
      counts: {
        now: itemsForRepo.filter((i) => i.column === 'now').length,
        next: itemsForRepo.filter((i) => i.column === 'next').length,
        later: itemsForRepo.filter((i) => i.column === 'later').length,
        done: itemsForRepo.filter((i) => i.column === 'done').length,
      },
    };
  });

  return {
    schema: 'avd-ops-roadmap-resolved/v1',
    asOf: issuesDoc.fetchedAt,
    themes: roadmapDoc.themes || [],
    repos: reposSummary,
    items: resolved,
    dropped,
  };
}

export function buildRoadmapHtml(reposDoc, roadmapDoc, issuesDoc, routingDoc) {
  const data = resolveRoadmap(reposDoc, roadmapDoc, issuesDoc);
  const themes = new Map((roadmapDoc.themes || []).map((t) => [t.id, t]));
  const repoLink = (name) => (name === 'avd-ops' ? '<a href="index.html">avd-ops</a>' : `<a href="family/${esc(name)}.html">${esc(name)}</a>`);
  const matMark = (m) => {
    const info = MATURITY[m] || MATURITY['pre-beta'];
    return `<span class="mark-badge ${info.cls}">${esc(info.label)}</span>`;
  };
  const statusPill = (item) => `<span class="status ${esc(item.statusClass)}">${esc(item.statusLabel)}</span>`;

  const renderCard = (item) => {
    const themeTitle = themes.get(item.theme)?.title;
    const provenLine = item.column === 'done'
      ? (item.provenBy ? `<p class="rm-meta">Proven in a real run: ${link(item.provenBy, 'evidence')}.</p>` : '<p class="rm-meta">Built, not yet proven in a real run.</p>')
      : '';
    const shippedLine = item.closingPr ? ` &middot; ${link(item.closingPr, 'Shipped PR')}` : '';
    const communityLine = item.communityRequest ? `<p class="rm-meta">From a community request${item.requester ? ` (@${esc(item.requester)})` : ''}.</p>` : '';
    const parkedLine = item.parkedReason ? `<p class="rm-meta">Paused: ${esc(item.parkedReason)}</p>` : '';
    return `<article class="card rm-card" id="item-${esc(item.repo)}-${item.number}" data-repo="${esc(item.repo)}" data-layer="${esc(item.layer)}" data-theme="${esc(item.theme)}">
<div class="rm-top">${repoLink(item.repo)} ${matMark(item.maturity)} ${statusPill(item)}</div>
<h3><a href="${esc(item.url)}">${esc(item.title)}</a></h3>
${item.summary ? `<p>${esc(item.summary)}</p>` : ''}
${provenLine}${communityLine}${parkedLine}
<p class="rm-foot">${themeTitle ? `<span class="chip">${esc(themeTitle)}</span> ` : ''}<a class="mono" href="${esc(item.url)}">${esc(item.repo)}#${item.number}</a> &middot; ${item.closedAt ? `closed ${esc(item.closedAt)}` : `updated ${esc(item.updatedAt)}`}${shippedLine}</p>
</article>`;
  };

  const colItems = (col) => data.items.filter((i) => i.column === col);
  const colBlock = (id, title, sub, col) => {
    const list = colItems(col);
    return `<section class="rm-col" id="col-${id}">
<h2>${esc(title)} <span class="mono rm-col-count" data-total="${list.length}">(${list.length})</span></h2>
<p class="rm-sub">${esc(sub)}</p>
<div class="rm-list">
${list.length ? list.map(renderCard).join('\n') : '<p class="rm-empty">Nothing in this column right now.</p>'}
</div>
</section>`;
  };

  const allLayers = [...LAYERS, ['front-door', 'Front door', 'The website, onboarding docs and cross-repo governance.']];
  const renderRepoCard = (r) => {
    const totalItems = r.counts.now + r.counts.next + r.counts.later + r.counts.done;
    const countBits = [];
    if (r.counts.now) countBits.push(`${r.counts.now} now`);
    if (r.counts.next) countBits.push(`${r.counts.next} next`);
    if (r.counts.later) countBits.push(`${r.counts.later} later`);
    if (r.counts.done) countBits.push(`${r.counts.done} done`);
    const issuesUrl = `https://github.com/${r.repo}/issues`;
    const portalLink = r.portal ? `<a href="${esc(r.portal)}">Portal</a>` : '';
    const filterBtn = totalItems
      ? `<button class="chip rm-filter-repo" type="button" data-filter-repo="${esc(r.name)}">${esc(countBits.join(' · '))}</button>`
      : '';
    return `<article class="card rm-repo-card" id="${esc(r.name)}" data-layer="${esc(r.layer)}">
<div class="rm-top">${repoLink(r.name)} ${matMark(r.maturity)}${r.stage ? `<span class="rm-stage">${esc(r.stage)}</span>` : ''}</div>
<p class="rm-status"><b>Status:</b> ${esc(r.status)}</p>
${r.backlog ? `<p class="rm-backlog"><b>Backlog:</b> ${esc(r.backlog)}</p>` : ''}
<p class="rm-links">${filterBtn}<a href="${esc(issuesUrl)}">Issues</a>${portalLink ? ` &middot; ${portalLink}` : ''}</p>
</article>`;
  };
  const layerSections = allLayers.map(([id, title, what]) => {
    const rs = data.repos.filter((r) => r.layer === id);
    if (!rs.length) return '';
    return `<section class="rm-layer" id="layer-${esc(id)}">
<div class="rm-layer-head"><h3>${esc(title)} <span class="mono">(${rs.length})</span></h3><p>${esc(what)}</p></div>
<div class="rm-repo-grid">
${rs.map(renderRepoCard).join('\n')}
</div>
</section>`;
  }).filter(Boolean).join('\n');

  const doneList = colItems('done');
  const parkedList = colItems('parked');
  const featUrl = submissionUrl(routingDoc, reposDoc, { type: 'feature', area: 'unsure' });
  const resUrl = submissionUrl(routingDoc, reposDoc, { type: 'research-request', area: 'other' });

  const content = `<p class="eyebrow">Roadmap</p>
<h1>Backlog and status across the avd-ops project.</h1>
<p class="lede">Where each of the ${reposDoc.repos.length} repositories stands today, what is in its backlog, and what is being built, explored and shipped. Direction, not a promise. No dates.</p>
<p>Every board item below is a public GitHub issue approved with the <span class="mono">roadmap</span> and <span class="mono">accepted</span> labels, plus a <span class="mono">status:*</span> label. Snapshot as of <span class="mono">${esc(data.asOf)}</span>.</p>

<nav class="rm-jump" aria-label="Page sections">
<a class="chip" href="#repos">Repo status &amp; backlog (${reposDoc.repos.length})</a>
<a class="chip" href="#board">Feature board (${data.items.length})</a>
<a class="chip" href="#col-now">Now (${colItems('now').length})</a>
<a class="chip" href="#col-next">Next (${colItems('next').length})</a>
<a class="chip" href="#col-later">Later (${colItems('later').length})</a>
<a class="chip" href="#recently-done">Recently done (${doneList.length})</a>
</nav>

<h2 id="repos">Repo status &amp; backlog</h2>
<p>Maturity is separate from task progress: an in-progress item in a design-stage repo is still early design work. Select any repo with board items to filter the feature board below, or open its GitHub issues for the full backlog.</p>
<div class="rm-layers">
${layerSections}
</div>

<h2 id="board">Feature board</h2>
<div class="rm-filters" data-rm-filters>
<div class="rm-filter-row" role="group" aria-label="Filter by layer">
<span class="rm-filter-label">Layer</span>
<button class="chip rm-chip-btn" type="button" data-filter-layer="all" aria-pressed="true">All layers</button>
${allLayers.map(([id, title]) => `<button class="chip rm-chip-btn" type="button" data-filter-layer="${esc(id)}" aria-pressed="false">${esc(title)}</button>`).join('\n')}
</div>
<div class="rm-filter-row" role="group" aria-label="Filter by theme">
<span class="rm-filter-label">Theme</span>
<button class="chip rm-chip-btn" type="button" data-filter-theme="all" aria-pressed="true">All themes</button>
${(roadmapDoc.themes || []).map((t) => `<button class="chip rm-chip-btn" type="button" data-filter-theme="${esc(t.id)}" aria-pressed="false">${esc(t.title)}</button>`).join('\n')}
</div>
<div class="rm-filter-status" hidden>
<span class="rm-filter-summary" data-filter-summary></span>
<button class="chip rm-chip-btn" type="button" data-filter-reset>Clear filters</button>
</div>
</div>

<div class="rm-board">
${colBlock('now', 'Now', 'In progress: someone is actively working on it.', 'now')}
${colBlock('next', 'Next', 'Planned: decided and designed, not started yet.', 'next')}
${colBlock('later', 'Later', 'Exploring: looking at the question and prior art before deciding.', 'later')}
</div>

<h2 id="recently-done">Recently done <span class="mono rm-col-count" data-total="${doneList.length}">(${doneList.length})</span></h2>
<p>Closed as completed in the last 90 days. Older shipped items stay in each repo's closed <span class="mono">roadmap</span> issues.</p>
<div class="rm-done">
${doneList.length ? doneList.map(renderCard).join('\n') : '<p class="rm-empty">No roadmap items closed in the last 90 days.</p>'}
</div>

<details class="rm-parked" id="parked">
<summary>Parked (${parkedList.length})</summary>
<p>Items that were on the public roadmap and are paused, with a stated reason.</p>
<div class="rm-done">
${parkedList.length ? parkedList.map(renderCard).join('\n') : '<p class="rm-empty">Nothing is parked right now.</p>'}
</div>
</details>

<h2 id="contribute">Suggest or ask</h2>
<p>Have a feature to suggest or a question that needs research first? Open a public submission or browse the open research questions.</p>
<p class="actions">
<a class="cta" href="${esc(featUrl)}">Suggest a feature</a>
<a class="cta ghost" href="${esc(resUrl)}">Ask for research</a>
<a class="cta ghost" href="research.html">Research projects</a>
</p>`;

  const html = applyShell(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Roadmap | avd-ops</title>
<meta name="description" content="Public roadmap across the avd-ops repositories: repo status, backlog, what is in progress, planned, exploring and recently done, with maturity marks and no dates.">
<!-- shell:head --><!-- /shell:head -->
<script src="assets/roadmap.js" defer></script>
</head>
<body class="shell">
<!-- Generated by scripts/site/build-roadmap.mjs from roadmap.json and site/data/issues.json. Do not edit; rebuild instead. -->
<!-- shell:top --><!-- /shell:top -->
<main id="main" class="roadmap">
${content}
<p class="built">Built from <a href="https://github.com/avd-ops/avd-ops/blob/main/roadmap.json">roadmap.json</a> and <a href="data/issues.json">issues.json</a>. Something wrong or missing? Open an issue in <a href="https://github.com/avd-ops/avd-ops/issues">avd-ops</a>.</p>
</main>
<!-- shell:foot --><!-- /shell:foot -->
</body>
</html>
`, 'roadmap.html');

  return { html, json: `${JSON.stringify(data, null, 2)}\n` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const roadmapDoc = JSON.parse(readFileSync(join(root, 'roadmap.json'), 'utf8'));
  const issuesDoc = JSON.parse(readFileSync(join(root, 'site/data/issues.json'), 'utf8'));
  const routingDoc = JSON.parse(readFileSync(join(root, 'submissions/routing.json'), 'utf8'));
  const { html, json } = buildRoadmapHtml(reposDoc, roadmapDoc, issuesDoc, routingDoc);
  if (process.argv.includes('--check')) {
    if (!existsSync(join(root, OUT_HTML)) || readFileSync(join(root, OUT_HTML), 'utf8') !== html) {
      console.error(`${OUT_HTML} is out of date; run node scripts/site/build-roadmap.mjs`);
      process.exit(1);
    }
    if (!existsSync(join(root, OUT_DATA)) || readFileSync(join(root, OUT_DATA), 'utf8') !== json) {
      console.error(`${OUT_DATA} is out of date; run node scripts/site/build-roadmap.mjs`);
      process.exit(1);
    }
    console.log(`${OUT_HTML} and ${OUT_DATA} are up to date`);
  } else {
    writeFileSync(join(root, OUT_HTML), html);
    writeFileSync(join(root, OUT_DATA), json);
    console.log(`wrote ${OUT_HTML} and ${OUT_DATA}`);
  }
}
