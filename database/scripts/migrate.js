#!/usr/bin/env node
/**
 * Applies SQL migrations in database/migrations/.
 * Tracks versions in schema_migrations (created by 001_initial_schema.sql).
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");
const isDown = process.argv.includes("--down");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Copy database/.env.example to database/.env");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    if (isDown) {
      const downFile = path.join(MIGRATIONS_DIR, "001_initial_schema.down.sql");
      const sql = fs.readFileSync(downFile, "utf8");
      console.log("Rolling back 001_initial_schema...");
      await client.query(sql);
      console.log("Rollback complete.");
      return;
    }

    const hasTracking = await tableExists(client, "schema_migrations");
    if (hasTracking) {
      const { rows } = await client.query(
        "SELECT version FROM schema_migrations WHERE version = $1",
        ["001_initial_schema"]
      );
      if (rows.length > 0) {
        console.log("001_initial_schema already applied — nothing to do.");
        return;
      }
    }

    const upFile = path.join(MIGRATIONS_DIR, "001_initial_schema.sql");
    const sql = fs.readFileSync(upFile, "utf8");
    console.log("Applying 001_initial_schema...");
    await client.query(sql);
    console.log("Migration complete.");
  } finally {
    await client.end();
  }
}

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return rows.length > 0;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
