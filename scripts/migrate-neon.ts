import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString || !/^postgres(?:ql)?:\/\//i.test(connectionString)) {
  throw new Error('DATABASE_URL is missing or is not a PostgreSQL connection string.');
}
if (process.env.CONFIRM_NEON_MIGRATION !== 'YES') {
  throw new Error('Migration not run. Set CONFIRM_NEON_MIGRATION=YES after taking a Neon backup.');
}

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.join(here, '..', 'server', 'migrations', '001_security_auth_foundation.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 10000
});

try {
  const client = await pool.connect();
  try {
    await client.query(sql);
    const result = await client.query(
      'SELECT version, applied_at FROM app_schema_migrations WHERE version = $1',
      ['001_security_auth_foundation']
    );
    if (result.rowCount !== 1) {
      throw new Error('Migration completed without a verifiable migration ledger entry.');
    }
    process.stdout.write('Neon security schema migration applied and verified. No legacy records were copied or deleted.\n');
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
