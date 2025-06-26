// mcp-express-server/db.js
import pg from 'pg';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

/**
 * PostgreSQL connection pool configuration.
 * Environment variables are used for sensitive credentials.
 */
 const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

// Event listener for database connection errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    // Terminate the process if a critical database error occurs
    process.exit(-1);
});

console.log('PostgreSQL Pool initialized.');

/**
 * Executes a SQL query against the PostgreSQL database.
 * @param {string} text - The SQL query string.
 * @param {Array<any>} params - An array of parameters for the query.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of row objects.
 */
export const query = async (text, params) => {
    try {
        const res = await pool.query(text, params);
        console.log(res.rows);
        console.log(`[DB] SQL Query executed: "${text.substring(0, 50)}..." with params: ${JSON.stringify(params)}, rows: ${res.rows.length}`);
        return res.rows;
    } catch (err) {
        console.error(`[DB] Error executing query: "${text.substring(0, 50)}..." with params: ${JSON.stringify(params)}, error: ${err.message}`);
        throw err;
    }
};

export default pool;

