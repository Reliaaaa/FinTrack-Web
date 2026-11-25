import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db, ensureSchema } from './db';
import type { PoolClient } from 'pg';

const COOKIE = 'fintrack_session';
const duration = 30 * 24 * 60 * 60 * 1000;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export async function currentUser() {
  await ensureSchema();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const result = await db().query<{ id: string; name: string; email: string }>('SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()', [hash(token)]);
  return result.rows[0] || null;
}
export async function setSession(response: NextResponse, userId: string, client?: PoolClient) {
  const token = randomBytes(32).toString('hex');
  await (client || db()).query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)', [hash(token), userId, new Date(Date.now() + duration)]);
  response.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: duration / 1000 });
}
export async function deleteSession(response: NextResponse) {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) await db().query('DELETE FROM sessions WHERE token_hash=$1', [hash(token)]);
  response.cookies.set(COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}
export async function sameOrigin() {
  const h = await headers();
  const origin = h.get('origin');
  if (!origin) return false;
  const host = h.get('x-forwarded-host') || h.get('host');
  const scheme = h.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  try { return new URL(origin).origin === `${scheme}://${host}`; } catch { return false; }
}
export async function rateLimit(key: string, limit: number) {
  const result = await db().query<{ attempts: number }>(`INSERT INTO auth_attempts(key,attempts,window_start) VALUES($1,1,NOW()) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN auth_attempts.window_start<NOW()-INTERVAL '15 minutes' THEN 1 ELSE auth_attempts.attempts+1 END, window_start=CASE WHEN auth_attempts.window_start<NOW()-INTERVAL '15 minutes' THEN NOW() ELSE auth_attempts.window_start END RETURNING attempts`, [hash(key)]);
  return result.rows[0].attempts <= limit;
}
export const failure = (error: string, status = 400) => NextResponse.json({ error }, { status });
