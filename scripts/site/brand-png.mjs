// Renders the PNG exports in brand/png/ from the vector files in site/assets/brand/ (lockups, social cards).
// The 1024px avatars and name tiles in brand/png/ are the owner's originals and are not rebuilt here.
// Needs Playwright with a Chromium, which the tests don't: run it by hand after changing a brand file.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   npm i --no-save playwright@1.56.1 && npx playwright install chromium   # once; not a dependency of the site
//   node scripts/site/brand-png.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const brand = (f) => `data:image/svg+xml;base64,${readFileSync(join(root, 'site/assets/brand', f)).toString('base64')}`;
const { colors } = JSON.parse(readFileSync(join(root, 'brand/profile.json'), 'utf8'));
const INK = colors['--brand-ink'].light; const LIGHT = colors['--bg'].light;

// [file, width, height, background, image, image height as a share of the canvas]
const RENDERS = [
  ['lockup-light-2400.png', 2400, 600, LIGHT, 'lockup.svg', 0.62],
  ['lockup-dark-2400.png', 2400, 600, INK, 'lockup-dark.svg', 0.62],
  ['lockup-transparent-2400.png', 2400, 600, 'transparent', 'lockup.svg', 0.62],
  ['mark-512.png', 512, 512, 'transparent', 'mark.svg', 1],
  ['favicon-180.png', 180, 180, 'transparent', 'favicon.svg', 1],
  ['social-1200x630.png', 1200, 630, INK, 'lockup-dark.svg', 0.3],
  ['github-social-1280x640.png', 1280, 640, INK, 'lockup-dark.svg', 0.3],
];

const { chromium } = await import('playwright');
const browser = await chromium.launch();
for (const [file, w, h, bg, svg, share] of RENDERS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<body style="margin:0;width:${w}px;height:${h}px;display:grid;place-items:center;background:${bg}"><img src="${brand(svg)}" style="height:${Math.round(h * share)}px"></body>`);
  await page.screenshot({ path: join(root, 'brand/png', file), omitBackground: bg === 'transparent' });
  await page.close();
  console.log(`wrote brand/png/${file}`);
}
await browser.close();
