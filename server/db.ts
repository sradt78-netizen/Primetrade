import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_COPY_TRADERS } from '../src/data/copyTraders';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory fallback if no PostgreSQL is configured yet
let pgPool: pg.Pool | null = null;
let currentDbUrl: string = '';

export function getDatabaseUrl(): string {
  // Check process.env first
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 10) {
    return process.env.DATABASE_URL.trim();
  }
  // Try reading from .env file
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath));
      if (parsed.DATABASE_URL && parsed.DATABASE_URL.trim().length > 10) {
        process.env.DATABASE_URL = parsed.DATABASE_URL.trim();
        return parsed.DATABASE_URL.trim();
      }
    }
  } catch (_) {}
  return '';
}

export function initPgPool(dbUrl?: string): pg.Pool | null {
  const targetUrl = (dbUrl || getDatabaseUrl()).trim();
  if (!targetUrl || !targetUrl.startsWith('postgres')) {
    return null;
  }

  if (pgPool && currentDbUrl === targetUrl) {
    return pgPool;
  }

  try {
    if (pgPool) {
      pgPool.end().catch(() => {});
    }
    pgPool = new Pool({
      connectionString: targetUrl,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000,
      max: 10
    });
    currentDbUrl = targetUrl;
    console.log('[Neon PostgreSQL] Pool initialized for host:', new URL(targetUrl).hostname);
    return pgPool;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Pool init failed:', err.message);
    return null;
  }
}

export async function checkDbConnection(customUrl?: string) {
  const url = (customUrl || getDatabaseUrl()).trim();
  if (!url || !url.startsWith('postgres')) {
    return {
      connected: false,
      type: 'local_fallback',
      databaseUrlConfigured: false,
      error: 'No DATABASE_URL configured yet. Provide your Neon PostgreSQL connection string to activate.'
    };
  }

  const pool = initPgPool(url);
  if (!pool) {
    return {
      connected: false,
      type: 'neon_postgres',
      databaseUrlConfigured: true,
      error: 'Failed to create Postgres connection pool. Invalid URL format.'
    };
  }

  const startTime = Date.now();
  try {
    const client = await pool.connect();
    try {
      const pingRes = await client.query('SELECT NOW() as now, current_database() as db_name, version() as pg_version');
      const latency = Date.now() - startTime;
      const hostname = new URL(url).hostname;
      const dbName = pingRes.rows[0]?.db_name || 'neondb';

      // Check / Create tables
      await initTables(client);

      // Check counts
      const userCountRes = await client.query('SELECT COUNT(*) FROM users');
      const traderCountRes = await client.query('SELECT COUNT(*) FROM copy_traders');
      const subCountRes = await client.query('SELECT COUNT(*) FROM copy_subscriptions');

      return {
        connected: true,
        type: 'neon_postgres',
        databaseUrlConfigured: true,
        host: hostname,
        database: dbName,
        latencyMs: latency,
        pgVersion: pingRes.rows[0]?.pg_version?.slice(0, 30) || 'PostgreSQL',
        tablesInitialized: true,
        counts: {
          users: parseInt(userCountRes.rows[0]?.count || '0', 10),
          traders: parseInt(traderCountRes.rows[0]?.count || '0', 10),
          subscriptions: parseInt(subCountRes.rows[0]?.count || '0', 10)
        }
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      connected: false,
      type: 'neon_postgres',
      databaseUrlConfigured: true,
      host: new URL(url).hostname,
      error: err.message || 'Connection failed'
    };
  }
}

export async function initTables(client: pg.PoolClient) {
  // 1. Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      username VARCHAR(100) UNIQUE,
      email VARCHAR(255) UNIQUE,
      full_name VARCHAR(255),
      account_balance NUMERIC(15, 2) DEFAULT 0.00,
      demo_balance NUMERIC(15, 2) DEFAULT 50000.00,
      kyc_tier VARCHAR(50) DEFAULT 'Unverified',
      is_kyc_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Copy Traders table
  await client.query(`
    CREATE TABLE IF NOT EXISTS copy_traders (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      specialty VARCHAR(100) NOT NULL,
      badge VARCHAR(50) DEFAULT 'Active',
      rating NUMERIC(3, 1) DEFAULT 5.0,
      review_count INT DEFAULT 5,
      followers INT DEFAULT 0,
      win_rate NUMERIC(5, 2) DEFAULT 80.0,
      total_return NUMERIC(15, 2) DEFAULT 0.0,
      equity NUMERIC(15, 2) DEFAULT 0.0,
      total_trades INT DEFAULT 0,
      min_investment NUMERIC(15, 2) DEFAULT 100.0,
      bio TEXT,
      risk_score INT DEFAULT 4,
      profit_shared NUMERIC(5, 2) DEFAULT 10.0,
      preferred_asset VARCHAR(100),
      avatar VARCHAR(255),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Copy Subscriptions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS copy_subscriptions (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100),
      trader_id VARCHAR(100) REFERENCES copy_traders(id),
      trader_name VARCHAR(150),
      trader_specialty VARCHAR(100),
      allocated_amount NUMERIC(15, 2) NOT NULL,
      current_profit NUMERIC(15, 2) DEFAULT 0.00,
      profit_percentage NUMERIC(6, 2) DEFAULT 0.00,
      status VARCHAR(50) DEFAULT 'active',
      copied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed copy traders if empty
  const countRes = await client.query('SELECT COUNT(*) FROM copy_traders');
  if (parseInt(countRes.rows[0]?.count || '0', 10) === 0) {
    console.log(`[Neon PostgreSQL] Seeding ${INITIAL_COPY_TRADERS.length} expert traders into database...`);
    for (const t of INITIAL_COPY_TRADERS) {
      await client.query(`
        INSERT INTO copy_traders (
          id, name, specialty, badge, rating, review_count, followers,
          win_rate, total_return, equity, total_trades, min_investment,
          bio, risk_score, profit_shared, preferred_asset, avatar
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) ON CONFLICT (id) DO NOTHING;
      `, [
        t.id, t.name, t.specialty, t.badge, t.rating, t.reviewCount, t.followers,
        t.winRate, t.totalReturn, t.equity, t.totalTrades, t.minInvestment,
        t.description, t.riskScore, t.profitShared, t.preferredAsset, t.avatar
      ]);
    }
  }
}

export async function getCopyTraders() {
  const pool = initPgPool();
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        const res = await client.query('SELECT * FROM copy_traders ORDER BY followers DESC');
        if (res.rows && res.rows.length > 0) {
          return res.rows.map(r => ({
            id: r.id,
            name: r.name,
            specialty: r.specialty,
            badge: r.badge,
            rating: Number(r.rating),
            reviewCount: Number(r.review_count),
            followers: Number(r.followers),
            winRate: Number(r.win_rate),
            totalReturn: Number(r.total_return),
            equity: Number(r.equity),
            totalTrades: Number(r.total_trades),
            minInvestment: Number(r.min_investment),
            description: r.bio,
            riskScore: Number(r.risk_score),
            profitShared: Number(r.profit_shared),
            preferredAsset: r.preferred_asset,
            avatar: r.avatar
          }));
        }
      } finally {
        client.release();
      }
    } catch (_) {}
  }
  return INITIAL_COPY_TRADERS;
}

// In-memory fallback subscriptions
const inMemorySubscriptions: any[] = [];

export async function addCopySubscription(sub: {
  id: string;
  userId?: string;
  traderId: string;
  traderName: string;
  traderSpecialty: string;
  amount: number;
}) {
  const pool = initPgPool();
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO copy_subscriptions (
            id, user_id, trader_id, trader_name, trader_specialty, allocated_amount, status
          ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
        `, [sub.id, sub.userId || 'demo_user', sub.traderId, sub.traderName, sub.traderSpecialty, sub.amount]);
        return { success: true, persisted: 'neon_postgres' };
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[Neon PostgreSQL] Failed to save subscription to DB, falling back to memory:', err.message);
    }
  }
  inMemorySubscriptions.push({
    ...sub,
    allocated_amount: sub.amount,
    current_profit: 0,
    profit_percentage: 0,
    status: 'active',
    copied_at: new Date().toISOString()
  });
  return { success: true, persisted: 'local_memory' };
}
