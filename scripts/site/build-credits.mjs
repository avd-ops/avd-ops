// Builds site/credits.html (https://avd-ops.dev/credits.html) from credits.json, the one list of what
// the family adopts, learns from and reads, and how help flows both ways: upstream and back to us.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-credits.mjs           # write site/credits.html
//   node scripts/site/build-credits.mjs --check   # fail if site/credits.html is out of date (CI)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const OUT = 'site/credits.html';
const data = JSON.parse(readFileSync(join(root, 'credits.json'), 'utf8'));
const { repos } = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const gh = (name) => `https://github.com/${data.org}/${name}`;
const link = (url, text) => `<a href="${esc(url)}">${esc(text)}</a>`;

const NAV = [['Overview', 'index.html'], ['Docs', 'docs/index.html'], ['Architecture', 'architecture.html'], ['Credits', 'credits.html'],
  ...['avd-landing-zone', 'avd-current-state', 'avd-assess', 'avd-swarm', 'avd-second-brain'].map((r) => [r, `family/${r}.html`])];
const nav = NAV.map(([t, u]) => `<a href="${u}"${u === 'credits.html' ? ' aria-current="page"' : ''}>${t}</a>`).join('');

function table(rows, head, cells) {
  return `<div class="tbl"><table class="stacked">
<thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
<tbody>
${rows.map((r) => `<tr>${cells(r).map((c, i) => (i ? `<td data-label="${head[i]}">${c}</td>` : `<th scope="row">${c}</th>`)).join('')}</tr>`).join('\n')}
</tbody></table></div>`;
}

const where = (names) => (names || []).map((n) => `<span class="chip">${esc(n)}</span>`).join('');
const cards = (items) => `<div class="credit-cards">
${items.map((i) => `<div class="card"><h3>${link(i.url, i.title)}</h3><p>${esc(i.text)}</p></div>`).join('\n')}
</div>`;

const p = data.people;
const content = `<span class="eyebrow kicker">Credits</span>
<h1>Built on other people's work, and giving it back.</h1>
<p class="lede">The open-source projects, sources and people the avd-ops repos stand on, and how research help flows both ways: what we send upstream, and where you can help us.</p>
<div class="warn" role="note"><strong>Personal project. Research and learning only. Not for production. No warranty.</strong>
<ul><li>Built on my own time for research and learning. Not affiliated with, endorsed by or supported by my employer or Microsoft.</li>
<li>Don't run any of it in production or against tenants that matter. Test in a dedicated lab subscription and tenant first.</li>
<li>Provided "as is", without warranty of any kind, under each repo's license. You use it at your own risk and own the Azure charges it incurs.</li>
<li><strong>Contributions and forks are welcome and encouraged.</strong> See <a href="#help-us">Help us</a> and <a href="index.html#contribute">Contribute</a>.</li></ul></div>
<p>Listing a project here credits it; it doesn't mean the project endorses avd-ops. Licenses are what each repo's license file said on ${esc(data.checked)}. Where we use a source, we link it and say what we use it for in our own words.</p>
<h2 id="adopted">Open source we build on</h2>
<p>Adopted because each is the best at its job and open source (<a href="https://github.com/${data.org}/avd-ops/blob/main/docs/build-or-adopt.md">build or adopt</a>), and pinned to a release or commit where it runs.</p>
${table(data.adopted, ['Project', 'What we use it for', 'License', 'Used in'], (r) => [link(r.url, r.name), esc(r.job), `<span class="mono">${esc(r.license)}</span>`, `<div class="chips">${where(r.in)}</div>`])}
<h2 id="tooling">Tools we build with</h2>
${table(data.tooling, ['Project', 'What we use it for', 'License'], (r) => [link(r.url, r.name), esc(r.job), `<span class="mono">${esc(r.license)}</span>`])}
<h2 id="prior-art">Prior art we learned from</h2>
<p>Projects that do part of what we do. We studied them, used them as a checklist, and say why we took a different path.</p>
${table(data.prior_art, ['Project', 'What we learned', 'License'], (r) => [link(r.url, r.name), esc(r.why), `<span class="mono">${esc(r.license)}</span>`])}
<h2 id="sources">Sources we read</h2>
${table(data.sources, ['Source', 'What we read it for', 'Terms'], (r) => [link(r.url, r.name), esc(r.use), esc(r.license)])}
<p>${esc(data.references.text)} ${link(data.references.url, 'See the pinned references')}.</p>
<h2 id="people">People</h2>
<ul>
${p.maintainers.map((m) => `<li><strong>${esc(m.name)}</strong> (${link(`https://github.com/${m.github}`, `@${m.github}`)}), ${esc(m.role.toLowerCase())}.</li>`).join('\n')}
<li>Everyone who has opened an issue or a pull request: see each repo's contributors on GitHub, ${repos.filter((r) => r.name !== 'avd-ops').map((r) => link(`${gh(r.name)}/graphs/contributors`, r.name)).join(', ')} and ${link(`${gh('avd-ops')}/graphs/contributors`, 'avd-ops')}.</li>
<li>${esc(p.experts.text)} ${link(p.experts.url, 'Read the method and the list')}.</li>
</ul>
<h2 id="give-back">What we send upstream</h2>
<p>When a real run finds something only an upstream project can fix, we write it down with the evidence and offer it back. A person reviews every draft and files it under their own account; no agent posts upstream.</p>
${cards(data.give_back)}
<h2 id="help-us">Help us</h2>
<p>Research help is as welcome as code. Each of these is a GitHub issue or a pull request in the <a href="https://github.com/${data.org}">${esc(data.org)}</a> repos. Issues are public, so keep tenant data, names, IDs and secrets out of them.</p>
${cards(data.help_wanted)}
<p>${repos.filter((r) => r.name !== 'avd-ops').map((r, i) => `<a class="cta${i ? ' ghost' : ''}" href="${gh(r.name)}/issues">${esc(r.name)} issues</a>`).join('')}</p>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Credits | avd-ops</title>
<meta name="description" content="The open source, sources and people the avd-ops repos build on, and how to help in both directions.">
<link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/avd-ops.css">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
<!-- Generated by scripts/site/build-credits.mjs from credits.json. Do not edit; edit the JSON and rebuild. -->
<div class="wrap wide"><header class="top"><a class="brand" href="index.html"><img class="mark" src="assets/brand/mark.svg" alt="" width="26" height="26">avd-ops</a><nav aria-label="Repos">${nav}</nav></header>
${content}
<footer class="site"><p>This page is built from <a href="https://github.com/${data.org}/avd-ops/blob/main/credits.json">credits.json</a>. Missing a credit, or a license is wrong? Open an issue or a pull request in <a href="https://github.com/${data.org}/avd-ops/issues">avd-ops</a>.</p>
<p>Every avd-ops repo is open source, under MIT unless a folder says otherwise. Azure, Azure Virtual Desktop, Microsoft Entra, Intune and FSLogix are trademarks of Microsoft. Other names belong to their owners.</p></footer></div>
</body>
</html>
`;

if (process.argv.includes('--check')) {
  if (!existsSync(join(root, OUT)) || readFileSync(join(root, OUT), 'utf8') !== html) {
    console.error(`${OUT} is out of date; run node scripts/site/build-credits.mjs`);
    process.exit(1);
  }
  console.log(`${OUT} is up to date`);
} else {
  writeFileSync(join(root, OUT), html);
  console.log(`wrote ${OUT}`);
}
