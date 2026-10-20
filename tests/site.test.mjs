// The avd-ops site (site/, published at https://avd-ops.dev/ by .github/workflows/pages.yml).
// Every page keeps the research-only notice and the invitation to contribute and fork, every relative link
// resolves, and the site names no partner but Liquidware.
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const pages = ['site/index.html', ...readdirSync(join(root, 'site/family')).filter((f) => f.endsWith('.html')).map((f) => `site/family/${f}`)];
const read = (f) => readFileSync(join(root, f), 'utf8');

test('the site has a page for each public repo in the family', () => {
  for (const r of ['avd-landing-zone', 'avd-current-state', 'avd-swarm', 'avd-second-brain', 'avd-liquidware']) {
    assert.ok(pages.includes(`site/family/${r}.html`), r);
  }
});

test('every page carries the avd-ops name', () => {
  for (const f of pages) {
    assert.match(read(f), /<a class="brand" href="[^"]*index\.html">avd-ops<\/a>/, f);
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

test('relative links resolve to files in site/', () => {
  for (const f of pages) {
    for (const [, href] of read(f).matchAll(/href="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const target = join(root, dirname(f), href.split('#')[0]);
      assert.ok(existsSync(target), `${f}: ${href}`);
    }
  }
});

test('the site names no partner but Liquidware and no HCL tooling', () => {
  for (const f of pages) {
    assert.doesNotMatch(read(f), /nerdio|login ?vsi|goliath|terraform|packer|\.tf\b/i, f);
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
