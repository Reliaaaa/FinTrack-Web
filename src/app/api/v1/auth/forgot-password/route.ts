import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { configured, db, ensureSchema } from '@/server/db';
import { failure, rateLimit, sameOrigin } from '@/server/auth';
import { appOrigin, resetLink, sendResetEmail } from '@/server/auth-providers';
import { PayloadTooLarge, readBoundedJson } from '@/server/body';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const base = appOrigin(process.env.APP_URL);
  if (!configured() || !base || !process.env.RESEND_API_KEY || !process.env.RESET_FROM_EMAIL) return failure('Pemulihan kata sandi belum tersedia', 503);
  if (!await sameOrigin()) return failure('Origin tidak valid', 403);
  await ensureSchema();
  const ip = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'unknown';
  if (!await rateLimit(`reset:${ip}`, 20)) return failure('Terlalu banyak percobaan. Coba lagi nanti.', 429);
  let input: unknown; try { input = await readBoundedJson(request, 4096); } catch (e) { return e instanceof PayloadTooLarge ? failure('Permintaan terlalu besar', 413) : failure('JSON tidak valid'); }
  const parsed = z.object({ email: z.email().max(255) }).safeParse(input);
  if (!parsed.success) return failure('Email tidak valid');
  const email = parsed.data.email.toLowerCase();
  if (!await rateLimit(`reset:email:${email}`, 5)) return NextResponse.json({ ok: true });
  const user = await db().query<{id: string}>('SELECT id FROM users WHERE email=$1', [email]);
  if (user.rows[0]) {
    const token = randomBytes(32).toString('hex');
    await db().query('INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL \'30 minutes\')', [createHash('sha256').update(token).digest('hex'), user.rows[0].id]);
    const url = resetLink(base, token);
    try { await sendResetEmail(process.env.RESEND_API_KEY, process.env.RESET_FROM_EMAIL, email, url); } catch { console.error('Password reset email delivery failed'); }
  }
  return NextResponse.json({ ok: true });
}
