// Tests for the release notes aggregator (scripts/site/fetch-releases.mjs and scripts/site/build-releases.mjs).
// Run: node --test tests/releases.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeReleaseBody, normalizeApiRelease } from '../scripts/site/fetch-releases.mjs';
import { buildReleasesHtml, buildReleasesFeedXml } from '../scripts/site/build-releases.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('site/releases.html and site/releases-feed.xml are up to date (scripts/site/build-releases.mjs --check)', () => {
  execFileSync(process.execPath, [join(root, 'scripts/site/build-releases.mjs'), '--check'], { stdio: 'pipe' });
  assert.ok(existsSync(join(root, 'site/releases.html')), 'site/releases.html');
  assert.ok(existsSync(join(root, 'site/releases-feed.xml')), 'site/releases-feed.xml');
});

test('sanitizeReleaseBody removes partner names and banned terms', () => {
  const raw = 'Not affiliated with the author\'s employer, Liquidware or Microsoft. Also mentions Nerdio and banned-term and AVD family.';
  const clean = sanitizeReleaseBody(raw, ['banned-term']);
  assert.doesNotMatch(clean, /liquidware/i);
  assert.doesNotMatch(clean, /nerdio/i);
  assert.doesNotMatch(clean, /\bbanned-term\b/i);
  assert.doesNotMatch(clean, /AVD family/i);
  assert.match(clean, /or Microsoft\./);
});

test('normalizeApiRelease normalizes tag, prerelease flag, and assets', () => {
  const repoEntry = { name: 'avd-assess', repo: 'avd-ops/avd-assess', layer: 'assess', maturity: 'pre-beta' };
  const rel = normalizeApiRelease(repoEntry, {
    tag_name: 'v4.0.0-rc.1',
    name: 'avd-assess 4.0.0-rc.1',
    prerelease: false,
    published_at: '2026-11-18T12:00:00Z',
    html_url: 'https://github.com/avd-ops/avd-assess/releases/tag/v4.0.0-rc.1',
    body: '### Added\n- New check.',
    assets: [{ name: 'avd-assess-4.0.0-rc.1.zip', size: 2048, browser_download_url: 'https://github.com/avd-ops/avd-assess/releases/download/v4.0.0-rc.1/avd-assess-4.0.0-rc.1.zip' }],
  });
  assert.equal(rel.prerelease, true);
  assert.equal(rel.publishedAt, '2026-11-18');
  assert.equal(rel.assets.length, 1);
  assert.equal(rel.assets[0].size, 2048);
});

test('buildReleasesHtml and buildReleasesFeedXml render coverage, platform release, and Atom feed', () => {
  const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const releasesDoc = JSON.parse(readFileSync(join(root, 'site/data/releases.json'), 'utf8'));
  const platformDoc = JSON.parse(readFileSync(join(root, 'platform-release.json'), 'utf8'));
  const html = buildReleasesHtml(reposDoc, releasesDoc, platformDoc);
  const feed = buildReleasesFeedXml(reposDoc, releasesDoc);

  assert.equal(platformDoc.schema, 'avd-ops-platform-release/v1');
  assert.equal(platformDoc.repos.length, reposDoc.repos.length);
  assert.match(html, new RegExp(`platform-v${platformDoc.platformVersion.replace('.', '\\.')}`));

  for (const r of reposDoc.repos) {
    assert.ok(html.includes(r.name), `releases.html includes ${r.name}`);
  }
  assert.match(html, /data-release-filters/);
  assert.match(feed, /^<\?xml version="1\.0" encoding="utf-8"\?>/);
  assert.match(feed, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
  for (const r of releasesDoc.releases.slice(0, 30)) {
    assert.ok(feed.includes(r.url), `feed includes ${r.url}`);
  }
});
