import { NextResponse } from 'next/server';
import { configured, db } from '@/server/db';
import { currentUser } from '@/server/auth';
export const runtime = 'nodejs';
export async function GET() {
  if (!configured()) return NextResponse.json({ configured: false });
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ configured: true, error: 'Masuk untuk melanjutkan' }, { status: 401 });
    const result = await db().query<{ data: unknown; version: string }>('SELECT data,version FROM finance_data WHERE user_id=$1', [user.id]);
    return NextResponse.json({ configured: true, user: { id: user.id, name: user.name, email: user.email }, data: result.rows[0]?.data, version: result.rows[0]?.version }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ configured: true, error: 'Basis data tidak tersedia' }, { status: 503 }); }
}
