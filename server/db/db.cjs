const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://sentinel:sentinel123@localhost:5433/sentinel';

const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Execute a SQL query with optional parameters.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 500) {
        console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 80));
    }
    return result;
}

/**
 * Test the database connection.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    try {
        await pool.query('SELECT NOW()');
        return true;
    } catch (err) {
        console.error('[DB] Connection test failed:', err.message);
        return false;
    }
}

module.exports = { pool, query, testConnection };
