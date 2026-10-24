import { AsyncLocalStorage } from 'async_hooks';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool = null;
let pgliteInstance = null;
let isEmbedded = false;

// Directory for local development fallback data
const localDbDir = path.resolve(__dirname, '../../../.postgres-data');

export async function initDatabase() {
  if (pool || pgliteInstance) {
    return;
  }

  // Attempt external PostgreSQL connection via 'pg'
  try {
    const isRemote =
      !env.DATABASE_URL.includes('localhost') &&
      !env.DATABASE_URL.includes('127.0.0.1');
    const requiresSsl =
      isRemote ||
      env.DATABASE_URL.includes('sslmode=require') ||
      env.DATABASE_URL.includes('aivencloud.com');

    let connStr = env.DATABASE_URL;
    if (requiresSsl) {
      connStr = connStr
        .replace(/[?&]sslmode=[^&]+/i, '')
        .replace(/\?$/, '');
    }

    const testPool = new Pool({
      connectionString: connStr,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });

    const client = await testPool.connect();
    await client.query('SELECT 1');
    client.release();

    pool = testPool;
    isEmbedded = false;
    logger.info('Connected to PostgreSQL database via pg Pool');
    return;
  } catch (err) {
    logger.warn(
      { error: err.message },
      'External PostgreSQL connection failed. Falling back to embedded PostgreSQL (PGlite) for local development.'
    );
  }

  // Fallback to embedded PGlite WASM Postgres engine
  if (!fs.existsSync(localDbDir)) {
    fs.mkdirSync(localDbDir, { recursive: true });
  }

  pgliteInstance = new PGlite(localDbDir);
  await pgliteInstance.waitReady;
  isEmbedded = true;
  logger.info(`Initialized embedded PostgreSQL at ${localDbDir}`);
}

const txStorage = new AsyncLocalStorage();

/**
 * Executes a parameterized SQL query
 * @param {string} text - SQL query with $1, $2 parameters
 * @param {Array} params - Query parameters
 * @returns {Promise<{ rows: Array, rowCount: number }>}
 */
export async function query(text, params = []) {
  // If running inside a transaction, automatically route to the active transaction client
  const activeTx = txStorage.getStore();
  if (activeTx) {
    return await activeTx(text, params);
  }

  if (!pool && !pgliteInstance) {
    await initDatabase();
  }

  if (pool) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(
      { text: text.trim().slice(0, 100), duration, rows: res.rowCount },
      'Executed SQL query'
    );
    return res;
  }

  if (pgliteInstance) {
    const start = Date.now();
    const res = await pgliteInstance.query(text, params);
    const duration = Date.now() - start;
    logger.debug(
      { text: text.trim().slice(0, 100), duration, rows: res.rows?.length || 0 },
      'Executed SQL query (PGlite)'
    );
    return {
      rows: res.rows || [],
      rowCount: res.rows ? res.rows.length : res.affectedRows || 0,
    };
  }

  throw new Error('Database not initialized');
}

/**
 * Execute a callback inside a database transaction with a dedicated txQuery
 * Automatically scopes all query() calls within the transaction via AsyncLocalStorage
 * @param {Function} callback - async (txQuery) => result
 * @returns {Promise<any>}
 */
export async function withTransaction(callback) {
  if (!pool && !pgliteInstance) {
    await initDatabase();
  }

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txQuery = async (text, params = []) => {
        const start = Date.now();
        const res = await client.query(text, params);
        const duration = Date.now() - start;
        logger.debug(
          { text: text.trim().slice(0, 100), duration, rows: res.rowCount },
          'Executed TX SQL query'
        );
        return res;
      };
      const result = await txStorage.run(txQuery, () => callback(txQuery));
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  if (pgliteInstance) {
    return await pgliteInstance.transaction(async (tx) => {
      const txQuery = async (text, params = []) => {
        const start = Date.now();
        const res = await tx.query(text, params);
        const duration = Date.now() - start;
        logger.debug(
          { text: text.trim().slice(0, 100), duration, rows: res.rows?.length || 0 },
          'Executed TX SQL query (PGlite)'
        );
        return {
          rows: res.rows || [],
          rowCount: res.rows ? res.rows.length : res.affectedRows || 0,
        };
      };
      return await txStorage.run(txQuery, () => callback(txQuery));
    });
  }

  throw new Error('Database not initialized');
}

/**
 * Executes raw multi-statement SQL (e.g. migration files)
 * @param {string} text
 */
export async function exec(text) {
  if (!pool && !pgliteInstance) {
    await initDatabase();
  }

  if (pool) {
    return await pool.query(text);
  }

  if (pgliteInstance) {
    return await pgliteInstance.exec(text);
  }

  throw new Error('Database not initialized');
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.debug('Closed PostgreSQL pool');
  }
  if (pgliteInstance) {
    await pgliteInstance.close();
    pgliteInstance = null;
    logger.debug('Closed PGlite instance');
  }
}

export function isEmbeddedMode() {
  return isEmbedded;
}
