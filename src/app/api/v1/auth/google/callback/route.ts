import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { db, ensureSchema, configured } from '@/server/db';
import { appOrigin, googleProfile } from '@/server/auth-providers';
import { setSession } from '@/server/auth';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const base = appOrigin(process.env.APP_URL);
  const error = (reason: string) => { const response = new NextResponse(null, { status: 302, headers: { Location: `/?auth_error=${reason}`, 'Cache-Control': 'no-store' } }); response.cookies.set('fintrack_oauth_state', '', { path: '/api/v1/auth/google', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }); return response; };
  const state = request.nextUrl.searchParams.get('state') || '';
  const expected = request.cookies.get('fintrack_oauth_state')?.value || '';
  const code = request.nextUrl.searchParams.get('code');
  if (!base || !configured() || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !code || !/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(expected) || !timingSafeEqual(Buffer.from(state), Buffer.from(expected))) return error('google_failed');
  try {
    const profile = await googleProfile(code, process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, base);
    await ensureSchema();
    const client = await db().connect(); let userId: string;
    try {
      await client.query('BEGIN');
      const existing = await client.query<{user_id: string}>('SELECT user_id FROM google_accounts WHERE subject=$1', [profile.sub]);
      if (existing.rows[0]) userId = existing.rows[0].user_id;
      else {
        const email = profile.email.toLowerCase();
        const duplicate = await client.query('SELECT id FROM users WHERE email=$1', [email]);
        if (duplicate.rowCount) { await client.query('ROLLBACK'); return error('email_exists'); }
        userId = randomUUID(); const name = String(profile.name || email.split('@')[0]).trim().slice(0, 60) || 'Pengguna';
        await client.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)', [userId, name, email, await hash(randomBytes(32).toString('hex'), 12)]);
        await client.query('INSERT INTO google_accounts(subject,user_id) VALUES($1,$2)', [profile.sub, userId]);
        await client.query('INSERT INTO finance_data(user_id,data) VALUES($1,$2)', [userId, JSON.stringify({ name, wallets: [], entries: [], budgets: [], recurring: [] })]);
      }
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    const result = NextResponse.redirect(new URL('/', base)); result.cookies.set('fintrack_oauth_state', '', { path: '/api/v1/auth/google', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }); await setSession(result, userId); return result;
  } catch { return error('google_failed'); }
}
