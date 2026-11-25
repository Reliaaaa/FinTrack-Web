import { createHash } from 'node:crypto';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { configured, db, ensureSchema } from '@/server/db';
import { failure, rateLimit, sameOrigin } from '@/server/auth';
import { newPasswordSchema } from '@/server/auth-providers';
import { PayloadTooLarge, readBoundedJson } from '@/server/body';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!configured()) return failure('Database belum dikonfigurasi', 503);
  if (!await sameOrigin()) return failure('Origin tidak valid', 403);
  await ensureSchema();
  const ip = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'unknown';
  if (!await rateLimit(`reset-confirm:${ip}`, 20)) return failure('Terlalu banyak percobaan. Coba lagi nanti.', 429);
  let input: unknown; try { input = await readBoundedJson(request, 4096); } catch (e) { return e instanceof PayloadTooLarge ? failure('Permintaan terlalu besar', 413) : failure('JSON tidak valid'); }
  const parsed = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password: newPasswordSchema }).safeParse(input);
  if (!parsed.success) return failure('Token atau kata sandi tidak valid');
  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const passwordHash = await hash(parsed.data.password, 12);
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const token = await client.query<{user_id: string}>('DELETE FROM password_resets WHERE token_hash=$1 AND expires_at>NOW() RETURNING user_id', [tokenHash]);
    if (!token.rows[0]) { await client.query('ROLLBACK'); return failure('Tautan tidak valid atau telah kedaluwarsa'); }
    const id = token.rows[0].user_id;
    await client.query('UPDATE users SET password_hash=$1 WHERE id=$2', [passwordHash,id]);
    await client.query('DELETE FROM sessions WHERE user_id=$1', [id]);
    await client.query('DELETE FROM password_resets WHERE user_id=$1', [id]);
    await client.query('COMMIT');
    return NextResponse.json({ok:true});
  } catch { await client.query('ROLLBACK'); return failure('Tidak dapat mengubah kata sandi', 500); } finally { client.release(); }
}
