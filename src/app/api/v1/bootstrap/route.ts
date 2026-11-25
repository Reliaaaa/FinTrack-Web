import { NextResponse } from 'next/server';
import { configured, db } from '@/server/db';
import { currentUser } from '@/server/auth';
import { appOrigin } from '@/server/auth-providers';
export const runtime = 'nodejs';
const noStore = { 'Cache-Control': 'private, no-store' };
export async function GET() {
  if (!configured()) return NextResponse.json({ configured: false }, { headers: noStore });
  try {
    const origin = appOrigin(process.env.APP_URL);
    const authOptions = {
      google: Boolean(origin && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      passwordReset: Boolean(origin && process.env.RESEND_API_KEY && process.env.RESET_FROM_EMAIL),
    };
    const user = await currentUser();
    if (!user) return NextResponse.json({ configured: true, authOptions, error: 'Masuk untuk melanjutkan' }, { status: 401, headers: noStore });
    const result = await db().query<{ data: unknown; version: string }>('SELECT data,version FROM finance_data WHERE user_id=$1', [user.id]);
    return NextResponse.json({ configured: true, authOptions, user: { id: user.id, name: user.name, email: user.email }, data: result.rows[0]?.data, version: result.rows[0]?.version }, { headers: noStore });
  } catch { return NextResponse.json({ configured: true, error: 'Basis data tidak tersedia' }, { status: 503, headers: noStore }); }
}
