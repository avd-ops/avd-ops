// Every label the submission forms use, from routing.json. Prints the gh commands by default; with
// --apply it runs them (needs `gh auth login`). Writes to a repo, so only the owner runs --apply.
// Usage: node submissions/labels.mjs <owner/repo> [--apply]
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [repo, flag] = process.argv.slice(2);
if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
  console.error('usage: node submissions/labels.mjs <owner/repo> [--apply]');
  process.exit(2);
}
const routing = JSON.parse(readFileSync(new URL('./routing.json', import.meta.url), 'utf8'));
const color = (name) => (name.startsWith('type:') ? '1ca998' : name.startsWith('dispute') ? 'd29922' : 'ededed');
for (const [name, description] of Object.entries(routing.labels)) {
  const args = ['label', 'create', name, '--repo', repo, '--color', color(name), '--description', description, '--force'];
  console.log(`gh ${args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}`);
  if (flag === '--apply') {
    console.log(`Creating label ${name} in ${repo}...`);
    execFileSync('gh', args, { stdio: 'inherit' });
  }
}
