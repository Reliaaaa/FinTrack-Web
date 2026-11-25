import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db, configured, ensureSchema } from '@/server/db';
import { FinanceData, nextOccurrence } from '@/lib/finance';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  if (!configured()) return NextResponse.json({ status: 'skipped', reason: 'demo-mode' });
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureSchema();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const users = await db().query<{ user_id: string }>("SELECT user_id FROM finance_data WHERE jsonb_array_length(data->'recurring') > 0");
  let created = 0;
  for (const user of users.rows) {
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ data: FinanceData }>('SELECT data FROM finance_data WHERE user_id=$1 FOR UPDATE', [user.user_id]);
      const data = result.rows[0]?.data;
      if (!data) { await client.query('ROLLBACK'); continue; }
      let changed = false;
      for (const item of data.recurring) {
        if (!item.active) continue;
        let iterations = 0;
        while (item.nextDate <= today && iterations++ < 24) {
          const sourceId = createHash('sha256').update(`${item.id}:${item.nextDate}`).digest('hex').slice(0, 32);
          if (!data.entries.some(e => e.id === sourceId)) {
            data.entries.push({ id: sourceId, type: item.type, amount: item.amount, walletId: item.walletId, category: item.category, title: item.title, note: 'Dibuat otomatis dari jadwal berulang', date: item.nextDate });
            created++; changed = true;
          }
          item.anchorDay ||= Number(item.nextDate.slice(-2));
          item.nextDate = nextOccurrence(item.nextDate, item.frequency, item.anchorDay);
          changed = true;
        }
      }
      if (changed) await client.query('UPDATE finance_data SET data=$1,version=version+1,updated_at=NOW() WHERE user_id=$2', [JSON.stringify(data), user.user_id]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  return NextResponse.json({ status: 'ok', created });
}
