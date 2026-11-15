import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PORTAL_ROUTES, resolveTarget } from '../src/routes.mjs';
import { renderHubHtml } from '../src/hub.mjs';
import { handleRequest } from '../src/index.mjs';

test('resolveTarget routes root to hub and portal prefixes to upstreams', () => {
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/')), { kind: 'hub' });
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/index.html')), { kind: 'hub' });
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/deploy')), { kind: 'redirect', location: '/deploy/' });
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/deploy?demo=1')), { kind: 'redirect', location: '/deploy/?demo=1' });
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/deploy/')), {
    kind: 'proxy',
    targetUrl: 'https://avd-ops.github.io/avd-landing-zone/portal/'
  });
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/assess/app.js')), {
    kind: 'proxy',
    targetUrl: 'https://avd-ops.github.io/avd-current-state/portal/app.js'
  });
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/assets/avd-ops.css')), {
    kind: 'proxy',
    targetUrl: 'https://avd-ops.dev/assets/avd-ops.css'
  });
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/customizer')), { kind: 'redirect', location: '/customizer/' });
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/customizer/')), {
    kind: 'proxy',
    targetUrl: 'https://avd-ops.dev/design/'
  });
  assert.deepEqual(resolveTarget(new URL('https://avd-ops.app/unknown')), { kind: 'not_found' });
});

test('handleRequest enforces read-only methods, strips cookies, and serves the hub', async () => {
  const postRes = await handleRequest(new Request('https://avd-ops.app/deploy/', { method: 'POST' }));
  assert.equal(postRes.status, 405);
  assert.equal(postRes.headers.get('allow'), 'GET, HEAD');

  const hubRes = await handleRequest(new Request('https://avd-ops.app/'));
  assert.equal(hubRes.status, 200);
  const html = await hubRes.text();
  assert.match(html, /https:\/\/avd-ops\.dev\//);
  for (const r of PORTAL_ROUTES) {
    assert.ok(html.includes(`href="${r.prefix}/"`), `hub links ${r.prefix}/`);
  }

  const proxyRes = await handleRequest(
    new Request('https://avd-ops.app/deploy/'),
    async (targetUrl) => {
      assert.equal(targetUrl, 'https://avd-ops.github.io/avd-landing-zone/portal/');
      return new Response('ok', {
        status: 200,
        headers: { 'content-type': 'text/html', 'set-cookie': 'secret=1' }
      });
    }
  );
  assert.equal(proxyRes.status, 200);
  assert.equal(proxyRes.headers.get('set-cookie'), null);
  assert.equal(proxyRes.headers.get('x-avd-ops-demo'), 'static-sample');
  assert.equal(await proxyRes.text(), 'ok');
});

test('renderHubHtml stays clean of inline styles and banned terms', () => {
  const html = renderHubHtml();
  assert.match(html, /class="iconbtn customize"/);
  assert.doesNotMatch(html, /<style|style="/);
  assert.doesNotMatch(html, /liquidware|nerdio|login ?vsi|goliath/i);
});
