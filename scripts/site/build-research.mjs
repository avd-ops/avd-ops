// Builds site/research.html (https://avd-ops.dev/research.html) from site/data/issues.json, repos.json and
// submissions/routing.json (docs/submissions-spec.md section 5.3a).
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-research.mjs           # write site/research.html
//   node scripts/site/build-research.mjs --check   # fail if site/research.html is out of date (CI)
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { applyShell } from './apply-shell.mjs';
import { submissionUrl } from '../../submissions/links.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const OUT = 'site/research.html';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function resolveResearch(reposDoc, roadmapDoc, issuesDoc) {
  const publicRepos = new Set(reposDoc.repos.map((r) => r.name));
  const approvers = new Set(roadmapDoc.approvers || ['nickprignano']);
  const projects = [];
  for (const iss of issuesDoc.issues || []) {
    if (iss.private || !publicRepos.has(iss.repo)) continue;
    if (iss.state === 'closed' && iss.stateReason === 'not_planned') continue;
    const labels = iss.labels || [];
    const reqLabel = labels.find((l) => l.name === 'research-request' || l.name === 'type:research-request');
    const accLabel = labels.find((l) => l.name === 'accepted');
    if (!reqLabel || !accLabel || !approvers.has(accLabel.by)) continue;
    if (iss.lastTitleChange && accLabel.at && Date.parse(iss.lastTitleChange) > Date.parse(accLabel.at)) continue;
    const gapLabel = iss.gap || labels.map((l) => l.name).find((n) => n.startsWith('gap:')) || null;
    const status = iss.state === 'closed' ? 'done' : labels.some((l) => l.name === 'status:in-progress') ? 'in-progress' : 'open';
    projects.push({
      repo: iss.repo,
      number: iss.number,
      url: iss.url,
      title: iss.title,
      gap: gapLabel,
      callForHelp: labels.some((l) => l.name === 'call-for-help'),
      status,
      updatedAt: iss.updatedAt || issuesDoc.fetchedAt,
      closedAt: iss.closedAt || null,
      closingPr: iss.closingPr || null,
      helper: iss.requester || null,
    });
  }
  projects.sort((a, b) => Number(b.callForHelp) - Number(a.callForHelp) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return projects;
}

export function buildResearchHtml(reposDoc, roadmapDoc, issuesDoc, routingDoc) {
  const projects = resolveResearch(reposDoc, roadmapDoc, issuesDoc);
  const askAssess = submissionUrl(routingDoc, reposDoc, { type: 'research-request', area: 'assess.gap', target: 'gap:sample-check' });
  const askOther = submissionUrl(routingDoc, reposDoc, { type: 'research-request', area: 'other' });
  const sendSource = submissionUrl(routingDoc, reposDoc, { type: 'research', area: 'assess.references' });
  const sendEvidence = submissionUrl(routingDoc, reposDoc, { type: 'evidence', area: 'assess.baselines' });

  const statusPill = (s) => {
    if (s === 'done') return '<span class="status s-done">Done</span>';
    if (s === 'in-progress') return '<span class="status s-in-progress">Being researched</span>';
    return '<span class="status s-exploring">Open question</span>';
  };

  const cards = projects.map((p) => {
    const helpUrl = submissionUrl(routingDoc, reposDoc, {
      type: 'research',
      area: 'assess.references',
      target: p.gap || `${p.repo}#${p.number}`,
    });
    return `<article class="card rm-card" id="res-${esc(p.repo)}-${p.number}">
<div class="rm-top"><span class="chip">${esc(p.repo)}</span>${p.gap ? ` <span class="chip mono">${esc(p.gap)}</span>` : ''}${p.callForHelp ? ' <span class="chip">call for help</span>' : ''} ${statusPill(p.status)}</div>
<h3><a href="${esc(p.url)}">${esc(p.title)}</a></h3>
<p class="rm-foot"><a class="mono" href="${esc(p.url)}">${esc(p.repo)}#${p.number}</a> &middot; updated ${esc(p.updatedAt)}${p.closingPr ? ` &middot; <a href="${esc(p.closingPr)}">Produced reference</a>` : ''} &middot; <a href="${esc(helpUrl)}">I can help</a></p>
</article>`;
  }).join('\n');

  const repoLinks = reposDoc.repos.map((r) => `<li><a href="https://github.com/${esc(r.repo)}/issues?q=is%3Aopen+label%3Aresearch-request+label%3Aaccepted">${esc(r.name)} open research requests</a></li>`).join('\n');

  const content = `<p class="eyebrow">Research projects</p>
<h1>Open questions we need sources, measurements or runs to answer.</h1>
<p class="lede">Accepted research questions across the public avd-ops repositories, grouped by repo and gap, with links to send a pinned source, contribute measured evidence or ask a new question.</p>
<p>Only issues with the <span class="mono">research-request</span> and <span class="mono">accepted</span> labels appear here. Snapshot as of <span class="mono">${esc(issuesDoc.fetchedAt)}</span>. For work already decided or being built, see the <a href="roadmap.html">roadmap</a>.</p>

<p class="actions">
<a class="cta" href="${esc(askOther)}">Ask for research</a>
<a class="cta ghost" href="${esc(sendSource)}">Send a pinned source</a>
<a class="cta ghost" href="${esc(sendEvidence)}">Send baseline evidence</a>
</p>

<h2 id="open-projects">Accepted research projects (${projects.length})</h2>
<div class="rm-done">
${projects.length ? cards : '<p class="rm-empty">No open research projects right now.</p>'}
</div>

<h2 id="by-repo">Per-repository lists on GitHub</h2>
<p>Each repository filters its own accepted research requests directly on GitHub:</p>
<ul>
${repoLinks}
</ul>
<p>Looking for a specific gap in the assessment methodology? Browse the <a href="standards/index.html">standards library</a> or <a href="${esc(askAssess)}">ask for research on a gap</a>.</p>`;

  return applyShell(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Research projects | avd-ops</title>
<meta name="description" content="Accepted open research questions across the avd-ops repositories, with links to contribute sources, evidence or new questions.">
<!-- shell:head --><!-- /shell:head -->
</head>
<body class="shell">
<!-- Generated by scripts/site/build-research.mjs from site/data/issues.json. Do not edit; rebuild instead. -->
<!-- shell:top --><!-- /shell:top -->
<main id="main" class="roadmap">
${content}
<p class="built">Built from <a href="data/issues.json">issues.json</a>. Something wrong or missing? Open an issue in <a href="https://github.com/avd-ops/avd-ops/issues">avd-ops</a>.</p>
</main>
<!-- shell:foot --><!-- /shell:foot -->
</body>
</html>
`, 'research.html');
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const roadmapDoc = JSON.parse(readFileSync(join(root, 'roadmap.json'), 'utf8'));
  const issuesDoc = JSON.parse(readFileSync(join(root, 'site/data/issues.json'), 'utf8'));
  const routingDoc = JSON.parse(readFileSync(join(root, 'submissions/routing.json'), 'utf8'));
  const html = buildResearchHtml(reposDoc, roadmapDoc, issuesDoc, routingDoc);
  if (process.argv.includes('--check')) {
    if (!existsSync(join(root, OUT)) || readFileSync(join(root, OUT), 'utf8') !== html) {
      console.error(`${OUT} is out of date; run node scripts/site/build-research.mjs`);
      process.exit(1);
    }
    console.log(`${OUT} is up to date`);
  } else {
    writeFileSync(join(root, OUT), html);
    console.log(`wrote ${OUT}`);
  }
}
