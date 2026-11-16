import { NextResponse } from 'next/server';
import { configured, db } from '@/server/db';
export const runtime = 'nodejs';
export async function GET() {
  if (!configured()) return NextResponse.json({ status: 'demo', database: 'not-configured' });
  try { await db().query('SELECT 1'); return NextResponse.json({ status: 'ok', database: 'connected' }); }
  catch { return NextResponse.json({ status: 'error', database: 'unavailable' }, { status: 503 }); }
}
