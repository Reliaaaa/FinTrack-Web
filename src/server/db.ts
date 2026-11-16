import { Pool, types } from 'pg';

types.setTypeParser(1082, value => value);
let pool: Pool | undefined;
let schemaPromise: Promise<void> | undefined;
export const configured = () => Boolean(process.env.DATABASE_URL);
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diatur');
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: true } });
  return pool;
}
export function ensureSchema() {
  if (!schemaPromise) schemaPromise = db().query(`
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
  `).then(() => undefined).catch(error => { schemaPromise = undefined; throw error; });
  return schemaPromise;
}
