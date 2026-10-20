// The family check: every public AVD repo in repos.json presents as part of avd-ops and names no
// project outside the family it shouldn't (decision 0002). Reads each repo's default branch with an
// anonymous shallow clone, so it needs no token. Run by .github/workflows/family.yml weekly and by hand.
// Personal project, not for production, as is; not affiliated with the author's employer, Liquidware or Microsoft.
//
//   node scripts/family-check.mjs              # clone each repo into a temp folder and check it
//   node scripts/family-check.mjs --dir DIR    # check clones already in DIR/<name>
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const family = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
const at = process.argv.indexOf('--dir');
const dir = at > 0 ? process.argv[at + 1] : mkdtempSync(join(tmpdir(), 'avd-family-'));
const banned = new RegExp(`(?<![\\w-])(${family.banned.map((b) => b.replace(/[-]/g, '\\-')).join('|')})(?![\\w-])`, 'i');

const problems = [];
for (const r of family.repos) {
  const path = r.name === 'avd-ops' ? root : join(dir, r.name);
  if (!existsSync(join(path, '.git'))) {
    execFileSync('git', ['clone', '-q', '--depth', '1', '--branch', r.branch, `https://github.com/${r.repo}.git`, path]);
  }
  const readme = readFileSync(join(path, 'README.md'), 'utf8').split('\n');
  const h1 = readme.findIndex((l) => l.startsWith('# '));
  const next = readme.slice(h1 + 1).find((l) => l.trim());
  if (r.name !== 'avd-ops' && next?.trim() !== family.brand_line) problems.push(`${r.name}: README.md: the line under the title isn't the avd-ops brand line`);
  const files = execFileSync('git', ['-C', path, 'ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)
    .filter((f) => !(r.generated || []).some((g) => f.startsWith(g)));
  for (const f of files) {
    let text;
    try { text = readFileSync(join(path, f), 'utf8'); } catch { continue; }
    if (text.includes('\u0000')) continue;
    text.split('\n').forEach((line, i) => {
      if (banned.test(line)) problems.push(`${r.name}: ${f}:${i + 1}: names ${line.match(banned)[1]}`);
    });
  }
}
for (const p of problems) console.log(`::error::${p}`);
console.log(problems.length ? `${problems.length} problem(s) in the family` : `all ${family.repos.length} repos present as avd-ops`);
process.exit(problems.length ? 1 : 0);
