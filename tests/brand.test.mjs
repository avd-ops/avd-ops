// The brand profile (brand/profile.json, schema brand/profile.schema.json): what the brand-profile skill reads.
// It must match the design system it summarizes and list every brand file the repo holds.
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (f) => readFileSync(join(root, f), 'utf8');
const profile = JSON.parse(read('brand/profile.json'));
const schema = JSON.parse(read('brand/profile.schema.json'));
const css = read('site/assets/avd-ops.css');
const block = (re) => Object.fromEntries([...(css.match(re) || [, ''])[1].matchAll(/(--[\w-]+):([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const light = block(/\n:root\{([\s\S]*?)\n\}/);
const dark = block(/:root\[data-theme="dark"\]\{([\s\S]*?)\}/);
const darkMedia = block(/:root:not\(\[data-theme="light"\]\)\{([\s\S]*?)\}\}/);

test('the profile has the fields the schema requires, and no others', () => {
  for (const k of schema.required) assert.ok(k in profile, `missing ${k}`);
  for (const k of Object.keys(profile)) assert.ok(k in schema.properties, `${k} is not in the schema`);
  for (const k of schema.properties.roles.required) assert.ok(profile.roles[k], `role ${k}`);
  assert.equal(profile.schemaVersion, schema.properties.schemaVersion.const);
  const item = schema.properties.assets.items;
  for (const a of profile.assets) {
    for (const k of item.required) assert.ok(a[k], `${a.file}: no ${k}`);
    for (const k of Object.keys(a)) assert.ok(k in item.properties, `${a.file}: ${k} is not in the schema`);
    assert.ok(item.properties.kind.enum.includes(a.kind), `${a.file}: kind ${a.kind}`);
    if (a.background) assert.ok(item.properties.background.enum.includes(a.background), `${a.file}: background ${a.background}`);
  }
  const typeKeys = schema.properties.type.additionalProperties.properties;
  for (const [role, t] of Object.entries(profile.type)) for (const k of Object.keys(t)) assert.ok(k in typeKeys, `type.${role}.${k} is not in the schema`);
});

test('the profile matches the design system: version, every color in both themes, shape, fonts', () => {
  const version = (css.match(/^\/\* avd-ops design system v(\d+\.\d+\.\d+) /) || [])[1];
  assert.equal(profile.release.version, version);
  assert.equal(profile.release.tag, `ds-v${version}`);
  const colorTokens = Object.keys(light).filter((k) => /#|rgba/.test(light[k]));
  assert.deepEqual(Object.keys(profile.colors).sort(), colorTokens.sort(), 'one entry per color token');
  for (const k of colorTokens) {
    assert.equal(profile.colors[k].light, light[k], `${k} light`);
    assert.equal(profile.colors[k].dark, dark[k], `${k} dark`);
    assert.equal(profile.colors[k].dark, darkMedia[k], `${k} dark (prefers-color-scheme)`);
  }
  for (const [k, v] of Object.entries(profile.shape)) assert.equal(v, light[k], k);
  for (const t of Object.values(profile.roles)) assert.ok(profile.colors[t], `role points at ${t}, not a color token`);
  for (const [role, t] of Object.entries(profile.type)) {
    assert.ok(light[`--${role}`].startsWith(`"${t.family}"`), `--${role} is ${t.family}`);
    for (const f of t.files || []) assert.ok(existsSync(join(root, f)), f);
    // Each declared weight has a face in the stylesheet.
    for (const w of t.weights || []) assert.ok([...css.matchAll(new RegExp(`font-family:"${t.family}";font-weight:(\\d+)(?: (\\d+))?`, 'g'))].some(([, lo, hi]) => w >= +lo && w <= +(hi || lo)), `${t.family} ${w} has no @font-face`);
  }
});

test('every brand file is in the profile, and every file the profile names exists', () => {
  const listed = new Set(profile.assets.map((a) => a.file));
  for (const f of listed) assert.ok(existsSync(join(root, f)), `missing ${f}`);
  for (const dir of ['site/assets/brand', 'brand/png', 'brand/source']) {
    for (const f of readdirSync(join(root, dir))) assert.ok(listed.has(`${dir}/${f}`), `${dir}/${f} is not in brand/profile.json`);
  }
  for (const f of Object.values(profile.starters)) assert.ok(existsSync(join(root, f)), f);
  for (const a of profile.assets.filter((x) => x.generated)) assert.ok(existsSync(join(root, a.generated)), a.generated);
});

test('lockups are pure vector: text outlined, the current mark, colors from the brand', () => {
  const palette = new Set(['#fff', '#ffffff', ...Object.values(profile.colors).flatMap((c) => [c.light, c.dark])]);
  const mark = (f) => read(`site/assets/brand/${f}`).split('\n').filter((l) => /^\s*<(path|rect|defs|mask)/.test(l)).map((l) => l.trim());
  for (const f of ['lockup.svg', 'lockup-dark.svg', 'lockup-white.svg']) {
    const svg = read(`site/assets/brand/${f}`);
    for (const [, c] of svg.replace(/<mask[\s\S]*?<\/mask>/g, '').matchAll(/(?:fill|stroke)="(#[0-9a-f]{3,6})"/gi)) assert.ok(palette.has(c.toLowerCase()), `${f}: ${c} is not a brand color`);
    for (const l of mark(f === 'lockup-white.svg' ? 'mark-white.svg' : 'mark.svg')) assert.ok(svg.includes(l), `${f} is out of date with the mark; run scripts/site/brand_lockups.py`);
    assert.doesNotMatch(svg, /<text|<image|href=/, `${f} must not depend on fonts or other files`);
    assert.match(svg, /aria-label="avd-ops, deploy quietly"/, f);
  }
});

test('the starters carry what the profile requires', () => {
  const notice = profile.required.find((r) => r.id === 'notice').text;
  for (const f of Object.values(profile.starters)) {
    const h = read(f).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/&quot;/g, '"');
    for (const r of profile.required) {
      for (const sentence of r.text.split(/(?<=\.) /)) assert.ok(h.includes(sentence), `${f} is missing: ${sentence}`);
    }
  }
  assert.ok(notice.includes('Not for production'));
});
