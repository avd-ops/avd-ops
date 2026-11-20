// Fetches published GitHub Releases across all public repos in repos.json and writes site/data/releases.json.
// If an API request fails or --offline is passed, keeps the committed snapshot so offline builds and CI
// never fail on network hiccups.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/fetch-releases.mjs            # fetch from api.github.com and write site/data/releases.json
//   node scripts/site/fetch-releases.mjs --offline  # keep committed site/data/releases.json
import { readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const OUT = join(root, 'site/data/releases.json');
const PARTNER_RE = /\b(liquidware|nerdio|login ?vsi|goliath)\b/gi;

export function sanitizeReleaseBody(text, banned = []) {
  let out = String(text || '').replace(/\r\n/g, '\n').trim();
  // Normalize the avd-assess disclaimer so the site keeps its no-partner rule.
  out = out.replace(/,\s*Liquidware\s+or\s+Microsoft\b/gi, ' or Microsoft');
  out = out.replace(PARTNER_RE, '[redacted]');
  out = out.replace(/\bAVD (?:repo )?family\b/gi, 'avd-ops repos');
  if (banned.length) {
    const re = new RegExp(`(?<![\\w-])(${banned.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`, 'gi');
    out = out.replace(re, '[redacted]');
  }
  return out;
}

export function normalizeApiRelease(repoEntry, raw, banned = []) {
  const tagName = raw.tag_name || '';
  const publishedAtRaw = raw.published_at || raw.created_at || '';
  const publishedAt = publishedAtRaw ? publishedAtRaw.slice(0, 10) : '';
  const assets = (raw.assets || [])
    .filter((a) => a && a.name && a.browser_download_url)
    .map((a) => ({
      name: a.name,
      size: Number(a.size || 0),
      downloadUrl: a.browser_download_url,
    }));

  return {
    repo: repoEntry.name,
    repoFull: repoEntry.repo,
    layer: repoEntry.layer,
    maturity: repoEntry.maturity,
    tagName,
    name: raw.name || tagName,
    prerelease: Boolean(raw.prerelease) || /-[0-9A-Za-z.-]+$/.test(tagName),
    publishedAt,
    publishedAtRaw,
    url: raw.html_url || `https://github.com/${repoEntry.repo}/releases/tag/${encodeURIComponent(tagName)}`,
    author: raw.author?.login || null,
    body: sanitizeReleaseBody(raw.body || '', banned),
    assets,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  if (process.argv.includes('--offline') && existsSync(OUT)) {
    const snap = JSON.parse(readFileSync(OUT, 'utf8'));
    console.log(`using committed site/data/releases.json (${snap.releases.length} releases, as of ${snap.fetchedAt})`);
    process.exit(0);
  }

  const reposDoc = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const repos = reposDoc.repos || [];
  const banned = reposDoc.banned || [];
  const headers = { 'User-Agent': 'avd-ops-site-build', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const releases = [];
    for (const r of repos) {
      const res = await fetch(`https://api.github.com/repos/${r.repo}/releases?per_page=30`, { headers });
      if (!res.ok) throw new Error(`${r.repo}: HTTP ${res.status}`);
      const list = await res.json();
      for (const raw of list) {
        if (raw.draft) continue;
        releases.push(normalizeApiRelease(r, raw, banned));
      }
    }
    releases.sort((a, b) => (b.publishedAtRaw || '').localeCompare(a.publishedAtRaw || '')
      || a.repo.localeCompare(b.repo)
      || b.tagName.localeCompare(a.tagName));

    const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { releases: [] };
    const merged = releases.length ? releases : existing.releases;
    const out = {
      schema: 'avd-ops-releases/v1',
      fetchedAt: new Date().toISOString().slice(0, 10),
      releases: merged,
    };
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
    console.log(`wrote site/data/releases.json (${out.releases.length} releases)`);
  } catch (err) {
    if (!existsSync(OUT)) throw err;
    console.warn(`fetch-releases: ${err.message}; keeping committed site/data/releases.json`);
  }
}
