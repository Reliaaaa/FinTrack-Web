import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { PayloadTooLarge, readBoundedJson } from '../src/server/body.ts';

test('JSON body limit is enforced without a Content-Length header', async () => {
  const request = new NextRequest('http://localhost/api', { method: 'POST', body: JSON.stringify({ text: 'x'.repeat(100) }) });
  assert.equal(request.headers.has('content-length'), false);
  await assert.rejects(readBoundedJson(request, 32), PayloadTooLarge);
});

test('small JSON body is parsed', async () => {
  const request = new NextRequest('http://localhost/api', { method: 'POST', body: '{"ok":true}' });
  assert.deepEqual(await readBoundedJson(request, 32), { ok: true });
});
