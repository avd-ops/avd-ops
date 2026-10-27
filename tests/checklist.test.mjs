// The owner's checklist (site/checklist.html): its data file is valid and public-only, and the pure functions in
// site/assets/checklist-core.js read GitHub's answers the way GitHub gives them (empty properties omitted).
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validate, prStatus, itemPrStatus, rulesetStatus, pvrStatus, itemSettingStatus, planRequests, budget, applyResult,
  shouldAutoCheck, progress, listPrs, STALE_MS, RATE_LIMIT, currentRate, readRate,
} from '../site/assets/checklist-core.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (f) => readFileSync(join(root, f), 'utf8');
const data = JSON.parse(read('site/checklist.json'));

test('checklist.json is valid and names only public repos in repos.json', () => {
  assert.deepEqual(validate(data), []);
  const pub = new Set(JSON.parse(read('repos.json')).repos.map((r) => r.repo));
  for (const r of data.repos) assert.ok(pub.has(`${data.owner}/${r.name}`), `${r.name} is not a public repo in repos.json`);
});

test('a full check fits in one hour of unauthenticated requests', () => {
  assert.ok(planRequests(data, { prs: {}, settings: {} }).length <= RATE_LIMIT - 3, 'too many lines for one check: remove done ones');
});

test('the page loads only its own scripts and asks only api.github.com', () => {
  const html = read('site/checklist.html');
  assert.match(html, /<script type="module" src="assets\/checklist\.js"><\/script>/);
  const js = read('site/assets/checklist.js') + read('site/assets/checklist-core.js');
  const hosts = new Set([...js.matchAll(/https:\/\/([\w.-]+)/g)].map((m) => m[1]));
  for (const h of hosts) assert.match(h, /^(api\.)?github\.com$/, h);
  assert.doesNotMatch(js, /sendBeacon|XMLHttpRequest|Authorization|token/i, 'no tracking, no sign-in');
});

test('pull request states, including the lazy first read', () => {
  assert.equal(prStatus(undefined).state, 'unchecked');
  assert.equal(prStatus({ state: 'closed', merged: true }).state, 'merged');
  assert.equal(prStatus({ state: 'closed', merged: false }).state, 'closed');
  assert.equal(prStatus({ state: 'open', mergeable_state: 'clean' }).state, 'ready');
  assert.equal(prStatus({ state: 'open', mergeable_state: 'dirty' }).state, 'conflict');
  assert.equal(prStatus({ state: 'open', mergeable_state: 'unstable' }).state, 'checks');
  assert.equal(prStatus({ state: 'open', mergeable_state: 'unknown' }).state, 'checking');
  assert.equal(prStatus({ state: 'open' }).state, 'checking', 'omitted mergeable_state is never ready');
  assert.equal(prStatus({ state: 'open', draft: true, mergeable_state: 'clean' }).state, 'draft');
  assert.equal(prStatus({ state: 'open', mergeable_state: 'has_hooks' }).state, 'ready');
});

test('a pair is ready only when both halves are, and done only when both are merged', () => {
  const item = { kind: 'pr', prs: [{ repo: 'a', number: 1 }, { repo: 'b', number: 2 }] };
  const ready = { state: 'open', mergeable_state: 'clean' };
  assert.equal(itemPrStatus(item, { 'a#1': ready, 'b#2': ready }).state, 'ready');
  const half = itemPrStatus(item, { 'a#1': ready, 'b#2': { state: 'open', mergeable_state: 'dirty' } });
  assert.equal(half.state, 'conflict');
  assert.match(half.word, /^b #2: Merge conflict/);
  assert.equal(half.head, 'Not ready yet');
  assert.equal(itemPrStatus(item, { 'a#1': { merged: true }, 'b#2': ready }).done, false);
  const closedHalf = itemPrStatus(item, { 'a#1': { merged: true }, 'b#2': { state: 'closed', merged: false } });
  assert.equal(closedHalf.done, false, 'closed without merging is not done');
  assert.equal(closedHalf.head, 'Closed, not merged');
  assert.equal(itemPrStatus(item, { 'a#1': { merged: true }, 'b#2': { merged_at: '2026-10-21T00:00:00Z' } }).done, true);
});

test('rulesets and private vulnerability reporting', () => {
  assert.equal(rulesetStatus([]).done, false, 'an empty list is no ruleset');
  assert.deepEqual(rulesetStatus([{ type: 'deletion' }]).missing, ['non_fast_forward', 'pull_request']);
  assert.equal(rulesetStatus([{ type: 'deletion' }, { type: 'non_fast_forward' }, { type: 'pull_request' }, { type: 'required_status_checks' }]).done, true);
  assert.equal(rulesetStatus(null).state, 'unchecked');
  assert.equal(pvrStatus({ enabled: true }).done, true);
  assert.equal(pvrStatus({ enabled: false }).state, 'off');
  assert.equal(pvrStatus({}).state, 'unchecked');
  const item = { repos: ['a', 'b'] };
  assert.equal(itemSettingStatus(item, { a: { done: true }, b: { done: false, state: 'off' } }).word, '1 of 2 repos');
  assert.equal(itemSettingStatus(item, {}).state, 'unchecked');
});

test('merged pull requests are never asked about again, and a failed request keeps the last result', () => {
  const all = planRequests(data, { prs: {}, settings: {} });
  const [first] = listPrs(data);
  const key = `${first.repo}#${first.number}`;
  const after = planRequests(data, { prs: { [key]: { merged: true } }, settings: {} });
  assert.equal(after.length, all.length - 1);
  assert.equal(planRequests(data, { prs: { [key]: { state: 'closed', merged: false } }, settings: {} }).length, all.length, 'a closed pull request can be reopened');
  const asked = Object.fromEntries(all.slice(0, 5).map((r) => [r.key, 100]));
  const rotated = planRequests(data, { prs: {}, settings: {}, asked });
  assert.deepEqual(rotated.slice(-5).map((r) => r.key), all.slice(0, 5).map((r) => r.key), 'the ones asked most recently go last');
  const c1 = applyResult({ prs: {}, settings: {} }, `pr:${key}`, true, { state: 'open', mergeable_state: 'clean', title: 't', extra: 'dropped' });
  assert.deepEqual(Object.keys(c1.prs[key]).sort(), ['draft', 'html_url', 'mergeable_state', 'merged', 'merged_at', 'state', 'title']);
  const c2 = applyResult(c1, `pr:${key}`, false, null, 5);
  assert.equal(c2.prs[key].mergeable_state, 'clean');
  assert.equal(c2.asked[`pr:${key}`], 5);
});

test('the rate limit is respected and the page waits before checking by itself', () => {
  const now = 1_000_000_000_000;
  assert.deepEqual(budget(30, { remaining: 10, reset: now / 1000 + 600 }, now), { send: 7, waitUntil: now + 600_000 });
  assert.equal(budget(30, { remaining: 0, reset: now / 1000 - 1 }, now).send, 30, 'the window has reset');
  assert.equal(budget(30, null, now).send, 30);
  assert.equal(currentRate({ remaining: 0, reset: now / 1000 - 1 }, now), null, 'an old window is not shown');
  assert.deepEqual(currentRate({ remaining: 4, reset: now / 1000 + 60 }, now), { remaining: 4, reset: now / 1000 + 60 });
  assert.equal(readRate(() => null), null, 'a missing header is unknown, not zero');
  assert.deepEqual(readRate((h) => ({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1700000000' })[h]), { remaining: 0, reset: 1700000000 });
  assert.equal(shouldAutoCheck({}, now), true);
  assert.equal(shouldAutoCheck({ checkedAt: now - 1000 }, now), false);
  assert.equal(shouldAutoCheck({ checkedAt: now - STALE_MS - 1 }, now), true);
});

test('progress counts manual ticks and leaves out sections that do not count', () => {
  const d = { owner: 'o', updated: '2026-10-21', repos: [{ name: 'r', branch: 'main' }], sections: [
    { id: 's', title: 'S', items: [{ id: 'm', kind: 'manual', text: 'x' }, { id: 'p', kind: 'pr', prs: [{ repo: 'r', number: 1 }] }] },
    { id: 'h', title: 'H', counts: false, items: [{ id: 'm2', kind: 'manual', text: 'y' }] },
  ] };
  assert.deepEqual(validate(d), []);
  assert.deepEqual(progress(d, { prs: { 'r#1': { merged: true } } }, { m: true, m2: true }), { done: 2, total: 2 });
  assert.deepEqual(progress(d, {}, {}), { done: 0, total: 2 });
  assert.ok(validate({ ...d, sections: [{ id: 's', title: 'S', items: [{ id: 'l', kind: 'manual', text: 'x', link: 'https://example.com/' }] }] }).length, 'links stay on github.com');
  for (const repos of [undefined, []]) assert.ok(validate({ ...d, sections: [{ id: 's', title: 'S', items: [{ id: 'v', kind: 'pvr', text: 'x', repos }] }] }).length, 'a setting line needs repos');
});
