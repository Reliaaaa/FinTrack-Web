import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { configured, db, ensureSchema } from '@/server/db';
import { failure, rateLimit, sameOrigin, setSession } from '@/server/auth';
import { newPasswordSchema } from '@/server/auth-providers';
import { PayloadTooLarge, readBoundedJson } from '@/server/body';
import { newFinanceData } from '@/lib/finance';
export const runtime = 'nodejs';
const schema = z.object({ name: z.string().trim().min(1).max(60), email: z.email().max(255), password: newPasswordSchema });
export async function POST(request: NextRequest) {
  if (!configured()) return failure('Database belum dikonfigurasi', 503);
  if (!await sameOrigin()) return failure('Origin tidak valid', 403);
  await ensureSchema();
  const ip = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'unknown';
  if (!await rateLimit(`register:${ip}`, 10)) return failure('Terlalu banyak percobaan. Coba lagi nanti.', 429);
  let input: unknown; try { input = await readBoundedJson(request, 4096); } catch (error) { return error instanceof PayloadTooLarge ? failure('Permintaan terlalu besar', 413) : failure('JSON tidak valid'); }
  const parsed = schema.safeParse(input); if (!parsed.success) return failure('Nama, email, atau kata sandi tidak valid');
  if (!await rateLimit(`register:email:${parsed.data.email.toLowerCase()}`, 5)) return failure('Terlalu banyak percobaan. Coba lagi nanti.', 429);
  const { name, password } = parsed.data; const email = parsed.data.email.toLowerCase(); const userId = randomUUID();
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)', [userId, name, email, await hash(password, 12)]);
    await client.query('INSERT INTO finance_data(user_id,data) VALUES($1,$2)', [userId, JSON.stringify(newFinanceData(name))]);
    const response = NextResponse.json({ ok: true }, { status: 201 });
    await setSession(response, userId, client);
    await client.query('COMMIT');
    return response;
  } catch (error) { await client.query('ROLLBACK'); if ((error as { code?: string }).code === '23505') return failure('Email sudah terdaftar', 409); return failure('Tidak dapat membuat akun', 500); } finally { client.release(); }
}
