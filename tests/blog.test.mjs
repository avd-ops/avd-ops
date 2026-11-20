// Tests for the auto-blog (scripts/site/draft-blog.mjs and scripts/site/build-blog.mjs).
// Run: node --test tests/blog.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isBotOrNoisePr, classifyPr, sanitizeText, formatDigestMarkdown } from '../scripts/site/draft-blog.mjs';
import { loadPosts, buildFeedXml, inferAutoTags, inferAutoRepos } from '../scripts/site/build-blog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('site/blog/ is up to date with docs/blog/ (scripts/site/build-blog.mjs --check)', () => {
  execFileSync(process.execPath, [join(root, 'scripts/site/build-blog.mjs'), '--check'], { stdio: 'pipe' });
  assert.ok(existsSync(join(root, 'site/blog/index.html')), 'site/blog/index.html');
  assert.ok(existsSync(join(root, 'site/blog/feed.xml')), 'site/blog/feed.xml');
});

test('blog posts and Atom feed render with required metadata', () => {
  const posts = loadPosts();
  assert.ok(posts.length >= 1, 'at least one blog post exists');
  const feed = readFileSync(join(root, 'site/blog/feed.xml'), 'utf8');
  assert.match(feed, /^<\?xml version="1\.0" encoding="utf-8"\?>/);
  assert.match(feed, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
  for (const p of posts) {
    assert.ok(feed.includes(`https://avd-ops.dev/blog/${p.url}`), `feed includes ${p.url}`);
  }
  const emptyFeed = buildFeedXml([]);
  assert.match(emptyFeed, /<updated>2026-01-01T00:00:00Z<\/updated>/);
});

test('draft-blog filters bot/noise PRs and classifies updates', () => {
  assert.equal(isBotOrNoisePr({ user: { login: 'dependabot[bot]' }, title: 'Bump marked' }), true);
  assert.equal(isBotOrNoisePr({ user: { login: 'nickprignano' }, title: 'blog: daily digest 2026-11-20' }), true);
  assert.equal(isBotOrNoisePr({ user: { login: 'nickprignano' }, title: 'Add C26 sovereign checks', head: { ref: 'feat/c26' } }), false);

  assert.equal(classifyPr({ title: 'fix: handle empty snapshot', labels: [] }), 'fixes');
  assert.equal(classifyPr({ title: 'Add benchmark finding', labels: [{ name: 'finding' }] }), 'findings');
  assert.equal(classifyPr({ title: 'feat: add auto-blog', labels: [] }), 'features');
});

test('draft-blog sanitizes banned terms and partner names and formats Markdown', () => {
  const clean = sanitizeText('Update for AVD family and banned-term and Nerdio', ['banned-term']);
  assert.doesNotMatch(clean, /\bbanned-term\b/i);
  assert.doesNotMatch(clean, /nerdio/i);
  assert.doesNotMatch(clean, /AVD family/i);

  const md = formatDigestMarkdown({
    date: '2026-11-20',
    banned: ['banned-term'],
    items: [
      { repo: 'avd-assess', kind: 'releases', title: 'v1.2.0', url: 'https://github.com/avd-ops/avd-assess/releases/tag/v1.2.0', note: 'release' },
      { repo: 'avd-ops', kind: 'features', title: 'Add blog (#99)', url: 'https://github.com/avd-ops/avd-ops/pull/99', note: 'merged PR' },
      { repo: 'avd-current-state', kind: 'findings', title: 'Probe timeout finding (#12)', url: 'https://github.com/avd-ops/avd-current-state/issues/12', note: 'research' },
      { repo: 'avd-landing-zone', kind: 'fixes', title: 'Fix NSG rule (#45)', url: 'https://github.com/avd-ops/avd-landing-zone/pull/45', note: 'merged PR' },
    ],
  });
  assert.match(md, /^---\ntitle: "Daily update: 2026-11-20"\ndate: "2026-11-20"/);
  assert.match(md, /## Releases/);
  assert.match(md, /## Features and updates/);
  assert.match(md, /## Findings and decisions/);
  assert.match(md, /## Fixes and hardening/);

  const weeklyMd = formatDigestMarkdown({
    start: '2026-11-13',
    end: '2026-11-19',
    items: [
      { date: '2026-11-15', repo: 'avd-ops', kind: 'features', title: 'Add blog (#99)', url: 'https://github.com/avd-ops/avd-ops/pull/99', note: 'merged PR' },
    ],
  });
  assert.match(weeklyMd, /title: "Weekly digest: 2026-11-13 to 2026-11-19"/);
  assert.match(weeklyMd, /tags: \["weekly-digest", "features"\]/);

  assert.deepEqual(inferAutoTags('2026-11-19-weekly-digest', '## Releases\n## Fixes\n'), ['weekly-digest', 'release', 'fixes']);
  assert.deepEqual(inferAutoTags('2026-11-21-deep-dive', 'Plain prose note.'), ['note']);
  assert.deepEqual(inferAutoRepos('Updated avd-assess and avd-ops.', ['avd-assess', 'avd-ops', 'avd-learn']), ['avd-assess', 'avd-ops']);
});
