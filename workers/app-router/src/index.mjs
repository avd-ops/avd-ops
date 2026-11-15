// Cloudflare Worker for https://avd-ops.app/
// Routes the public demo hub and static portal proxies with zero auth and zero backend state.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.

import { resolveTarget } from './routes.mjs';
import { renderHubHtml } from './hub.mjs';

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-avd-ops-demo': 'static-sample'
};

function withSecurityHeaders(headersInit, contentType) {
  const headers = new Headers(headersInit);
  headers.delete('set-cookie');
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }
  if (contentType) headers.set('content-type', contentType);
  return headers;
}

export async function handleRequest(request, fetchImpl = fetch) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: withSecurityHeaders({ allow: 'GET, HEAD' }, 'text/plain; charset=utf-8')
    });
  }

  const url = new URL(request.url);
  const resolved = resolveTarget(url);

  if (resolved.kind === 'hub') {
    const body = request.method === 'HEAD' ? null : renderHubHtml();
    return new Response(body, {
      status: 200,
      headers: withSecurityHeaders({ 'cache-control': 'public, max-age=300' }, 'text/html; charset=utf-8')
    });
  }

  if (resolved.kind === 'redirect') {
    const location = new URL(resolved.location, url.origin).toString();
    return Response.redirect(location, 301);
  }

  if (resolved.kind === 'not_found') {
    return new Response('Not Found', {
      status: 404,
      headers: withSecurityHeaders({}, 'text/plain; charset=utf-8')
    });
  }

  const upstream = await fetchImpl(resolved.targetUrl, {
    method: request.method,
    headers: {
      accept: request.headers.get('accept') || '*/*'
    }
  });

  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: withSecurityHeaders(upstream.headers)
  });
}

export default {
  fetch(request) {
    return handleRequest(request);
  }
};
