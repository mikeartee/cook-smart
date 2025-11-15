/**
 * Database Connection Pool for Lambda Functions
 * 
 * Lambda functions are stateless, but we can reuse connections
 * across invocations within the same container instance.
 */

import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create database connection pool
 * Lambda best practice: Use 1 connection per instance
 */
export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // Lambda: 1 connection per container instance
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: {
        rejectUnauthorized: false, // AWS RDS requires SSL
      },
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  return pool;
};

/**
 * Execute a query with automatic connection management
 */
export const query = async (text: string, params?: any[]) => {
  const pool = getPool();
  return pool.query(text, params);
};

/**
 * Get a client for transaction support
 */
export const getClient = async (): Promise<PoolClient> => {
  const pool = getPool();
  return pool.connect();
};

/**
 * Close the pool (for cleanup, rarely needed in Lambda)
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
