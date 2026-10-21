// The starters in templates/ (docs/design-system.md, "Start a new page"): built from the release, the page one
// safe under a strict CSP, the artifact one self-contained apart from Google Fonts, and both carrying the notice.
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const read = (f) => readFileSync(join(root, f), 'utf8');
const { VERSION: version } = await import('../scripts/site/build-kit.mjs');
assert.ok(version, 'version line in avd-ops.css');

test('the starters are up to date with the release (scripts/site/build-kit.mjs)', () => {
  execFileSync(process.execPath, [join(root, 'scripts/site/build-kit.mjs'), '--check'], { stdio: 'pipe' });
  for (const f of ['templates/page.html', 'templates/artifact.html']) assert.match(read(f), new RegExp(`design system v${version.replace(/\./g, '\\.')} `), f);
});

test('both starters show the whole notice before the first section and end with the credit line', () => {
  for (const f of ['templates/page.html', 'templates/artifact.html']) {
    const h = read(f);
    const top = h.split('<h2')[0];
    for (const re of [/Personal project\. Research and learning only\. Not for production\. No warranty\./, /Not affiliated with, endorsed by or supported by my employer/, /"as is", without warranty of any kind/, /Contributions and forks are welcome and encouraged\./]) {
      assert.match(top, re, `${f} is missing ${re}`);
    }
    assert.match(h, /<p class="credit">A <a href="https:\/\/prignano\.ai\/">prignano\.ai<\/a> production<\/p>/, `${f}: credit line`);
    assert.match(h, /<!-- page:start [^>]*-->[\s\S]*<!-- page:end -->/, `${f}: content markers`);
    assert.match(h, /<div class="layout solo">/, `${f}: one column`);
  }
});

test('the page starter needs no inline script or style and loads only the vendored copy', () => {
  const h = read('templates/page.html');
  assert.match(h, /<body class="shell">/);
  assert.doesNotMatch(h, /<style|style="|<script>|\son\w+="/, 'inline style or script');
  for (const [, url] of h.matchAll(/(?:src|<link[^>]*href)="([^"]+)"/g)) assert.match(url, /^assets\//, `loads ${url}`);
  for (const f of ['avd-ops.css', 'avd-ops-shell.css', 'theme.js', 'brand/favicon.svg', 'brand/mark.svg']) assert.ok(h.includes(`assets/${f}`), f);
});

test('the artifact starter is one file: tokens, shell and theme.js inlined, fonts only from Google Fonts', () => {
  const h = read('templates/artifact.html');
  assert.doesNotMatch(h, /<!doctype|<(html|head|body)[\s>]/i, 'the artifact host adds the document skeleton');
  assert.match(h.slice(0, 8192), /<title>[^<]+<\/title>/, 'title in the first 8KB');
  assert.match(h, /<meta name="claude:viewport-fit-sides" content="cover">/);
  assert.doesNotMatch(h, /@font-face|url\("fonts\//, 'no self-hosted font paths');
  for (const [, url] of h.matchAll(/(?:src|<link[^>]*href)="([^"]+)"/g)) {
    assert.match(url, /^(data:image\/svg\+xml;base64,|https:\/\/fonts\.(googleapis|gstatic)\.com(\/|$))/, `loads ${url}`);
  }
  // Every color token is defined on bare :root and again in both dark blocks, the shape the artifact host expects.
  assert.match(h, /\n:root\{[\s\S]*?--bg:/);
  assert.match(h, /@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{/);
  assert.match(h, /:root\[data-theme="dark"\]\{/);
  assert.match(h, /body\{background:var\(--bg\)/, 'explicit body background');
  assert.match(h, /<div class="shell">/, 'the shell on a wrapper, since the host owns <body>');
  assert.ok(h.includes(read('site/assets/avd-ops-shell.css').split('\n').find((l) => l.startsWith('.shell header.bar{'))), 'the shell, unchanged');
  assert.ok(h.includes("var KEY = 'avd-ops-theme';"), 'theme.js, unchanged');
  assert.ok(Buffer.byteLength(h) < 64 * 1024, 'small enough to copy and edit');
});
