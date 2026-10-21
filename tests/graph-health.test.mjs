// KB health over the docs graph (scripts/site/graph-health.mjs): the rules on small fixtures, then the
// real graph in site/docs/graph.json, which must have no orphan, nothing unreachable from the nav and no
// guidance page still linking a superseded decision.
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { graphHealth } from '../scripts/site/graph-health.mjs';

const root = new URL('../', import.meta.url).pathname;
const node = (id, extra = {}) => ({ id, title: id, url: `${id}.html`, topic: id.split('/')[0], ...extra });

test('a page nobody links to is an orphan, unless the nav reaches it', () => {
  const h = graphHealth({
    nodes: [node('start/README.md', { section: true }), node('repos/a.md'), node('repos/b.md')],
    links: [{ source: 'start/README.md', target: 'repos/a.md' }],
  });
  assert.deepEqual(h.orphans, ['repos/b.md']);
  assert.deepEqual(h.unreachable, ['repos/b.md']);
});

test('a cycle that only links to itself is unreachable though nothing in it is an orphan', () => {
  const h = graphHealth({
    nodes: [node('start/README.md', { section: true }), node('repos/a.md'), node('repos/b.md')],
    links: [{ source: 'repos/a.md', target: 'repos/b.md' }, { source: 'repos/b.md', target: 'repos/a.md' }],
  });
  assert.deepEqual(h.orphans, []);
  assert.deepEqual(h.unreachable, ['repos/a.md', 'repos/b.md']);
});

test('hubs rank by inbound links; self links and links to unknown pages are ignored', () => {
  const h = graphHealth({
    nodes: [node('start/README.md', { section: true }), node('repos/a.md'), node('repos/b.md')],
    links: [
      { source: 'start/README.md', target: 'repos/a.md' }, { source: 'repos/b.md', target: 'repos/a.md' },
      { source: 'start/README.md', target: 'repos/b.md' }, { source: 'repos/a.md', target: 'repos/a.md' },
      { source: 'repos/a.md', target: 'gone.md' },
    ],
  }, { hubs: 1 });
  assert.deepEqual(h.hubs.map((x) => [x.id, x.linkedFrom]), [['repos/a.md', 2]]);
  assert.deepEqual(h.deadEnds, ['repos/a.md']);
});

test('a superseded decision may be linked from the decision records, not from guidance', () => {
  const h = graphHealth({
    nodes: [node('decisions/README.md', { section: true }), node('decisions/0001-old.md', { status: 'superseded by 0002' }),
      node('decisions/0002-new.md', { status: 'accepted' }), node('concepts/README.md', { section: true })],
    links: [
      { source: 'decisions/README.md', target: 'decisions/0001-old.md' }, { source: 'decisions/0002-new.md', target: 'decisions/0001-old.md' },
      { source: 'concepts/README.md', target: 'decisions/0001-old.md' }, { source: 'concepts/README.md', target: 'decisions/0002-new.md' },
    ],
  });
  assert.deepEqual(h.supersededLinks, [{ source: 'concepts/README.md', target: 'decisions/0001-old.md' }]);
});

test('the docs graph is healthy', () => {
  const h = graphHealth(JSON.parse(readFileSync(`${root}site/docs/graph.json`, 'utf8')));
  assert.deepEqual(h.orphans, [], 'link these pages from another page');
  assert.deepEqual(h.unreachable, [], 'these pages cannot be reached from the nav');
  assert.deepEqual(h.supersededLinks, [], 'link the decision that superseded these instead');
});
