// Route table and target URL resolver for avd-ops.app.
// Pure functions so both the Cloudflare Worker and Node tests can import it.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.

export const PORTAL_ROUTES = [
  {
    prefix: '/deploy',
    upstream: 'https://avd-ops.github.io/avd-landing-zone/portal',
    title: 'Deploy',
    repo: 'avd-landing-zone',
    summary: 'Compose a five-plane landing zone manifest and preview Cloud Shell deployment steps.'
  },
  {
    prefix: '/assess',
    upstream: 'https://avd-ops.github.io/avd-current-state/portal',
    title: 'Assess',
    repo: 'avd-current-state',
    summary: 'Inspect a Contoso sample estate across Entra, Intune, M365, Azure, and Power Platform.'
  },
  {
    prefix: '/migrate',
    upstream: 'https://avd-ops.github.io/avd-migrate/portal',
    title: 'Migrate',
    repo: 'avd-migrate',
    summary: 'Design a single-pool target-state baseline and export a C14 manifest.'
  },
  {
    prefix: '/status',
    upstream: 'https://avd-ops.github.io/avd-current-state/status',
    title: 'Status',
    repo: 'avd-current-state',
    summary: 'View the redacted five-plane estate status dashboard on static sample data.'
  },
  {
    prefix: '/benchmark',
    upstream: 'https://avd-ops.github.io/avd-benchmark/portal',
    title: 'Benchmark',
    repo: 'avd-benchmark',
    summary: 'Explore Tier 1 AVD benchmark profiles and reference corpus results.'
  },
  {
    prefix: '/linecheck',
    upstream: 'https://avd-ops.github.io/avd-linecheck',
    title: 'Linecheck',
    repo: 'avd-linecheck',
    summary: 'Run the browser-only network reachability, RTT, jitter, and download check.'
  },
  {
    prefix: '/customizer',
    upstream: null,
    title: 'Customizer',
    repo: 'avd-ops',
    summary: 'Customize color palettes, typography pairings, and brand marks, then export adopter-theme.css.'
  }
];

export const ASSET_UPSTREAM = 'https://avd-ops.dev/assets';

/**
 * Resolve an incoming request URL on avd-ops.app to an action:
 * - { kind: 'hub' } for / and /index.html
 * - { kind: 'redirect', location } when a portal prefix lacks its trailing slash
 * - { kind: 'proxy', targetUrl } for portal subpaths and /assets/*
 * - { kind: 'not_found' } otherwise
 */
export function resolveTarget(url) {
  const { pathname, search } = url;

  if (pathname === '/' || pathname === '/index.html') {
    return { kind: 'hub' };
  }

  if (pathname.startsWith('/assets/')) {
    const rest = pathname.slice('/assets'.length);
    return { kind: 'proxy', targetUrl: `${ASSET_UPSTREAM}${rest}${search}` };
  }

  if (pathname === '/customizer') {
    return { kind: 'redirect', location: `/customizer/${search}` };
  }

  if (pathname === '/customizer/' || pathname === '/customizer/index.html') {
    return { kind: 'customizer' };
  }

  for (const route of PORTAL_ROUTES) {
    if (!route.upstream) continue;
    if (pathname === route.prefix) {
      return { kind: 'redirect', location: `${route.prefix}/${search}` };
    }
    if (pathname.startsWith(`${route.prefix}/`)) {
      const rest = pathname.slice(route.prefix.length);
      return { kind: 'proxy', targetUrl: `${route.upstream}${rest}${search}` };
    }
  }

  return { kind: 'not_found' };
}
