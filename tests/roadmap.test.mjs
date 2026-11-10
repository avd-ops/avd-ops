// Tests for the public roadmap (site/roadmap.html, scripts/site/build-roadmap.mjs), the research projects page
// (site/research.html, scripts/site/build-research.mjs), and the weekly candidates helper
// (scripts/site/roadmap-candidates.mjs).
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRoadmap, buildRoadmapHtml } from '../scripts/site/build-roadmap.mjs';
import { resolveResearch, buildResearchHtml } from '../scripts/site/build-research.mjs';
import { findRoadmapCandidates } from '../scripts/site/roadmap-candidates.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (f) => readFileSync(join(root, f), 'utf8');
const reposDoc = JSON.parse(read('repos.json'));
const roadmapDoc = JSON.parse(read('roadmap.json'));
const issuesDoc = JSON.parse(read('site/data/issues.json'));
const routingDoc = JSON.parse(read('submissions/routing.json'));

test('repos.json defines maturity for every repo and routing.json describes all roadmap labels', () => {
  for (const r of reposDoc.repos) {
    assert.match(r.maturity || '', /^(proven|pre-beta|design)$/, `${r.name}: maturity`);
  }
  for (const l of ['roadmap', 'accepted', 'status:exploring', 'status:planned', 'status:in-progress', 'status:done', 'status:parked']) {
    assert.ok(routingDoc.labels[l], `routing.json describes ${l}`);
  }
});

test('roadmap.html, data/roadmap.json and research.html are up to date (--check)', () => {
  execFileSync(process.execPath, [join(root, 'scripts/site/build-roadmap.mjs'), '--check'], { stdio: 'pipe' });
  execFileSync(process.execPath, [join(root, 'scripts/site/build-research.mjs'), '--check'], { stdio: 'pipe' });
});

test('roadmap only shows items approved by an approver and drops unapproved, title-edited, private or not-planned items', () => {
  const fixture = {
    schema: 'avd-ops-issues/v1',
    fetchedAt: '2026-11-09',
    issues: [
      {
        repo: 'avd-ops',
        number: 1,
        url: 'https://github.com/avd-ops/avd-ops/issues/1',
        title: 'Approved item',
        state: 'open',
        updatedAt: '2026-11-01',
        labels: [
          { name: 'roadmap', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
          { name: 'accepted', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
          { name: 'status:planned', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
        ],
      },
      {
        repo: 'avd-ops',
        number: 2,
        url: 'https://github.com/avd-ops/avd-ops/issues/2',
        title: 'Labeled by someone else',
        state: 'open',
        updatedAt: '2026-11-01',
        labels: [
          { name: 'roadmap', by: 'stranger', at: '2026-11-01T10:00:00Z' },
          { name: 'accepted', by: 'stranger', at: '2026-11-01T10:00:00Z' },
        ],
      },
      {
        repo: 'avd-ops',
        number: 3,
        url: 'https://github.com/avd-ops/avd-ops/issues/3',
        title: 'Title changed after approval',
        state: 'open',
        updatedAt: '2026-11-02',
        lastTitleChange: '2026-11-02T12:00:00Z',
        labels: [
          { name: 'roadmap', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
          { name: 'accepted', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
        ],
      },
      {
        repo: 'avd-ops',
        number: 4,
        url: 'https://github.com/avd-ops/avd-ops/issues/4',
        title: 'Private repo issue',
        private: true,
        state: 'open',
        updatedAt: '2026-11-01',
        labels: [
          { name: 'roadmap', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
          { name: 'accepted', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
        ],
      },
      {
        repo: 'avd-ops',
        number: 5,
        url: 'https://github.com/avd-ops/avd-ops/issues/5',
        title: 'Closed as not planned',
        state: 'closed',
        stateReason: 'not_planned',
        updatedAt: '2026-11-01',
        labels: [
          { name: 'roadmap', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
          { name: 'accepted', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
        ],
      },
      {
        repo: 'avd-ops',
        number: 6,
        url: 'https://github.com/avd-ops/avd-ops/issues/6',
        title: 'Closed over 90 days ago',
        state: 'closed',
        stateReason: 'completed',
        closedAt: '2026-01-01',
        updatedAt: '2026-01-01',
        labels: [
          { name: 'roadmap', by: 'nickprignano', at: '2026-01-01T10:00:00Z' },
          { name: 'accepted', by: 'nickprignano', at: '2026-01-01T10:00:00Z' },
        ],
      },
    ],
  };

  const res = resolveRoadmap(reposDoc, roadmapDoc, fixture, { now: '2026-11-09' });
  assert.equal(res.items.length, 1);
  assert.equal(res.items[0].number, 1);
  assert.equal(res.items[0].column, 'next');
  const reasons = res.dropped.map((d) => d.reason).sort();
  assert.deepEqual(reasons, [
    'closed-over-90-days',
    'not-planned',
    'private-or-unknown-repo',
    'title-edited-after-approval',
    'unapproved-labeler',
  ]);
});

test('roadmap rejects banned terms in titles or summaries and rejects URLs outside repos.json', () => {
  const badIssue = {
    schema: 'avd-ops-issues/v1',
    fetchedAt: '2026-11-09',
    issues: [
      {
        repo: 'avd-ops',
        number: 99,
        url: 'https://github.com/avd-ops/avd-ops/issues/99',
        title: 'Add terraform module',
        state: 'open',
        labels: [
          { name: 'roadmap', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
          { name: 'accepted', by: 'nickprignano', at: '2026-11-01T10:00:00Z' },
        ],
      },
    ],
  };
  assert.throws(() => resolveRoadmap(reposDoc, roadmapDoc, badIssue), /banned term/);

  const badCurated = {
    ...roadmapDoc,
    items: [{ issue: 'https://github.com/someone-else/other-repo/issues/1', summary: 'Outside family' }],
  };
  assert.throws(() => resolveRoadmap(reposDoc, badCurated, issuesDoc), /not an issue or PR in a repos\.json repo/);
});

test('research projects page shows only accepted research-request issues and links the submission intake', () => {
  const projects = resolveResearch(reposDoc, roadmapDoc, issuesDoc);
  assert.ok(projects.length >= 1);
  for (const p of projects) {
    assert.ok(reposDoc.repos.some((r) => r.name === p.repo), p.repo);
  }
  const html = buildResearchHtml(reposDoc, roadmapDoc, issuesDoc, routingDoc);
  assert.match(html, /Accepted research projects/);
  assert.match(html, /template=research-request\.yml/);
  assert.match(html, /template=research\.yml/);
});

test('roadmap-candidates filters out roadmap-labeled and bot issues', () => {
  const fixture = {
    fetchedAt: '2026-11-09',
    issues: [
      {
        repo: 'avd-ops',
        number: 10,
        url: 'https://github.com/avd-ops/avd-ops/issues/10',
        title: 'Already on roadmap',
        state: 'open',
        updatedAt: '2026-11-08',
        labels: [{ name: 'roadmap', by: 'nickprignano' }],
      },
      {
        repo: 'avd-ops',
        number: 11,
        url: 'https://github.com/avd-ops/avd-ops/issues/11',
        title: 'Nightly docs sweep',
        state: 'open',
        updatedAt: '2026-11-08',
        labels: [{ name: 'docs-findings', by: 'github-actions[bot]' }],
      },
      {
        repo: 'avd-assess',
        number: 12,
        url: 'https://github.com/avd-ops/avd-assess/issues/12',
        title: 'New candidate work item',
        state: 'open',
        updatedAt: '2026-11-08',
        labels: [{ name: 'enhancement', by: 'nickprignano' }],
      },
    ],
  };
  const candidates = findRoadmapCandidates(reposDoc, fixture);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].number, 12);
});
