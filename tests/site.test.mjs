// The avd-ops site (site/, published at https://avd-ops.dev/ by .github/workflows/pages.yml).
// Every page keeps the research-only notice and the invitation to contribute and fork, every relative link
// resolves, and the site names no partner product and no HCL tooling.
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const walk = (d) => readdirSync(join(root, d)).flatMap((f) => (statSync(join(root, d, f)).isDirectory() ? walk(`${d}/${f}`) : [`${d}/${f}`]));
const pages = walk('site').filter((f) => f.endsWith('.html'));
const read = (f) => readFileSync(join(root, f), 'utf8');

test('the site has a page for each public repo in the family', () => {
  for (const r of ['avd-landing-zone', 'avd-current-state', 'avd-assess', 'avd-swarm', 'avd-second-brain']) {
    assert.ok(pages.includes(`site/family/${r}.html`), r);
  }
});

test('every page carries the avd-ops name', () => {
  for (const f of pages) {
    assert.match(read(f), /<a class="brand" href="[^"]*index\.html"><img class="mark" src="[^"]*assets\/brand\/mark\.svg" alt=""[^>]*>avd-ops<\/a>/, f);
    assert.doesNotMatch(read(f), /AVD (repo )?family/i, f);
  }
});

test('every page shows the notice before its first section', () => {
  for (const f of pages) {
    const top = read(f).split('<h2')[0];
    for (const re of [/Personal project\. Research and learning only\. Not for production\. No warranty\./, /Not affiliated with, endorsed by or supported by my employer/, /Don't run any of it in production/, /"as is", without warranty of any kind/, /Contributions and forks are welcome and encouraged\./]) {
      assert.match(top, re, `${f} is missing ${re}`);
    }
  }
});

test('every page uses the shared design system and nothing else (docs/design-system.md)', () => {
  for (const f of pages) {
    const h = read(f);
    assert.match(h, /<link rel="stylesheet" href="(\.\.\/)*assets\/avd-ops\.css">/, `${f}: no avd-ops.css`);
    assert.match(h, /<link rel="icon" href="(\.\.\/)*assets\/brand\/favicon\.svg"/, `${f}: no favicon`);
    assert.doesNotMatch(h, /<style|style="/, `${f}: inline styles belong in assets/`);
    assert.doesNotMatch(h, /fonts\.(googleapis|gstatic)\.com/, `${f}: fonts are served from assets/fonts`);
  }
});

test('the design system defines every token for light and dark and serves its own fonts', () => {
  const css = read('site/assets/avd-ops.css');
  assert.match(css, /^\/\* avd-ops design system v\d+\.\d+\.\d+ /, 'version line');
  const block = (re) => (css.match(re) || [, ''])[1];
  const names = (b) => [...b.matchAll(/(--[\w-]+):/g)].map((m) => m[1]).sort();
  const light = names(block(/\n:root\{([\s\S]*?)\n\}/));
  const darkMedia = names(block(/:root:not\(\[data-theme="light"\]\)\{([\s\S]*?)\}\}/));
  const darkAttr = names(block(/:root\[data-theme="dark"\]\{([\s\S]*?)\}/));
  const colors = light.filter((n) => /#[0-9a-f]{3,6}\b|rgba/.test(css.match(new RegExp(`\\n:root\\{[\\s\\S]*?${n}:([^;]+);`))[1]));
  assert.ok(colors.length > 20, 'color tokens');
  for (const n of colors) {
    assert.ok(darkMedia.includes(n), `${n} has no dark value (prefers-color-scheme)`);
    assert.ok(darkAttr.includes(n), `${n} has no dark value (data-theme)`);
  }
  assert.deepEqual(darkMedia, darkAttr, 'the two dark blocks match');
  for (const [, src] of css.matchAll(/url\("([^"]+)"\)/g)) assert.ok(existsSync(join(root, 'site/assets', src)), src);
  assert.ok(existsSync(join(root, 'site/assets/fonts/LICENSE')), 'font licenses');
  assert.ok(existsSync(join(root, 'site/assets/brand/mark.svg')), 'the mark');
  // Colors live in tokens only: no hex outside the token blocks, in the shared file or the site's own.
  const rest = css.replace(/\n:root\{[\s\S]*?\n\}|@media \(prefers-color-scheme:dark\)\{[\s\S]*?\}\}|:root\[data-theme="dark"\]\{[\s\S]*?\}/g, '');
  assert.doesNotMatch(rest, /#[0-9a-fA-F]{3,6}\b/, 'hex outside the tokens in avd-ops.css');
  assert.doesNotMatch(read('site/assets/site.css'), /#[0-9a-fA-F]{3,6}\b/, 'hex in site.css');
});

test('relative links resolve to files in site/', () => {
  for (const f of pages) {
    for (const [, href] of read(f).matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const target = join(root, dirname(f), href.split('#')[0]);
      assert.ok(existsSync(target), `${f}: ${href}`);
    }
  }
});

test('the site names no partner product and no HCL tooling (no Liquidware for now)', () => {
  for (const f of [...pages, 'site/assets/site.css']) {
    assert.doesNotMatch(read(f), /liquidware|nerdio|login ?vsi|goliath|terraform|packer|\.tf\b/i, f);
  }
});

test('every command block stands alone in Cloud Shell (build/lessons/0015)', () => {
  for (const f of pages) {
    for (const [, block] of read(f).matchAll(/<pre>([\s\S]*?)<\/pre>/g)) {
      assert.match(block, /git clone https:\/\/github\.com\/nickprignano\/[\w-]+\.git/, `${f}: no clone`);
      assert.match(block, /Set-Location ~\/[\w-]+; git checkout -q \w+; git pull -q --ff-only/, `${f}: no Set-Location`);
      assert.doesNotMatch(block, /\.\.\.|\\\n/, `${f}: placeholder or bash line continuation`);
    }
  }
});

test('README and LICENSE keep the research-only notice', () => {
  assert.match(read('LICENSE'), /^MIT License[\s\S]*PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND/);
  const top = read('README.md').split('\n## ')[0];
  for (const re of [/Personal project/, /Research and learning only/, /Not for production/, /not affiliated with, endorsed by or supported by my employer/, /"as is", without warranty/, /forks are welcome/]) {
    assert.match(top, re, `README intro is missing ${re}`);
  }
});

test('the docs are built from docs/knowledge and up to date (scripts/site/build-docs.mjs)', () => {
  assert.ok(pages.includes('site/docs/index.html') && pages.includes('site/docs/graph.html'), 'docs home and graph');
  execFileSync(process.execPath, [join(root, 'scripts/site/build-docs.mjs'), '--check'], { stdio: 'pipe' });
  const graph = JSON.parse(read('site/docs/graph.json'));
  const ids = new Set(graph.nodes.map((n) => n.id));
  for (const l of graph.links) assert.ok(ids.has(l.source) && ids.has(l.target), `${l.source} -> ${l.target}`);
  const linked = new Set(graph.links.flatMap((l) => [l.source, l.target]));
  for (const n of graph.nodes) assert.ok(linked.has(n.id), `${n.id} is an orphan: link it from another page`);
});

test('repos.json lists every public repo with a docs page, and every page links its repo', () => {
  const family = JSON.parse(read('repos.json'));
  for (const r of family.repos) {
    assert.ok(existsSync(join(root, r.docs)), `${r.name}: ${r.docs}`);
    if (r.name !== 'avd-ops') assert.match(read(r.docs), new RegExp(`https://github\\.com/${r.repo}`), r.name);
  }
});

test('avd-ops names no project outside the family it shouldn\'t (repos.json banned)', () => {
  const { banned } = JSON.parse(read('repos.json'));
  const re = new RegExp(`(?<![\\w-])(${banned.join('|')})(?![\\w-])`, 'i');
  const files = execFileSync('git', ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  for (const f of files) {
    if (f === 'repos.json' || !existsSync(join(root, f))) continue;
    const text = readFileSync(join(root, f), 'utf8');
    if (text.includes('\u0000')) continue;
    assert.doesNotMatch(text, re, f);
  }
});
