#!/usr/bin/env node
/**
 * Applies SQL migrations in database/migrations/.
 * Tracks versions in schema_migrations (created by 001_initial_schema.sql).
 * Skips optional manual migrations (e.g. 002_postgis_optional.sql).
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");
const SKIP_FILES = new Set(["002_postgis_optional.sql"]);
const isDown = process.argv.includes("--down");
const downTarget = process.argv.find((arg) => arg.startsWith("--down="));

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Copy database/.env.example to database/.env");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    if (isDown || downTarget) {
      const version = downTarget
        ? downTarget.replace("--down=", "")
        : "003_add_restaurant_capacity_cuisine";
      const downFile = path.join(MIGRATIONS_DIR, `${version}.down.sql`);
      if (!fs.existsSync(downFile)) {
        console.error(`Down migration not found: ${downFile}`);
        process.exit(1);
      }
      const sql = fs.readFileSync(downFile, "utf8");
      console.log(`Rolling back ${version}...`);
      await client.query(sql);
      console.log("Rollback complete.");
      return;
    }

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql") && !file.includes(".down.") && !SKIP_FILES.has(file))
      .sort();

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      const applied = await isMigrationApplied(client, version);
      if (applied) {
        console.log(`${version} already applied — skipping.`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`Applying ${version}...`);
      await client.query(sql);
      console.log(`${version} complete.`);
    }

    console.log("All pending migrations applied.");
  } finally {
    await client.end();
  }
}

async function isMigrationApplied(client, version) {
  const hasTracking = await tableExists(client, "schema_migrations");
  if (!hasTracking) {
    return false;
  }

  const { rows } = await client.query(
    "SELECT version FROM schema_migrations WHERE version = $1",
    [version]
  );
  return rows.length > 0;
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
