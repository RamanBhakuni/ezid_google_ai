-- EZID Postgres schema (replaces Firestore collections: users, short_ids, lookups)

CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,           -- Firebase Auth UID
  email              TEXT,
  name               TEXT,
  role               TEXT,                       -- primary/legacy role
  roles              TEXT[]      DEFAULT '{}',    -- all assigned roles
  short_id           TEXT,                       -- primary/legacy short id
  short_ids          TEXT[]      DEFAULT '{}',    -- all owned aliases
  organization_name  TEXT,
  plan               TEXT        DEFAULT 'FREE',
  plan_expiry        TIMESTAMPTZ,
  quota_used         INTEGER     DEFAULT 0,       -- lifetime usage
  lookup_balance     INTEGER     DEFAULT 10,      -- remaining credits
  quota_refreshed_at TIMESTAMPTZ DEFAULT now(),   -- free-tier monthly reset marker
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ,
  alias_credits      INTEGER     DEFAULT 0,       -- paid-but-unclaimed aliases
  total_lookups      INTEGER     DEFAULT 0,       -- times this user was looked up
  is_verified        BOOLEAN     DEFAULT false,
  api_key            TEXT
);

CREATE TABLE IF NOT EXISTS short_ids (
  short_id   TEXT PRIMARY KEY,                    -- the claimed id (globally unique)
  email      TEXT,
  owner_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lookups (
  id          BIGSERIAL PRIMARY KEY,
  business_id TEXT,
  short_id    TEXT,
  found_email TEXT,
  status      TEXT,
  timestamp   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lookups_business ON lookups (business_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_created    ON users (created_at DESC);
