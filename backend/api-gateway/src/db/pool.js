const { Pool } = require("pg");
const config = require("../config");

let pool = null;

function getPool() {
  if (!config.databaseUrl) {
    return null;
  }
  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl });
  }
  return pool;
}

async function checkConnection() {
  const db = getPool();
  if (!db) {
    return { configured: false, ok: false };
  }
  try {
    await db.query("SELECT 1 AS ok");
    return { configured: true, ok: true };
  } catch (err) {
    return { configured: true, ok: false, message: err.message };
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, checkConnection, closePool };
