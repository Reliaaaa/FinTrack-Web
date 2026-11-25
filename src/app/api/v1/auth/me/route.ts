import { NextResponse } from 'next/server';
import { currentUser } from '@/server/auth';
import { configured } from '@/server/db';

export const runtime = 'nodejs';

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!configured()) return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 503, headers });
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401, headers });
    return NextResponse.json({ user: { id: user.id } }, { headers });
  } catch {
    return NextResponse.json({ error: 'Basis data tidak tersedia' }, { status: 503, headers });
  }
}
