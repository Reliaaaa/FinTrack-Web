import { NextRequest, NextResponse } from 'next/server';
import { db, configured } from '@/server/db';
import { currentUser, failure, sameOrigin } from '@/server/auth';
import { financeSchema } from '@/server/validation';
import { z } from 'zod';
import { PayloadTooLarge, readBoundedJson } from '@/server/body';
export const runtime = 'nodejs';
const updateSchema = z.object({ version: z.string().regex(/^\d+$/), data: financeSchema });
export async function GET() {
  if (!configured()) return failure('Database belum dikonfigurasi', 503);
  const user = await currentUser(); if (!user) return failure('Sesi tidak valid', 401);
  const result = await db().query<{ data: unknown; version: string }>('SELECT data,version FROM finance_data WHERE user_id=$1', [user.id]);
  return NextResponse.json({ data: result.rows[0]?.data, version: result.rows[0]?.version }, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function PUT(request: NextRequest) {
  if (!configured()) return failure('Database belum dikonfigurasi', 503);
  if (!await sameOrigin()) return failure('Origin tidak valid', 403);
  const user = await currentUser(); if (!user) return failure('Sesi tidak valid', 401);
  let body: unknown; try { body = await readBoundedJson(request, 5_000_000); } catch (error) { return error instanceof PayloadTooLarge ? failure('Data terlalu besar', 413) : failure('JSON tidak valid'); }
  const parsed = updateSchema.safeParse(body); if (!parsed.success) return failure('Data keuangan atau versi tidak valid');
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ version: string }>('UPDATE finance_data SET data=$1,version=version+1,updated_at=NOW() WHERE user_id=$2 AND version=$3 RETURNING version', [JSON.stringify(parsed.data.data), user.id, parsed.data.version]);
    if (!result.rows[0]) {
      const latest = await client.query<{ version: string }>('SELECT version FROM finance_data WHERE user_id=$1', [user.id]);
      await client.query('ROLLBACK');
      return latest.rows[0] ? NextResponse.json({ error: 'Data berubah di tab atau perangkat lain. Simpan draf Anda lalu muat ulang data terbaru.', version: latest.rows[0].version }, { status: 409 }) : failure('Data akun tidak ditemukan', 404);
    }
    await client.query('UPDATE users SET name=$1 WHERE id=$2', [parsed.data.data.name, user.id]);
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, version: result.rows[0].version });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
