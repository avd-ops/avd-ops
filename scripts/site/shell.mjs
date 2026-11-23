// The avd-ops app shell (docs/design-system.md, "Shell"): the brand bar with the Docs, Deploy, Assess, Migrate
// and Status switcher and the notice, the side list and the footer, as HTML strings. build-docs.mjs wraps every
// docs page in it, and apply-shell.mjs writes it into the hand-written pages between their shell markers, so
// every page on avd-ops.dev has one navigation. Pure: it takes a page's place and returns markup.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const family = JSON.parse(readFileSync(join(root, 'repos.json'), 'utf8'));
const portal = (name) => family.repos.find((r) => r.name === name)?.portal;
const status = (name) => family.repos.find((r) => r.name === name)?.status;

// The architectural layers the repos sit in (repos.json "layer"), in the order work flows through them: read and
// plan, build, the control planes the build orchestrates, operate, and the optional intelligence on top. The side
// list, the home page's system figure and its layer matrix all come from this list, so a repo shows up everywhere
// the moment it is in repos.json; a repo with a layer this list doesn't know fails the build.
export const LAYERS = [
  ['assess', 'Assess and plan', 'What is there now, what it should be, and what moves.'],
  ['build', 'Build and change', 'One orchestrator deploys the landing zone and every change after it.'],
  ['control', 'Control planes', 'Identity, devices, Microsoft 365, Azure, the network and day-2 workflows, as code.'],
  ['operate', 'Operate and support', 'Troubleshoot hosts and check the network a user connects from.'],
  ['intelligence', 'Intelligence, on top', 'Optional agents and memory. The foundation never needs them.'],
];
const OFF_LIST = new Set(['front-door']);
const members = (id) => family.repos.filter((r) => r.layer === id);
const title = (id) => LAYERS.find(([x]) => x === id)[1];
const count = (rs) => `${rs.length} ${rs.length === 1 ? 'repo' : 'repos'}`;
for (const r of family.repos) {
  if (!OFF_LIST.has(r.layer) && !LAYERS.some(([id]) => id === r.layer)) throw new Error(`repos.json: ${r.name} has layer "${r.layer}"; use one of ${LAYERS.map(([id]) => id).join(', ')}`);
}

// The side list, the same on every page, in four tiers: the platform, the ecosystem by layer, governance and
// standards, and the system itself. Each tier holds groups of [label, path]; a group without a title sits
// straight under its tier. Paths are relative to site/.
export const GROUPS = [
  ['Platform', [[null, [['Overview', 'index.html'], ['Start here', 'docs/index.html'], ['Concepts', 'docs/concepts.html'], ['Architecture', 'architecture.html'], ['Blog', 'blog/index.html']]]]],
  ['Ecosystem', [[null, [['Repo guides', 'docs/repos/index.html']]], ...LAYERS.map(([id, title]) => [title, members(id).map((r) => [r.name, `family/${r.name}.html`])])]],
  ['Governance and standards', [[null, [['Security review', 'security.html'], ['Standards library', 'standards/index.html'], ['Decisions', 'docs/decisions/index.html'], ['Roadmap', 'roadmap.html'], ['Docs roadmap', 'docs/roadmap.html'], ['Research projects', 'research.html']]]]],
  ['System', [[null, [['Design system', 'design/index.html'], ['Graph', 'docs/graph.html'], ['Story', 'story.html'], ['Release notes', 'releases.html'], ['Metrics', 'metrics.html'], ['Credits', 'credits.html'], ['Legal notice', 'legal.html']]]]],
];

// The switcher: the site, then the portals each repo publishes (repos.json "portal" and "status").
export const SWITCHER = [['Docs', null], ['Deploy', portal('avd-landing-zone')], ['Assess', portal('avd-current-state')], ['Migrate', portal('avd-migrate')], ['Status', status('avd-current-state')]];

// Maturity as the pill says it: a ring that fills as a repo matures (avd-ops.css .mark-badge).
const MATURITY = { proven: 'Proven', 'pre-beta': 'Pre-beta', design: 'Design' };
const badge = (m) => `<span class="mark-badge m-${m}">${MATURITY[m] || m}</span>`;
// A repo's role without the layer prefix the matrix already shows ("Control plane: ", "On top: ").
const role = (r) => r.role.replace(/^(Control plane|On top|Foundation): /, '').replace(/^./, (c) => c.toUpperCase());

// The home page's system figure: the optional layer on top, the lifecycle under it, and the control planes the
// build orchestrates, each block linking to the repo guide or architecture. Pure; apply-shell.mjs writes it between
// <!-- family:figure --> markers.
export function systemFigure(up) {
  const block = (id, cls, sub) => {
    const rs = members(id);
    return `<a class="blk ${cls}" href="${up}docs/repos/index.html#layer-${id}"><span class="t">${title(id)}</span><span class="n">${count(rs)}</span><span class="sub">${sub}</span></a>`;
  };
  return `<figure class="sys" aria-label="The avd-ops system, by layer">
<div class="sys-top">${block('intelligence', 'b-top', 'Optional agents &amp; memory')}</div>
<p class="sys-rule">Reads what the foundation emits. Dependencies point down, never up.</p>
<div class="sys-flow">${block('assess', 'b-step', 'Inventory &amp; plan')}${block('build', 'b-step b-core', 'Bicep &amp; IaC')}${block('operate', 'b-step', 'Run &amp; verify')}</div>
<p class="sys-rule">The orchestrator deploys across five control planes and the network.</p>
<div class="sys-base">${block('control', 'b-base', 'Entra · Intune · M365 · Azure · Networking · Power Platform')}</div>
<p class="sys-ground">Microsoft Azure, Entra, Intune and Microsoft 365</p>
</figure>`;
}

// The home page's layer matrix: one row per layer, every public repo in it with its role, its maturity and its
// portal when it has one. apply-shell.mjs writes it between <!-- family:matrix --> markers.
export function layerMatrix(up) {
  return `<div class="matrix">
${LAYERS.map(([id, name, what]) => {
    const rs = members(id);
    const rows = rs.map((r) => `<li><a class="rp" href="${up}family/${r.name}.html">${r.name}</a><span class="rl">${role(r)}</span>${badge(r.maturity)}${r.portal ? `<a class="go" href="${r.portal}" aria-label="Open the ${r.name} portal">Open the portal</a>` : '<span class="go none"></span>'}</li>`).join('\n');
    return `<section class="lyr" id="layer-${id}" aria-labelledby="lyr-${id}">
<div class="lh"><h3 id="lyr-${id}">${name}</h3><p>${what}</p><p class="num">${count(rs)}</p></div>
<ul class="lr">
${rows}
</ul>
</section>`;
  }).join('\n')}
</div>`;
}

// The pieces the starters in templates/ share with the site (scripts/site/build-kit.mjs).
export const brand = (href, src) => `<a class="brand" href="${href}"><img class="mark" src="${src}" alt="" width="44" height="44"><span class="name"><span class="word">avd-ops</span><span class="tag">Deploy quietly</span></span></a>`;
export const SKIP = '<a class="skip" href="#main">Skip to content</a>';
export const TRADEMARKS = '<p>Every repo is open source, under MIT unless a folder says otherwise. Azure, Azure Virtual Desktop, Microsoft Entra, Intune and FSLogix are trademarks of Microsoft.</p>';
export const themeButton = () => `<button class="iconbtn theme" type="button" aria-label="Switch theme">${SUN}${MOON}</button>`;
export const customizeButton = (href) => `<button class="iconbtn customize" type="button" aria-label="Customize theme and palette" title="Customize theme and palette" aria-expanded="false" data-design-href="${href}">${GEAR}</button>`;
export const devButton = () => `<button class="iconbtn dev" type="button" aria-pressed="false" aria-label="Show contract and decision IDs (dev mode)" title="Show contract and decision IDs (dev mode)">${DEV}</button>`;

export const CREDIT = '<p class="credit">A <a href="https://prignano.ai/">prignano.ai</a> production</p>';

export const NOTICE = (up) => `<details class="notice"><summary><strong class="long">Community research project. Use at your own risk. No warranty.</strong><strong class="short">Use at your own risk</strong></summary>
<div class="full"><ul><li>Built on my own time for research and learning. Not affiliated with, endorsed by or supported by my employer or Microsoft.</li>
<li>Don't run any of it in production or against tenants that matter. Test in a dedicated lab subscription and tenant first.</li>
<li>Provided "as is", without warranty of any kind, under each repo's license. You use it at your own risk and own the Azure charges it incurs.</li>
<li><strong>Contributions and forks are welcome and encouraged.</strong> See <a href="${up}index.html#contribute">Contribute</a>.</li></ul></div></details>`;

export const SUN = '<svg class="sun" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.5"/><path d="M10 1.8v2.2M10 16v2.2M1.8 10H4M16 10h2.2M4.2 4.2l1.6 1.6M14.2 14.2l1.6 1.6M4.2 15.8l1.6-1.6M14.2 5.8l1.6-1.6"/></svg>';
export const MOON = '<svg class="moon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z"/></svg>';
export const DEV = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 6.5 3 10l3.5 3.5M13.5 6.5 17 10l-3.5 3.5M11.2 4.5 8.8 15.5"/></svg>';
export const GEAR = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="2.7"/><path d="M10 2.2v1.9M10 15.9v1.9M2.2 10h1.9M15.9 10h1.9M4.5 4.5l1.3 1.3M14.2 14.2l1.3 1.3M4.5 15.5l1.3-1.3M14.2 5.8l1.3-1.3"/></svg>';
const MENU = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3 5.5h14M3 10h14M3 14.5h14"/></svg>';

// up: the path from the page to site/ ('' or '../'); current: the page's path under site/.
export function shellHead(up) {
  return `<link rel="icon" href="${up}assets/brand/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${up}assets/avd-ops.css">
<link rel="stylesheet" href="${up}assets/avd-ops-shell.css">
<link rel="stylesheet" href="${up}assets/site.css">
<script src="${up}assets/theme.js"></script>`;
}

// A page under docs/repos/ or docs/decisions/ marks its section's index as the place it belongs.
function mark(href, current) {
  if (href === current) return ' aria-current="page"';
  const dir = href.replace(/index\.html$/, '');
  return dir !== href && dir.split('/').length > 2 && current.startsWith(dir) ? ' aria-current="true"' : '';
}

export function shellTop(up, current) {
  const switcher = SWITCHER.map(([t, href]) => (href
    ? `<a href="${href}">${t}</a>`
    : `<a href="${up}index.html" aria-current="true">${t}</a>`)).join('');
  const links = (items) => items.map(([t, href]) => `<a href="${up}${href}"${mark(href, current)}>${t}</a>`).join('');
  const side = GROUPS.map(([tier, groups]) => {
    if (tier === 'Platform') {
      return `<p class="tier">${tier}</p>${groups.map(([, items]) => links(items)).join('')}`;
    }
    const total = groups.reduce((n, [, xs]) => n + xs.length, 0);
    const inner = groups.map(([g, items]) => (g
      ? `<details class="side-group"><summary class="group">${g}<span class="side-count">${items.length}</span></summary><div class="side-links">${links(items)}</div></details>`
      : links(items))).join('');
    return `<details class="side-group tier-group"><summary class="tier">${tier}<span class="side-count">${total}</span></summary><div class="side-links">${inner}</div></details>`;
  }).join('\n');
  return `${SKIP}
<header class="bar"><div class="bar-in">${brand(`${up}index.html`, `${up}assets/brand/mark.svg`)}
<nav class="switcher" aria-label="avd-ops tools">${switcher}</nav>
${NOTICE(up)}
<div class="tools">${themeButton()}<button class="iconbtn menu" type="button" aria-label="Pages" aria-expanded="false" aria-controls="side">${MENU}</button></div></div></header>
<div class="layout"><nav class="side" id="side" aria-label="Pages">
${side}
</nav>`;
}

export function shellFoot(_extra, up = '') {
  return `</div>
<footer class="foot" id="contribute"><div class="in">
<div class="foot-open"><div><strong>Built in the open under MIT</strong><p>Fork a repo, run a lab, or open a pull request. See <a href="${up}credits.html#help-us">credits</a> for where research help is needed.</p></div>
<div class="actions"><a class="cta" href="${up}docs/repos/index.html">Browse all 16 repos</a><a class="cta ghost" href="https://github.com/avd-ops">GitHub Organization</a></div></div>
<div class="foot-meta"><a href="${up}legal.html">Legal notice &amp; trademarks</a>${CREDIT}</div>
</div></footer>
<button class="backdrop" type="button" tabindex="-1" aria-label="Close the pages list"></button>`;
}
