// The standards library (site/standards/, built by scripts/site/build-standards.mjs from a pinned copy of
// avd-assess in site/data/standards/). The copy is avd-assess's own files byte for byte, every record has its
// page, every citation resolves, and avd-assess is only ever linked at the pinned commit.
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const read = (f) => readFileSync(join(root, f), 'utf8');
const lock = JSON.parse(read('site/data/standards/standards.lock.json'));
const data = (f) => `site/data/standards/${f.replace(/^contracts\//, '')}`;
const index = JSON.parse(read(data('index.json')));
const pages = ['standards', 'standards/methods', 'standards/sources'].flatMap((d) => readdirSync(join(root, 'site', d)).filter((f) => f.endsWith('.html')).map((f) => `site/${d}/${f}`));

test('the library is built from the locked avd-assess files and is up to date', () => {
  assert.match(lock.commit, /^[0-9a-f]{40}$/, 'lock pins a full commit');
  assert.match(lock.source, /^https:\/\/github\.com\/[\w-]+\/avd-assess$/, 'lock names avd-assess');
  assert.match(lock.date, /^\d{4}-\d{2}-\d{2}$/, 'lock dates the edition');
  for (const f of ['index.json', 'map.json', 'method.json', 'contracts/fact-register.json']) assert.ok(f in lock.files, `${f} is locked`);
  for (const [f, hash] of Object.entries(lock.files)) {
    assert.equal(createHash('sha256').update(readFileSync(join(root, data(f)))).digest('hex'), hash, `${f} matches the lock; copy it with --pin, never edit it`);
  }
  // The security page and the library show one edition of avd-assess.
  assert.equal(lock.commit, JSON.parse(read('site/data/security-review.lock.json')).commit, 'one avd-assess pin for the site');
  execFileSync(process.execPath, [join(root, 'scripts/site/build-standards.mjs'), '--check'], { stdio: 'pipe' });
});

test('every method and every source has its page, and every claim its anchor', () => {
  for (const f of Object.keys(lock.files).filter((p) => p.startsWith('methods/'))) {
    assert.ok(pages.includes(`site/standards/${f.replace('.md', '.html')}`), f);
  }
  for (const r of index.references) {
    const html = read(`site/standards/sources/${r.id}.html`);
    assert.ok(html.includes(`href="${r.url.replace(/&/g, '&amp;')}"`), `${r.id}: links its source`);
    for (const c of r.claims) assert.ok(html.includes(`<section class="claim" id="${c.id}">`), `${r.id}#${c.id}`);
  }
});

test('citations are numbered references that resolve, and none is left raw', () => {
  for (const f of pages.filter((p) => p.includes('/methods/'))) {
    const html = read(f);
    assert.doesNotMatch(html, /<code>(ref|obs|gap):/, `${f}: a citation was not resolved`);
    for (const [, src, claim] of html.matchAll(/class="cite" href="\.\.\/sources\/([\w.-]+)\.html(?:#([\w.:-]+))?"/g)) {
      assert.ok(html.includes(`id="r-${src}"`), `${f}: [${src}] is in its reference list`);
      if (claim) assert.ok(read(`site/standards/sources/${src}.html`).includes(`id="${claim}"`), `${f}: ${src}#${claim}`);
    }
    for (const [, id] of html.matchAll(/class="cite (?:obs|gap)" href="#((?:obs|gap)-[\w.-]+)"/g)) assert.ok(html.includes(`id="${id}"`), `${f}: ${id} is listed`);
  }
});

test('avd-assess is linked only at the pinned commit, and every page states its edition', () => {
  for (const f of pages) {
    const html = read(f);
    assert.ok(!/github\.com\/[\w-]+\/avd-assess\/(blob|tree|commits)\/(main|master)\b/.test(html), `${f}: unpinned avd-assess link`);
    for (const [, sha] of html.matchAll(/github\.com\/[\w-]+\/avd-assess\/(?:blob|tree|commits)\/([^/"#]+)/g)) assert.equal(sha, lock.commit, `${f}: links avd-assess at ${sha}`);
    assert.match(html, new RegExp(`Edition <a class="mono" href="[^"]+">${lock.commit.slice(0, 7)}</a> of avd-assess`), `${f}: edition stamp`);
  }
});

test('library.json carries every source, claim and its three node states for the library and the credits page', () => {
  const lib = JSON.parse(read('site/data/library.json'));
  assert.equal(lib.schema, 'avd-ops-library/v1');
  assert.equal(lib.edition.commit, lock.commit);
  assert.equal(lib.references.length, index.references.length);
  for (const r of lib.references) for (const c of r.claims) {
    for (const k of ['mapped', 'measurable', 'validated', 'disputed', 'helpWanted']) assert.equal(typeof c.state[k], 'boolean', `${r.id}#${c.id}: ${k}`);
    assert.ok(!(c.state.validated && !c.state.mapped), `${r.id}#${c.id}: validated implies mapped`);
  }
  assert.ok(existsSync(join(root, 'site/standards/index.html')), 'the library has a front page');
  assert.match(read('scripts/site/shell.mjs'), /\['Standards library', 'standards\/index\.html'\]/, 'the side list links the library');
});
