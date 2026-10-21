/* avd-ops checklist core: pure functions behind checklist.html. They take what GitHub's public REST API returned
   and the checklist data (checklist.json) and return what each line shows. No DOM, no network, no storage, so
   tests/checklist.test.mjs runs them offline.
   Personal project, not for production, as is; not affiliated with the author's employer or Microsoft. */

export const API = 'https://api.github.com';

// Unauthenticated callers get 60 requests an hour per network. A full check costs one request per open pull
// request plus two per repo; pull requests already merged or closed are never asked about again.
export const RATE_LIMIT = 60;
// The page checks by itself on load only when its last check is older than this, so reloading costs nothing.
export const STALE_MS = 10 * 60 * 1000;
// A person can ask for a new check at most this often.
export const MIN_GAP_MS = 2 * 60 * 1000;

// The rule types a default-branch ruleset must carry: no deletion, no force push, a pull request.
export const REQUIRED_RULES = ['deletion', 'non_fast_forward', 'pull_request'];

export const prKey = (repo, number) => `${repo}#${number}`;
// Where a setting's answer is cached: rules:<repo> or pvr:<repo>.
export const settingKey = (kind, repo) => `${kind === 'ruleset' ? 'rules' : 'pvr'}:${repo}`;

// Every pull request a checklist names, once, in the order it first appears.
export function listPrs(data) {
  const seen = new Set();
  const out = [];
  for (const s of data.sections) {
    for (const item of s.items) {
      for (const p of item.prs || []) {
        const k = prKey(p.repo, p.number);
        if (!seen.has(k)) { seen.add(k); out.push({ repo: p.repo, number: p.number }); }
      }
    }
  }
  return out;
}

// Repos a setting line checks, with their default branch from data.repos.
export function settingRepos(data, item) {
  return (item.repos || []).map((name) => {
    const r = data.repos.find((x) => x.name === name);
    if (!r) throw new Error(`${item.id}: ${name} is not in repos`);
    return r;
  });
}

// One pull request's state from GET /repos/{owner}/{repo}/pulls/{n}. GitHub works out mergeable_state lazily,
// so the first read after a push often says "unknown"; that is "checking", never "ready".
export function prStatus(pr) {
  if (!pr) return { state: 'unchecked', word: 'Not checked yet', done: false };
  if (pr.merged || pr.merged_at) return { state: 'merged', word: 'Merged', done: true };
  if (pr.state === 'closed') return { state: 'closed', word: 'Closed without merging', done: true };
  if (pr.draft) return { state: 'draft', word: 'Draft', done: false };
  switch (pr.mergeable_state) {
    case 'clean':
    case 'has_hooks': return { state: 'ready', word: 'Ready to merge', done: false };
    case 'unstable': return { state: 'checks', word: 'Checks failing or still running', done: false };
    case 'dirty': return { state: 'conflict', word: 'Merge conflict: needs a rebase', done: false };
    case 'blocked': return { state: 'blocked', word: 'Blocked by a rule or a review', done: false };
    case 'behind': return { state: 'behind', word: 'Behind its base branch', done: false };
    default: return { state: 'checking', word: 'GitHub is still checking; look again in a minute', done: false };
  }
}

// A line of one or more pull requests (a pair changes together): done only when every one is merged; a pull
// request closed without merging keeps the line open until checklist.json drops it. Its word is the least ready
// member's, so a pair reads "Ready" only when both halves are; head is the short word for the line's pill.
const ORDER = ['conflict', 'blocked', 'closed', 'behind', 'checks', 'draft', 'checking', 'unchecked', 'ready', 'merged'];
const head = (state) => (state === 'ready' ? 'Ready to merge' : state === 'unchecked' ? 'Not checked yet' : state === 'closed' ? 'Closed, not merged' : 'Not ready yet');
export function itemPrStatus(item, prs) {
  const each = (item.prs || []).map((p) => ({ ...p, status: prStatus(prs[prKey(p.repo, p.number)]) }));
  const worst = each.reduce((a, b) => (ORDER.indexOf(b.status.state) < ORDER.indexOf(a.status.state) ? b : a), each[0]);
  const done = each.length > 0 && each.every((p) => p.status.state === 'merged');
  if (done) return { state: 'done', word: 'Merged', head: 'Merged', done, each };
  const st = worst.status.state;
  if (each.length > 1 && st !== 'ready') return { state: st, word: `${worst.repo} #${worst.number}: ${worst.status.word}`, head: head(st), done, each };
  return { state: st, word: worst.status.word, head: head(st), done, each };
}

// GET /repos/{owner}/{repo}/rules/branches/{branch} lists the rules in force on that branch.
export function rulesetStatus(rules) {
  if (!Array.isArray(rules)) return { state: 'unchecked', word: 'Not checked yet', done: false, missing: REQUIRED_RULES };
  const have = new Set(rules.map((r) => r.type));
  const missing = REQUIRED_RULES.filter((t) => !have.has(t));
  return missing.length
    ? { state: 'off', word: `Missing: ${missing.map(ruleWord).join(', ')}`, done: false, missing }
    : { state: 'on', word: 'On', done: true, missing };
}
const ruleWord = (t) => ({ deletion: 'restrict deletions', non_fast_forward: 'block force pushes', pull_request: 'require a pull request' })[t] || t;

// GET /repos/{owner}/{repo}/private-vulnerability-reporting returns {enabled}.
export function pvrStatus(body) {
  if (!body || typeof body.enabled !== 'boolean') return { state: 'unchecked', word: 'Not checked yet', done: false };
  return body.enabled ? { state: 'on', word: 'On', done: true } : { state: 'off', word: 'Off', done: false };
}

// A setting line across several repos: done when every repo is.
export function itemSettingStatus(item, perRepo) {
  const each = item.repos.map((name) => ({ name, status: perRepo[name] || { state: 'unchecked', word: 'Not checked yet', done: false } }));
  const off = each.filter((e) => !e.status.done);
  if (!off.length) return { state: 'done', word: 'On in every repo', done: true, each };
  if (off.every((e) => e.status.state === 'unchecked')) return { state: 'unchecked', word: 'Not checked yet', done: false, each };
  return { state: 'off', word: `${each.length - off.length} of ${each.length} repos`, done: false, each };
}

// The requests a full check would make, the ones answered longest ago first, so when GitHub's limit cuts a check
// short the next one picks up where it stopped. Merged pull requests are skipped, since they can't change back;
// a closed one can be reopened, so it is still asked about.
export function planRequests(data, cache) {
  const out = [];
  for (const s of data.sections) {
    for (const item of s.items) {
      if (item.kind === 'ruleset') for (const r of settingRepos(data, item)) out.push({ key: settingKey('ruleset', r.name), path: `/repos/${data.owner}/${r.name}/rules/branches/${encodeURIComponent(r.branch)}` });
      if (item.kind === 'pvr') for (const r of settingRepos(data, item)) out.push({ key: settingKey('pvr', r.name), path: `/repos/${data.owner}/${r.name}/private-vulnerability-reporting` });
    }
  }
  for (const p of listPrs(data)) {
    const k = prKey(p.repo, p.number);
    if (prStatus(cache.prs?.[k]).state === 'merged') continue;
    out.push({ key: `pr:${k}`, path: `/repos/${data.owner}/${p.repo}/pulls/${p.number}` });
  }
  const seen = new Set();
  const asked = cache.asked || {};
  return out.filter((r) => (seen.has(r.key) ? false : seen.add(r.key)))
    .map((r, i) => ({ r, i, t: asked[r.key] || 0 }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((x) => x.r);
}

// How many of the planned requests to send now, from the rate limit GitHub last reported. Keeps a small reserve
// so a person opening a PR link right after still gets through.
export function budget(planned, rate, now) {
  const reserve = 3;
  if (!rate || typeof rate.remaining !== 'number') return { send: Math.min(planned, RATE_LIMIT - reserve), waitUntil: null };
  if (rate.reset && now >= rate.reset * 1000) return { send: Math.min(planned, RATE_LIMIT - reserve), waitUntil: null };
  const send = Math.max(0, Math.min(planned, rate.remaining - reserve));
  return { send, waitUntil: send < planned && rate.reset ? rate.reset * 1000 : null };
}

// The rate GitHub last reported, or null once its window has reset and the number no longer holds.
export const currentRate = (rate, now) => (rate && typeof rate.remaining === 'number' && rate.reset && now < rate.reset * 1000 ? rate : null);
// Reads the rate-limit headers; a missing header is unknown, never zero.
export function readRate(get) {
  const r = get('x-ratelimit-remaining'); const t = get('x-ratelimit-reset');
  if (r === null || t === null || r === '' || t === '') return null;
  const remaining = Number(r); const reset = Number(t);
  return Number.isFinite(remaining) && Number.isFinite(reset) ? { remaining, reset } : null;
}

// Should the page check by itself on load?
export const shouldAutoCheck = (cache, now) => !cache.checkedAt || now - cache.checkedAt > STALE_MS;
// When the Check now button may be used again.
export const nextCheckAt = (cache) => (cache.checkedAt ? cache.checkedAt + MIN_GAP_MS : 0);

// Folds one response into the cache. A failed request keeps the last good value; either way the key counts as
// asked at `now`, so the next check starts with the others.
export function applyResult(cache, key, ok, body, now = 0) {
  const next = { prs: { ...(cache.prs || {}) }, settings: { ...(cache.settings || {}) }, asked: { ...(cache.asked || {}), [key]: now }, checkedAt: cache.checkedAt, rate: cache.rate };
  if (!ok) return next;
  if (key.startsWith('pr:')) {
    const b = body || {};
    next.prs[key.slice(3)] = { title: b.title, html_url: b.html_url, state: b.state, merged: b.merged, merged_at: b.merged_at, draft: b.draft, mergeable_state: b.mergeable_state };
  } else {
    next.settings[key] = key.startsWith('rules:') ? (Array.isArray(body) ? body.map((r) => ({ type: r.type })) : body) : body;
  }
  return next;
}

// Overall progress for the header: automatic lines from the cache, manual lines from the person's ticks.
export function progress(data, cache, ticks) {
  let done = 0; let total = 0;
  for (const s of data.sections) {
    if (s.counts === false) continue;
    for (const item of s.items) {
      total += 1;
      if (lineDone(data, item, cache, ticks)) done += 1;
    }
  }
  return { done, total };
}

export function lineDone(data, item, cache, ticks) {
  if (item.kind === 'manual') return !!ticks[item.id];
  if (item.kind === 'pr') return itemPrStatus(item, cache.prs || {}).done;
  return itemSettingStatus(item, settingsFor(data, item, cache)).done;
}

export function settingsFor(data, item, cache) {
  const out = {};
  for (const name of item.repos || []) {
    const v = (cache.settings || {})[settingKey(item.kind, name)];
    out[name] = item.kind === 'ruleset' ? rulesetStatus(v) : pvrStatus(v);
  }
  return out;
}

// Checks the data file's shape; tests and the page both call it, so a bad edit fails loudly instead of quietly.
export function validate(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['not an object'];
  if (!/^[\w-]+$/.test(data.owner || '')) errors.push('owner');
  if (!/^\d{4}-\d{2}-\d{2}/.test(data.updated || '')) errors.push('updated');
  const repoNames = new Set((data.repos || []).map((r) => r.name));
  const ids = new Set();
  for (const s of data.sections || []) {
    if (!s.id || !s.title || !Array.isArray(s.items)) { errors.push(`section ${s.id}`); continue; }
    for (const item of s.items) {
      if (!item.id || ids.has(item.id)) errors.push(`item id ${item.id}`);
      ids.add(item.id);
      if (!['pr', 'manual', 'ruleset', 'pvr'].includes(item.kind)) errors.push(`${item.id}: kind`);
      if (item.kind === 'pr') for (const p of item.prs || []) if (!repoNames.has(p.repo) || !Number.isInteger(p.number)) errors.push(`${item.id}: ${p.repo}#${p.number}`);
      if (item.kind === 'pr' && !(item.prs || []).length) errors.push(`${item.id}: no prs`);
      if ((item.kind === 'ruleset' || item.kind === 'pvr') && !(Array.isArray(item.repos) && item.repos.length && item.repos.every((r) => repoNames.has(r)))) errors.push(`${item.id}: repos`);
      if (item.kind === 'manual' && !item.text) errors.push(`${item.id}: text`);
      if (item.link && !/^https:\/\/github\.com\//.test(item.link)) errors.push(`${item.id}: link must be on github.com`);
    }
  }
  return errors;
}
