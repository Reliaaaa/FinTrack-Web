import { NextRequest } from 'next/server';

export class PayloadTooLarge extends Error {}

export async function readBoundedJson(request: NextRequest, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) throw new PayloadTooLarge();
  if (!request.body) throw new SyntaxError('Empty body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new PayloadTooLarge(); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString('utf8'));
}
