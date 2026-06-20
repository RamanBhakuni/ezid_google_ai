-- Dummy/test data for EZID. Safe to re-run (ON CONFLICT DO NOTHING).
-- These users have NO Firebase Auth account, so they can't log in — they exist
-- only as data for testing the admin panel, lookups, and stats.
-- Load with:  psql -U postgres -d ezid -f seed.sql   (or `npm run seed`)

INSERT INTO users (id, email, name, role, roles, short_id, short_ids, plan, lookup_balance, alias_credits, is_verified)
VALUES
  ('seed_rahul', 'rahul@example.com',     'Rahul Kumar',     'INDIVIDUAL', ARRAY['INDIVIDUAL'],            'rahul23',    ARRAY['rahul23'],            'FREE',          10,    0, true),
  ('seed_priya', 'priya@example.com',     'Priya Sharma',    'INDIVIDUAL', ARRAY['INDIVIDUAL'],            'priya_art',  ARRAY['priya_art'],          'FREE',          10,    0, true),
  ('seed_john',  'john@example.com',      'John Doe',        'INDIVIDUAL', ARRAY['INDIVIDUAL'],            NULL,         ARRAY[]::text[],             'FREE',          10,    0, true),
  ('seed_acme',  'sales@acmecorp.in',     'Acme Sales Team', 'BUSINESS',   ARRAY['BUSINESS'],             'acme_sales', ARRAY['acme_sales'],         'BUSINESS_PRO',  10000, 0, true),
  ('seed_edu',   'admin@school.edu',      'Springfield High','BUSINESS',   ARRAY['INDIVIDUAL','BUSINESS'],'springfield',ARRAY['springfield'],        'EDU_BASIC',     500,   2, true)
ON CONFLICT (id) DO NOTHING;

-- Give the paid business a 30-day validity window.
UPDATE users SET plan_expiry = now() + interval '30 days' WHERE id IN ('seed_acme', 'seed_edu');

-- The claimable short-id -> email mappings (what businesses look up).
INSERT INTO short_ids (short_id, email, owner_id)
VALUES
  ('rahul23',     'rahul@example.com', 'seed_rahul'),
  ('priya_art',   'priya@example.com', 'seed_priya'),
  ('acme_sales',  'sales@acmecorp.in', 'seed_acme'),
  ('springfield', 'admin@school.edu',  'seed_edu')
ON CONFLICT (short_id) DO NOTHING;
