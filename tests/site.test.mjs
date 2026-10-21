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
assert.ok(pages.includes('site/design/index.html'), 'the design system reference page');
const read = (f) => readFileSync(join(root, f), 'utf8');

test('the site has a page for each public repo in the family', () => {
  for (const r of ['avd-landing-zone', 'avd-current-state', 'avd-assess', 'avd-swarm', 'avd-second-brain']) {
    assert.ok(pages.includes(`site/family/${r}.html`), r);
  }
});

test('every page carries the avd-ops name', () => {
  for (const f of pages) {
    assert.match(read(f), /<a class="brand" href="[^"]*index\.html"><img class="mark" src="[^"]*assets\/brand\/mark\.svg" alt=""[^>]*><span class="word">avd-ops<\/span><\/a>/, f);
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
    assert.match(h, /<link rel="stylesheet" href="(\.\.\/)*assets\/avd-ops-shell\.css">/, `${f}: no avd-ops-shell.css`);
    assert.match(h, /<script src="(\.\.\/)*assets\/theme\.js"><\/script>/, `${f}: no theme.js`);
    assert.match(h, /<body class="shell">/, `${f}: not in the shell`);
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

test('the portal components share the version, use only tokens and touch only .portal pages', () => {
  const base = read('site/assets/avd-ops.css');
  const css = read('site/assets/avd-ops-portal.css');
  const v = (t, re) => (t.match(re) || [])[1];
  const version = v(base, /^\/\* avd-ops design system (v\d+\.\d+\.\d+) /);
  assert.equal(v(css, /^\/\* avd-ops portal components (v\d+\.\d+\.\d+) /), version, 'one version for both files');
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,6}\b|rgba?\(|:root|@font-face/, 'colors and fonts come from avd-ops.css');
  const defined = new Set([...base.matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
  for (const [, t] of css.matchAll(/var\((--[\w-]+)/g)) assert.ok(defined.has(t), `${t} is not an avd-ops token`);
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]+\{/g, '').split('}').map((r) => r.split('{')[0].trim()).filter(Boolean);
  for (const sel of rules.flatMap((r) => r.split(/,(?![^(]*\))/))) assert.match(sel.trim(), /^(body)?\.portal\b/, `unscoped selector: ${sel.trim()}`);
  for (const f of pages) assert.doesNotMatch(read(f), /class="portal"/, `${f}: the avd-ops.dev pages are not portals`);
});

test('every page opens in the one shell: same side list, switcher, notice and credit (scripts/site/shell.mjs)', () => {
  execFileSync(process.execPath, [join(root, 'scripts/site/apply-shell.mjs'), '--check'], { stdio: 'pipe' });
  const strip = (h) => h.replace(/ aria-current="(page|true)"/g, '').replace(/href="(\.\.\/)+/g, 'href="');
  const nav = (h) => strip((h.match(/<nav class="side"[\s\S]*?<\/nav>/) || [''])[0]);
  const first = nav(read('site/index.html'));
  assert.ok(first.includes('family/avd-landing-zone.html'), 'the side list');
  for (const n of JSON.parse(read('site/docs/graph.json')).nodes.filter((x) => x.section)) assert.ok(first.includes(`href="docs/${n.url}"`), `the side list has no link to the docs section ${n.url}`);
  for (const f of pages) {
    const h = read(f);
    assert.equal(nav(h), first, `${f}: a different side list`);
    assert.match(h, /<nav class="switcher"[^>]*><a href="[^"]*index\.html" aria-current="true">Docs<\/a><a href="https:\/\/[^"]+">Deploy<\/a><a href="https:\/\/[^"]+">Assess<\/a><\/nav>/, `${f}: switcher`);
    assert.equal((h.match(/aria-current="page"/g) || []).length <= 1, true, `${f}: more than one current page`);
    assert.match(h, /<details class="notice">/, `${f}: notice line`);
    assert.match(h, /<p class="credit">A <a href="https:\/\/prignano\.ai\/">prignano\.ai<\/a> production<\/p>/, `${f}: credit line`);
  }
});

test('the shell and theme.js share the version, use only tokens and touch only .shell pages', () => {
  const base = read('site/assets/avd-ops.css');
  const version = (base.match(/^\/\* avd-ops design system (v\d+\.\d+\.\d+) /) || [])[1];
  const css = read('site/assets/avd-ops-shell.css');
  assert.equal((css.match(/^\/\* avd-ops app shell (v\d+\.\d+\.\d+) /) || [])[1], version, 'shell version');
  assert.equal((read('site/assets/theme.js').match(/^\/\* avd-ops theme and drawer (v\d+\.\d+\.\d+) /) || [])[1], version, 'theme.js version');
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,6}\b|rgba?\(|@font-face/, 'colors and fonts come from avd-ops.css');
  const defined = new Set([...base.matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
  for (const [, t] of css.matchAll(/var\((--[\w-]+)/g)) assert.ok(defined.has(t), `${t} is not an avd-ops token`);
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]+\{/g, '').split('}').map((r) => r.split('{')[0].trim()).filter(Boolean);
  for (const sel of rules.flatMap((r) => r.split(/,(?![^(]*\))/))) {
    assert.match(sel.trim(), /^((html(:not\(\.js\))?|\.js|:root(:not\(\[data-theme="light"\]\)|\[data-theme="dark"\])?) )?\.shell\b/, `unscoped selector: ${sel.trim()}`);
  }
  assert.doesNotMatch(read('site/assets/theme.js').replace(/\/\*[\s\S]*?\*\//g, ''), /fetch\(|XMLHttpRequest|https?:\/\//, 'theme.js makes no requests');
});

test('touch targets in the shell are at least 44px and the side list fits a phone', () => {
  const base = read('site/assets/avd-ops.css');
  assert.match(base, /--tap:44px/, '--tap');
  const css = read('site/assets/avd-ops-shell.css');
  assert.match(css, /\.shell \.iconbtn\{width:var\(--tap\);height:var\(--tap\)/, 'icon buttons');
  assert.match(css, /@media \(pointer:coarse\)\{\.shell \.side a\{min-height:var\(--tap\)\}/, 'side list rows on touch');
  assert.match(css, /width:min\(20rem,86vw\)/, 'drawer width');
});

test('the design system manifest lists every vendored file with its hash (scripts/site/design-manifest.mjs)', () => {
  execFileSync(process.execPath, [join(root, 'scripts/site/design-manifest.mjs'), '--check'], { stdio: 'pipe' });
  const m = JSON.parse(read('site/assets/MANIFEST.json'));
  assert.equal(`v${m.version}`, (read('site/assets/avd-ops.css').match(/^\/\* avd-ops design system (v\d+\.\d+\.\d+) /) || [])[1]);
  for (const f of ['avd-ops.css', 'avd-ops-shell.css', 'avd-ops-portal.css', 'theme.js', 'brand/mark.svg', 'fonts/LICENSE']) assert.match(m.files[f] || '', /^[0-9a-f]{64}$/, f);
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
  for (const f of [...pages, 'site/assets/site.css', 'site/assets/avd-ops-shell.css', 'site/assets/theme.js']) {
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
