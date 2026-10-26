import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const canonical = readFileSync(resolve(root, 'llms.txt'));
const published = resolve(root, 'site/llms.txt');
const server = createServer((request, response) => {
  if (request.url !== '/llms.txt') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(readFileSync(published));
});

server.listen(0, '127.0.0.1');
await once(server, 'listening');
try {
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/llms.txt`);
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 200, 'GET /llms.txt should return 200');
  assert.deepEqual(body, canonical, 'GET /llms.txt should match the canonical generated llms.txt');
  console.log('OK');
} finally {
  server.close();
  await once(server, 'close');
}
