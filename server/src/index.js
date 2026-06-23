import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { pool } from './pool.js';
import { sendEmail, templates } from './email.js';
import {
  hashPassword, comparePassword, signToken, randomToken,
  requireAuth, requireAdmin, selfOrAdmin,
} from './auth.js';
import { rateLimit } from './rateLimit.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

// Maps a `users` row (snake_case) into the camelCase User shape the frontend
// expects. Never leaks password_hash / tokens.
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

const isAdmin = (req) =>
  req.auth?.roles?.includes('ADMIN') || req.auth?.role === 'ADMIN';

const emailKey = (prefix) => (req) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  return email ? `${prefix}:${email}` : null;
};

// One reset / verification email per address per 90 seconds (server-enforced).
const resetLimiter = rateLimit({
  windowMs: 90_000,
  keyFn: emailKey('reset'),
  message: 'Please wait before requesting another password reset link.',
});
const verifyLimiter = rateLimit({
  windowMs: 90_000,
  keyFn: emailKey('verify'),
  message: 'Please wait before requesting another verification email.',
});

/* ============================================================================
 * AUTHENTICATION (Postgres-native, replaces Firebase Auth)
 * ========================================================================= */

// register
app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw fail('Name, email and password are required.');
  if (String(password).length < 6) throw fail('Password must be at least 6 characters.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw fail('Please enter a valid email address.');
  const userRole = role || 'INDIVIDUAL';

  const existing = await pool.query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
  if (existing.rowCount > 0) throw fail('An account with this email already exists. Please log in.', 409);

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const token = randomToken();

  await pool.query(
    `INSERT INTO users
       (id, email, name, role, roles, organization_name, plan, quota_used,
        lookup_balance, quota_refreshed_at, created_at, alias_credits,
        total_lookups, is_verified, password_hash, verification_token, verification_expires)
     VALUES ($1,$2,$3,$4,$5,$6,'FREE',0,10,now(),now(),0,0,false,$7,$8, now() + interval '1 day')`,
    [id, email, name, userRole, [userRole], userRole === 'BUSINESS' ? name : null, passwordHash, token]
  );

  const link = `${APP_URL}/#/verify-email?token=${token}`;
  const tpl = templates.verifyEmail(name, link);
  sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch(() => {});

  res.json({ ok: true });
}));

// login
app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw fail('Email and password are required.');

  const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  const user = rows[0];
  if (!user || !user.password_hash) throw fail('Invalid email or password.', 401);

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw fail('Invalid email or password.', 401);

  if (!user.is_verified) throw fail('EMAIL_NOT_VERIFIED: Please verify your email before logging in.', 403);

  res.json({ token: signToken(user), user: rowToUser(user) });
}));

// current user (from token)
app.get('/api/auth/me', requireAuth, wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.auth.id]);
  res.json(rowToUser(rows[0]));
}));

// verify email (token from the link)
app.post('/api/auth/verify-email', wrap(async (req, res) => {
  const { token } = req.body;
  if (!token) throw fail('Verification token is required.');
  const { rows } = await pool.query(
    `UPDATE users
        SET is_verified = true, verification_token = NULL, verification_expires = NULL
      WHERE verification_token = $1 AND verification_expires > now()
    RETURNING email, name`,
    [token]
  );
  if (rows.length === 0) throw fail('This verification link is invalid or has expired.');

  const tpl = templates.welcome(rows[0].name);
  sendEmail({ to: rows[0].email, subject: tpl.subject, html: tpl.html }).catch(() => {});
  res.json({ ok: true });
}));

// resend verification
app.post('/api/auth/resend-verification', verifyLimiter, wrap(async (req, res) => {
  const { email } = req.body;
  if (!email) throw fail('Email is required.');
  const { rows } = await pool.query(
    'SELECT name, is_verified FROM users WHERE lower(email) = lower($1)', [email]
  );
  const user = rows[0];
  if (user && !user.is_verified) {
    const token = randomToken();
    await pool.query(
      `UPDATE users SET verification_token = $2, verification_expires = now() + interval '1 day'
        WHERE lower(email) = lower($1)`,
      [email, token]
    );
    const link = `${APP_URL}/#/verify-email?token=${token}`;
    const tpl = templates.verifyEmail(user.name, link);
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch(() => {});
  }
  res.json({ ok: true }); // never reveal whether the email exists
}));

// forgot password
app.post('/api/auth/forgot-password', resetLimiter, wrap(async (req, res) => {
  const { email } = req.body;
  if (!email) throw fail('Email is required.');
  const { rows } = await pool.query('SELECT name FROM users WHERE lower(email) = lower($1)', [email]);
  if (rows[0]) {
    const token = randomToken();
    await pool.query(
      `UPDATE users SET reset_token = $2, reset_expires = now() + interval '1 hour'
        WHERE lower(email) = lower($1)`,
      [email, token]
    );
    const link = `${APP_URL}/#/reset-password?token=${token}`;
    const tpl = templates.resetPassword(rows[0].name, link);
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch(() => {});
  }
  res.json({ ok: true }); // never reveal whether the email exists
}));

// reset password
app.post('/api/auth/reset-password', wrap(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw fail('Token and new password are required.');
  if (String(password).length < 6) throw fail('Password must be at least 6 characters.');
  const hash = await hashPassword(password);
  const { rows } = await pool.query(
    `UPDATE users
        SET password_hash = $2, reset_token = NULL, reset_expires = NULL, is_verified = true
      WHERE reset_token = $1 AND reset_expires > now()
    RETURNING email`,
    [token, hash]
  );
  if (rows.length === 0) throw fail('This reset link is invalid or has expired.');
  res.json({ ok: true });
}));

/* ============================================================================
 * USERS & PROFILES  (all require a valid token)
 * ========================================================================= */

// getUserProfile (self or admin)
app.get('/api/users/:id', requireAuth, selfOrAdmin, wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(rowToUser(rows[0]));
}));

// getAllUsers (admin only)
app.get('/api/users', requireAuth, requireAdmin, wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 100');
  res.json(rows.map(rowToUser));
}));

// addRoleToUser (self upgrade or admin)
app.post('/api/users/:id/roles', requireAuth, selfOrAdmin, wrap(async (req, res) => {
  const { role } = req.body;
  await pool.query(
    `UPDATE users
        SET roles = (SELECT ARRAY(SELECT DISTINCT unnest(array_append(roles, $2)))),
            role  = $2
      WHERE id = $1`,
    [req.params.id, role]
  );
  res.json({ ok: true });
}));

// addAliasCredit (self or admin)
app.post('/api/users/:id/alias-credit', requireAuth, selfOrAdmin, wrap(async (req, res) => {
  await pool.query('UPDATE users SET alias_credits = alias_credits + 1 WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// updateUserPlan (self or admin)
app.post('/api/users/:id/plan', requireAuth, selfOrAdmin, wrap(async (req, res) => {
  const { planName } = req.body;
  let dbPlanCode = 'FREE';
  let creditsToAdd = 0;
  if (planName?.includes('Edu')) { dbPlanCode = 'EDU_BASIC'; creditsToAdd = 500; }
  if (planName?.includes('Business') || planName?.includes('Pro')) {
    dbPlanCode = 'BUSINESS_PRO'; creditsToAdd = 10000;
  }

  const upd = await pool.query(
    `UPDATE users
        SET plan = $2, lookup_balance = lookup_balance + $3,
            plan_expiry = now() + interval '30 days', updated_at = now()
      WHERE id = $1
    RETURNING email, name, plan_expiry`,
    [req.params.id, dbPlanCode, creditsToAdd]
  );

  const row = upd.rows[0];
  if (row?.email && creditsToAdd > 0) {
    const expiry = row.plan_expiry ? new Date(row.plan_expiry).toDateString() : null;
    const { subject, html } = templates.paymentReceipt(row.name, planName, creditsToAdd, expiry);
    sendEmail({ to: row.email, subject, html }).catch(() => {});
  }

  res.json({ plan: dbPlanCode });
}));

// generateAndSaveApiKey (self or admin)
app.post('/api/users/:id/api-key', requireAuth, selfOrAdmin, wrap(async (req, res) => {
  const rnd = () => Math.random().toString(36).slice(2, 11);
  const newKey = `ez_live_${rnd()}_${rnd()}`;
  await pool.query('UPDATE users SET api_key = $1 WHERE id = $2', [newKey, req.params.id]);
  res.json({ apiKey: newKey });
}));

// adminUpdateUser (admin only)
const COLUMN_MAP = {
  email: 'email', name: 'name', role: 'role', roles: 'roles',
  shortId: 'short_id', shortIds: 'short_ids', organizationName: 'organization_name',
  plan: 'plan', quotaUsed: 'quota_used', lookupBalance: 'lookup_balance',
  aliasCredits: 'alias_credits', totalLookups: 'total_lookups',
  isVerified: 'is_verified', apiKey: 'api_key',
};
app.patch('/api/users/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
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

// deleteUser (admin only)
app.delete('/api/users/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

/* ============================================================================
 * CUSTOM SHORT-ID CLAIMING  (acts on the authenticated user)
 * ========================================================================= */

app.post('/api/short-ids/claim', requireAuth, wrap(async (req, res) => {
  const userId = req.auth.id;          // derived from token, never trusted from body
  const userEmail = req.auth.email;
  const cleanId = String(req.body.desiredId || '').toLowerCase().trim();

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
    const u = userRes.rows[0];
    const currentIds = u.short_ids || [];
    const credits = u.alias_credits || 0;
    const isFirstFree = currentIds.length === 0 && !u.short_id;

    if (!isFirstFree && credits <= 0) throw fail('Payment required for additional aliases.');

    await client.query(
      'INSERT INTO short_ids (short_id, email, owner_id, created_at) VALUES ($1,$2,$3,now())',
      [cleanId, userEmail, userId]
    );

    if (isFirstFree) {
      await client.query(
        'UPDATE users SET short_ids = array_append(short_ids, $2), short_id = $2 WHERE id = $1',
        [userId, cleanId]
      );
    } else {
      await client.query(
        `UPDATE users SET short_ids = array_append(short_ids, $2), alias_credits = alias_credits - 1 WHERE id = $1`,
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

/* ============================================================================
 * LOOKUP  (requester = authenticated user)
 * ========================================================================= */

app.post('/api/lookup', requireAuth, wrap(async (req, res) => {
  const requesterId = req.auth.id;
  const cleanId = String(req.body.shortId || '')
    .replace(/^(https?:\/\/)?ezid\.in\//, '').replace(/\/$/, '').trim();

  if (!cleanId) return res.json({ shortId: req.body.shortId, email: null, status: 'INVALID' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [requesterId]);
    const user = userRes.rows[0];
    const currentPlan = user.plan || 'FREE';
    let balance = user.lookup_balance ?? 0;

    if (currentPlan === 'FREE') {
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

    if (balance <= 0) throw fail('QUOTA_EXCEEDED: Insufficient credits. Please upgrade or top-up.');

    const idRes = await client.query('SELECT * FROM short_ids WHERE short_id = $1', [cleanId]);
    let result;
    if (idRes.rowCount > 0) {
      const data = idRes.rows[0];
      result = { shortId: cleanId, email: data.email, status: 'FOUND' };
      if (data.owner_id) {
        await client.query('UPDATE users SET total_lookups = total_lookups + 1 WHERE id = $1', [data.owner_id]);
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

app.post('/api/lookup/bulk', requireAuth, wrap(async (req, res) => {
  const requesterId = req.auth.id;
  const shortIds = req.body.shortIds;
  if (!Array.isArray(shortIds) || shortIds.length === 0) return res.json([]);

  const uniqueIds = [...new Set(
    shortIds.map((id) => String(id).replace(/^(https?:\/\/)?ezid\.in\//, '').replace(/\/$/, '').trim())
  )];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const found = await client.query(
      'SELECT short_id, email FROM short_ids WHERE short_id = ANY($1)', [uniqueIds]
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
      `UPDATE users SET lookup_balance = lookup_balance - $2, quota_used = quota_used + $2 WHERE id = $1`,
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

/* ============================================================================
 * ANALYTICS & ADMIN
 * ========================================================================= */

// getBusinessStats (self or admin)
app.get('/api/stats/:businessId', requireAuth, wrap(async (req, res) => {
  const { businessId } = req.params;
  if (businessId !== req.auth.id && !isAdmin(req)) throw fail('Not allowed.', 403);

  const lookupsRes = await pool.query(
    `SELECT id, short_id, status, found_email, timestamp, business_id
       FROM lookups WHERE business_id = $1 ORDER BY timestamp DESC LIMIT 2000`,
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

// resetDatabase (admin only)
app.post('/api/admin/reset', requireAuth, requireAdmin, wrap(async (_req, res) => {
  await pool.query('TRUNCATE lookups, short_ids, users RESTART IDENTITY CASCADE');
  res.json({ ok: true });
}));

// Generic transactional email (e.g. contact form) — open endpoint.
app.post('/api/email/send', wrap(async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) throw fail('to, subject and html are required.');
  const result = await sendEmail({ to, subject, html });
  res.json(result);
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`EZID API listening on http://localhost:${PORT}`));
