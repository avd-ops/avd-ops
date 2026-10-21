// The shared submission intake (docs/submissions-spec.md): one routing table, one set of issue forms,
// one link builder. Routes name only repos in repos.json, every form exists and keeps the public-safe
// warning and checkbox, private routes never become an issue, and links carry only IDs, never free text.
// Run: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { submissionUrl } from '../submissions/links.mjs';

const root = new URL('../', import.meta.url).pathname;
const read = (f) => readFileSync(join(root, f), 'utf8');
const routing = JSON.parse(read('submissions/routing.json'));
const repos = JSON.parse(read('repos.json'));
const forms = readdirSync(join(root, 'submissions/forms')).filter((f) => f.endsWith('.yml'));
const kbForms = ['kb-feedback.yml'];
const labelsOf = (yml) => (yml.match(/^labels: \[(.*)\]$/m)?.[1] ?? '').split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);

test('every route names a type, a repo in repos.json and a form that exists', () => {
  const names = repos.repos.map((r) => r.name);
  const seen = new Set();
  for (const r of routing.routes) {
    assert.ok(routing.types[r.type], `unknown type ${r.type}`);
    const key = `${r.type}/${r.area}`;
    assert.ok(!seen.has(key), `duplicate route ${key}`);
    seen.add(key);
    if (r.mail) {
      assert.equal(routing.types[r.type].public, false, `${key}: only private types go by mail`);
      assert.ok(!r.repo && !r.form, `${key}: a mail route has no repo or form`);
      continue;
    }
    assert.equal(routing.types[r.type].public, true, `${key}: a private type never opens an issue`);
    assert.ok(names.includes(r.repo), `${key}: ${r.repo} is not in repos.json`);
    assert.ok(forms.includes(r.form) || kbForms.includes(r.form), `${key}: form ${r.form} missing`);
  }
  for (const [type, t] of Object.entries(routing.types)) {
    assert.ok(routing.routes.some((r) => r.type === type), `type ${type} has no route`);
    if (!t.public) assert.match(t.subject, /^\[[a-z]+\]$/, `${type}: fixed subject tag`);
  }
});

test('each of the three foundation repos gets bug, feature, feedback and dispute routes', () => {
  for (const [repo, area] of [['avd-landing-zone', 'landing-zone'], ['avd-current-state', 'current-state'], ['avd-assess', 'assess']]) {
    for (const [type, a] of [['bug', area], ['feature', area], ['feedback', area], ['feedback', `${area}.dispute`]]) {
      assert.ok(routing.routes.some((r) => r.type === type && r.area === a && r.repo === repo), `${repo} ${type} ${a}`);
    }
  }
});

test('every form opens with the public warning, carries the shared labels and a required public-safe checkbox', () => {
  for (const f of forms) {
    const yml = read(`submissions/forms/${f}`);
    const body = yml.split('body:')[1];
    assert.match(body.split('- type:')[1], /^ markdown/, `${f}: the warning comes first`);
    assert.match(body, /[Pp]ublic/, `${f}: says issues are public`);
    const labels = labelsOf(yml);
    for (const l of routing.always) assert.ok(labels.includes(l), `${f}: label ${l}`);
    assert.ok(labels.some((l) => l.startsWith('type:')), `${f}: a type label`);
    for (const l of labels) assert.ok(routing.labels[l], `${f}: label ${l} is not described in routing.json`);
    assert.match(yml, /id: (public-safe|confirm)\n[\s\S]*?required: true/, `${f}: a required consent checkbox`);
    assert.doesNotMatch(yml, /id: (e-?mail|phone|company|employer|tenant)/i, `${f}: asks for contact or employer details`);
  }
});

test("the forms avd-ops routes to itself are byte-identical copies in .github/ISSUE_TEMPLATE", () => {
  const own = new Set(routing.routes.filter((r) => r.repo === 'avd-ops' && !kbForms.includes(r.form)).map((r) => r.form));
  assert.ok(own.size > 0);
  for (const f of own) {
    const copy = `.github/ISSUE_TEMPLATE/${f}`;
    assert.ok(existsSync(join(root, copy)), `${copy} missing`);
    assert.equal(read(copy), read(`submissions/forms/${f}`), `${copy} drifted from submissions/forms/${f}`);
  }
});

test('the link builder points only at repos.json or the mailbot, and carries no free text', () => {
  const url = new URL(submissionUrl(routing, repos, { type: 'feedback', area: 'assess.dispute', target: 'ref:session-host-sizing#medium-users-per-vcpu', title: 'Dispute: users per vCPU' }));
  assert.equal(url.origin, 'https://github.com');
  assert.ok(repos.repos.some((r) => url.pathname === `/${r.repo}/issues/new`), url.pathname);
  assert.equal(url.searchParams.get('template'), 'dispute.yml');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['target', 'template', 'title']);

  for (const target of ['https://evil.example/x', 'gap:x y', 'a'.repeat(200), 'ref:x<script>']) {
    assert.throws(() => submissionUrl(routing, repos, { type: 'bug', area: 'landing-zone', target }), /target/, target);
  }
  assert.throws(() => submissionUrl(routing, repos, { type: 'bug', area: 'landing-zone', title: 'my tenant is <id>\nand my email' }), /title/);
  assert.throws(() => submissionUrl(routing, repos, { type: 'bug', area: 'nowhere' }), /no route/);

  for (const type of ['contact', 'sponsorship']) {
    const mail = submissionUrl(routing, repos, { type, area: 'any', target: 'ignored', title: 'ignored' });
    assert.equal(mail, `mailto:${routing.mail.address}?subject=${encodeURIComponent(`[${type}]`)}`);
  }
  assert.match(routing.mail.address, /@avd-ops\.dev$/, 'the one non-GitHub destination is on avd-ops.dev');
});
