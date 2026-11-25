import { compare } from 'bcryptjs';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { configured, db, ensureSchema } from '@/server/db';
import { failure, rateLimit, sameOrigin, setSession } from '@/server/auth';
import { PayloadTooLarge, readBoundedJson } from '@/server/body';
export const runtime = 'nodejs';
const schema = z.object({ email: z.email().max(255), password: z.string().min(1).max(128) });
export async function POST(request: NextRequest) {
  if (!configured()) return failure('Database belum dikonfigurasi', 503);
  if (!await sameOrigin()) return failure('Origin tidak valid', 403);
  await ensureSchema();
  const ip = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'unknown';
  if (!await rateLimit(`login:${ip}`, 20)) return failure('Terlalu banyak percobaan. Coba lagi nanti.', 429);
  let input: unknown; try { input = await readBoundedJson(request, 4096); } catch (error) { return error instanceof PayloadTooLarge ? failure('Permintaan terlalu besar', 413) : failure('JSON tidak valid'); }
  const parsed = schema.safeParse(input); if (!parsed.success) return failure('Email atau kata sandi tidak valid');
  if (!await rateLimit(`login:email:${parsed.data.email.toLowerCase()}`, 10)) return failure('Terlalu banyak percobaan. Coba lagi nanti.', 429);
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ id: string; password_hash: string }>('SELECT id,password_hash FROM users WHERE email=$1 FOR UPDATE', [parsed.data.email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !await compare(parsed.data.password, user.password_hash)) { await client.query('ROLLBACK'); return failure('Email atau kata sandi salah', 401); }
    const response = NextResponse.json({ ok: true });
    await setSession(response, user.id, client);
    await client.query('COMMIT');
    return response;
  } catch { await client.query('ROLLBACK'); return failure('Tidak dapat masuk', 500); } finally { client.release(); }
}
