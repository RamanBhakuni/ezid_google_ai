// Sets (or resets) a password for an existing user and marks them verified.
// Useful for accounts migrated off Firebase that have no password yet.
// Usage:  node src/setPassword.js <email> <password>
import { pool } from './pool.js';
import { hashPassword } from './auth.js';

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node src/setPassword.js <email> <password>');
  process.exit(1);
}

try {
  const hash = await hashPassword(password);
  const { rowCount } = await pool.query(
    `UPDATE users
        SET password_hash = $2, is_verified = true,
            verification_token = NULL, verification_expires = NULL
      WHERE lower(email) = lower($1)`,
    [email, hash]
  );
  if (rowCount === 0) console.error(`❌ No user found with email ${email}`);
  else console.log(`✅ Password set for ${email} (account marked verified).`);
} catch (e) {
  console.error('❌ Failed:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
