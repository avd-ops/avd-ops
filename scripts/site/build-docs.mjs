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

const root = new URL('../../', import.meta.url).pathname;
const KB = 'docs/knowledge';
const OUT = 'site/docs';
const REPO = 'https://github.com/nickprignano/avd-ops/blob/main/';

// The reader-facing topics are published; the KB's own upkeep pages (its README, curation, experts,
// troubleshooting) stay in the repo and are linked on GitHub.
const PUBLISHED = [/^getting-started\//, /^concepts\//, /^repos\//, /^roadmap\//, /^decisions\/(README|\d{4}-[\w-]+)\.md$/];
const SECTIONS = [['Start here', 'getting-started/README.md'], ['Concepts', 'concepts/README.md'], ['Repos', 'repos/README.md'],
  ['Roadmap', 'roadmap/README.md'], ['Decisions', 'decisions/README.md']];

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

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pages = sources.map((src) => {
  const { meta, body } = frontMatter(readFileSync(join(root, KB, src), 'utf8'));
  const h1 = (body.match(/^# (.+)$/m) || [, src])[1];
  return { src, url: urlOf(src), title: h1, summary: meta.summary || '', topic: meta.topic || src.split('/')[0], body, links: [] };
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

function render(page) {
  const renderer = new marked.Renderer();
  const link = renderer.link.bind(renderer);
  renderer.link = (token) => link({ ...token, href: rewrite(page, token.href) });
  return marked.parse(page.body, { renderer, gfm: true });
}

const NOTICE = (up) => `<div class="warn" role="note"><strong>Personal project. Research and learning only. Not for production. No warranty.</strong>
<ul><li>Built on my own time for research and learning. Not affiliated with, endorsed by or supported by my employer or Microsoft.</li>
<li>Don't run any of it in production or against tenants that matter. Test in a dedicated lab subscription and tenant first.</li>
<li>Provided "as is", without warranty of any kind, under each repo's license. You use it at your own risk and own the Azure charges it incurs.</li>
<li><strong>Contributions and forks are welcome and encouraged.</strong> See <a href="${up}index.html#contribute">Contribute</a>.</li></ul></div>`;

function shell({ url, title, summary, content, current }) {
  const up = '../'.repeat(url.split('/').length);           // to site/
  const docs = '../'.repeat(url.split('/').length - 1);     // to site/docs/
  const nav = [...SECTIONS.map(([t, s]) => [t, urlOf(s)]), ['Graph', 'graph.html']]
    .map(([t, u]) => `<a href="${docs}${u}"${u === current ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const withNotice = content.replace(/(<\/h1>)/, `$1\n${NOTICE(up)}`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)} | avd-ops docs</title>
<meta name="description" content="${esc(summary)}">
<link rel="icon" href="${up}assets/brand/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${up}assets/avd-ops.css">
<link rel="stylesheet" href="${up}assets/site.css">
</head>
<body>
<!-- Generated by scripts/site/build-docs.mjs from ${KB}/. Do not edit; edit the Markdown and rebuild. -->
<div class="wrap"><header class="top"><a class="brand" href="${up}index.html"><img class="mark" src="${up}assets/brand/mark.svg" alt="" width="26" height="26">avd-ops</a><nav aria-label="Docs">${nav}</nav></header>
${withNotice}
<footer class="site"><p>These docs are the Markdown in <a href="https://github.com/nickprignano/avd-ops/tree/main/${KB}">${KB}/</a>; open the folder in Obsidian to browse it as a vault. Each repo is the source of truth for itself.</p>
<p>Every repo is open source under MIT. Azure, Azure Virtual Desktop, Microsoft Entra, Intune and FSLogix are trademarks of Microsoft.</p></footer></div>
</body>
</html>
`;
}

function build() {
  const files = new Map();
  for (const p of pages) p.html = render(p);
  for (const p of pages) {
    const back = pages.filter((q) => q.links.includes(p.src));
    const backlinks = back.length
      ? `\n<h2 id="linked-from">Linked from</h2>\n<ul class="backlinks">${back.map((q) => `<li><a href="${posix.relative(posix.dirname(p.url), q.url)}">${esc(q.title)}</a></li>`).join('')}</ul>\n`
      : '';
    files.set(p.url, shell({ url: p.url, title: p.title, summary: p.summary, current: p.url, content: p.html + backlinks }));
  }
  const graph = {
    nodes: pages.map((p) => ({ id: p.src, title: p.title, url: p.url, topic: p.topic })),
    links: pages.flatMap((p) => p.links.map((t) => ({ source: p.src, target: t }))),
  };
  files.set('graph.json', `${JSON.stringify(graph, null, 1)}\n`);
  files.set('graph.html', shell({
    url: 'graph.html', title: 'Graph', summary: 'Every docs page and the links between them', current: 'graph.html',
    content: `<h1>Graph</h1>
<p class="lede">Every page in these docs and the links between them, the same graph Obsidian draws from the vault. Select a page to open it.</p>
<h2 id="map">Map</h2>
<div class="graph" data-src="graph.json"><svg role="img" aria-label="Graph of the docs pages and their links"></svg></div>
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
