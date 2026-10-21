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
    case 'clean': return { state: 'ready', word: 'Ready to merge', done: false };
    case 'unstable': return { state: 'checks', word: 'Checks failing or still running', done: false };
    case 'dirty': return { state: 'conflict', word: 'Merge conflict: needs a rebase', done: false };
    case 'blocked': return { state: 'blocked', word: 'Blocked by a rule or a review', done: false };
    case 'behind': return { state: 'behind', word: 'Behind its base branch', done: false };
    default: return { state: 'checking', word: 'GitHub is still checking; look again in a minute', done: false };
  }
}

// A line of one or more pull requests (a pair changes together): done when every one is merged or closed. Its
// word is the least ready member's, so a pair reads "Ready" only when both halves are.
const ORDER = ['conflict', 'blocked', 'behind', 'checks', 'draft', 'checking', 'unchecked', 'ready', 'closed', 'merged'];
export function itemPrStatus(item, prs) {
  const each = (item.prs || []).map((p) => ({ ...p, status: prStatus(prs[prKey(p.repo, p.number)]) }));
  const worst = each.reduce((a, b) => (ORDER.indexOf(b.status.state) < ORDER.indexOf(a.status.state) ? b : a), each[0]);
  const done = each.length > 0 && each.every((p) => p.status.done);
  if (done) return { state: 'done', word: each.every((p) => p.status.state === 'merged') ? 'Merged' : 'Done', done, each };
  if (each.length > 1 && worst.status.state !== 'ready') return { state: worst.status.state, word: `${worst.repo} #${worst.number}: ${worst.status.word}`, done, each };
  return { state: worst.status.state, word: worst.status.word, done, each };
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

// The requests a full check would make, cheapest first: settings, then the open pull requests. Merged and closed
// pull requests already in the cache are skipped, since they can't change back.
export function planRequests(data, cache) {
  const out = [];
  for (const s of data.sections) {
    for (const item of s.items) {
      if (item.kind === 'ruleset') for (const r of settingRepos(data, item)) out.push({ key: `rules:${r.name}`, path: `/repos/${data.owner}/${r.name}/rules/branches/${encodeURIComponent(r.branch)}` });
      if (item.kind === 'pvr') for (const r of settingRepos(data, item)) out.push({ key: `pvr:${r.name}`, path: `/repos/${data.owner}/${r.name}/private-vulnerability-reporting` });
    }
  }
  for (const p of listPrs(data)) {
    const k = prKey(p.repo, p.number);
    if (prStatus(cache.prs?.[k]).done) continue;
    out.push({ key: `pr:${k}`, path: `/repos/${data.owner}/${p.repo}/pulls/${p.number}` });
  }
  const seen = new Set();
  return out.filter((r) => (seen.has(r.key) ? false : seen.add(r.key)));
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

// Should the page check by itself on load?
export const shouldAutoCheck = (cache, now) => !cache.checkedAt || now - cache.checkedAt > STALE_MS;
// When the Check now button may be used again.
export const nextCheckAt = (cache) => (cache.checkedAt ? cache.checkedAt + MIN_GAP_MS : 0);

// Folds one response into the cache. A failed request keeps the last good value.
export function applyResult(cache, key, ok, body) {
  const next = { prs: { ...(cache.prs || {}) }, settings: { ...(cache.settings || {}) }, checkedAt: cache.checkedAt, rate: cache.rate };
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
    const v = (cache.settings || {})[`${item.kind === 'ruleset' ? 'rules' : 'pvr'}:${name}`];
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
      if ((item.kind === 'ruleset' || item.kind === 'pvr') && !(item.repos || []).every((r) => repoNames.has(r))) errors.push(`${item.id}: repos`);
      if (item.kind === 'manual' && !item.text) errors.push(`${item.id}: text`);
      if (item.link && !/^https:\/\/github\.com\//.test(item.link)) errors.push(`${item.id}: link must be on github.com`);
    }
  }
  return errors;
}
