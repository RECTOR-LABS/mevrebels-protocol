/**
 * PostgreSQL Database Connection
 *
 * Manages connection pool to PostgreSQL database
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create connection pool
export const db = new Pool({
  connectionString: DATABASE_URL,
  max: 20,  // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,  // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000,  // 10 seconds for initial connection (Docker startup race condition)
});

// Error handler
db.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Utility: Execute query with automatic error handling
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await db.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Query executed:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', { text, params, error });
    throw error;
  }
}

// Utility: Get a client from the pool (for transactions)
export async function getClient(): Promise<PoolClient> {
  return await db.connect();
}
