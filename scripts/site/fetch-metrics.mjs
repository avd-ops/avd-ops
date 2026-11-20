// Fetches 30-day repository activity, CI status, and release counts across repos.json
// and writes site/data/metrics.json for the avd-ops.dev/metrics.html leaderboard.
// If an API request fails or --offline is passed, keeps the committed snapshot so offline
// builds and CI never fail on network hiccups.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/fetch-metrics.mjs            # fetch from api.github.com and write site/data/metrics.json
//   node scripts/site/fetch-metrics.mjs --offline  # keep committed site/data/metrics.json
import { readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const OUT = join(root, 'site/data/metrics.json');
const WINDOW_DAYS = 30;

export function computeRepoScore({ mergedPrs30d = 0, commits30d = 0, releasesCount = 0, ciConclusion = 'unknown' }) {
  const prPoints = mergedPrs30d * 10;
  const commitPoints = commits30d * 2;
  const releasePoints = releasesCount * 25;
  const ciPoints = ciConclusion === 'success' ? 50 : 0;
  return prPoints + commitPoints + releasePoints + ciPoints;
}

export function computeBadges({ maturity, mergedPrs30d = 0, releasesCount = 0, ciConclusion = 'unknown', openIssues = 0 }) {
  const badges = [];
  if (maturity === 'proven') badges.push('Proven');
  if (ciConclusion === 'success') badges.push('Green CI');
  if (releasesCount >= 1) badges.push('Shipped');
  if (mergedPrs30d >= 5) badges.push('High Velocity');
  if (openIssues === 0) badges.push('Zero Backlog');
  return badges;
}

export function summarizeMetrics(repoEntries, fetchedAt) {
  const ranked = [...repoEntries]
    .sort((a, b) => b.score - a.score || b.mergedPrs30d - a.mergedPrs30d || b.commits30d - a.commits30d || a.name.localeCompare(b.name))
    .map((r, idx) => ({ ...r, rank: idx + 1 }));

  const layerMap = new Map();
  for (const r of ranked) {
    if (!layerMap.has(r.layer)) {
      layerMap.set(r.layer, { layer: r.layer, repoCount: 0, score: 0, mergedPrs30d: 0, commits30d: 0, releasesCount: 0 });
    }
    const l = layerMap.get(r.layer);
    l.repoCount += 1;
    l.score += r.score;
    l.mergedPrs30d += r.mergedPrs30d;
    l.commits30d += r.commits30d;
    l.releasesCount += r.releasesCount;
  }

  const layers = [...layerMap.values()]
    .sort((a, b) => b.score - a.score || a.layer.localeCompare(b.layer))
    .map((l, idx) => ({ ...l, rank: idx + 1 }));

  const greenCiCount = ranked.filter((r) => r.ciConclusion === 'success').length;
  const active7dCount = ranked.filter((r) => r.mergedPrs7d > 0 || r.commits7d > 0).length;

  return {
    schema: 'avd-ops-metrics/v1',
    fetchedAt,
    windowDays: WINDOW_DAYS,
    totals: {
      repos: ranked.length,
      totalScore: ranked.reduce((s, r) => s + r.score, 0),
      mergedPrs30d: ranked.reduce((s, r) => s + r.mergedPrs30d, 0),
      commits30d: ranked.reduce((s, r) => s + r.commits30d, 0),
      releasesCount: ranked.reduce((s, r) => s + r.releasesCount, 0),
      greenCiCount,
      greenCiPct: ranked.length ? Math.round((greenCiCount / ranked.length) * 100) : 0,
      active7dCount,
    },
    layers,
    repos: ranked,
  };
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  if (process.argv.includes('--offline') && existsSync(OUT)) {
    const snap = JSON.parse(readFileSync(OUT, 'utf8'));
    console.log(`using committed site/data/metrics.json (${snap.repos.length} repos, as of ${snap.fetchedAt})`);
    process.exit(0);
  }

  const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const repos = reposDoc.repos || [];
  const headers = { 'User-Agent': 'avd-ops-site-build', Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const now = new Date();
  const since30d = new Date(now.getTime() - WINDOW_DAYS * 86400 * 1000).toISOString();
  const since7d = new Date(now.getTime() - 7 * 86400 * 1000).toISOString();

  try {
    const entries = [];
    for (const r of repos) {
      const branch = r.branch || 'main';
      const [meta, pulls, commits, releases, runs] = await Promise.all([
        fetchJson(`https://api.github.com/repos/${r.repo}`, headers),
        fetchJson(`https://api.github.com/repos/${r.repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100`, headers),
        fetchJson(`https://api.github.com/repos/${r.repo}/commits?sha=${encodeURIComponent(branch)}&since=${encodeURIComponent(since30d)}&per_page=100`, headers),
        fetchJson(`https://api.github.com/repos/${r.repo}/releases?per_page=30`, headers),
        fetchJson(`https://api.github.com/repos/${r.repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=5`, headers),
      ]);

      const merged30 = pulls.filter((p) => p.merged_at && p.merged_at >= since30d);
      const merged7 = merged30.filter((p) => p.merged_at >= since7d);
      const commits30d = Array.isArray(commits) ? commits.length : 0;
      const commits7d = Array.isArray(commits)
        ? commits.filter((c) => (c.commit?.author?.date || c.commit?.committer?.date || '') >= since7d).length
        : 0;
      const publishedReleases = Array.isArray(releases) ? releases.filter((rel) => !rel.draft) : [];
      const latestRelease = publishedReleases[0]?.tag_name || null;

      const latestCompletedRun = (runs.workflow_runs || []).find((w) => w.status === 'completed');
      const ciConclusion = latestCompletedRun?.conclusion || 'unknown';
      const openIssues = Number(meta.open_issues_count || 0);
      const stars = Number(meta.stargazers_count || 0);
      const pushedAt = (meta.pushed_at || '').slice(0, 10) || null;

      const metrics = {
        name: r.name,
        repo: r.repo,
        layer: r.layer,
        maturity: r.maturity,
        stars,
        openIssues,
        pushedAt,
        mergedPrs30d: merged30.length,
        mergedPrs7d: merged7.length,
        commits30d,
        commits7d,
        releasesCount: publishedReleases.length,
        latestRelease,
        ciConclusion,
      };
      metrics.score = computeRepoScore(metrics);
      metrics.badges = computeBadges(metrics);
      entries.push(metrics);
    }

    const out = summarizeMetrics(entries, now.toISOString().slice(0, 10));
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
    console.log(`wrote site/data/metrics.json (${out.repos.length} repos, total XP ${out.totals.totalScore})`);
  } catch (err) {
    if (!existsSync(OUT)) throw err;
    console.warn(`fetch-metrics: ${err.message}; keeping committed site/data/metrics.json`);
  }
}
