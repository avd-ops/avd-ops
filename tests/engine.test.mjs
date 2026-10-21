// The portal engine (docs/portal-engine-spec.md, sections 6, 8 and 12): each module's cases, the probe on a
// scripted network, the scan for requests, eval and HTML from data, the ES2020 floor, the notice and version
// line, the manifest, and each file loading alone after core.js in Node and in a browser-like context.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import vm from 'node:vm';
import { ENGINE, PATH, NETWORK, engineFiles, versionOf, manifest } from '../scripts/site/engine-manifest.mjs';

const require = createRequire(import.meta.url);
const load = (f) => require(join(ENGINE, f));
const core = load('core.js'), blocks = load('blocks.js'), statelines = load('statelines.js');
const runin = load('runin.js'), bands = load('bands.js'), probe = load('probe.js');
const files = engineFiles();
const text = (f) => readFileSync(join(ENGINE, f), 'utf8');
const code = (f) => text(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\'"`])\/\/.*$/gm, '$1');

// ---------------------------------------------------------------- core and blocks
test('core: check accepts a fitting string and throws with the name otherwise; fits returns null', () => {
  assert.equal(core.check('eastus', /^[a-z0-9]+$/, 'location'), 'eastus');
  assert.throws(() => core.check('east us', /^[a-z0-9]+$/, 'location'), /location does not fit/);
  assert.throws(() => core.check(42, /^\d+$/, 'n'), /n does not fit/);
  assert.throws(() => core.check('x', 'x', 'p'), /does not fit/);
  assert.equal(core.fits('a', /^a$/), 'a');
  assert.equal(core.fits(['a'], /^a$/), null);
  const g = /^[a-z]+$/g;
  for (let i = 0; i < 3; i++) assert.equal(core.check('abc', g, 'g'), 'abc', 'a g flag keeps no state between calls');
  assert.equal(g.lastIndex, 0, 'the caller pattern is not touched');
  assert.equal(core.VERSION, JSON.parse(readFileSync(PATH, 'utf8')).version);
});

test('blocks: quoting doubles the quote and refuses line breaks and control characters', () => {
  assert.equal(blocks.psQuote("o'brien"), "'o''brien'");
  assert.equal(blocks.bashQuote("o'brien"), "'o'\\''brien'");
  assert.equal(blocks.psQuote(''), "''");
  // PowerShell ends a single-quoted string at U+2018 to U+201B too.
  assert.equal(blocks.psQuote('x\u2019; iex'), "'x\u2019\u2019; iex'");
  assert.equal(blocks.psQuote('\u2018\u201a\u201b'), "'\u2018\u2018\u201a\u201a\u201b\u201b'");
  for (const bad of ['a\nb', 'a\rb', 'a\tb', 'a\u0000b', 'a\u007fb']) {
    assert.throws(() => blocks.psQuote(bad), /control character/, JSON.stringify(bad));
    assert.throws(() => blocks.bashQuote(bad), /control character/, JSON.stringify(bad));
  }
});

test('blocks: arg takes a value only when it fits its pattern', () => {
  assert.equal(blocks.arg('Location', 'eastus', /^[a-z0-9]+$/), " -Location 'eastus'");
  assert.equal(blocks.arg('User', "o'brien@contoso.com", /^[^\s@]+@[\w.-]+$/), " -User 'o''brien@contoso.com'");
  assert.throws(() => blocks.arg('Location', "x'; iex", /^[a-z0-9]+$/), /Location does not fit/);
  assert.throws(() => blocks.arg('Location', undefined, /^[a-z]*$/), /does not fit/);
  assert.throws(() => blocks.arg('-Bad Name', 'x', /x/), /parameter name/);
});

test('blocks: hereString carries plain JSON and refuses what a paste would break', () => {
  assert.deepEqual(blocks.hereString('intake.json', { a: 1 }), ["@'", '{\n  "a": 1\n}', "'@"]);
  assert.throws(() => blocks.hereString('intake.json', { a: 'café' }), /intake.json holds a character/);
  assert.throws(() => blocks.hereString('intake.json', { a: '—' }), /holds a character/);
});

test('blocks: repo URL, ref and commit checks match the deployment portal', () => {
  for (const u of ['https://github.com/avd-ops/avd-landing-zone', 'https://github.com/a/b/', 'https://github.com/a_b/c.d']) assert.ok(blocks.isRepoUrl(u), u);
  for (const u of ['http://github.com/a/b', 'https://github.com/a/b/c', 'https://github.com/../b', 'https://evil.example/a/b', 'https://github.com/a/b.git; iex', null]) assert.ok(!blocks.isRepoUrl(u), String(u));
  for (const r of ['master', 'v0.1.0', 'feature/x', 'pe-v1.0.0']) assert.ok(blocks.isRef(r), r);
  for (const r of ['-x', 'a..b', 'a//b', 'a/', 'x.lock', "a'b", 'a b', '', 'x'.repeat(101)]) assert.ok(!blocks.isRef(r), r);
  assert.ok(blocks.isCommit('d106eed') && blocks.isCommit('a'.repeat(40)));
  assert.ok(!blocks.isCommit('d106ee') && !blocks.isCommit('g106eed') && !blocks.isCommit('a'.repeat(41)));
});

// ---------------------------------------------------------------- state lines
test('statelines: every block, oldest first, parsed or reported with raw cut at 200', () => {
  const t = 'noise\n<<<AVDLZ-STATE {"a":1} AVDLZ-STATE>>>\nmore <<<AVDLZ-STATE {"b":\n2} AVDLZ-STATE>>> <<<AVDLZ-STATE {bad AVDLZ-STATE>>>';
  const r = statelines.extract(t, 'AVDLZ-STATE');
  assert.deepEqual(r.slice(0, 2), [{ value: { a: 1 } }, { value: { b: 2 } }]);
  assert.equal(r[2].raw, '{bad');
  assert.match(r[2].parseError, /JSON|Unexpected|Expected/);
  const long = statelines.extract(`<<<AVDCS-STATE {${'x'.repeat(500)} AVDCS-STATE>>>`, 'AVDCS-STATE');
  assert.equal(long[0].raw.length, 200);
  assert.deepEqual(statelines.extract('', 'AVDCS-STATE'), []);
  assert.deepEqual(statelines.extract(null, 'AVDCS-STATE'), []);
});

test('statelines: each portal keeps its own line-break rule', () => {
  const wrapped = '<<<M-STATE {"a":"x\r\ny"} M-STATE>>>';
  assert.deepEqual(statelines.extract(wrapped, 'M-STATE', { newlines: 'any' }), [{ value: { a: 'xy' } }]);
  assert.deepEqual(statelines.extract(wrapped, 'M-STATE', { newlines: 'lf' }), [{ value: { a: 'xy' } }]);
  const loneCr = '<<<M-STATE {"a":"x\ry"} M-STATE>>>';
  assert.deepEqual(statelines.extract(loneCr, 'M-STATE'), [{ value: { a: 'xy' } }], 'any drops a lone CR');
  assert.ok(statelines.extract(loneCr, 'M-STATE', { newlines: 'lf' })[0].parseError, 'lf keeps it, and a raw CR is not JSON');
  assert.throws(() => statelines.extract('', 'M-STATE', { newlines: 'cr' }), /any or lf/);
  for (const m of ['m-state', 'X', 'A.B', 'A(B', '']) assert.throws(() => statelines.extract('', m), /marker/, m);
});

// ---------------------------------------------------------------- run in
const LZ_SCRIPTS = /\.\/(scripts\/[\w.\/-]+\.(?:ps1|sh))/g, CS_SCRIPTS = /\.\/(avd_[\w]+\.ps1)/g;
const PLATFORMS = {
  'scripts/a.ps1': { 'cloudshell-pwsh': 'tested', 'cloudshell-bash': 'untested', windows: 'untested', macos: 'tested', requires: 'PowerShell 7.2 or later, the Az modules' },
  'scripts/b.sh': { 'cloudshell-pwsh': 'tested', 'cloudshell-bash': 'tested', windows: 'no', macos: 'untested', requires: 'bash, the Az modules' },
  'scripts/odd.ps1': { 'cloudshell-pwsh': 'maybe' }
};

test('runin: where and shell, with Bash on Windows meaning PowerShell', () => {
  assert.deepEqual(runin.validRunIn(), { where: 'cloudshell', shell: 'pwsh' });
  assert.deepEqual(runin.validRunIn({ where: 'windows', shell: 'bash' }), { where: 'windows', shell: 'pwsh' });
  assert.deepEqual(runin.validRunIn({ where: 'macos', shell: 'bash' }), { where: 'macos', shell: 'bash' });
  assert.deepEqual(runin.validRunIn({ where: 'toString', shell: 'zsh' }), { where: 'cloudshell', shell: 'pwsh' });
  assert.ok(runin.isDefaultRunIn({}) && !runin.isDefaultRunIn({ where: 'macos' }));
  assert.deepEqual(['cloudshell/pwsh', 'cloudshell/bash', 'windows/pwsh', 'macos/bash'].map((k) => runin.platformKey({ where: k.split('/')[0], shell: k.split('/')[1] })),
    ['cloudshell-pwsh', 'cloudshell-bash', 'windows', 'macos']);
});

test('runin: scriptsIn takes the portal pattern and lists each script once', () => {
  const cmd = './scripts/a.ps1 -X; bash ./scripts/b.sh; ./scripts/a.ps1';
  assert.deepEqual(runin.scriptsIn(cmd, LZ_SCRIPTS), ['scripts/a.ps1', 'scripts/b.sh']);
  assert.deepEqual(runin.scriptsIn('./avd_current_state_collector.ps1 x ./avd_current_state_facts.ps1', CS_SCRIPTS), ['avd_current_state_collector.ps1', 'avd_current_state_facts.ps1']);
  assert.deepEqual(runin.scriptsIn(null, LZ_SCRIPTS), []);
  assert.throws(() => runin.scriptsIn(cmd, /x/), /global pattern/);
  assert.deepEqual(runin.scriptsIn(cmd, LZ_SCRIPTS), ['scripts/a.ps1', 'scripts/b.sh'], 'the caller pattern keeps no state');
});

test('runin: support is the weakest script, with requirements off Cloud Shell only', () => {
  const both = './scripts/a.ps1\nbash ./scripts/b.sh';
  assert.deepEqual(runin.support(both, {}, PLATFORMS, LZ_SCRIPTS), { status: 'tested', requires: [], blockedBy: [], place: 'Cloud Shell', shell: 'pwsh' });
  assert.deepEqual(runin.support(both, { where: 'windows' }, PLATFORMS, LZ_SCRIPTS),
    { status: 'no', requires: ['PowerShell 7.2 or later', 'the Az modules', 'bash'], blockedBy: ['scripts/b.sh'], place: 'Windows', shell: 'pwsh' });
  assert.equal(runin.support(both, { where: 'macos', shell: 'bash' }, PLATFORMS, LZ_SCRIPTS).status, 'untested');
  assert.equal(runin.support('Get-AzContext', {}, PLATFORMS, LZ_SCRIPTS).status, 'tested', 'no script: tested where written');
  assert.equal(runin.support('Get-AzContext', { shell: 'bash' }, PLATFORMS, LZ_SCRIPTS).status, 'untested', 'no script: untested elsewhere');
  assert.equal(runin.support('./scripts/unknown.ps1', {}, PLATFORMS, LZ_SCRIPTS).status, 'untested', 'an unlisted script');
  assert.equal(runin.support('./scripts/odd.ps1', {}, PLATFORMS, LZ_SCRIPTS).status, 'untested', 'an unknown value');
  assert.equal(runin.support('./scripts/a.ps1', {}, null, LZ_SCRIPTS).status, 'untested', 'no table');
});

test('runin: pwshFile, signInLines and the whole-block Bash rewrite', () => {
  assert.deepEqual(runin.pwshFile(['Get-Date']), ['f="$(mktemp -d)/step.ps1"', `cat > "$f" <<'AVD_PS'`, 'Get-Date', 'AVD_PS', 'pwsh -NoLogo -File "$f"']);
  assert.deepEqual(runin.pwshFile(['Get-Date'], { declare: false })[0], `cat > "$f" <<'AVD_PS'`);
  assert.throws(() => runin.pwshFile(['x', 'AVD_PS']), /cannot carry/);
  assert.deepEqual(runin.signInLines('cloudshell', 'pwsh', { azPowerShell: true, azCli: true }), []);
  assert.deepEqual(runin.signInLines('windows', 'pwsh', { azPowerShell: true, azCli: true }), [runin.SIGN_IN.azPowerShell, runin.SIGN_IN.azCliPwsh]);
  assert.deepEqual(runin.signInLines('macos', 'bash', { azPowerShell: true, azCli: true }), [runin.SIGN_IN.azCliBash]);
  assert.deepEqual(runin.signInLines('macos', 'bash', { azPowerShell: true }), []);
  assert.equal(runin.SIGN_IN.azPowerShell, 'if (-not (Get-AzContext)) { Connect-AzAccount -UseDeviceAuthentication | Out-Null }');
  const block = "$repo = Join-Path $HOME 'x'\nSet-Location $repo";
  assert.equal(runin.forRunIn(block, { where: 'windows' }), block);
  assert.equal(runin.forRunIn(block, { where: 'cloudshell', shell: 'bash' }),
    `f="$(mktemp -d)/step.ps1"\ncat > "$f" <<'AVD_PS'\n${block}\nAVD_PS\npwsh -NoLogo -File "$f"`);
  assert.equal(runin.forRunIn('', { shell: 'bash' }), '');
  assert.throws(() => runin.forRunIn('a\nAVD_PS\nb', { shell: 'bash' }), /cannot carry/);
});

// ---------------------------------------------------------------- bands
// The deployment portal's region bands (rateLatency), as a table.
const LATENCY = {
  noAnswer: { label: 'No answer', cls: 'muted', claim: 'lz-0003' },
  rows: [
    { lt: 100, label: 'Good', cls: 'good', claim: 'lz-0003' },
    { le: 150, label: 'Usable', cls: 'ok', claim: 'lz-0003' },
    { otherwise: true, label: 'Sluggish', cls: 'poor', claim: 'lz-0003' }
  ]
};

test('bands: band reproduces the region bands at every boundary', () => {
  const label = (v) => bands.band(v, LATENCY).label;
  const cases = [[0, 'Good'], [99.999, 'Good'], [100, 'Usable'], [100.001, 'Usable'], [150, 'Usable'], [150.001, 'Sluggish'], [1e9, 'Sluggish'], [Infinity, 'Sluggish'],
    [null, 'No answer'], [undefined, 'No answer'], [NaN, 'No answer'], ['50', 'No answer'], [{}, 'No answer']];
  for (const [v, want] of cases) assert.equal(label(v), want, String(v));
  assert.deepEqual(bands.band(10, LATENCY), { label: 'Good', cls: 'good', claim: 'lz-0003' }, 'the row without its bound');
});

test('bands: a table needs a claim on every row, rising bounds and otherwise last', () => {
  const bad = [
    {}, { noAnswer: LATENCY.noAnswer, rows: [] },
    { noAnswer: LATENCY.noAnswer, rows: [{ lt: 1, claim: 'c' }] },
    { noAnswer: LATENCY.noAnswer, rows: [{ lt: 2, claim: 'c' }, { lt: 1, claim: 'c' }, { otherwise: true, claim: 'c' }] },
    { noAnswer: LATENCY.noAnswer, rows: [{ lt: 1, le: 2, claim: 'c' }, { otherwise: true, claim: 'c' }] },
    { noAnswer: LATENCY.noAnswer, rows: [{ claim: 'c' }, { otherwise: true, claim: 'c' }] },
    { noAnswer: LATENCY.noAnswer, rows: [{ lt: '1', claim: 'c' }, { otherwise: true, claim: 'c' }] },
    { noAnswer: LATENCY.noAnswer, rows: [{ lt: 1, claim: 'c' }, { otherwise: true, lt: 9, claim: 'c' }] },
    { noAnswer: LATENCY.noAnswer, rows: [{ lt: 1 }, { otherwise: true, claim: 'c' }] },
    { noAnswer: { label: 'x' }, rows: [{ otherwise: true, claim: 'c' }] }
  ];
  for (const t of bad) assert.throws(() => bands.band(1, t), Error, JSON.stringify(t));
  assert.equal(bands.band(5, { noAnswer: { claim: 'c' }, rows: [{ otherwise: true, claim: 'c', label: 'all' }] }).label, 'all');
});

test('bands: worst fails closed', () => {
  const order = ['pass', 'warn', 'blocked', 'fail'];
  assert.equal(bands.worst(['pass', 'warn', 'pass'], order), 'warn');
  assert.equal(bands.worst(['pass', 'fail', 'warn'], order), 'fail');
  assert.equal(bands.worst(['pass', 'mystery'], order), 'fail', 'an unknown state is the worst');
  assert.equal(bands.worst([], order), null);
  assert.equal(bands.worst(undefined, order), null);
  assert.throws(() => bands.worst(['pass'], []), /in order/);
});

test('bands: classifyHosts says not tested, no answer and reached, and only all reached is reachable', () => {
  const hosts = [{ host: 'a.example.com', purpose: 'A' }, { host: 'b.example.com', purpose: 'B' }];
  const s = (r) => bands.classifyHosts(r, hosts);
  assert.equal(s([]).status, 'unknown');
  assert.equal(s(null).status, 'unknown');
  assert.equal(s([{ host: 'a.example.com', median: 20 }, { host: 'b.example.com', median: 30 }]).status, 'reachable');
  const part = s([{ host: 'a.example.com', median: 20 }]);
  assert.equal(part.status, 'partial');
  assert.deepEqual(part.hosts, [{ host: 'a.example.com', purpose: 'A', reached: true, median: 20 }, { host: 'b.example.com', purpose: 'B', reached: null, median: null }]);
  assert.deepEqual(part.failed, ['b.example.com']);
  assert.equal(s([{ host: 'a.example.com', median: 20 }, { host: 'b.example.com', median: null }]).status, 'partial');
  assert.equal(s([{ host: 'a.example.com', median: null }, { host: 'b.example.com', median: NaN }]).status, 'blocked');
  assert.equal(s([{ host: 'a.example.com', median: '20' }]).hosts[0].reached, false, 'a string is no answer');
  assert.equal(s([null, { host: 'c.example.com', median: 1 }]).status, 'unknown', 'other hosts are ignored');
  const cut = s([{ host: 'a.example.com', median: 20 }, { host: 'b.example.com', median: null, notTested: true }]);
  assert.deepEqual([cut.status, cut.hosts[1].reached], ['partial', null], 'notTested from probe.run is not tested');
  assert.equal(s([{ host: 'a.example.com', median: null, deadline: true }]).hosts[0].reached, null, 'a deadline cut is not tested');
});

// ---------------------------------------------------------------- probe on a scripted network
// outcome(host, n) for the n-th request to a host: { ms } or { reject: true }. The clock moves by ms as each
// request is sent; requests settle on the next turn, so concurrency is real.
function network(outcome) {
  let t = 1000, inflight = 0;
  const net = { calls: [], timers: 0, cleared: 0, maxInflight: 0, now: () => t, advance: (ms) => { t += ms; } };
  const seen = {};
  net.env = {
    now: () => t,
    dateNow: () => 1700000000000,
    random: () => 0.5,
    setTimeout: (fn, ms) => { net.timeouts = (net.timeouts || []).concat(ms); return ++net.timers; },
    clearTimeout: () => { net.cleared++; },
    fetch: (url, init) => {
      const host = new URL(url).hostname, n = (seen[host] = (seen[host] || 0) + 1) - 1;
      net.calls.push({ url, init: { ...init, signal: !!init.signal }, host, n });
      const o = outcome(host, n) || {};
      t += o.ms || 0; inflight++; net.maxInflight = Math.max(net.maxInflight, inflight);
      return new Promise((res, rej) => setImmediate(() => { inflight--; if (o.reject) rej(new TypeError('Failed to fetch')); else res({ type: 'opaque' }); }));
    }
  };
  return net;
}
const ms = (list) => (host, n) => ({ ms: list[n] });

test('probe: timeOnce sends the deployment portal\'s exact request', async () => {
  const net = network(() => ({ ms: 42 }));
  assert.equal(await probe.timeOnce('westus.api.cognitive.microsoft.com', { env: net.env }), 42);
  assert.deepEqual(net.calls[0].init, { mode: 'no-cors', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: true });
  assert.equal(net.calls[0].url, `https://westus.api.cognitive.microsoft.com/?avdlz=1700000000000${(0.5).toString(36).slice(2)}`);
  assert.equal(net.cleared, 1, 'the timer is cleared');
  await probe.timeOnce('a.example.com', { env: net.env, method: 'HEAD', param: 'lc' });
  assert.equal(net.calls[1].init.method, 'HEAD');
  assert.match(net.calls[1].url, /^https:\/\/a\.example\.com\/\?lc=/);
  assert.throws(() => probe.timeOnce('a.example.com', { env: net.env, method: 'POST' }), /GET or HEAD/);
  assert.throws(() => probe.timeOnce('a.example.com', { env: net.env, param: 'a&b=' }), /cache-buster/);
  const sync = { ...net.env, fetch: () => { throw new TypeError('bad'); } };
  await assert.rejects(probe.timeOnce('a.example.com', { env: sync }), /bad/);
  assert.equal(net.timeouts[0], 4000, 'the 4-second timeout');
  assert.throws(() => probe.timeOnce('a.example.com', { env: { ...net.env, AbortController: 1 } }), /needs AbortController/);
  // Without injected timers, the global ones are called on the global (a browser refuses any other this).
  const r = await probe.timeOnce('a.example.com', { env: { fetch: net.env.fetch, now: net.env.now } });
  assert.equal(typeof r, 'number');
});

test('probe: targets are public DNS names only', () => {
  for (const h of ['westus.api.cognitive.microsoft.com', 'windows.cloud.microsoft', 'A.Example.COM']) assert.doesNotThrow(() => probe.checkHost(h), h);
  for (const h of ['10.0.0.1', '[::1]', '::1', 'localhost', 'x.localhost', 'nas.local', 'svc.internal', 'router.home.arpa', 'intranet', 'a.example.com/path',
    'https://a.example.com', 'a.example.com:8080', 'a..example.com', '-a.example.com', '', null, 'user@a.example.com', 'a.example.123'])
    assert.throws(() => probe.checkHost(h), /public DNS name/, String(h));
  assert.deepEqual(probe.connectSrc(['a.example.com', 'B.example.com', 'a.example.com']), ['https://a.example.com', 'https://b.example.com']);
  assert.throws(() => probe.connectSrc(['a.example.com', 'localhost']), /public DNS name/);
});

test('probe: measure warms up, then takes 5 samples one after another (the median is the upper middle)', async () => {
  const net = network(ms([300, 50, 40, 60, 45, 55]));
  const r = await probe.measure('a.example.com', { env: net.env });
  assert.equal(net.calls.length, 6);
  assert.deepEqual(r, { samples: [50, 40, 60, 45, 55], median: 50, jitter: 15, stalls: 0, slow: 0, deadline: false });
  assert.equal(net.maxInflight, 1, 'one after another');
  assert.equal(probe.median([1, 2, 3, 4]), 3);
  assert.equal(probe.median([]), null);
  assert.equal(probe.jitter([10]), null);
});

test('probe: any rejected request is no answer, unless stalls are counted', async () => {
  let net = network((h, n) => (n === 0 ? { reject: true } : { ms: 10 }));
  let r = await probe.measure('a.example.com', { env: net.env });
  assert.equal(r.median, null); assert.equal(net.calls.length, 1, 'a rejected warm-up stops');
  net = network((h, n) => (n === 3 ? { reject: true } : { ms: 10 }));
  r = await probe.measure('a.example.com', { env: net.env });
  assert.equal(r.median, null); assert.equal(r.jitter, null); assert.equal(net.calls.length, 4, 'a rejected sample stops');
  net = network((h, n) => (n === 3 ? { reject: true } : { ms: 10 + n }));
  r = await probe.measure('a.example.com', { env: net.env, countStalls: true, samples: 8, slowMs: 14 });
  assert.equal(net.calls.length, 9);
  assert.deepEqual([r.stalls, r.samples.length, r.median, r.slow], [1, 7, 15, 4]);
  net = network(() => ({ reject: true }));
  r = await probe.measure('a.example.com', { env: net.env, countStalls: true, warmUp: false });
  assert.deepEqual([r.median, r.stalls], [null, 5], 'every sample stalled');
});

test('probe: the deadline ends a host with no answer', async () => {
  const net = network(() => ({ ms: 100 }));
  const r = await probe.measure('a.example.com', { env: net.env, deadlineAt: net.now() + 350 });
  assert.equal(r.deadline, true);
  assert.equal(r.median, null);
  assert.equal(net.calls.length, 4, 'warm-up and three samples before the deadline');
  assert.deepEqual(r.samples, [100, 100, 100], 'the samples taken are still returned');
  assert.deepEqual(net.timeouts.slice(-1), [50], 'the last request times out at the deadline');
  const early = network(() => ({ ms: 1 }));
  const none = await probe.measure('a.example.com', { env: early.env, deadlineAt: early.now() });
  assert.deepEqual([none.deadline, none.median, early.calls.length], [true, null, 0], 'past the deadline, nothing is sent');
});

test('probe: run measures phases one after another, in target order, within its deadlines', async () => {
  const net = network((h) => ({ ms: h.startsWith('slow') ? 30 : 10 }));
  const targets = ['slow1.example.com', 'b.example.com', 'c.example.com', 'd.example.com', 'e.example.com'];
  const res = await probe.run([{ targets, concurrency: 2 }, { targets: ['jitter.example.com'], concurrency: 1 }], { env: net.env });
  assert.deepEqual(res[0].map((r) => r.host), targets);
  assert.ok(res[0].every((r) => r.median !== null));
  assert.ok(net.maxInflight <= 2, `at most 2 at once, saw ${net.maxInflight}`);
  const firstOfPhase2 = net.calls.findIndex((c) => c.host === 'jitter.example.com');
  assert.equal(firstOfPhase2, net.calls.length - 6, 'phase 2 starts after phase 1 ends');
  const late = network(() => ({ ms: 100 }));
  const cut = await probe.run([{ targets: ['a.example.com', 'b.example.com', 'c.example.com'], concurrency: 1 }], { env: late.env, deadlineMs: 700 });
  assert.equal(cut[0][0].median, 100);
  assert.equal(cut[0][1].deadline, true, 'b is cut off mid-measure');
  assert.deepEqual(cut[0][2], { host: 'c.example.com', median: null, notTested: true });
  await assert.rejects(Promise.resolve().then(() => probe.run([{ targets: ['localhost'] }], { env: net.env })), /public DNS name/);
  const own = network(() => ({ ms: 5 }));
  const kept = await probe.run([{ targets: ['a.example.com'], opts: { env: own.env, samples: 2 } }]);
  assert.deepEqual([kept[0][0].median, own.calls.length], [5, 3], 'a phase keeps its own env when the run has none');
});

// ---------------------------------------------------------------- the scan, the floor, the manifest
test('no file but probe.js can make a request, and none evaluates code or writes HTML', () => {
  const network = /\bfetch\b|XMLHttpRequest|WebSocket|EventSource|RTCPeerConnection|sendBeacon|\bimport\s*\(|\bhttps?:\/\/|importScripts|\.src\s*=|navigator\./;
  const never = /\beval\b|new\s+Function|Function\s*\(|set(?:Timeout|Interval)\s*\(\s*['"`]|innerHTML|outerHTML|insertAdjacentHTML|document\.write|\bdocument\b|\bwindow\b|localStorage|sessionStorage|indexedDB|\bWorker\b/;
  for (const f of files) {
    if (!NETWORK.includes(f)) assert.doesNotMatch(code(f), network, `${f} makes a request`);
    assert.doesNotMatch(code(f), never, f);
  }
  assert.match(code('probe.js'), /`https:\/\/\$\{/, 'probe.js builds https:// URLs from a checked host');
  assert.doesNotMatch(code('probe.js'), /http:\/\//, 'probe.js never uses http');
});

test('every engine file is ASCII, carries the notice and the version line, and stays at the ES2020 floor', () => {
  const version = JSON.parse(readFileSync(PATH, 'utf8')).version;
  // Syntax after ES2020: logical assignment, numeric separators, class fields and static blocks, top-level await,
  // the regexp d and v flags, and Object.hasOwn, Array.prototype.at, structuredClone (library, not syntax).
  const later = /(\|\||&&|\?\?)=|\d_\d|#[A-Za-z_]\w*\s*[=;(]|static\s*\{|^\s*await\b|\/[dgimsuyv]*[dv][dgimsuyv]*\.test|\bObject\.hasOwn\b|\.at\(|structuredClone|\.replaceAll\(|Promise\.any|WeakRef|FinalizationRegistry/m;
  for (const f of files) {
    const t = text(f);
    assert.doesNotMatch(t, /[^\x00-\x7f]/, `${f} is ASCII`);
    assert.equal(versionOf(t), version, `${f} version`);
    assert.match(t.split('\n')[0], /Personal project, not for production, as is; not affiliated with the author's employer or Microsoft\. MIT\./, `${f} notice`);
    assert.doesNotMatch(code(f), later, `${f} uses syntax after ES2020`);
    assert.doesNotThrow(() => new vm.Script(t, { filename: f }), f);
  }
});

test('the manifest is up to date, lists every file and what it needs, and a released version never changes', () => {
  const m = JSON.parse(readFileSync(PATH, 'utf8'));
  assert.equal(readFileSync(PATH, 'utf8').replace(/\r\n/g, '\n'), manifest(), 'run node scripts/site/engine-manifest.mjs');
  assert.deepEqual(Object.keys(m.files), files);
  for (const [f, e] of Object.entries(m.files)) {
    assert.equal(e.sha256, createHash('sha256').update(readFileSync(join(ENGINE, f))).digest('hex'), f);
    assert.equal(e.network, f === 'probe.js', `${f} network`);
    assert.deepEqual(e.needs, f === 'core.js' ? [] : ['core.js'], `${f} needs core.js only`);
  }
  // A release PR runs the script with --release; any later change to a released file needs a new version.
  const current = Object.fromEntries(Object.entries(m.files).map(([f, e]) => [f, e.sha256]));
  if (m.released[m.version]) assert.deepEqual(m.released[m.version], current, `v${m.version} is released with other contents: bump the version`);
  for (const v of Object.keys(m.released)) assert.match(v, /^\d+\.\d+\.\d+$/);
});

test('each file loads alone after core.js, in Node and in a browser-like context', () => {
  const names = { 'blocks.js': 'blocks', 'statelines.js': 'statelines', 'runin.js': 'runin', 'bands.js': 'bands', 'probe.js': 'probe' };
  assert.deepEqual(Object.keys(names).sort(), files.filter((f) => f !== 'core.js'));
  for (const [f, name] of Object.entries(names)) {
    const ctx = vm.createContext({});
    ctx.self = ctx;
    vm.runInContext(text('core.js'), ctx, { filename: 'core.js' });
    vm.runInContext(text(f), ctx, { filename: f });
    assert.deepEqual(Object.keys(ctx.AvdOpsEngine).sort(), ['core', name].sort(), f);
    assert.equal(typeof ctx.AvdOpsEngine[name], 'object', f);
    assert.equal(typeof load(f), 'object', `${f} in Node`);
  }
});
