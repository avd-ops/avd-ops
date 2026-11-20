// One-time historical backfill: crawls public releases, merged PRs, closed accepted issues,
// and local decision records across all repos in repos.json prior to 2026-11-20, grouped into
// weekly digests in docs/blog/YYYY-MM-DD-weekly-digest.md.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/backfill-blog.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isBotOrNoisePr, classifyPr, sanitizeText } from './draft-blog.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const BLOG_DIR = join(root, 'docs/blog');
const DECISIONS_DIR = join(root, 'docs/knowledge/decisions');
const CUTOFF = '2026-11-20';

function getWeekRange(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0=Sun..6=Sat
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(dt);
  mon.setUTCDate(dt.getUTCDate() + diffToMon);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  const start = mon.toISOString().slice(0, 10);
  let end = sun.toISOString().slice(0, 10);
  if (end >= CUTOFF) end = '2026-11-19';
  return { start, end };
}

async function fetchAllPages(baseUrl, headers) {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const sep = baseUrl.includes('?') ? '&' : '?';
    const res = await fetch(`${baseUrl}${sep}per_page=100&page=${page}`, { headers });
    if (!res.ok) throw new Error(`${baseUrl} (page ${page}): HTTP ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || !batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

function collectAllLocalDecisions() {
  if (!existsSync(DECISIONS_DIR)) return [];
  const items = [];
  for (const file of readdirSync(DECISIONS_DIR).sort()) {
    if (!/^\d{4}-[\w-]+\.md$/.test(file)) continue;
    const raw = readFileSync(join(DECISIONS_DIR, file), 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    const dateMatch = fm[1].match(/^date:\s*"?(\d{4}-\d{2}-\d{2})"?/m);
    if (!dateMatch || dateMatch[1] >= CUTOFF) continue;
    const h1 = (raw.match(/^# (.+)$/m) || [, file.replace(/\.md$/, '')])[1];
    items.push({
      date: dateMatch[1],
      repo: 'avd-ops',
      kind: 'findings',
      title: h1,
      url: `https://github.com/avd-ops/avd-ops/blob/main/docs/knowledge/decisions/${file}`,
      note: 'Decision record',
    });
  }
  return items;
}

function formatWeeklyMarkdown({ start, end, items, banned }) {
  const clean = (s) => sanitizeText(s, banned);
  const groups = {
    releases: items.filter((i) => i.kind === 'releases'),
    features: items.filter((i) => i.kind === 'features'),
    findings: items.filter((i) => i.kind === 'findings'),
    fixes: items.filter((i) => i.kind === 'fixes'),
  };
  const repos = [...new Set(items.map((i) => i.repo))].sort();
  const tags = ['weekly-digest'];
  if (groups.releases.length) tags.push('release');
  if (groups.features.length) tags.push('features');
  if (groups.findings.length) tags.push('findings');
  if (groups.fixes.length) tags.push('fixes');

  const counts = [
    groups.releases.length && `${groups.releases.length} release${groups.releases.length === 1 ? '' : 's'}`,
    groups.features.length && `${groups.features.length} feature update${groups.features.length === 1 ? '' : 's'}`,
    groups.findings.length && `${groups.findings.length} finding${groups.findings.length === 1 ? '' : 's'}`,
    groups.fixes.length && `${groups.fixes.length} fix${groups.fixes.length === 1 ? '' : 'es'}`,
  ].filter(Boolean);

  const label = start === end ? start : `${start} to ${end}`;
  const summary = clean(`Weekly digest (${label}): ${counts.join(', ')} across ${repos.length} repo${repos.length === 1 ? '' : 's'}.`);
  const lines = [
    '---',
    `title: ${JSON.stringify(`Weekly digest: ${label}`)}`,
    `date: ${JSON.stringify(end)}`,
    `summary: ${JSON.stringify(summary)}`,
    `repos: [${repos.map((r) => JSON.stringify(r)).join(', ')}]`,
    `tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`,
    '---',
    '',
    `Summary of public updates merged, released, or recorded across the **avd-ops** repositories for **${label}**.`,
    '',
  ];

  const renderSection = (heading, list) => {
    if (!list.length) return;
    lines.push(`## ${heading}`, '');
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.repo.localeCompare(b.repo));
    for (const item of sorted) {
      const title = clean(item.title);
      const note = item.note ? ` (${clean(item.note)})` : '';
      lines.push(`- **\`${item.repo}\`** (${item.date}): [${title}](${item.url})${note}`);
    }
    lines.push('');
  };

  renderSection('Releases', groups.releases);
  renderSection('Features and updates', groups.features);
  renderSection('Findings and decisions', groups.findings);
  renderSection('Fixes and hardening', groups.fixes);

  return `${lines.join('\n').trimEnd()}\n`;
}

const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
const token = process.env.GITHUB_TOKEN || execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
const headers = {
  Authorization: `Bearer ${token}`,
  'User-Agent': 'avd-ops-blog-backfill',
  Accept: 'application/vnd.github+json',
};

const allItems = [...collectAllLocalDecisions()];

for (const r of reposDoc.repos) {
  const [releases, pulls, issues] = await Promise.all([
    fetchAllPages(`https://api.github.com/repos/${r.repo}/releases`, headers),
    fetchAllPages(`https://api.github.com/repos/${r.repo}/pulls?state=closed`, headers),
    fetchAllPages(`https://api.github.com/repos/${r.repo}/issues?state=closed`, headers),
  ]);

  for (const rel of releases) {
    if (rel.draft) continue;
    const date = (rel.published_at || '').slice(0, 10);
    if (!date || date >= CUTOFF) continue;
    allItems.push({
      date,
      repo: r.name,
      kind: 'releases',
      title: `${rel.tag_name}${rel.name && rel.name !== rel.tag_name ? ` — ${rel.name}` : ''}`,
      url: rel.html_url,
      note: rel.prerelease ? 'pre-release' : 'release',
    });
  }

  for (const pr of pulls) {
    if (!pr.merged_at) continue;
    const date = pr.merged_at.slice(0, 10);
    if (!date || date >= CUTOFF) continue;
    if (isBotOrNoisePr(pr)) continue;
    allItems.push({
      date,
      repo: r.name,
      kind: classifyPr(pr),
      title: `${pr.title} (#${pr.number})`,
      url: pr.html_url,
      note: 'merged PR',
    });
  }

  for (const iss of issues) {
    if (iss.pull_request) continue;
    const date = (iss.closed_at || '').slice(0, 10);
    if (!date || date >= CUTOFF) continue;
    if (iss.state_reason === 'not_planned') continue;
    const labels = (iss.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
    const isInteresting = labels.some((l) => ['accepted', 'research-request', 'type:research-request', 'finding'].includes(l));
    if (!isInteresting) continue;
    allItems.push({
      date,
      repo: r.name,
      kind: 'findings',
      title: `${iss.title} (#${iss.number})`,
      url: iss.html_url,
      note: labels.includes('research-request') || labels.includes('type:research-request') ? 'research' : 'closed issue',
    });
  }
  console.log(`crawled ${r.name}`);
}

const byWeek = new Map();
for (const item of allItems) {
  const { start, end } = getWeekRange(item.date);
  if (!byWeek.has(end)) byWeek.set(end, { start, end, items: [] });
  byWeek.get(end).items.push(item);
}

mkdirSync(BLOG_DIR, { recursive: true });
for (const [end, bucket] of [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const md = formatWeeklyMarkdown({ ...bucket, banned: reposDoc.banned || [] });
  writeFileSync(join(BLOG_DIR, `${end}-weekly-digest.md`), md);
}
console.log(`wrote ${byWeek.size} weekly digests (${allItems.length} total items)`);
