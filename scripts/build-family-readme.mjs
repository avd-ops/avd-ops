// Generates the `## The family` table in README.md from repos.json (decision 0002).
// Community research project. Use at your own risk. No warranty.
//
//   node scripts/build-family-readme.mjs          # update README.md in place
//   node scripts/build-family-readme.mjs --check  # exit 1 if README.md is out of date
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const BEGIN = '<!-- generated:family begin -->';
const END = '<!-- generated:family end -->';

const LAYER_LABELS = {
  assess: 'Assess',
  build: 'Build',
  control: 'Control',
  operate: 'Operate',
  intelligence: 'Intelligence',
};

const LAYER_ORDER = ['assess', 'build', 'control', 'operate', 'intelligence'];

export function renderFamilyTable(reposJson) {
  const members = reposJson.repos
    .filter((r) => r.name !== 'avd-ops')
    .sort((a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer));

  const rows = [
    '| Layer | Repo | Role | Docs |',
    '|---|---|---|---|',
    ...members.map((r) => {
      const layer = LAYER_LABELS[r.layer] || r.layer;
      const role = r.role.replace(/\|/g, '\\|');
      return `| ${layer} | [${r.name}](https://github.com/${r.repo}#readme) | ${role} | [page](${r.docs}) |`;
    }),
  ];
  return [BEGIN, ...rows, END].join('\n');
}

export function syncFamilyReadme(checkOnly = false) {
  const reposJson = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
  const readmePath = join(root, 'README.md');
  const readme = readFileSync(readmePath, 'utf8');
  const eol = readme.includes('\r\n') ? '\r\n' : '\n';

  const start = readme.indexOf(BEGIN);
  const end = readme.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('README.md is missing <!-- generated:family begin/end --> markers');
  }

  const block = renderFamilyTable(reposJson).replace(/\n/g, eol);
  const updated = readme.slice(0, start) + block + readme.slice(end + END.length);

  if (checkOnly) {
    return updated === readme;
  }
  if (updated !== readme) {
    writeFileSync(readmePath, updated, 'utf8');
  }
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const ok = syncFamilyReadme(check);
  if (check && !ok) {
    console.error('README.md family table is out of date; run: node scripts/build-family-readme.mjs');
    process.exit(1);
  }
  console.log(check ? 'README.md family table is up to date' : 'Updated README.md family table from repos.json');
}
