import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './pool.js';
import { sendEmail, templates } from './email.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

// Maps a `users` row (snake_case) into the camelCase User shape the frontend
// expects. Timestamps go out as ISO strings; the client converts to Date.
function rowToUser(r) {
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    roles: r.roles || [],
    shortId: r.short_id,
    shortIds: r.short_ids || [],
    organizationName: r.organization_name,
    plan: r.plan,
    planExpiry: r.plan_expiry ? r.plan_expiry.toISOString() : null,
    quotaUsed: r.quota_used || 0,
    lookupBalance: r.lookup_balance ?? 10,
    quotaRefreshedAt: r.quota_refreshed_at ? r.quota_refreshed_at.toISOString() : null,
    createdAt: r.created_at ? r.created_at.toISOString() : null,
    aliasCredits: r.alias_credits || 0,
    totalLookups: r.total_lookups || 0,
    isVerified: r.is_verified,
    apiKey: r.api_key,
  };
}

// Wraps an async route so thrown errors become a clean JSON response.
// Use `err.status` to control the HTTP code (defaults to 400).
const wrap = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((e) => {
    console.error(`${req.method} ${req.path} failed:`, e.message);
    res.status(e.status || 400).json({ error: e.message || 'Request failed' });
  });
};

function fail(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/* ----------------------------------------------------------------------------
 * Users & profiles
 * ------------------------------------------------------------------------- */

// createUserProfile
app.post('/api/users', wrap(async (req, res) => {
  const u = req.body;
  const result = await pool.query(
    `INSERT INTO users
       (id, email, name, role, roles, short_id, short_ids, organization_name,
        plan, quota_used, lookup_balance, quota_refreshed_at, created_at,
        alias_credits, total_lookups, is_verified)
     VALUES ($1,$2,$3,$4,$5,$6,'{}',$7,$8,0,10,now(),now(),0,0,$9)
     ON CONFLICT (id) DO NOTHING`,
    [
      u.id, u.email, u.name, u.role, u.roles || [], u.shortId || null,
      u.organizationName || null, u.plan || 'FREE', u.isVerified ?? false,
    ]
  );

  // Fire a welcome email only for genuinely new rows (rowCount 0 = already existed).
  // Fire-and-forget so a mail hiccup never fails signup.
  if (result.rowCount > 0 && u.email) {
    const { subject, html } = templates.welcome(u.name);
    sendEmail({ to: u.email, subject, html }).catch(() => {});
  }

  res.json({ ok: true });
}));

// getUserProfile
app.get('/api/users/:id', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(rowToUser(rows[0]) /* null when not found */);
}));

// getAllUsers (admin)
app.get('/api/users', wrap(async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT 100'
  );
  res.json(rows.map(rowToUser));
}));

// addRoleToUser
app.post('/api/users/:id/roles', wrap(async (req, res) => {
  const { role } = req.body;
  await pool.query(
    `UPDATE users
        SET roles = (SELECT ARRAY(SELECT DISTINCT unnest(array_append(roles, $2))) ),
            role  = $2
      WHERE id = $1`,
    [req.params.id, role]
  );
  res.json({ ok: true });
}));

// addAliasCredit
app.post('/api/users/:id/alias-credit', wrap(async (req, res) => {
  await pool.query(
    'UPDATE users SET alias_credits = alias_credits + 1 WHERE id = $1',
    [req.params.id]
  );
  res.json({ ok: true });
}));

// updateUserPlan — credit/plan logic ported from the old client code
app.post('/api/users/:id/plan', wrap(async (req, res) => {
  const { planName } = req.body;
  let dbPlanCode = 'FREE';
  let creditsToAdd = 0;
  if (planName?.includes('Edu')) { dbPlanCode = 'EDU_BASIC'; creditsToAdd = 500; }
  if (planName?.includes('Business') || planName?.includes('Pro')) {
    dbPlanCode = 'BUSINESS_PRO'; creditsToAdd = 10000;
  }

  const upd = await pool.query(
    `UPDATE users
        SET plan = $2,
            lookup_balance = lookup_balance + $3,
            plan_expiry = now() + interval '30 days',
            updated_at = now()
      WHERE id = $1
    RETURNING email, name, plan_expiry`,
    [req.params.id, dbPlanCode, creditsToAdd]
  );

  // Send a purchase receipt (fire-and-forget).
  const row = upd.rows[0];
  if (row?.email && creditsToAdd > 0) {
    const expiry = row.plan_expiry ? new Date(row.plan_expiry).toDateString() : null;
    const { subject, html } = templates.paymentReceipt(row.name, planName, creditsToAdd, expiry);
    sendEmail({ to: row.email, subject, html }).catch(() => {});
  }

  res.json({ plan: dbPlanCode });
}));

// syncEmailVerification
app.post('/api/users/:id/verify', wrap(async (req, res) => {
  await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// generateAndSaveApiKey
app.post('/api/users/:id/api-key', wrap(async (req, res) => {
  const rnd = () => Math.random().toString(36).slice(2, 11);
  const newKey = `ez_live_${rnd()}_${rnd()}`;
  await pool.query('UPDATE users SET api_key = $1 WHERE id = $2', [newKey, req.params.id]);
  res.json({ apiKey: newKey });
}));

// adminUpdateUser — partial update over a whitelist of columns
const COLUMN_MAP = {
  email: 'email', name: 'name', role: 'role', roles: 'roles',
  shortId: 'short_id', shortIds: 'short_ids', organizationName: 'organization_name',
  plan: 'plan', quotaUsed: 'quota_used', lookupBalance: 'lookup_balance',
  aliasCredits: 'alias_credits', totalLookups: 'total_lookups',
  isVerified: 'is_verified', apiKey: 'api_key',
};
app.patch('/api/users/:id', wrap(async (req, res) => {
  const sets = [];
  const vals = [];
  for (const [key, value] of Object.entries(req.body)) {
    const col = COLUMN_MAP[key];
    if (!col) continue;
    vals.push(value);
    sets.push(`${col} = $${vals.length}`);
  }
  if (sets.length === 0) return res.json({ ok: true });
  vals.push(req.params.id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
  res.json({ ok: true });
}));

// deleteUser
app.delete('/api/users/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

/* ----------------------------------------------------------------------------
 * Custom short-id claiming (atomic, replaces the Firestore transaction)
 * ------------------------------------------------------------------------- */

app.post('/api/short-ids/claim', wrap(async (req, res) => {
  const { userId, userEmail, desiredId } = req.body;
  const cleanId = String(desiredId || '').toLowerCase().trim();

  if (cleanId.length < 5) throw fail('ID must be at least 5 characters long.');
  if (!/^[a-z0-9._]+$/.test(cleanId)) {
    throw fail('Only letters, numbers, dots, and underscores allowed.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const taken = await client.query('SELECT 1 FROM short_ids WHERE short_id = $1', [cleanId]);
    if (taken.rowCount > 0) throw fail(`The ID '${cleanId}' is already taken.`);

    const userRes = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const exists = userRes.rowCount > 0;
    const u = exists ? userRes.rows[0] : { short_ids: [], alias_credits: 0, short_id: null };

    const currentIds = u.short_ids || [];
    const credits = u.alias_credits || 0;
    const isFirstFree = currentIds.length === 0 && !u.short_id;

    if (!isFirstFree && credits <= 0) throw fail('Payment required for additional aliases.');

    // The user row MUST exist before inserting into short_ids (owner_id FK).
    // A missing profile means a Firebase-authed user with no Postgres row yet
    // (e.g. created before the migration) — create it now.
    if (!exists) {
      await client.query(
        `INSERT INTO users
           (id, email, name, role, roles, short_id, short_ids, plan,
            quota_used, lookup_balance, alias_credits, total_lookups, created_at)
         VALUES ($1,$2,'User','INDIVIDUAL', ARRAY['INDIVIDUAL'], $3, ARRAY[$4]::text[],
                 'FREE', 0, 10, $5, 0, now())`,
        [userId, userEmail, isFirstFree ? cleanId : null, cleanId, isFirstFree ? 0 : -1]
      );
    }

    await client.query(
      'INSERT INTO short_ids (short_id, email, owner_id, created_at) VALUES ($1,$2,$3,now())',
      [cleanId, userEmail, userId]
    );

    // For an existing user, append the alias (the new-user INSERT above already
    // set short_ids / short_id, so no update is needed in that branch).
    if (exists && isFirstFree) {
      await client.query(
        'UPDATE users SET short_ids = array_append(short_ids, $2), short_id = $2 WHERE id = $1',
        [userId, cleanId]
      );
    } else if (exists) {
      await client.query(
        `UPDATE users
            SET short_ids = array_append(short_ids, $2),
                alias_credits = alias_credits - 1
          WHERE id = $1`,
        [userId, cleanId]
      );
    }

    await client.query('COMMIT');
    res.json({ shortId: cleanId });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

/* ----------------------------------------------------------------------------
 * Core lookup (single) — balance check, lazy reset, expiry, deduct credit
 * ------------------------------------------------------------------------- */

app.post('/api/lookup', wrap(async (req, res) => {
  const { requesterId, shortId: shortIdInput } = req.body;
  const cleanId = String(shortIdInput || '')
    .replace(/^(https?:\/\/)?ezid\.in\//, '').replace(/\/$/, '').trim();

  if (!cleanId) return res.json({ shortId: shortIdInput, email: null, status: 'INVALID' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [requesterId]);
    if (userRes.rowCount === 0) throw fail('User not found', 404);
    const user = userRes.rows[0];

    const currentPlan = user.plan || 'FREE';
    let balance = user.lookup_balance ?? 0;

    if (currentPlan === 'FREE') {
      // Lazy monthly reset for free tier.
      const lastRefresh = user.quota_refreshed_at ? new Date(user.quota_refreshed_at) : null;
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      if (!lastRefresh || Date.now() - lastRefresh.getTime() > THIRTY_DAYS) {
        balance = 10;
        await client.query(
          'UPDATE users SET lookup_balance = 10, quota_refreshed_at = now() WHERE id = $1',
          [requesterId]
        );
      }
    } else {
      const expiry = user.plan_expiry ? new Date(user.plan_expiry) : null;
      if (expiry && new Date() > expiry) {
        throw fail('EXPIRED: Your plan validity has expired. Please buy a new pack.');
      }
    }

    if (balance <= 0) {
      throw fail('QUOTA_EXCEEDED: Insufficient credits. Please upgrade or top-up.');
    }

    const idRes = await client.query('SELECT * FROM short_ids WHERE short_id = $1', [cleanId]);
    let result;
    if (idRes.rowCount > 0) {
      const data = idRes.rows[0];
      result = { shortId: cleanId, email: data.email, status: 'FOUND' };
      if (data.owner_id) {
        await client.query(
          'UPDATE users SET total_lookups = total_lookups + 1 WHERE id = $1',
          [data.owner_id]
        );
      }
    } else {
      result = { shortId: cleanId, email: null, status: 'NOT_FOUND' };
    }

    await client.query(
      `INSERT INTO lookups (business_id, short_id, found_email, status, timestamp)
       VALUES ($1,$2,$3,$4,now())`,
      [requesterId, cleanId, result.email || null, result.status]
    );

    await client.query(
      'UPDATE users SET lookup_balance = lookup_balance - 1, quota_used = quota_used + 1 WHERE id = $1',
      [requesterId]
    );

    await client.query('COMMIT');
    res.json(result);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

/* ----------------------------------------------------------------------------
 * Bulk lookup — one transaction (replaces writeBatch)
 * ------------------------------------------------------------------------- */

app.post('/api/lookup/bulk', wrap(async (req, res) => {
  const { requesterId, shortIds } = req.body;
  if (!Array.isArray(shortIds) || shortIds.length === 0) return res.json([]);

  const uniqueIds = [...new Set(
    shortIds.map((id) => String(id).replace(/^(https?:\/\/)?ezid\.in\//, '').replace(/\/$/, '').trim())
  )];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const found = await client.query(
      'SELECT short_id, email FROM short_ids WHERE short_id = ANY($1)',
      [uniqueIds]
    );
    const emailById = new Map(found.rows.map((r) => [r.short_id, r.email]));

    const results = uniqueIds.map((id) =>
      emailById.has(id)
        ? { shortId: id, email: emailById.get(id), status: 'FOUND' }
        : { shortId: id, email: null, status: 'NOT_FOUND' }
    );

    for (const r of results) {
      await client.query(
        `INSERT INTO lookups (business_id, short_id, found_email, status, timestamp)
         VALUES ($1,$2,$3,$4,now())`,
        [requesterId, r.shortId, r.email, r.status]
      );
    }

    await client.query(
      `UPDATE users
          SET lookup_balance = lookup_balance - $2,
              quota_used = quota_used + $2
        WHERE id = $1`,
      [requesterId, uniqueIds.length]
    );

    await client.query('COMMIT');
    res.json(results);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

/* ----------------------------------------------------------------------------
 * Analytics & admin
 * ------------------------------------------------------------------------- */

// getBusinessStats
app.get('/api/stats/:businessId', wrap(async (req, res) => {
  const { businessId } = req.params;
  const lookupsRes = await pool.query(
    `SELECT id, short_id, status, found_email, timestamp, business_id
       FROM lookups
      WHERE business_id = $1
      ORDER BY timestamp DESC
      LIMIT 2000`,
    [businessId]
  );

  const lookups = lookupsRes.rows.map((r) => ({
    id: String(r.id),
    shortId: r.short_id,
    status: r.status,
    foundEmail: r.found_email,
    timestamp: r.timestamp ? r.timestamp.toISOString() : null,
    requesterId: r.business_id,
  }));

  const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [businessId]);
  const u = rowToUser(userRes.rows[0]);

  res.json({
    lookups,
    quota: u?.quotaUsed || 0,
    balance: u?.lookupBalance || 0,
    plan: u?.plan ?? null,
    expiry: u?.planExpiry ?? null,
  });
}));

// resetDatabase (admin)
app.post('/api/admin/reset', wrap(async (_req, res) => {
  await pool.query('TRUNCATE lookups, short_ids, users RESTART IDENTITY CASCADE');
  res.json({ ok: true });
}));

// Generic transactional email (e.g. contact form). Awaited so the caller
// learns whether it actually sent.
app.post('/api/email/send', wrap(async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) throw fail('to, subject and html are required.');
  const result = await sendEmail({ to, subject, html });
  res.json(result);
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`EZID API listening on http://localhost:${PORT}`));
