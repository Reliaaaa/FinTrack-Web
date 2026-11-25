import { z } from 'zod';

export const newPasswordSchema = z.string().min(8).max(128).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Kata sandi maksimal 72 byte UTF-8');

export function appOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) return null;
    return url.origin;
  } catch { return null; }
}

export function resetLink(base: string, token: string) {
  const url = new URL('/reset', base);
  url.hash = new URLSearchParams({ reset_token: token }).toString();
  return url.toString();
}

export async function googleProfile(code: string, clientId: string, clientSecret: string, base: string) {
  const token = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: new URL('/api/v1/auth/google/callback', base).toString(), grant_type: 'authorization_code' }), cache: 'no-store' });
  if (!token.ok) throw new Error('Google token exchange failed');
  const tokens: unknown = await token.json();
  const parsedToken = z.object({ access_token: z.string().min(1).max(4096) }).safeParse(tokens);
  if (!parsedToken.success) throw new Error('Google token response invalid');
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${parsedToken.data.access_token}` }, cache: 'no-store' });
  if (!response.ok) throw new Error('Google userinfo failed');
  const profile: unknown = await response.json();
  const parsed = z.object({ sub: z.string().min(1).max(255), email: z.email().max(255), email_verified: z.literal(true), name: z.string().optional() }).safeParse(profile);
  if (!parsed.success) throw new Error('Google profile invalid');
  return parsed.data;
}

export async function sendResetEmail(apiKey: string, from: string, email: string, url: string) {
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [email], subject: 'Atur ulang kata sandi FinTrack', text: `Gunakan tautan berikut dalam 30 menit untuk mengatur ulang kata sandi Anda: ${url}\nJika Anda tidak meminta perubahan ini, abaikan email ini.` }), cache: 'no-store' });
  if (!response.ok) throw new Error(`Email delivery failed: ${response.status}`);
}
