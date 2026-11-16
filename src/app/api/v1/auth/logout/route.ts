import { NextResponse } from 'next/server';
import { configured } from '@/server/db';
import { deleteSession, failure, sameOrigin } from '@/server/auth';
export const runtime = 'nodejs';
export async function POST() {
  if (!configured()) return failure('Database belum dikonfigurasi', 503);
  if (!await sameOrigin()) return failure('Origin tidak valid', 403);
  const response = NextResponse.json({ ok: true }); await deleteSession(response); return response;
}
