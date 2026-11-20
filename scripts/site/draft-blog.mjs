// Collects public updates (releases, merged PRs, closed findings/issues, and new decisions)
// across all repos in repos.json and drafts a weekly (or single-day) Markdown post in docs/blog/.
// Intended for .github/workflows/blog-digest.yml to open a reviewable PR before publishing.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/draft-blog.mjs                                    # weekly digest (last 7 days ending yesterday UTC)
//   node scripts/site/draft-blog.mjs --since 2026-11-13 --until 2026-11-19
//   node scripts/site/draft-blog.mjs --date 2026-11-20                  # single-day digest
//   node scripts/site/draft-blog.mjs --dry-run                          # print Markdown to stdout without writing
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const BLOG_DIR = join(root, 'docs/blog');
const DECISIONS_DIR = join(root, 'docs/knowledge/decisions');
const PARTNER_RE = /\b(liquidware|nerdio|login ?vsi|goliath)\b/gi;
const BOT_LOGINS = new Set(['dependabot[bot]', 'github-actions[bot]', 'renovate[bot]']);

export function defaultDate(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return d.toISOString().slice(0, 10);
}

export function defaultWeekRange(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function sanitizeText(text, banned = []) {
  let out = String(text || '').replace(/\r?\n+/g, ' ').trim();
  out = out.replace(PARTNER_RE, '[redacted]');
  out = out.replace(/\bAVD (?:repo )?family\b/gi, 'avd-ops repos');
  if (banned.length) {
    const re = new RegExp(`(?<![\\w-])(${banned.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`, 'gi');
    out = out.replace(re, '[redacted]');
  }
  return out;
}

export function isBotOrNoisePr(pr) {
  const login = pr.user?.login || '';
  if (BOT_LOGINS.has(login)) return true;
  const title = (pr.title || '').toLowerCase();
  if (/^(chore\(deps\)|build\(deps\)|bump |chore: sync\b|blog: (?:daily|weekly) digest\b)/.test(title)) return true;
  if ((pr.head?.ref || '').startsWith('blog/')) return true;
  return false;
}

export function classifyPr(pr) {
  const title = (pr.title || '').toLowerCase();
  const labels = (pr.labels || []).map((l) => (typeof l === 'string' ? l : l.name || '').toLowerCase());
  if (labels.some((l) => l.includes('finding') || l.includes('research') || l.includes('decision'))) return 'findings';
  if (labels.some((l) => l === 'bug' || l === 'fix' || l === 'security') || /^(fix|sec|security|hotfix)(\(|:|\b)/.test(title)) return 'fixes';
  return 'features';
}

export function collectLocalDecisions(startDate, endDate = startDate, decisionsDir = DECISIONS_DIR) {
  if (!existsSync(decisionsDir)) return [];
  const items = [];
  for (const file of readdirSync(decisionsDir).sort()) {
    if (!/^\d{4}-[\w-]+\.md$/.test(file)) continue;
    const raw = readFileSync(join(decisionsDir, file), 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    const dateMatch = fm[1].match(/^date:\s*"?(\d{4}-\d{2}-\d{2})"?/m);
    if (!dateMatch || dateMatch[1] < startDate || dateMatch[1] > endDate) continue;
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

export function formatDigestMarkdown({ date, start, end, items, banned = [] }) {
  const rangeStart = start || date;
  const rangeEnd = end || date;
  const isWeekly = rangeStart !== rangeEnd;
  const label = isWeekly ? `${rangeStart} to ${rangeEnd}` : rangeEnd;

  const clean = (s) => sanitizeText(s, banned);
  const groups = {
    releases: items.filter((i) => i.kind === 'releases'),
    features: items.filter((i) => i.kind === 'features'),
    findings: items.filter((i) => i.kind === 'findings'),
    fixes: items.filter((i) => i.kind === 'fixes'),
  };

  const repos = [...new Set(items.map((i) => i.repo))].sort();
  const tags = isWeekly ? ['weekly-digest'] : [];
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

  const prefix = isWeekly ? `Weekly digest (${label})` : `Daily digest for ${label}`;
  const titleText = isWeekly ? `Weekly digest: ${label}` : `Daily update: ${label}`;
  const summary = clean(`${prefix}: ${counts.join(', ')} across ${repos.join(', ')}.`);
  const intro = isWeekly
    ? `Summary of public updates merged, released, or recorded across the **avd-ops** repositories for **${label}**.`
    : `Summary of public updates merged, released, or recorded across the **avd-ops** repositories on **${label}**.`;

  const lines = [
    '---',
    `title: ${JSON.stringify(titleText)}`,
    `date: ${JSON.stringify(rangeEnd)}`,
    `summary: ${JSON.stringify(summary)}`,
    `repos: [${repos.map((r) => JSON.stringify(r)).join(', ')}]`,
    `tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`,
    '---',
    '',
    intro,
    '',
  ];

  const renderSection = (heading, list) => {
    if (!list.length) return;
    lines.push(`## ${heading}`, '');
    const sorted = [...list].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || a.repo.localeCompare(b.repo));
    for (const item of sorted) {
      const title = clean(item.title);
      const note = item.note ? ` (${clean(item.note)})` : '';
      const datePrefix = isWeekly && item.date ? ` (${item.date})` : '';
      lines.push(`- **\`${item.repo}\`**${datePrefix}: [${title}](${item.url})${note}`);
    }
    lines.push('');
  };

  renderSection('Releases', groups.releases);
  renderSection('Features and updates', groups.features);
  renderSection('Findings and decisions', groups.findings);
  renderSection('Fixes and hardening', groups.fixes);

  return `${lines.join('\n').trimEnd()}\n`;
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function fetchPages(baseUrl, headers, maxPages = 3) {
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = baseUrl.includes('?') ? '&' : '?';
    const batch = await fetchJson(`${baseUrl}${sep}per_page=100&page=${page}`, headers);
    if (!Array.isArray(batch) || !batch.length) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

export async function collectRangeUpdates({ start, end, repos, headers }) {
  const items = [];
  for (const r of repos) {
    const releases = await fetchJson(`https://api.github.com/repos/${r.repo}/releases?per_page=30`, headers);
    for (const rel of releases) {
      if (rel.draft) continue;
      const pub = (rel.published_at || '').slice(0, 10);
      if (pub >= start && pub <= end) {
        items.push({
          date: pub,
          repo: r.name,
          kind: 'releases',
          title: `${rel.tag_name}${rel.name && rel.name !== rel.tag_name ? ` — ${rel.name}` : ''}`,
          url: rel.html_url,
          note: rel.prerelease ? 'pre-release' : 'release',
        });
      }
    }

    const pulls = await fetchPages(
      `https://api.github.com/repos/${r.repo}/pulls?state=closed&sort=updated&direction=desc`,
      headers,
    );
    for (const pr of pulls) {
      if (!pr.merged_at) continue;
      const d = pr.merged_at.slice(0, 10);
      if (d < start || d > end) continue;
      if (isBotOrNoisePr(pr)) continue;
      items.push({
        date: d,
        repo: r.name,
        kind: classifyPr(pr),
        title: `${pr.title} (#${pr.number})`,
        url: pr.html_url,
        note: 'merged PR',
      });
    }

    const issues = await fetchPages(
      `https://api.github.com/repos/${r.repo}/issues?state=closed&since=${start}T00:00:00Z`,
      headers,
    );
    for (const iss of issues) {
      if (iss.pull_request) continue;
      const d = (iss.closed_at || '').slice(0, 10);
      if (d < start || d > end) continue;
      if (iss.state_reason === 'not_planned') continue;
      const labels = (iss.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
      const isInteresting = labels.some((l) => ['accepted', 'research-request', 'type:research-request', 'finding'].includes(l));
      if (!isInteresting) continue;
      items.push({
        date: d,
        repo: r.name,
        kind: 'findings',
        title: `${iss.title} (#${iss.number})`,
        url: iss.html_url,
        note: labels.includes('research-request') || labels.includes('type:research-request') ? 'research' : 'closed issue',
      });
    }
  }
  return items;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const argVal = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };
  const singleDate = argVal('--date');
  const range = defaultWeekRange();
  const start = singleDate || argVal('--since') || range.start;
  const end = singleDate || argVal('--until') || range.end;
  for (const d of [start, end]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      console.error(`invalid date "${d}"; expected YYYY-MM-DD`);
      process.exit(1);
    }
  }
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const headers = { 'User-Agent': 'avd-ops-blog-digest', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const remoteItems = await collectRangeUpdates({ start, end, repos: reposDoc.repos, headers });
  const localDecisions = collectLocalDecisions(start, end);
  const items = [...remoteItems, ...localDecisions];

  if (!items.length) {
    console.log(`No notable updates for ${start}..${end}; skipping draft.`);
    process.exit(0);
  }

  const md = formatDigestMarkdown({ start, end, items, banned: reposDoc.banned || [] });
  if (dryRun) {
    process.stdout.write(md);
    process.exit(0);
  }

  mkdirSync(BLOG_DIR, { recursive: true });
  const filename = start === end ? `${end}-daily-update.md` : `${end}-weekly-digest.md`;
  const outPath = join(BLOG_DIR, filename);
  if (existsSync(outPath) && !force) {
    console.log(`${outPath} already exists; pass --force to overwrite.`);
    process.exit(0);
  }
  writeFileSync(outPath, md);
  console.log(`wrote docs/blog/${filename} (${items.length} items)`);
}
