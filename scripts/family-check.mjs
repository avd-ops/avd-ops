// The family check: every public AVD repo in repos.json presents as part of avd-ops, carries the
// community research notice and ## How it connects interlinks, and names no project outside the
// family it shouldn't (decision 0002). Reads each repo's default branch with an anonymous shallow
// clone, so it needs no token. Run by .github/workflows/family.yml weekly and by hand.
// Community research project. Use at your own risk. No warranty.
//
//   node scripts/family-check.mjs              # clone each repo into a temp folder and check it
//   node scripts/family-check.mjs --dir DIR    # check clones already in DIR/<name>
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const family = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
const at = process.argv.indexOf('--dir');
const dir = at > 0 ? process.argv[at + 1] : mkdtempSync(join(tmpdir(), 'avd-family-'));
const banned = new RegExp(`(?<![\\w-])(${family.banned.map((b) => b.replace(/[-]/g, '\\-')).join('|')})(?![\\w-])`, 'i');
const noticePhrase = 'Community research project. Use at your own risk. No warranty.';

const problems = [];
for (const r of family.repos) {
  const path = r.name === 'avd-ops' ? root : join(dir, r.name);
  if (!existsSync(join(path, '.git'))) {
    execFileSync('git', ['clone', '-q', '--depth', '1', '--branch', r.branch, `https://github.com/${r.repo}.git`, path]);
  }
  const readmeText = readFileSync(join(path, 'README.md'), 'utf8');
  const readme = readmeText.split(/\r?\n/);
  const h1 = readme.findIndex((l) => l.startsWith('# '));
  const next = readme.slice(h1 + 1).find((l) => l.trim());
  if (r.name !== 'avd-ops') {
    if (next?.trim() !== family.brand_line) {
      problems.push(`${r.name}: README.md: the line under the title isn't the avd-ops brand line`);
    }
    if (!readmeText.includes('## How it connects')) {
      problems.push(`${r.name}: README.md: missing ## How it connects interlink section`);
    }
  }
  if (!readmeText.includes(noticePhrase)) {
    problems.push(`${r.name}: README.md: missing notice "${noticePhrase}"`);
  }
  const files = execFileSync('git', ['-C', path, 'ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)
    .filter((f) => !(r.generated || []).some((g) => f.startsWith(g)))
    .filter((f) => !(r.name === 'avd-ops' && f === 'repos.json'));   // the banned list itself
  for (const f of files) {
    let text;
    try { text = readFileSync(join(path, f), 'utf8'); } catch { continue; }
    if (text.includes('\u0000')) continue;
    text.split(/\r?\n/).forEach((line, i) => {
      if (banned.test(line)) problems.push(`${r.name}: ${f}:${i + 1}: names ${line.match(banned)[1]}`);
    });
  }
}
for (const p of problems) console.log(`::error::${p}`);
console.log(problems.length ? `${problems.length} problem(s) in the family` : `all ${family.repos.length} repos present as avd-ops`);
process.exit(problems.length ? 1 : 0);
