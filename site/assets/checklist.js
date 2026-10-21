/* avd-ops checklist page (checklist.html): reads checklist.json, asks GitHub's public API what each line's pull
   requests and settings look like, and ticks lines off by itself. The owner's own steps are checkboxes kept in
   this browser only. Nothing is sent anywhere but api.github.com, and no sign-in is used.
   Personal project, not for production, as is; not affiliated with the author's employer or Microsoft. */
import {
  API, validate, planRequests, budget, applyResult, shouldAutoCheck, nextCheckAt, itemPrStatus, itemSettingStatus,
  settingsFor, progress, lineDone, prKey,
} from './checklist-core.js';

const CACHE_KEY = 'avd-ops-checklist-cache';
const TICKS_KEY = 'avd-ops-checklist-ticks';
const $ = (sel) => document.querySelector(sel);

const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: the page still works, it just forgets */ } };

let data = null;
let cache = load(CACHE_KEY, { prs: {}, settings: {} });
let ticks = load(TICKS_KEY, {});
let busy = false;

const time = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
  }
  for (const kid of kids) if (kid != null) e.append(kid);
  return e;
};
const pill = (state, word) => el('span', { class: `cl-pill cl-${state}`, text: word });

function prLink(p) {
  const c = (cache.prs || {})[prKey(p.repo, p.number)];
  const href = c?.html_url || `https://github.com/${data.owner}/${p.repo}/pull/${p.number}`;
  return el('a', { href }, `${p.repo} #${p.number}`, c?.title ? el('span', { class: 'cl-title', text: ` ${c.title}` }) : null);
}

function line(item) {
  const done = lineDone(data, item, cache, ticks);
  const li = el('li', { class: `cl-line${done ? ' cl-done' : ''}`, id: `line-${item.id}` });
  if (item.kind === 'manual') {
    const box = el('input', { type: 'checkbox', id: `tick-${item.id}` });
    box.checked = !!ticks[item.id];
    box.addEventListener('change', () => { ticks = { ...ticks, [item.id]: box.checked }; save(TICKS_KEY, ticks); render(); });
    li.append(el('label', { class: 'cl-tick', for: `tick-${item.id}` }, box, el('span', { text: item.text })),
      el('div', { class: 'cl-meta' }, pill(box.checked ? 'done' : 'todo', box.checked ? 'Done (ticked in this browser)' : 'To do'),
        item.link ? el('a', { href: item.link, text: 'Open the setting' }) : null));
    return li;
  }
  if (item.kind === 'pr') {
    const s = itemPrStatus(item, cache.prs || {});
    const links = el('div', { class: 'cl-prs' });
    for (const p of s.each) links.append(el('div', { class: 'cl-pr' }, prLink(p), pill(p.status.state, p.status.word)));
    li.append(el('div', { class: 'cl-head' }, pill(s.done ? 'done' : s.state, s.done ? s.word : s.state === 'ready' ? 'Ready to merge' : s.state === 'unchecked' ? 'Not checked yet' : 'Not ready yet'), el('span', { text: item.note || '' })), links);
    return li;
  }
  const s = itemSettingStatus(item, settingsFor(data, item, cache));
  const chips = el('div', { class: 'chips cl-repos' });
  for (const e of s.each) chips.append(el('a', { class: `chip cl-${e.status.state}`, href: `https://github.com/${data.owner}/${e.name}/settings/${item.kind === 'ruleset' ? 'rules' : 'security_analysis'}`, title: e.status.word }, `${e.name}: ${e.status.word}`));
  li.append(el('div', { class: 'cl-head' }, pill(s.done ? 'done' : s.state, s.word), el('span', { text: item.text })), chips);
  if (item.link) li.append(el('a', { href: item.link, text: 'Open the setting' }));
  return li;
}

function render() {
  const root = $('#checklist');
  root.replaceChildren();
  for (const s of data.sections) {
    const sec = el('section', { class: 'cl-section', 'aria-labelledby': `h-${s.id}` }, el('h2', { id: `h-${s.id}`, text: s.title }));
    if (s.intro) sec.append(el('p', { text: s.intro }));
    const list = el('ol', { class: 'cl-list' });
    for (const item of s.items) list.append(line(item));
    sec.append(list);
    root.append(sec);
  }
  const p = progress(data, cache, ticks);
  $('#progress').textContent = `${p.done} of ${p.total} done`;
  const meter = $('#meter');
  meter.max = p.total; meter.value = p.done;
  status();
}

function status(extra) {
  const parts = [];
  parts.push(cache.checkedAt ? `Last checked ${time(cache.checkedAt)}.` : 'Not checked yet.');
  if (cache.rate && typeof cache.rate.remaining === 'number') parts.push(`GitHub allows ${cache.rate.remaining} more checks from your network until ${time(cache.rate.reset * 1000)}.`);
  if (extra) parts.push(extra);
  $('#checked').textContent = parts.join(' ');
  const wait = nextCheckAt(cache) - Date.now();
  const btn = $('#check');
  btn.disabled = busy || wait > 0;
  btn.textContent = busy ? 'Checking...' : wait > 0 ? `Check again at ${time(nextCheckAt(cache))}` : 'Check now';
}

async function check() {
  if (busy || !data) return;
  busy = true; status();
  const plan = planRequests(data, cache);
  const { send, waitUntil } = budget(plan.length, cache.rate, Date.now());
  let failed = 0; let ok = 0; let limited = false;
  for (const req of plan.slice(0, send)) {
    try {
      const res = await fetch(`${API}${req.path}`, { headers: { Accept: 'application/vnd.github+json' } });
      const remaining = Number(res.headers.get('x-ratelimit-remaining'));
      const reset = Number(res.headers.get('x-ratelimit-reset'));
      if (Number.isFinite(remaining) && reset) cache = { ...cache, rate: { remaining, reset } };
      if ((res.status === 403 || res.status === 429) && remaining === 0) { limited = true; break; }
      const body = res.ok ? await res.json() : null;
      if (res.ok) ok += 1; else failed += 1;
      cache = applyResult(cache, req.key, res.ok, body);
    } catch (e) {
      failed += 1;
    }
  }
  // Only a check that got answers counts as a check, so a refused one doesn't block the next try.
  if (ok) cache = { ...cache, checkedAt: Date.now() };
  save(CACHE_KEY, cache);
  busy = false;
  render();
  const skipped = plan.length - send;
  const notes = [];
  if (limited) notes.push(`GitHub's hourly limit for your network is used up${cache.rate?.reset ? `; try again after ${time(cache.rate.reset * 1000)}` : ''}.`);
  if (failed) notes.push(`${failed} ${failed === 1 ? 'request' : 'requests'} failed; those lines keep their last result.`);
  if (skipped > 0) notes.push(`${skipped} not checked to stay inside GitHub's limit${waitUntil ? `; the rest after ${time(waitUntil)}` : ''}.`);
  status(notes.join(' '));
}

async function start() {
  $('#check').addEventListener('click', check);
  $('#reset').addEventListener('click', () => { ticks = {}; save(TICKS_KEY, ticks); render(); });
  try {
    const res = await fetch('checklist.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`checklist.json: HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    $('#checklist').textContent = `The checklist couldn't load (${e.message}). Reload the page to try again.`;
    return;
  }
  const errors = validate(data);
  if (errors.length) { $('#checklist').textContent = `checklist.json has problems: ${errors.join('; ')}.`; return; }
  $('#updated').textContent = data.updated;
  render();
  if (shouldAutoCheck(cache, Date.now())) check();
  setInterval(status, 30 * 1000);
}

start();
