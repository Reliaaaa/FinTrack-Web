import { Pool, types } from 'pg';

types.setTypeParser(1082, value => value);
let pool: Pool | undefined;
let schemaPromise: Promise<void> | undefined;
export const configured = () => Boolean(process.env.DATABASE_URL);
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diatur');
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, ssl: ['localhost', '127.0.0.1', '[::1]'].includes(host) ? false : { rejectUnauthorized: true } });
  return pool;
}
async function migrateSchema() {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1,$2)', [1179209300, 1396918341]);
    await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY, name VARCHAR(60) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash CHAR(64) PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS finance_data (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL, version BIGINT NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1;
    CREATE TABLE IF NOT EXISTS auth_attempts (
      key TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0,
      window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS google_accounts (
      subject TEXT PRIMARY KEY, user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      token_hash CHAR(64) PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
    `);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
export function ensureSchema() {
  if (!schemaPromise) schemaPromise = migrateSchema().catch(error => { schemaPromise = undefined; throw error; });
  return schemaPromise;
}
