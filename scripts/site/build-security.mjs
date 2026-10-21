// Builds site/security.html (https://avd-ops.dev/security.html) from site/data/security-review.json, a
// pinned copy of avd-assess's security review map (contract C20, avd-assess-security-review/v1). avd-assess
// is the map; this page only presents it, so a change to a claim, a standing or a gap is made there and
// arrives here with a pin bump (site/data/security-review.lock.json).
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-security.mjs           # write site/security.html
//   node scripts/site/build-security.mjs --check   # fail if site/security.html is out of date (CI)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { applyShell } from './apply-shell.mjs';

const root = new URL('../../', import.meta.url).pathname;
const OUT = 'site/security.html';
const map = JSON.parse(readFileSync(join(root, 'site/data/security-review.json'), 'utf8'));
const lock = JSON.parse(readFileSync(join(root, 'site/data/security-review.lock.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (url, text) => `<a href="${esc(url)}">${text}</a>`;
const assess = (path) => `${lock.source}/blob/${lock.commit}/${path}`;
const FAMILY = new Set(['avd-landing-zone', 'avd-current-state', 'avd-assess', 'avd-swarm', 'avd-second-brain']);
const repoLink = (r) => (FAMILY.has(r) ? `<a href="family/${r}.html">${r}</a>` : `<a href="index.html">${r}</a>`);

// An evidence item: the pinned URL avd-assess wrote, or for avd-assess's own files, the commit this page pins.
const evUrl = (ev) => ev.url || assess(ev.path.replace(/#.*/, ''));
const KIND = { lesson: 'Lesson', run: 'Run record', test: 'Test', ci: 'CI job', code: 'Code', license: 'License', decision: 'Decision', doc: 'Doc' };
const evLabel = (ev) => {
  const [path, anchor] = ev.path.split('#');
  const file = path.split('/').pop();
  return `${KIND[ev.kind]}: <span class="mono">${esc(file)}${anchor && /^L\d/.test(anchor) ? `:${esc(anchor.slice(1))}` : ''}</span>`;
};
const evidence = (list) => `<ul class="ev">${list.map((ev) => `<li>${link(evUrl(ev), evLabel(ev))}</li>`).join('')}</ul>`;

// ref:, obs: and gap: citations resolve to the file in avd-assess at the pinned commit.
const CITE = { ref: 'references', obs: 'observations', gap: 'gaps' };
const citeUrl = (c) => {
  const [kind, rest] = c.split(':');
  const id = rest.split('#')[0];
  return assess(`${CITE[kind]}/${id}.${kind === 'gap' ? 'md' : 'yaml'}`);
};

const STANDING = {
  run: ['Run', 'A real run showed it: a lesson or a run record is in the evidence.'],
  guarded: ['Guarded', 'A check in CI fails if it breaks.'],
  built: ['Built', 'It is in the code; no test or real run was found for it.'],
  designed: ['Designed', 'Written down only: a spec or a proposed decision, not built or not run.'],
};
const standing = (s) => `<span class="standing st-${s}">${STANDING[s][0]}</span>`;
const MATURITY = { proven: ['Proven', 's-built'], 'pre-beta': ['Pre-beta', 's-slice'], design: ['Design', 's-design'] };

const claims = new Map(map.areas.flatMap((a) => a.claims.map((c) => [c.id, c])));
const ops = new Map(map.operator.map((o) => [o.id, o]));
const ref = (id) => {
  if (claims.has(id)) return `<a href="#c-${id}">${esc(id)}</a>`;
  if (ops.has(id)) return `<a href="#o-${id}">${esc(id)}</a>`;
  return link(citeUrl(id), esc(id));
};
const refs = (ids) => `<span class="refs">${ids.map(ref).join(', ')}</span>`;
const counts = Object.fromEntries(Object.keys(STANDING).map((s) => [s, [...claims.values()].filter((c) => c.standing === s).length]));

const table = (head, rows) => `<div class="tbl"><table class="stacked">
<thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
<tbody>
${rows.map((cells) => `<tr${cells.id ? ` id="${cells.id}"` : ''}>${cells.map((c, i) => (i ? `<td data-label="${head[i]}">${c}</td>` : `<th scope="row">${c}</th>`)).join('')}</tr>`).join('\n')}
</tbody></table></div>`;
const row = (id, cells) => Object.assign(cells, { id });

const content = `<p class="eyebrow kicker">Security review</p>
<h1>What a security reviewer needs, in one map.</h1>
<p class="lede">Approving an Azure Virtual Desktop deployment built with the avd-ops repos? This page lists what each repo does for security, links the file that does it or proves it at a pinned commit, and says how strong that proof is, what you still own, and what is missing.</p>
<p>It is a map, not a copy and not an audit: every line points at the repo that holds the detail. The map itself lives in avd-assess (${link(assess('security-review.yaml'), 'security-review.yaml')}), and this page renders it at commit <span class="mono">${esc(lock.commit.slice(0, 7))}</span>, checked ${esc(map.checked)}. Nothing here is a security audit, a compliance attestation or a penetration test.</p>

<h2 id="maturity">How far each repo has been proven</h2>
<p>The owner's call, recorded in the ${link(map.maturity.source.url, 'roadmap spec')}. A claim below never makes its repo more proven than this.</p>
<div class="maturity">${Object.entries(map.maturity.repos).map(([r, m]) => `<div class="card"><b>${repoLink(r)}</b><span class="status ${MATURITY[m][1]}">${MATURITY[m][0]}</span></div>`).join('')}</div>

<h2 id="standing">How strong the evidence is</h2>
<p>Each claim carries one standing, the strongest its evidence supports. Of ${claims.size} claims: ${Object.entries(counts).map(([s, n]) => `${n} ${STANDING[s][0].toLowerCase()}`).join(', ')}.</p>
<dl class="legend">${Object.entries(STANDING).map(([s, [, means]]) => `<div><dt>${standing(s)}</dt><dd>${esc(means)}</dd></div>`).join('')}</dl>

<h2 id="checklist">The reviewer's questions</h2>
<p>Each question is answered by the claims and the operator decisions it links.</p>
<ol class="checklist">
${map.checklist.map((q) => `<li id="q-${q.id}"><strong>${esc(q.ask)}</strong> ${refs(q.see)}</li>`).join('\n')}
</ol>

${map.areas.map((a) => `<h2 id="${a.id}">${esc(a.title)}</h2>
<p class="pillars">Standards: ${a.pillars.map((p) => `<span class="chip">${esc(p)}</span>`).join(' ')} in ${link(assess('pillars.yaml'), 'the avd-assess pillars')}.</p>
${table(['Claim', 'Repo', 'Standing', 'Evidence'], a.claims.map((c) => row(`c-${c.id}`, [
  `${esc(c.says)}${c.note ? `<span class="note">${esc(c.note)}</span>` : ''}`,
  repoLink(c.repo),
  standing(c.standing),
  evidence(c.evidence),
])))}`).join('\n')}

<h2 id="operator">What you still decide and own</h2>
<p>The repos make these choices visible; they don't make them for you. Microsoft's half of the shared responsibility is in the ${link(citeUrl('ref:avd-security-guide'), 'AVD security guide')}.</p>
${table(['Decision', 'See'], map.operator.map((o) => row(`o-${o.id}`, [esc(o.says), refs(o.see)])))}

<h2 id="threats">What each repo can touch</h2>
<p>A short summary per repo, not a formal threat model. Only avd-swarm has had a full red team so far.</p>
<div class="credit-cards">
${map.threats.map((t) => `<div class="card"><h3>${repoLink(t.repo)}</h3><p>${esc(t.touches)}</p><p><b>Risks:</b> ${t.risks.map(esc).join('; ')}.</p><p><b>Limited by:</b> ${refs(t.limits)}</p>${t.formal === 'none' ? '<p class="note">No formal threat model yet.</p>' : `<p>${link(t.formal.url, 'Red team review')}</p>`}</div>`).join('\n')}
</div>

<h2 id="standards">The standards</h2>
<p>To judge an estate rather than the tools, use the avd-assess ${link(assess(map.standards.method), 'security method')} and ${link(citeUrl(map.standards.scope), 'its scope')}, the pillars ${map.standards.pillars.map((p) => `<span class="chip">${esc(p)}</span>`).join(' ')}, and these pinned Microsoft sources: ${map.standards.references.map((r) => link(citeUrl(r), esc(r.slice(4)))).join(', ')}.</p>

<h2 id="gaps">What the review found missing</h2>
<p>Each is proposed as an issue in the repo named, not fixed here.</p>
${table(['Gap', 'Repos'], map.gaps.map((g) => row(`g-${g.id}`, [`${esc(g.says)}${g.issue ? ` ${link(g.issue, 'Issue')}` : ''}`, `<div class="chips">${g.repos.map((r) => `<span class="chip">${esc(r)}</span>`).join('')}</div>`])))}

<h2 id="report">Reporting a vulnerability</h2>
<p>Privately, through <strong>Report a vulnerability</strong> on the repo's Security tab, as each repo's <span class="mono">SECURITY.md</span> says. Never put secrets, IDs, names or estate data in a public issue.</p>

<h2 id="data">The map as data</h2>
<p>For tools: ${link('data/security-review.json', 'security-review.json')} (<span class="mono">${esc(map.schema)}</span>), byte-identical to avd-assess at <span class="mono">${esc(lock.commit.slice(0, 7))}</span>, with its ${link(assess('contracts/schemas/assess-security-review.schema.json'), 'schema')}.</p>`;

const html = applyShell(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Security review | avd-ops</title>
<meta name="description" content="The map a security reviewer needs to approve deploying Azure Virtual Desktop with the avd-ops repos: what each repo does, the pinned evidence, what you still own and the gaps.">
<!-- shell:head --><!-- /shell:head -->
</head>
<body class="shell">
<!-- Generated by scripts/site/build-security.mjs from site/data/security-review.json. Do not edit; change the map in avd-assess and bump the pin. -->
<!-- shell:top --><!-- /shell:top -->
<main id="main" class="security">
${content}
<p class="built">This page is built from avd-assess's ${link(assess('security-review.yaml'), 'security review map')}. Something wrong or missing? Open an issue or a pull request in <a href="${esc(lock.source)}/issues">avd-assess</a>.</p>
</main>
<!-- shell:foot --><!-- /shell:foot -->
</body>
</html>
`, 'security.html');

if (process.argv.includes('--check')) {
  if (!existsSync(join(root, OUT)) || readFileSync(join(root, OUT), 'utf8') !== html) {
    console.error(`${OUT} is out of date; run node scripts/site/build-security.mjs`);
    process.exit(1);
  }
  console.log(`${OUT} is up to date`);
} else {
  writeFileSync(join(root, OUT), html);
  console.log(`wrote ${OUT}`);
}
