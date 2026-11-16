-- Safe to run more than once against databases created before snapshot versioning.
ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1;
