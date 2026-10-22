// Builds the standards library (https://avd-ops.dev/standards/) from site/data/standards/, a pinned copy of
// avd-assess's own published files: index.json (contract C20: references, claims, observations, gaps), map.json,
// method.json, the fact register and methods/*.md. avd-assess holds the standards; these pages only present
// them like a paper: numbered references, citations that name the claim, each source with its pin and the date
// it was read, and an edition stamp. A change to a claim is made in avd-assess and arrives here with a pin bump.
// It also writes site/data/library.json, the one data file the library and the credits page read.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-standards.mjs                      # write site/standards/ and site/data/library.json
//   node scripts/site/build-standards.mjs --check              # fail if any of them is out of date (CI)
//   node scripts/site/build-standards.mjs --pin ../avd-assess  # copy avd-assess's files at its HEAD and lock them
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { marked } from 'marked';
import { applyShell } from './apply-shell.mjs';

const root = new URL('../../', import.meta.url).pathname;
const DATA = 'site/data/standards';
const LOCK = `${DATA}/standards.lock.json`;
const FILES = ['index.json', 'map.json', 'method.json', 'contracts/fact-register.json'];
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

// --pin: take avd-assess's files at the checkout's HEAD, byte for byte, and record each hash.
const pinAt = process.argv.indexOf('--pin');
if (pinAt > -1) {
  const src = process.argv[pinAt + 1];
  if (!src || !existsSync(join(src, 'index.json'))) throw new Error('--pin needs the path of an avd-assess checkout');
  const git = (...a) => execFileSync('git', ['-C', src, ...a], { encoding: 'utf8' }).trim();
  if (git('status', '--porcelain')) throw new Error(`${src} has uncommitted changes; pin a clean commit`);
  rmSync(join(root, DATA), { recursive: true, force: true });
  const methods = readdirSync(join(src, 'methods')).filter((f) => f.endsWith('.md')).sort().map((f) => `methods/${f}`);
  const files = {};
  for (const f of [...FILES, ...methods]) {
    const to = join(root, DATA, f.replace(/^contracts\//, ''));
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(join(src, f), to);
    files[f] = sha(to);
  }
  const lock = {
    description: 'site/data/standards/ holds byte-identical copies of these avd-assess files at commit (contracts/fact-register.json is stored as fact-register.json); tests/standards.test.mjs checks every hash. To update, run node scripts/site/build-standards.mjs --pin <avd-assess checkout>, then node scripts/site/build-standards.mjs, in one PR.',
    source: 'https://github.com/avd-ops/avd-assess',
    commit: git('rev-parse', 'HEAD'),
    date: git('log', '-1', '--format=%cd', '--date=short'),
    files,
  };
  writeFileSync(join(root, LOCK), `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`pinned avd-assess ${lock.commit.slice(0, 7)} (${Object.keys(files).length} files); now run node scripts/site/build-standards.mjs`);
  process.exit(0);
}

const lock = JSON.parse(readFileSync(join(root, LOCK), 'utf8'));
const local = (f) => join(root, DATA, f.replace(/^contracts\//, ''));
const json = (f) => JSON.parse(readFileSync(local(f), 'utf8'));
const index = json('index.json');
const method = json('method.json');
const register = json('contracts/fact-register.json');
const SHORT = lock.commit.slice(0, 7);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const assess = (path) => `${lock.source}/blob/${lock.commit}/${path}`;
const cite = (path, id) => `avd-assess@${SHORT}:${path}${id ? `#${id}` : ''}`;
const known = (table, key, what) => {
  if (!(key in table)) throw new Error(`standards: unknown ${what} ${JSON.stringify(key)}; teach build-standards.mjs its label`);
  return table[key];
};

// The records, by ID.
const refs = new Map(index.references.map((r) => [r.id, r]));
const obs = new Map(index.observations.map((o) => [o.id, o]));
const gaps = new Map(index.gaps.map((g) => [g.id, g]));
const facts = new Map(register.facts.map((f) => [f.id, f]));
const methodIds = Object.keys(lock.files).filter((f) => f.startsWith('methods/')).map((f) => f.slice(8, -3));

// A citation token as avd-assess writes it: ref:<source>[#<claim>], obs:<id> or gap:<id>[#<anchor>].
const TOKEN = /`(ref|obs|gap):([A-Za-z0-9._-]+)(?:#([A-Za-z0-9.:_-]+))?`/g;
const resolve = (kind, id, claim, where) => {
  const table = { ref: refs, obs, gap: gaps }[kind];
  if (!table.has(id)) throw new Error(`${where}: ${kind}:${id} is not in avd-assess index.json at ${SHORT}`);
  if (kind === 'ref' && claim && !refs.get(id).claims.some((c) => c.id === claim)) throw new Error(`${where}: ref:${id}#${claim} names no claim of ${id}`);
};

// Who cites what: method pages (by reading them), observations and checks.
const citedBy = new Map(); // "source#claim" or "source" -> [{ method, title }]
const methods = methodIds.map((id) => {
  const md = readFileSync(local(`methods/${id}.md`), 'utf8');
  const title = (md.match(/^# (.+)$/m) || [, id])[1];
  for (const [, kind, ref, claim] of md.matchAll(TOKEN)) {
    resolve(kind, ref, claim, `methods/${id}.md`);
    if (kind !== 'ref') continue;
    const key = claim ? `${ref}#${claim}` : ref;
    if (!citedBy.has(key)) citedBy.set(key, []);
    if (!citedBy.get(key).some((m) => m.id === id)) citedBy.get(key).push({ id, title });
  }
  return { id, title, md };
});
const obsOn = new Map(); // "source#claim" -> [observation]
for (const o of index.observations) {
  const [, id, claim] = o.claim.match(/^ref:([^#]+)(?:#(.+))?$/) || [];
  if (!id) continue;
  resolve('ref', id, claim, `observations/${o.id}.yaml`);
  const key = claim ? `${id}#${claim}` : id;
  if (!obsOn.has(key)) obsOn.set(key, []);
  obsOn.get(key).push(o);
}
const checksOn = new Map(); // "source#claim" -> [check]
for (const c of method.checks) for (const cl of c.claims) {
  const m = cl.match(/^ref:([^#]+)#(.+)$/);
  if (m) (checksOn.get(`${m[1]}#${m[2]}`) || checksOn.set(`${m[1]}#${m[2]}`, []).get(`${m[1]}#${m[2]}`)).push(c);
}

// The three node states from avd-assess's map review: mapped (a pinned source states it), measurable (a check
// reads it and every fact that check needs is built), validated (an observation with evidence agrees or extends).
const VERDICT = { agrees: 'agrees', extends: 'extends', 'not-yet-tested': 'not yet tested', disagrees: 'disagrees' };
const KIND = { published: 'published', guidance: 'guidance', prior: 'prior estimate' };
const stateOf = (source, claim) => {
  const key = `${source}#${claim}`;
  const checks = checksOn.get(key) || [];
  const os = obsOn.get(key) || [];
  return {
    mapped: true,
    measurable: checks.some((c) => c.facts.every((f) => facts.get(f)?.status === 'built')),
    validated: os.some((o) => (o.verdict === 'agrees' || o.verdict === 'extends') && o.evidence?.length),
    disputed: os.some((o) => o.verdict === 'disagrees'),
    helpWanted: os.some((o) => o.verdict === 'not-yet-tested'),
  };
};

// How a source reads in a reference list: who published it, where, and which version we read.
function publisher(r) {
  const u = new URL(r.url);
  if (u.hostname === 'learn.microsoft.com') return 'Microsoft Learn';
  if (u.hostname === 'github.com') return `GitHub, ${u.pathname.split('/').slice(1, 3).join('/')}`;
  return u.hostname.replace(/^www\./, '');
}
function pinText(r) {
  const learn = r.pin.match(/git_commit_id ([0-9a-f]{7,40}), updated_at (\d{4}-\d{2}-\d{2})/);
  if (learn) return `git_commit_id <span class="mono">${learn[1].slice(0, 7)}</span>, updated ${learn[2]}`;
  const gh = r.pin.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree|commit)\/([0-9a-f]{40})/);
  if (gh) return `commit <a class="mono" href="${esc(r.pin)}">${gh[1].slice(0, 7)}</a>`;
  return esc(r.pin);
}
const isLearn = (r) => /git_commit_id/.test(r.pin);
const entry = (r) => `${esc(publisher(r))}. <cite>${esc(r.title)}</cite>. Pinned at ${pinText(r)}; read ${esc(r.read)}.`;

// Markdown from avd-assess: citations become numbered references, links stay inside the library or go to
// avd-assess at the pinned commit, never a branch.
function render(m) {
  const order = []; const oOrder = []; const gOrder = [];
  const num = (list, id) => (list.includes(id) ? list.indexOf(id) : list.push(id) - 1) + 1;
  let md = m.md.replace(/^# .+\n+/, '');
  md = md.replace(TOKEN, (_, kind, id, claim) => {
    if (kind === 'ref') {
      const n = num(order, id);
      const c = claim && refs.get(id).claims.find((x) => x.id === claim);
      return `<a class="cite" href="../sources/${id}.html${claim ? `#${esc(claim)}` : ''}"${c ? ` title="${esc(c.says)}"` : ''}>[${n}${claim ? `, ${esc(claim)}` : ''}]</a>`;
    }
    if (kind === 'obs') return `<a class="cite obs" href="#obs-${id}" title="${esc(obs.get(id).observed)}">[O${num(oOrder, id)}]</a>`;
    return `<a class="cite gap" href="#gap-${id}" title="Our own method: ${esc(gaps.get(id).title)}">[G${num(gOrder, id)}]</a>`;
  });
  const renderer = new marked.Renderer();
  renderer.link = ({ href, text }) => {
    let to = href;
    if (/^[a-z0-9-]+\.md(#.*)?$/.test(href) && methodIds.includes(href.split('.md')[0])) to = href.replace('.md', '.html');
    else if (!/^(https?:|#)/.test(href)) to = assess(href.replace(/^\.\.\//, '').replace(/^\.\//, 'methods/'));
    return `<a href="${esc(to)}">${text}</a>`;
  };
  const html = marked.parse(md, { renderer, gfm: true });
  const [lead, ...rest] = html.split(/(?=<h2)/);
  return { lead, body: rest.join(''), order, oOrder, gOrder };
}

const citeBox = (text) => `<div class="card cite-box"><p class="eyebrow">Cite this</p><p class="cite-line"><code>${esc(text)}</code></p>
<p class="note">Cite a claim as <span class="mono">avd-assess@&lt;commit&gt;:references/&lt;source&gt;.yaml#&lt;claim&gt;</span>. <a href="${'../'}how-to-cite.html">How to cite</a></p></div>`;
const edition = (up, file) => `<p class="edition">${file ? `<a class="mono" href="${esc(assess(file))}">${esc(file)}</a> &middot; ` : ''}Edition <a class="mono" href="${esc(`${lock.source}/tree/${lock.commit}`)}">${SHORT}</a> of avd-assess, ${esc(lock.date)}. <a href="${up}changes.html">What changed</a></p>`;
const marks = (s) => `<span class="states" aria-label="Node state">${[
  ['mapped', s.mapped, 'A pinned source states it'],
  ['measurable', s.measurable, 'A check reads it from built facts'],
  ['validated', s.validated, 'An observation with evidence backs it'],
].map(([t, on, why]) => `<span class="state${on ? ' on' : ''}" title="${why}">${on ? '&#10003;' : '&#9675;'} ${t}</span>`).join('')}${s.disputed ? '<span class="verdict v-disagrees">disputed by a run</span>' : ''}${s.helpWanted ? '<span class="verdict v-help">help wanted: not yet tested</span>' : ''}</span>`;
const verdict = (v) => `<span class="verdict v-${v}">${known(VERDICT, v, 'verdict')}</span>`;

function page(path, title, description, main) {
  const up = '../'.repeat(path.split('/').length - 1);
  return applyShell(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)} | Standards library | avd-ops</title>
<meta name="description" content="${esc(description)}">
<!-- shell:head --><!-- /shell:head -->
</head>
<body class="shell">
<!-- Generated by scripts/site/build-standards.mjs from site/data/standards/ (avd-assess at ${SHORT}). Do not edit; change avd-assess and bump the pin. -->
<!-- shell:top --><!-- /shell:top -->
<main id="main" class="standards">
${main}
<p class="built">Built from avd-assess at <a class="mono" href="${esc(`${lock.source}/tree/${lock.commit}`)}">${SHORT}</a>. Something wrong or missing? Open an issue or a pull request in <a href="${esc(lock.source)}/issues">avd-assess</a>.</p>
</main>
<!-- shell:foot --><!-- /shell:foot -->
</body>
</html>
`, path);
}

const out = new Map(); // path under site/ -> text

// Method pages.
for (const m of methods) {
  const r = render(m);
  const used = r.order.map((id) => refs.get(id));
  const claimsCited = (id) => [...new Set([...m.md.matchAll(TOKEN)].filter(([, k, s, c]) => k === 'ref' && s === id && c).map(([, , , c]) => c))];
  out.set(`standards/methods/${m.id}.html`, page(`standards/methods/${m.id}.html`, m.title, `${m.title} from the avd-assess standards, with every citation numbered and linked to its pinned source.`, `<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Standards library</a> / Methods</nav>
<h1>${esc(m.title)}</h1>
${edition('../', `methods/${m.id}.md`)}
<div class="abstract prose">${r.lead}</div>
<div class="article prose">${r.body}</div>
<h2 id="references">References</h2>
<ol class="refs">
${used.map((s, i) => { const cs = claimsCited(s.id); return `<li id="r-${s.id}"><span class="n">[${i + 1}]</span><span>${entry(s)}${cs.length ? ` Claims cited: ${cs.map((c) => `<a href="../sources/${s.id}.html#${esc(c)}">${esc(c)}</a>`).join(', ')}.` : ''} <a href="${esc(s.url)}">Source</a> &middot; <a href="../sources/${s.id}.html">Entry</a></span></li>`; }).join('\n')}
</ol>
${r.oOrder.length ? `<h2 id="observations">Our observations</h2>
<p>What our own runs showed about a cited claim. Evidence links are public and pinned.</p>
<ol class="refs">
${r.oOrder.map((id, i) => { const o = obs.get(id); const [, s, c] = o.claim.match(/^ref:([^#]+)(?:#(.+))?$/) || []; return `<li id="obs-${id}"><span class="n">[O${i + 1}]</span><span>${verdict(o.verdict)} <a href="${esc(assess(`observations/${id}.yaml`))}">${esc(id)}</a>, on ${s ? `<a href="../sources/${s}.html${c ? `#${esc(c)}` : ''}">${esc(s)}${c ? `#${esc(c)}` : ''}</a>` : esc(o.claim)}, ${esc(o.date)}. ${esc(o.observed)}</span></li>`; }).join('\n')}
</ol>` : ''}
${r.gOrder.length ? `<h2 id="gaps">Our own method (gaps)</h2>
<p>Where no published source covers a step, avd-assess writes the method and says what was searched and not found.</p>
<ol class="refs">
${r.gOrder.map((id, i) => `<li id="gap-${id}"><span class="n">[G${i + 1}]</span><span><a href="${esc(assess(`gaps/${id}.md`))}">${esc(id)}</a>: ${esc(gaps.get(id).title)}.</span></li>`).join('\n')}
</ol>` : ''}
${citeBox(cite(`methods/${m.id}.md`))}`));
}

// Source pages.
for (const s of index.references) {
  out.set(`standards/sources/${s.id}.html`, page(`standards/sources/${s.id}.html`, s.title, `${s.title}: the claims avd-assess takes from it, in its own words, with the pin and read date.`, `<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Standards library</a> / <a href="index.html">Sources</a></nav>
<h1>${esc(s.title)}</h1>
${edition('../', `references/${s.id}.yaml`)}
<p class="prose">${entry(s)} ${esc(s.license)}. We keep one line in our own words per claim and link the source; its text stays with its publisher.${s.notes ? ` ${esc(s.notes)}` : ''}</p>
<p class="actions"><a class="cta" href="${esc(s.url)}">Read the source</a></p>
${isLearn(s) ? '<p class="note">The Learn pin names the version we read; Microsoft does not publish that commit, so the pin is a record, not a readable copy. The live page may have changed since the read date.</p>' : ''}
<h2 id="claims">Claims (${s.claims.length})</h2>
${s.claims.map((c) => {
  const key = `${s.id}#${c.id}`;
  const by = citedBy.get(key) || [];
  const os = obsOn.get(key) || [];
  const cs = checksOn.get(key) || [];
  return `<section class="claim" id="${esc(c.id)}">
<p class="claim-head"><a class="mono" href="#${esc(c.id)}">#${esc(c.id)}</a> ${c.kind ? `<span class="kind">${esc(known(KIND, c.kind, 'claim kind'))}</span>` : ''}</p>
<p class="prose says">${esc(c.says)}</p>
${marks(stateOf(s.id, c.id))}
<p class="note">${by.length ? `Cited by ${by.map((m) => `<a href="../methods/${m.id}.html">${esc(m.title)}</a>`).join(', ')}.` : 'Not cited by a method yet.'}${cs.length ? ` Checks: ${cs.map((k) => `<a class="mono" href="${esc(assess('method.json'))}">${esc(k.id)}</a>`).join(', ')}.` : ''}${os.length ? ` Observations: ${os.map((o) => `${verdict(o.verdict)} <a href="${esc(assess(`observations/${o.id}.yaml`))}">${esc(o.id)}</a>`).join(', ')}.` : ''} Cite: <span class="mono">${esc(cite(`references/${s.id}.yaml`, c.id))}</span></p>
</section>`;
}).join('\n')}
${(citedBy.get(s.id) || []).length ? `<p class="note">The source as a whole is cited by ${citedBy.get(s.id).map((m) => `<a href="../methods/${m.id}.html">${esc(m.title)}</a>`).join(', ')}.</p>` : ''}
${citeBox(cite(`references/${s.id}.yaml`))}`));
}

// All sources, as a bibliography.
const claimCount = index.references.reduce((n, r) => n + r.claims.length, 0);
const sorted = [...index.references].sort((a, b) => a.title.localeCompare(b.title));
out.set('standards/sources/index.html', page('standards/sources/index.html', 'Sources', `Every source the avd-assess standards cite: ${index.references.length} pinned sources and ${claimCount} claims.`, `<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Standards library</a> / Sources</nav>
<h1>Sources</h1>
${edition('../')}
<p class="lede">${index.references.length} published sources, each pinned to the version we read, with ${claimCount} claims taken from them in our own words. Sorted by title.</p>
<ol class="refs bib">
${sorted.map((s) => `<li><span>${entry(s)} <a href="${s.id}.html">${s.claims.length} claim${s.claims.length === 1 ? '' : 's'}</a></span></li>`).join('\n')}
</ol>`));

// How to cite.
out.set('standards/how-to-cite.html', page('standards/how-to-cite.html', 'How to cite', 'How to cite the avd-assess standards: a claim, an observation, a gap or a check, at a commit.', `<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Standards library</a> / How to cite</nav>
<h1>How to cite</h1>
${edition('')}
<p class="lede">Cite avd-assess at a commit, so a reader sees exactly what the standard said when you read it. This edition is <span class="mono">${SHORT}</span>.</p>
<h2 id="forms">Forms</h2>
<div class="tbl"><table>
<thead><tr><th scope="col">What</th><th scope="col">Form</th><th scope="col">Example</th></tr></thead>
<tbody>
<tr><th scope="row">A claim from a source</th><td class="mono">avd-assess@&lt;commit&gt;:references/&lt;source&gt;.yaml#&lt;claim&gt;</td><td class="mono">${esc(cite('references/avd-autoscale.yaml', 'capacity-threshold'))}</td></tr>
<tr><th scope="row">An observation</th><td class="mono">avd-assess@&lt;commit&gt;:observations/&lt;id&gt;.yaml</td><td class="mono">${esc(cite(`observations/${index.observations[0].id}.yaml`))}</td></tr>
<tr><th scope="row">A gap (our own method)</th><td class="mono">avd-assess@&lt;commit&gt;:gaps/&lt;id&gt;.md</td><td class="mono">${esc(cite(`gaps/${index.gaps[0].id}.md`))}</td></tr>
<tr><th scope="row">A check</th><td class="mono">avd-assess@&lt;commit&gt;:method.json#&lt;check&gt;</td><td class="mono">${esc(cite('method.json', method.checks[0].id))}</td></tr>
<tr><th scope="row">A method</th><td class="mono">avd-assess@&lt;commit&gt;:methods/&lt;id&gt;.md</td><td class="mono">${esc(cite('methods/finops.md'))}</td></tr>
</tbody></table></div>
<h2 id="upstream">Citing the sources themselves</h2>
<p>Our claims are one line in our own words. When your point rests on what Microsoft or another publisher says, cite their page too, with the pin and read date from its entry here, and read it yourself: the live page may have changed since we read it.</p>
<h2 id="data">As data</h2>
<p>For tools: <a href="../data/library.json">library.json</a> holds every source, claim, observation, gap and check of this edition with its node state, and the pinned avd-assess files it is built from are in <a href="${esc(`${lock.source}/tree/${lock.commit}`)}">avd-assess at ${SHORT}</a> (contract C20).</p>`));

// What changed: the edition and where its history is.
out.set('standards/changes.html', page('standards/changes.html', 'What changed', 'The edition of the avd-assess standards this library shows, and where its history is.', `<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Standards library</a> / What changed</nav>
<h1>What changed</h1>
${edition('')}
<p class="lede">The library shows one edition of avd-assess at a time. A new edition arrives as a pull request in avd-ops that moves the pin.</p>
<ul>
<li><a href="${esc(`${lock.source}/commits/${lock.commit}`)}">avd-assess history up to this edition</a>: sources added or re-pinned, claims changed, observations and gaps.</li>
<li><a href="${esc(`${lock.source}/commits/${lock.commit}/references`)}">Changes to the sources</a> and <a href="${esc(`${lock.source}/commits/${lock.commit}/gold-standards.yaml`)}">to the gold-standard registry</a>.</li>
</ul>`));

// The library's front page.
const counts = { sources: index.references.length, claims: claimCount, observations: index.observations.length, gaps: index.gaps.length, checks: method.checks.length };
const allStates = index.references.flatMap((s) => s.claims.map((c) => stateOf(s.id, c.id)));
const nState = (k) => allStates.filter((s) => s[k]).length;
const abstract = (m) => { const p = m.md.replace(/^# .+\n+/, '').split(/\n\n/)[0].replace(TOKEN, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, ''); return esc(p); };
const byTitle = [...methods].sort((a, b) => a.title.localeCompare(b.title));
out.set('standards/index.html', page('standards/index.html', 'Standards library', 'The avd-assess standards for Azure Virtual Desktop, read like a paper: methods with numbered references, every source pinned, every claim in our own words.', `<h1>Standards library</h1>
${edition('')}
<p class="lede">What an Azure Virtual Desktop estate should be, and why: the avd-assess methods, each step citing a pinned published source, our own observation, or method we wrote where no source exists.</p>
<p>This is a reading view of <a href="${esc(lock.source)}">avd-assess</a>, which holds the standards; the pages here add nothing of their own. ${counts.sources} sources, ${counts.claims} claims, ${counts.observations} observations, ${counts.gaps} gaps and ${counts.checks} checks in this edition.</p>
<h2 id="methods">Methods</h2>
<ul class="method-list">
${byTitle.map((m) => `<li><a href="methods/${m.id}.html">${esc(m.title)}</a><span class="prose">${abstract(m)}</span></li>`).join('\n')}
</ul>
<h2 id="states">How far each claim is proven</h2>
<p>Every claim carries three marks. Of ${counts.claims} claims, ${nState('mapped')} are mapped, ${nState('measurable')} measurable and ${nState('validated')} validated; ${nState('helpWanted')} are waiting on a run that tests them.</p>
<dl class="legend">
<div><dt>${marks({ mapped: true })}</dt><dd>A pinned source states it.</dd></div>
<div><dt><span class="states"><span class="state on">&#10003; measurable</span></span></dt><dd>A check in method.json reads it, and every fact the check needs is collected today.</dd></div>
<div><dt><span class="states"><span class="state on">&#10003; validated</span></span></dt><dd>An observation from a real run, with public evidence, agrees with it or extends it.</dd></div>
</dl>
<h2 id="more">More</h2>
<ul>
<li><a href="sources/index.html">All sources</a>, as a bibliography.</li>
<li><a href="how-to-cite.html">How to cite</a> a claim, an observation, a gap or a check.</li>
<li><a href="changes.html">What changed</a> in this edition.</li>
</ul>`));

// The one data file the library and the credits page read.
const library = {
  $comment: 'Generated by scripts/site/build-standards.mjs from avd-assess at edition.commit. Do not edit.',
  schema: 'avd-ops-library/v1',
  edition: { source: lock.source, commit: lock.commit, date: lock.date },
  references: index.references.map((s) => ({
    id: s.id, title: s.title, url: s.url, publisher: publisher(s), pin: s.pin, read: s.read, license: s.license,
    claims: s.claims.map((c) => ({ id: c.id, says: c.says, kind: c.kind, state: stateOf(s.id, c.id), citedBy: (citedBy.get(`${s.id}#${c.id}`) || []).map((m) => m.id) })),
  })),
  observations: index.observations.map((o) => ({ id: o.id, claim: o.claim, verdict: o.verdict, date: o.date, evidence: o.evidence })),
  gaps: index.gaps.map((g) => ({ id: g.id, title: g.title })),
  checks: method.checks.map((c) => ({ id: c.id, title: c.title, claims: c.claims, facts: c.facts })),
  methods: methods.map((m) => ({ id: m.id, title: m.title })),
};
out.set('data/library.json', `${JSON.stringify(library, null, 1)}\n`);

// Write, or check. Pages no longer produced are removed (or reported).
const produced = new Set(out.keys());
const existing = ['standards', 'standards/methods', 'standards/sources'].flatMap((d) => (existsSync(join(root, 'site', d)) ? readdirSync(join(root, 'site', d)).filter((f) => f.endsWith('.html')).map((f) => `${d}/${f}`) : []));
const stale = [...out].filter(([p, text]) => !existsSync(join(root, 'site', p)) || readFileSync(join(root, 'site', p), 'utf8') !== text).map(([p]) => p);
const orphan = existing.filter((p) => !produced.has(p));
if (process.argv.includes('--check')) {
  for (const [f, h] of Object.entries(lock.files)) if (sha(local(f)) !== h) { console.error(`${DATA}: ${f} does not match the lock; copy it from avd-assess with --pin, never edit it`); process.exit(1); }
  if (stale.length || orphan.length) {
    console.error(`the standards library is out of date (${[...stale, ...orphan].slice(0, 5).join(', ')}${stale.length + orphan.length > 5 ? ', ...' : ''}); run node scripts/site/build-standards.mjs`);
    process.exit(1);
  }
  console.log(`the standards library is up to date (${out.size} files, avd-assess ${SHORT})`);
} else {
  for (const p of orphan) rmSync(join(root, 'site', p));
  for (const p of stale) { mkdirSync(dirname(join(root, 'site', p)), { recursive: true }); writeFileSync(join(root, 'site', p), out.get(p)); }
  console.log(`wrote ${stale.length} of ${out.size} files and removed ${orphan.length} under site/ (avd-assess ${SHORT})`);
}
