// The avd-ops app shell (docs/design-system.md, "Shell"): the brand bar with the Docs, Deploy and Assess
// switcher and the notice, the side list and the footer, as HTML strings. build-docs.mjs wraps every
// docs page in it, and apply-shell.mjs writes it into the hand-written pages between their shell markers, so
// every page on avd-ops.dev has one navigation. Pure: it takes a page's place and returns markup.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url).pathname;
const family = JSON.parse(readFileSync(`${root}repos.json`, 'utf8'));
const portal = (name) => family.repos.find((r) => r.name === name)?.portal;

// The side list, the same on every page. Paths are relative to site/.
export const GROUPS = [
  ['Start', [['Overview', 'index.html'], ['Start here', 'docs/index.html'], ['Architecture', 'architecture.html'],
    ['Security review', 'security.html'], ['Standards library', 'standards/index.html'], ['Concepts', 'docs/concepts.html'], ['Roadmap', 'docs/roadmap.html']]],
  ['Repos', [...family.repos.filter((r) => r.name !== 'avd-ops').map((r) => [r.name, `family/${r.name}.html`]), ['Repo guides', 'docs/repos/index.html']]],
  ['Record', [['Decisions', 'docs/decisions/index.html'], ['Graph', 'docs/graph.html'], ['Design system', 'design/index.html'], ['Credits', 'credits.html']]],
];

// The switcher: the site, then the portals each repo publishes (repos.json "portal").
export const SWITCHER = [['Docs', null], ['Deploy', portal('avd-landing-zone')], ['Assess', portal('avd-current-state')]];

// The pieces the starters in templates/ share with the site (scripts/site/build-kit.mjs).
export const brand = (href, src) => `<a class="brand" href="${href}"><img class="mark" src="${src}" alt="" width="44" height="44"><span class="name"><span class="word">avd-ops</span><span class="tag">Deploy quietly</span></span></a>`;
export const SKIP = '<a class="skip" href="#main">Skip to content</a>';
export const TRADEMARKS = '<p>Every repo is open source, under MIT unless a folder says otherwise. Azure, Azure Virtual Desktop, Microsoft Entra, Intune and FSLogix are trademarks of Microsoft.</p>';
export const themeButton = () => `<button class="iconbtn theme" type="button" aria-label="Switch theme">${SUN}${MOON}</button>`;

export const CREDIT = '<p class="credit">A <a href="https://prignano.ai/">prignano.ai</a> production</p>';

export const NOTICE = (up) => `<details class="notice"><summary><strong class="long">Personal project. Research and learning only. Not for production. No warranty.</strong><strong class="short">Not for production</strong></summary>
<div class="full"><ul><li>Built on my own time for research and learning. Not affiliated with, endorsed by or supported by my employer or Microsoft.</li>
<li>Don't run any of it in production or against tenants that matter. Test in a dedicated lab subscription and tenant first.</li>
<li>Provided "as is", without warranty of any kind, under each repo's license. You use it at your own risk and own the Azure charges it incurs.</li>
<li><strong>Contributions and forks are welcome and encouraged.</strong> See <a href="${up}index.html#contribute">Contribute</a>.</li></ul></div></details>`;

export const SUN = '<svg class="sun" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.5"/><path d="M10 1.8v2.2M10 16v2.2M1.8 10H4M16 10h2.2M4.2 4.2l1.6 1.6M14.2 14.2l1.6 1.6M4.2 15.8l1.6-1.6M14.2 5.8l1.6-1.6"/></svg>';
export const MOON = '<svg class="moon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z"/></svg>';
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
  const side = GROUPS.map(([g, items]) => `<p class="group">${g}</p>${items.map(([t, href]) => `<a href="${up}${href}"${mark(href, current)}>${t}</a>`).join('')}`).join('\n');
  return `${SKIP}
<header class="bar"><div class="bar-in">${brand(`${up}index.html`, `${up}assets/brand/mark.svg`)}
<nav class="switcher" aria-label="avd-ops tools">${switcher}</nav>
${NOTICE(up)}
<div class="tools">${themeButton()}<button class="iconbtn menu" type="button" aria-label="Pages" aria-expanded="false" aria-controls="side">${MENU}</button></div></div></header>
<div class="layout"><nav class="side" id="side" aria-label="Pages">
${side}
</nav>`;
}

export function shellFoot(extra) {
  return `</div>
<footer class="foot"><div class="in">${extra}
${TRADEMARKS}
${CREDIT}</div></footer>
<button class="backdrop" type="button" tabindex="-1" aria-label="Close the pages list"></button>`;
}
