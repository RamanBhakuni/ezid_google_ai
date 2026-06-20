// Applies schema.sql to the configured database. Run once: `npm run init-db`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'schema.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('✅ Schema applied successfully.');
} catch (e) {
  console.error('❌ Failed to apply schema:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
