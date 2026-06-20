import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Single shared connection pool for the whole API.
export const pool = new pg.Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'ezid',
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error:', err);
});
