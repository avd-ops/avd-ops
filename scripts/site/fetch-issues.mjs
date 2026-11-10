// Fetches the public issues snapshot (site/data/issues.json) across repos.json (docs/roadmap-spec.md section 5.1).
// If the API request fails or --offline is passed, keeps the committed snapshot so offline builds and CI
// never fail on network hiccups.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const OUT = join(root, 'site/data/issues.json');

export function normalizeApiIssue(repoName, raw, events = []) {
  const labelEvents = new Map();
  let lastTitleChange = null;
  let closingPr = null;
  for (const ev of events) {
    if (ev.event === 'labeled' && ev.label?.name) {
      labelEvents.set(ev.label.name, {
        name: ev.label.name,
        by: ev.actor?.login || null,
        at: ev.created_at || null,
      });
    } else if (ev.event === 'renamed' && ev.created_at) {
      if (!lastTitleChange || ev.created_at > lastTitleChange) lastTitleChange = ev.created_at;
    } else if (ev.event === 'closed' && ev.commit_url) {
      closingPr = ev.commit_url;
    }
  }
  const labels = (raw.labels || []).map((l) => {
    const name = typeof l === 'string' ? l : l.name;
    return labelEvents.get(name) || { name, by: null, at: null };
  });
  return {
    repo: repoName,
    number: raw.number,
    url: raw.html_url || `https://github.com/avd-ops/${repoName}/issues/${raw.number}`,
    title: raw.title || '',
    state: raw.state || 'open',
    stateReason: raw.state_reason || null,
    private: Boolean(raw.repository?.private),
    updatedAt: (raw.updated_at || '').slice(0, 10) || null,
    closedAt: raw.closed_at ? raw.closed_at.slice(0, 10) : null,
    lastTitleChange,
    closingPr,
    requester: raw.user?.login || null,
    labels,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  if (process.argv.includes('--offline') && existsSync(OUT)) {
    const snap = JSON.parse(readFileSync(OUT, 'utf8'));
    console.log(`using committed site/data/issues.json (${snap.issues.length} issues, as of ${snap.fetchedAt})`);
    process.exit(0);
  }
  const { repos } = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const headers = { 'User-Agent': 'avd-ops-site-build', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const issues = [];
    for (const r of repos) {
      const res = await fetch(`https://api.github.com/repos/${r.repo}/issues?state=all&labels=accepted&per_page=100`, { headers });
      if (!res.ok) throw new Error(`${r.repo}: HTTP ${res.status}`);
      const list = await res.json();
      for (const raw of list) {
        if (raw.pull_request) continue;
        const evRes = await fetch(`https://api.github.com/repos/${r.repo}/issues/${raw.number}/events?per_page=100`, { headers });
        const events = evRes.ok ? await evRes.json() : [];
        issues.push(normalizeApiIssue(r.name, raw, events));
      }
    }
    const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { issues: [] };
    const merged = issues.length ? issues : existing.issues;
    const out = {
      schema: 'avd-ops-issues/v1',
      fetchedAt: new Date().toISOString().slice(0, 10),
      issues: merged,
    };
    writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
    console.log(`wrote site/data/issues.json (${out.issues.length} issues)`);
  } catch (err) {
    if (existsSync(OUT)) {
      const snap = JSON.parse(readFileSync(OUT, 'utf8'));
      console.log(`fetch failed (${err.message}); keeping committed site/data/issues.json (as of ${snap.fetchedAt})`);
      process.exit(0);
    }
    throw err;
  }
}
