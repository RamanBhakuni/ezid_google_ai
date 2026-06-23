-- Adds Postgres-native auth columns to the existing users table.
-- Safe to re-run. Apply with: npm run migrate-auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token          TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires        TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));
