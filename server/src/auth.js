import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { pool } from './pool.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';
const TOKEN_TTL = '7d';

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const comparePassword = (pw, hash) => bcrypt.compare(pw, hash || '');

export const signToken = (user) =>
  jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });

export const verifyJwt = (token) => jwt.verify(token, JWT_SECRET);

// Opaque random token for email-verification / password-reset links.
export const randomToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Express middleware: requires a valid Bearer token. Loads the user row and
 * attaches { id, email, roles } to req.auth. Responds 401 otherwise.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required.' });

    const payload = verifyJwt(token);
    const { rows } = await pool.query(
      'SELECT id, email, roles, role FROM users WHERE id = $1',
      [payload.sub]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Account no longer exists.' });

    const u = rows[0];
    req.auth = { id: u.id, email: u.email, roles: u.roles || [], role: u.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

// Must run after requireAuth. Requires the ADMIN role.
export function requireAdmin(req, res, next) {
  if (!req.auth?.roles?.includes('ADMIN') && req.auth?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// Guard for ":id" routes — allow only the owner or an admin.
export function selfOrAdmin(req, res, next) {
  const isAdmin = req.auth?.roles?.includes('ADMIN') || req.auth?.role === 'ADMIN';
  if (req.params.id !== req.auth?.id && !isAdmin) {
    return res.status(403).json({ error: 'Not allowed.' });
  }
  next();
}
