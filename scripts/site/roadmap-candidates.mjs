// Weekly read-only helper (docs/roadmap-spec.md section 7.1): reads site/data/issues.json and lists open
// public issues in repos.json repos, updated within the window, that carry no roadmap label and aren't bot
// reports. Labels nothing, opens nothing and comments on nothing.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
import { readFileSync, appendFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const BOT_LABELS = new Set(['kb-digest', 'kb-freshness', 'docs-findings', 'portal-report', 'pin-drift']);

export function findRoadmapCandidates(reposDoc, issuesDoc, { since = '2026-11-02' } = {}) {
  const publicRepos = new Set(reposDoc.repos.map((r) => r.name));
  return (issuesDoc.issues || [])
    .filter((iss) => {
      if (iss.private || !publicRepos.has(iss.repo) || iss.state !== 'open') return false;
      const names = (iss.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
      if (names.includes('roadmap') || names.some((n) => BOT_LABELS.has(n))) return false;
      return !since || (iss.updatedAt && iss.updatedAt >= since);
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || b.number - a.number);
}

export function formatCandidatesMarkdown(candidates) {
  if (!candidates.length) return '# Roadmap candidates\n\nNo new unlabelled candidates this week.\n';
  const rows = candidates.map((c) => `- [\`${c.repo}#${c.number}\`](${c.url}) — ${c.title} *(updated ${c.updatedAt})*`);
  return `# Roadmap candidates (${candidates.length})\n\n${rows.join('\n')}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const issuesDoc = JSON.parse(readFileSync(join(root, 'site/data/issues.json'), 'utf8'));
  const md = formatCandidatesMarkdown(findRoadmapCandidates(reposDoc, issuesDoc, { since: '' }));
  process.stdout.write(md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
