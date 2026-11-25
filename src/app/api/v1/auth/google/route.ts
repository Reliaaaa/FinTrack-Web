import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { appOrigin } from '@/server/auth-providers';
import { configured } from '@/server/db';

export const runtime = 'nodejs';
export async function GET() {
  const base = appOrigin(process.env.APP_URL);
  if (!configured() || !base || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return new NextResponse(null, { status: 302, headers: { Location: '/?auth_error=google_unavailable', 'Cache-Control': 'no-store' } });
  const state = randomBytes(32).toString('hex');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: new URL('/api/v1/auth/google/callback', base).toString(), response_type: 'code', scope: 'openid email profile', state }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set('fintrack_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/v1/auth/google', maxAge: 600 });
  return response;
}
