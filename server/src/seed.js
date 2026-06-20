// Loads seed.sql (dummy test data). Run: `npm run seed`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'seed.sql'), 'utf8');

try {
  await pool.query(sql);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
  console.log(`✅ Seed applied. Users in DB: ${rows[0].n}`);
} catch (e) {
  console.error('❌ Seed failed:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
