// Tests for the activity & leaderboard metrics page (scripts/site/fetch-metrics.mjs and scripts/site/build-metrics.mjs).
// Run: node --test tests/metrics.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeRepoScore, computeBadges, summarizeMetrics } from '../scripts/site/fetch-metrics.mjs';
import { buildMetricsHtml } from '../scripts/site/build-metrics.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('site/metrics.html is up to date (scripts/site/build-metrics.mjs --check)', () => {
  execFileSync(process.execPath, [join(root, 'scripts/site/build-metrics.mjs'), '--check'], { stdio: 'pipe' });
  assert.ok(existsSync(join(root, 'site/metrics.html')), 'site/metrics.html');
});

test('computeRepoScore and computeBadges calculate XP and achievements', () => {
  const score = computeRepoScore({ mergedPrs30d: 6, commits30d: 10, releasesCount: 2, ciConclusion: 'success' });
  assert.equal(score, 6 * 10 + 10 * 2 + 2 * 25 + 50);

  const badges = computeBadges({
    maturity: 'proven',
    mergedPrs30d: 6,
    releasesCount: 1,
    ciConclusion: 'success',
    openIssues: 0,
  });
  assert.deepEqual(badges, ['Proven', 'Green CI', 'Shipped', 'High Velocity', 'Zero Backlog']);
});

test('summarizeMetrics ranks repos and aggregates layers', () => {
  const summary = summarizeMetrics([
    { name: 'repo-a', repo: 'avd-ops/repo-a', layer: 'assess', maturity: 'proven', mergedPrs30d: 5, mergedPrs7d: 2, commits30d: 10, commits7d: 3, releasesCount: 1, ciConclusion: 'success', score: 145, badges: ['Proven'] },
    { name: 'repo-b', repo: 'avd-ops/repo-b', layer: 'build', maturity: 'pre-beta', mergedPrs30d: 1, mergedPrs7d: 0, commits30d: 2, commits7d: 0, releasesCount: 0, ciConclusion: 'failure', score: 14, badges: [] },
  ], '2026-11-20');

  assert.equal(summary.schema, 'avd-ops-metrics/v1');
  assert.equal(summary.repos[0].rank, 1);
  assert.equal(summary.repos[0].name, 'repo-a');
  assert.equal(summary.totals.greenCiCount, 1);
  assert.equal(summary.totals.greenCiPct, 50);
  assert.equal(summary.totals.active7dCount, 1);
  assert.equal(summary.layers[0].layer, 'assess');
});

test('buildMetricsHtml renders scoreboard, podium, layers, and all repos', () => {
  const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const metricsDoc = JSON.parse(readFileSync(join(root, 'site/data/metrics.json'), 'utf8'));
  const html = buildMetricsHtml(metricsDoc);

  assert.match(html, /data-metrics-filters/);
  assert.match(html, /Top 3 repositories/);
  for (const r of reposDoc.repos) {
    assert.ok(html.includes(r.name), `metrics.html includes ${r.name}`);
  }
});
