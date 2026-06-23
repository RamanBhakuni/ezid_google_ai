// Applies migrate_auth.sql. Run once: `npm run migrate-auth`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'migrate_auth.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('✅ Auth columns migrated.');
} catch (e) {
  console.error('❌ Migration failed:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
