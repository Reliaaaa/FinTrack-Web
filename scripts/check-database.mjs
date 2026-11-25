import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { NextRequest } from 'next/server';

const source = process.env.DATABASE_URL;
if (!source || process.env.DB_INTEGRATION_TEST !== '1') throw new Error('Set DB_INTEGRATION_TEST=1 and a local DATABASE_URL');
const base = new URL(source);
if (!['localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('Database integration test only accepts localhost');
const url = database => { const result = new URL(base); result.pathname = `/${database}`; return result.toString(); };
const suffix = `${Date.now()}_${process.pid}`;
const names = [`fintrack_runtime_${suffix}`, `fintrack_fresh_${suffix}`, `fintrack_legacy_${suffix}`];
const admin = new Pool({ connectionString: url('postgres'), max: 1 });
const pools = [];
const created = [];
let appDb;
const execFileAsync = promisify(execFile);
const testTlsHost = async () => {
  const code = "import { db } from './src/server/db.ts'; const pool=db(); if (pool.options.ssl?.rejectUnauthorized !== true) throw new Error('remote TLS disabled'); await pool.end();";
  await execFileAsync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: 'postgresql://user:localhostsecret@db.example.com/fintrack' },
  });
};
const migration = async (pool, file) => pool.query(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
const schema = async pool => ({
  columns: (await pool.query(`SELECT table_name,column_name,data_type,is_nullable,column_default
    FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,column_name`)).rows,
  constraints: (await pool.query(`SELECT conrelid::regclass::text AS table_name,conname,pg_get_constraintdef(oid) AS definition
    FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY conrelid::regclass::text,conname`)).rows,
  indexes: (await pool.query(`SELECT tablename,indexname,indexdef FROM pg_indexes
    WHERE schemaname='public' ORDER BY tablename,indexname`)).rows,
});
try {
  await testTlsHost();
  for (const name of names) { await admin.query(`CREATE DATABASE ${name}`); created.push(name); }
  const [runtime, fresh, legacy] = names.map(name => { const pool = new Pool({ connectionString: url(name) }); pools.push(pool); return pool; });

  process.env.DATABASE_URL = url(names[0]);
  process.env.CRON_SECRET = 'fintrack-local-integration-secret';
  const startup = "import { db, ensureSchema } from './src/server/db.ts'; await ensureSchema(); await db().end();";
  await Promise.all([0, 1].map(() => execFileAsync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', startup], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: url(names[0]) },
  })));
  const { db, ensureSchema } = await import('../src/server/db.ts');
  appDb = db;
  const { GET } = await import('../src/app/api/cron/recurring/route.ts');
  await ensureSchema(); await ensureSchema();

  for (const file of ['001_initial.sql', '002_snapshot_version.sql', '003_auth_providers.sql']) await migration(fresh, file);
  for (const file of ['001_initial.sql', '002_snapshot_version.sql', '003_auth_providers.sql']) await migration(fresh, file);
  assert.deepEqual(await schema(runtime), await schema(fresh), 'runtime and SQL migrations must create the same structure');

  await legacy.query(`CREATE TABLE users (id UUID PRIMARY KEY,name VARCHAR(60) NOT NULL,email VARCHAR(255) NOT NULL UNIQUE,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE finance_data (user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
  const legacyId = randomUUID();
  await legacy.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)', [legacyId, 'Legacy', `${legacyId}@example.invalid`, 'unused']);
  await legacy.query('INSERT INTO finance_data(user_id,data) VALUES($1,$2)', [legacyId, JSON.stringify({ name: 'Legacy', wallets: [], entries: [], budgets: [], recurring: [] })]);
  for (const file of ['001_initial.sql', '002_snapshot_version.sql', '003_auth_providers.sql']) await migration(legacy, file);
  for (const file of ['001_initial.sql', '002_snapshot_version.sql', '003_auth_providers.sql']) await migration(legacy, file);
  const legacyRow = (await legacy.query('SELECT data,version FROM finance_data WHERE user_id=$1', [legacyId])).rows[0];
  assert.equal(legacyRow.version, '1');
  assert.equal(legacyRow.data.name, 'Legacy');
  assert.deepEqual(await schema(runtime), await schema(legacy), 'upgraded schema must match runtime');

  const userId = randomUUID();
  await runtime.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)', [userId, 'Version', `${userId}@example.invalid`, 'unused']);
  await runtime.query('INSERT INTO finance_data(user_id,data) VALUES($1,$2)', [userId, JSON.stringify({ name: 'First', wallets: [], entries: [], budgets: [], recurring: [] })]);
  const first = await runtime.query('UPDATE finance_data SET data=$1,version=version+1 WHERE user_id=$2 AND version=$3 RETURNING version', [JSON.stringify({ name: 'Saved', wallets: [], entries: [], budgets: [], recurring: [] }), userId, '1']);
  const stale = await runtime.query('UPDATE finance_data SET data=$1,version=version+1 WHERE user_id=$2 AND version=$3 RETURNING version', [JSON.stringify({ name: 'Stale', wallets: [], entries: [], budgets: [], recurring: [] }), userId, '1']);
  assert.equal(first.rows[0].version, '2');
  assert.equal(stale.rowCount, 0);
  assert.equal((await runtime.query('SELECT data FROM finance_data WHERE user_id=$1', [userId])).rows[0].data.name, 'Saved');

  const cronId = randomUUID();
  const due = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const finance = { name: 'Cron', wallets: [{ id: 'cash', name: 'Tunai', type: 'cash', openingBalance: 0, color: '#000000' }], entries: [], budgets: [], recurring: [{ id: 'payday', title: 'Gaji', type: 'income', amount: 1000, walletId: 'cash', category: 'Gaji', frequency: 'yearly', nextDate: due, active: true }] };
  await runtime.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)', [cronId, 'Cron', `${cronId}@example.invalid`, 'unused']);
  await runtime.query('INSERT INTO finance_data(user_id,data) VALUES($1,$2)', [cronId, JSON.stringify(finance)]);
  const request = new NextRequest('http://localhost/api/cron/recurring', { headers: { authorization: 'Bearer fintrack-local-integration-secret' } });
  assert.deepEqual((await (await GET(request)).json()).created, 1);
  assert.deepEqual((await (await GET(request)).json()).created, 0);
  const cronRow = (await runtime.query('SELECT data,version FROM finance_data WHERE user_id=$1', [cronId])).rows[0];
  assert.equal(cronRow.data.entries.length, 1);
  assert.equal(cronRow.version, '2');
  console.log('PASS: TLS host, concurrent startup, runtime/fresh/legacy schemas, repeat migrations, legacy data, stale writes, cron idempotency');
} finally {
  if (appDb) await appDb().end();
  for (const pool of pools) await pool.end();
  for (const name of created.reverse()) await admin.query(`DROP DATABASE IF EXISTS ${name}`);
  await admin.end();
}
