// Builds site/docs/ (https://avd-ops.dev/docs/) from the knowledge base in docs/knowledge/, which is
// also an Obsidian vault: the pages link to each other with ordinary relative Markdown links, and
// the graph on the site is drawn from those same links (decision 0002).
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-docs.mjs           # write site/docs/
//   node scripts/site/build-docs.mjs --check   # fail if site/docs/ is out of date (CI)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, posix } from 'node:path';
import { marked } from 'marked';
import { graphHealth } from './graph-health.mjs';
import { shellHead, shellTop, shellFoot } from './shell.mjs';

const root = new URL('../../', import.meta.url).pathname;
const KB = 'docs/knowledge';
const OUT = 'site/docs';
const REPO = 'https://github.com/avd-ops/avd-ops/blob/main/';

// The reader-facing topics are published; the KB's own upkeep pages (its README, curation, experts,
// troubleshooting) stay in the repo and are linked on GitHub.
const PUBLISHED = [/^getting-started\//, /^concepts\//, /^repos\//, /^roadmap\//, /^decisions\/(README|\d{4}-[\w-]+)\.md$/];
// The KB sections: each is a root of the docs graph, reached from the side list (shell.mjs GROUPS).
// In the side list's order, which is also the order Next walks through the docs.
const SECTIONS = [['Start here', 'getting-started/README.md'], ['Concepts', 'concepts/README.md'], ['Roadmap', 'roadmap/README.md'],
  ['Repos', 'repos/README.md'], ['Decisions', 'decisions/README.md']];

const walk = (d) => readdirSync(join(root, d)).flatMap((f) => {
  const p = `${d}/${f}`;
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const sources = walk(KB).map((p) => p.slice(KB.length + 1)).filter((p) => p.endsWith('.md') && PUBLISHED.some((re) => re.test(p))).sort();

// docs/knowledge/<path>.md -> site/docs/<url>: getting-started is the docs home, a folder's README is its index.
function urlOf(src) {
  if (src === 'getting-started/README.md') return 'index.html';
  if (/^(concepts|roadmap)\/README\.md$/.test(src)) return `${src.split('/')[0]}.html`;
  return src.replace(/README\.md$/, 'index.html').replace(/\.md$/, '.html');
}

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  if (m) for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*"?(.*?)"?$/);
    if (kv) meta[kv[1]] = kv[2];
  }
  return { meta, body: m ? text.slice(m[0].length) : text };
}

const unesc = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pages = sources.map((src) => {
  const { meta, body } = frontMatter(readFileSync(join(root, KB, src), 'utf8'));
  const h1 = (body.match(/^# (.+)$/m) || [, src])[1];
  return { src, url: urlOf(src), title: h1, summary: meta.summary || '', topic: meta.topic || src.split('/')[0], status: meta.status || '', body, links: [] };
});
const bySrc = new Map(pages.map((p) => [p.src, p]));

// Rewrites one link from a page: a published page becomes its site URL, anything else in the repo
// goes to GitHub, and outside links stay as they are.
function rewrite(page, href) {
  if (/^([a-z]+:|#)/i.test(href)) return href;
  const [path, hash] = href.split('#');
  const target = posix.normalize(posix.join(posix.dirname(page.src), path));
  const to = bySrc.get(target);
  if (to) {
    if (!page.links.includes(to.src) && to.src !== page.src) page.links.push(to.src);
    return posix.relative(posix.dirname(page.url), to.url) + (hash ? `#${hash}` : '');
  }
  return REPO + posix.normalize(posix.join(KB, target)) + (hash ? `#${hash}` : '');
}

function render(page, md) {
  const renderer = new marked.Renderer();
  const link = renderer.link.bind(renderer);
  renderer.link = (token) => link({ ...token, href: rewrite(page, token.href) });
  return marked.parse(md, { renderer, gfm: true });
}

// GitHub's heading anchors, so a link that works on GitHub and in the validator works on the site too.
function slugger() {
  const seen = new Map();
  return (text) => {
    const base = unesc(text.replace(/<[^>]+>/g, '')).trim().toLowerCase().replace(/[^\w\- ]/g, '').replace(/ /g, '-');
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
}

// On a phone a table reads as one card per row (site.css .stacked), so each cell carries its column's name.
function stack(table) {
  const cols = [...(table.match(/<thead>[\s\S]*?<\/thead>/) || [''])[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
  return table.replace('<table>', '<table class="stacked">').replace(/<tbody>[\s\S]*<\/tbody>/, (body) => body.replace(/<tr>([\s\S]*?)<\/tr>/g,
    (_, row) => { let i = 0; return `<tr>${row.replace(/<td([^>]*)>/g, (m, a) => `<td${a} data-label="${cols[i++] || ''}">`)}</tr>`; }));
}

// One idea per screen (docs/design-system.md, "One screen at a time"): the title and the intro are the first
// screen and each ## section is the next one. In a section, what comes after a <!-- more --> line goes behind
// "+ more", so the screen opens on its bottom line. Without JavaScript every screen shows, one after another.
function screens(page) {
  const slug = slugger();
  // Split on ## headings and <!-- more --> lines outside code fences, so a fenced sample can hold either.
  const list = [];
  let fence = false;
  for (const line of page.body.split('\n')) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    const h = !fence && line.match(/^(#{1,2}) (.+)$/);
    if (h) list.push({ title: h[2].trim(), level: h[1].length, parts: [[]] });
    else if (list.length && !fence && /^<!-- more -->\s*$/.test(line)) list.at(-1).parts.push([]);
    else if (list.length) list.at(-1).parts.at(-1).push(line);
  }
  return list.map((s) => {
    const id = slug(s.title);
    const [shown, ...rest] = s.parts.map((lines) => lines.join('\n'));
    const sub = (html) => html.replace(/<h([34])>([\s\S]*?)<\/h\1>/g, (_, n, t) => `<h${n} id="${slug(t)}">${t}</h${n}>`)
      .replace(/<table>[\s\S]*?<\/table>/g, (t) => `<div class="tbl">${stack(t)}</div>`);
    const head = marked.parseInline(s.title);
    const lead = sub(render(page, shown)).replace(/^<p>/, '<p class="bl">');
    const more = rest.length ? `\n<details class="more"><summary>More</summary>\n${sub(render(page, rest.join('\n')))}</details>\n` : '';
    // title is already escaped HTML (marked escapes it), so it goes into the markup as it is.
    return { id, title: head.replace(/<[^>]+>/g, ''), html: `<section class="screen" id="${id}">\n<h${s.level} tabindex="-1">${head}</h${s.level}>\n${lead}${more}</section>` };
  });
}

function shell({ url, title, summary, content }) {
  const up = '../'.repeat(url.split('/').length);           // to site/
  const foot = `<p>These docs are the Markdown in <a href="https://github.com/avd-ops/avd-ops/tree/main/${KB}">${KB}/</a>; open the folder in Obsidian to browse it as a vault. Each repo is the source of truth for itself.</p>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)} | avd-ops docs</title>
<meta name="description" content="${esc(summary)}">
${shellHead(up)}
</head>
<body class="shell">
<!-- Generated by scripts/site/build-docs.mjs from ${KB}/. Do not edit; edit the Markdown and rebuild. -->
${shellTop(up, `docs/${url}`)}
<main id="main"><div class="col">
${content}
</div></main>
${shellFoot(foot)}
</body>
</html>
`;
}

function build() {
  const files = new Map();
  for (const p of pages) p.screens = screens(p);
  // The docs read as one walk-through: Next on a page's last screen opens the next page, in the side list's order.
  const order = SECTIONS.flatMap(([, s]) => pages.filter((p) => p.src.startsWith(s.split('/')[0] + '/'))
    .sort((a, b) => (a.src === s ? -1 : b.src === s ? 1 : a.src.localeCompare(b.src))));
  // A published page outside the sections is still built, at the end of the walk.
  order.push(...pages.filter((p) => !order.includes(p)));
  for (const [i, p] of order.entries()) {
    const rel = (q) => posix.relative(posix.dirname(p.url), q.url);
    const back = pages.filter((q) => q.links.includes(p.src));
    const backlinks = back.length
      ? `<details class="more linked"><summary>Linked from ${back.length === 1 ? 'one page' : `${back.length} pages`}</summary>\n<ul class="backlinks">${back.map((q) => `<li><a href="${rel(q)}">${esc(q.title)}</a></li>`).join('')}</ul></details>\n`
      : '';
    const prev = order[i - 1];
    const next = order[i + 1];
    const steps = p.screens.length > 1
      ? `<nav class="sc-steps" aria-label="On this page"><ol>${p.screens.map((s, n) => `<li><a href="#${s.id}" title="${s.title}"><span class="n">${n + 1}</span><span class="t">${s.title}</span></a></li>`).join('')}</ol></nav>\n`
      : '';
    const nav = `<nav class="sc-nav" aria-label="Back and next"><div class="in">${prev ? `<a class="sc-back" href="${rel(prev)}" data-page="${esc(prev.title)}">Back</a>` : '<a class="sc-back" hidden>Back</a>'}`
      + `<span class="where">${p.screens[0].title}</span>`
      + `${next ? `<a class="sc-next" href="${rel(next)}" data-page="${esc(next.title)}">Next<span class="pg">: ${esc(next.title)}</span></a>` : '<a class="sc-next" hidden>Next</a>'}</div></nav>`;
    const content = `<article class="screens">\n${steps}${p.screens.map((s, n) => (n === p.screens.length - 1 ? s.html.replace(/<\/section>$/, `${backlinks}</section>`) : s.html)).join('\n')}\n${nav}\n</article>\n<script src="${'../'.repeat(p.url.split('/').length)}assets/docs.js" defer></script>`;
    files.set(p.url, shell({ url: p.url, title: p.title, summary: p.summary, content }));
  }
  const graph = {
    nodes: pages.map((p) => ({
      id: p.src, title: p.title, url: p.url, topic: p.topic,
      ...(p.status ? { status: p.status } : {}), ...(SECTIONS.some(([, s]) => s === p.src) ? { section: true } : {}),
    })),
    links: pages.flatMap((p) => p.links.map((t) => ({ source: p.src, target: t }))),
  };
  files.set('graph.json', `${JSON.stringify(graph, null, 1)}\n`);
  const { hubs } = graphHealth(graph);
  files.set('graph.html', shell({
    url: 'graph.html', title: 'Graph', summary: 'Every docs page and the links between them', 
    content: `<h1>Graph</h1>
<p class="lede">Every page in these docs and the links between them, the same graph Obsidian draws from the vault. Select a page to open it.</p>
<h2 id="map">Map</h2>
<div class="graph" data-src="graph.json"><svg role="img" aria-label="Graph of the docs pages and their links"></svg></div>
<h2 id="most-linked">Most linked</h2>
<p>The pages most others link to. Check these first when something changes.</p>
<ol>${hubs.map((h) => `<li><a href="${h.url}">${esc(h.title)}</a> (linked from ${h.linkedFrom})</li>`).join('')}</ol>
<h2 id="pages">Pages</h2>
<ul>${pages.map((p) => `<li><a href="${p.url}">${esc(p.title)}</a></li>`).join('')}</ul>
<script src="../assets/graph.js" defer></script>`,
  }));
  return files;
}

const files = build();
const check = process.argv.includes('--check');
const stale = [];
const onDisk = existsSync(join(root, OUT)) ? walk(OUT).map((p) => p.slice(OUT.length + 1)) : [];
for (const [rel, text] of files) {
  const p = join(root, OUT, rel);
  if (!existsSync(p) || readFileSync(p, 'utf8') !== text) stale.push(rel);
}
for (const rel of onDisk) if (!files.has(rel)) stale.push(rel);
if (check) {
  if (stale.length) {
    console.error(`site/docs is out of date (${stale.join(', ')}); run node scripts/site/build-docs.mjs`);
    process.exit(1);
  }
  console.log('site/docs is up to date');
} else {
  rmSync(join(root, OUT), { recursive: true, force: true });
  for (const [rel, text] of files) {
    mkdirSync(dirname(join(root, OUT, rel)), { recursive: true });
    writeFileSync(join(root, OUT, rel), text);
  }
  console.log(`wrote ${files.size} files to ${relative(root, join(root, OUT))}/`);
}
