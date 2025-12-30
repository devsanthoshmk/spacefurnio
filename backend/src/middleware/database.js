/**
 * ===========================================
 * DATABASE MIDDLEWARE
 * ===========================================
 * Provides Neon PostgreSQL database connection
 */

import { neon } from '@neondatabase/serverless';

/**
 * Creates a database query function with user context for RLS
 * @param {Object} env - Environment bindings
 * @param {string|null} userId - Current user ID
 * @param {string|null} sessionId - Session ID for guest carts
 * @returns {Function} SQL query function
 */
export function createDbClient(env, userId = null, sessionId = null) {
  const sql = neon(env.DATABASE_URL);

  /**
   * Execute SQL with automatic user context setting
   * @param {string[]} strings - Template string parts
   * @param {...any} values - Template values
   */
  async function query(strings, ...values) {
    // Set user context for RLS
    if (userId) {
      await sql`SELECT set_current_user(${userId}::uuid)`;
    }
    if (sessionId) {
      await sql`SELECT set_current_session(${sessionId})`;
    }

    // Execute the actual query
    return sql(strings, ...values);
  }

  // Also expose raw sql for complex operations
  query.raw = sql;
  query.sql = sql;

  return query;
}

/**
 * Middleware to attach database client to request
 */
export async function withDb(request) {
  const { env } = request;

  // Create base SQL client (without user context - set later by auth middleware)
  const sql = neon(env.DATABASE_URL);

  request.db = sql;
  request.createDbWithContext = (userId, sessionId) => createDbClient(env, userId, sessionId);
}

/**
 * Execute a transaction
 * @param {Function} sql - SQL client
 * @param {Function} callback - Transaction callback
 */
export async function transaction(sql, callback) {
  try {
    await sql`BEGIN`;
    const result = await callback(sql);
    await sql`COMMIT`;
    return result;
  } catch (error) {
    await sql`ROLLBACK`;
    throw error;
  }
}

export default { createDbClient, withDb, transaction };
