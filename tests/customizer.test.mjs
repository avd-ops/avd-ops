// Adopter Theme Customizer (v4.0.0): presets, WCAG AA contrast guardrails, zero-CDN font pairings,
// token-only adopter-theme.css generation, and SVG sanitization.
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PALETTE_PRESETS,
  FONT_PRESETS,
  resolveThemeTokens,
  evaluatePaletteContrast,
  generateAdopterCss,
  generateDropInSnippet,
  sanitizeSvg,
  svgToDataUri,
} from '../site/assets/customizer-core.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (f) => readFileSync(join(root, f), 'utf8');

function extractTokens(block) {
  return [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => m[1]).sort();
}

test('all curated palette presets pass WCAG AA in both light and dark modes', () => {
  assert.ok(PALETTE_PRESETS.length >= 4, 'at least 4 curated presets');
  for (const preset of PALETTE_PRESETS) {
    const resolved = resolveThemeTokens({ presetId: preset.id });
    const evalResult = evaluatePaletteContrast(resolved);
    assert.equal(evalResult.ok, true, `${preset.id} failed WCAG AA: ${evalResult.warnings.join('; ')}`);
  }
});

test('all font pairings use zero external CDNs or network URLs', () => {
  assert.ok(FONT_PRESETS.length >= 3, 'at least 3 font pairings');
  for (const font of FONT_PRESETS) {
    const combined = `${font.display} ${font.body} ${font.mono} ${font.wordmark}`;
    assert.doesNotMatch(combined, /https?:\/\/|fonts\.(googleapis|gstatic)\.com|@import/i, font.id);
  }
});

test('generated adopter-theme.css defines matching Light and Dark token blocks with no non-token selectors', () => {
  for (const preset of PALETTE_PRESETS) {
    for (const font of FONT_PRESETS) {
      const css = generateAdopterCss({ presetId: preset.id, fontId: font.id });
      assert.doesNotMatch(css, /https?:\/\/|@import|fonts\.(googleapis|gstatic)\.com/i, 'no external requests');

      const lightMatch = css.match(/\n:root\s*\{([\s\S]*?)\n\}/);
      const darkMediaMatch = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)\s*\{([\s\S]*?)\n\s*\}\s*\}/);
      const darkAttrMatch = css.match(/\n:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);

      assert.ok(lightMatch, `${preset.id}/${font.id}: missing :root block`);
      assert.ok(darkMediaMatch, `${preset.id}/${font.id}: missing prefers-color-scheme dark block`);
      assert.ok(darkAttrMatch, `${preset.id}/${font.id}: missing data-theme="dark" block`);

      const lightTokens = extractTokens(lightMatch[1]);
      const darkMediaTokens = extractTokens(darkMediaMatch[1]);
      const darkAttrTokens = extractTokens(darkAttrMatch[1]);

      assert.deepEqual(darkMediaTokens, darkAttrTokens, 'dark media and data-theme blocks match');
      for (const t of darkAttrTokens) {
        assert.ok(lightTokens.includes(t), `token ${t} defined in dark must exist in light`);
      }
      for (const req of ['--accent', '--accent-hover', '--on-accent', '--accent-soft', '--accent-line', '--brand', '--shell', '--display', '--body', '--mono', '--wordmark']) {
        assert.ok(lightTokens.includes(req), `missing required token ${req}`);
      }
    }
  }
});

test('custom accent derivation warns when contrast drops below WCAG AA', () => {
  const lowContrast = resolveThemeTokens({
    lightAccent: '#ffff00',
    darkAccent: '#222222',
    brand: '#1ca998',
    shell: '#0d1015',
  });
  const evalLow = evaluatePaletteContrast(lowContrast);
  assert.equal(evalLow.ok, false, 'low-contrast custom accents must trigger WCAG warning');
  assert.ok(evalLow.warnings.length >= 2, 'warns for both light and dark failing pairs');

  const highContrast = resolveThemeTokens({
    lightAccent: '#0b7a6e',
    darkAccent: '#3cc8b4',
    brand: '#1ca998',
    shell: '#0d1015',
  });
  assert.equal(evaluatePaletteContrast(highContrast).ok, true);
});

test('sanitizeSvg rejects scripts, event handlers, foreignObject, and external hrefs and accepts clean SVG', () => {
  const dirty = '<svg viewBox="0 0 44 44" onload="alert(1)"><script>evil()</script><foreignObject>x</foreignObject><a href="javascript:alert(2)"><rect width="44" height="44"/></a></svg>';
  assert.equal(sanitizeSvg(dirty), '');
  assert.equal(svgToDataUri(dirty), null);

  const safe = '<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><rect width="44" height="44" rx="8"/></svg>';
  assert.equal(sanitizeSvg(safe), safe);
  assert.match(svgToDataUri(safe), /^data:image\/svg\+xml;utf8,/);
});

test('drop-in snippet loads adopter-theme.css after avd-ops.css and before shell', () => {
  const snippet = generateDropInSnippet();
  const baseIdx = snippet.indexOf('assets/avd-ops.css');
  const adopterIdx = snippet.indexOf('assets/adopter-theme.css');
  const shellIdx = snippet.indexOf('assets/avd-ops-shell.css');
  assert.ok(baseIdx !== -1 && adopterIdx > baseIdx && shellIdx > adopterIdx);
});

test('site/design/index.html wires the customizer panel without inline styles', () => {
  const html = read('site/design/index.html');
  assert.match(html, /id="customizer-panel"/);
  assert.match(html, /src="\.\.\/assets\/customizer\.js"/);
  assert.doesNotMatch(html, /<style|style="/);
});
