#!/usr/bin/env node
/**
 * BE-9: Load demo seed SQL into PostgreSQL.
 * Idempotent: re-run updates demo rows (ON CONFLICT in seed file).
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SEEDS_DIR = path.join(__dirname, "..", "seeds");
const DEMO_SEED = "001_demo_manhattan.sql";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Copy database/.env.example to database/.env");
    process.exit(1);
  }

  const seedPath = path.join(SEEDS_DIR, DEMO_SEED);
  if (!fs.existsSync(seedPath)) {
    console.error(`Seed file not found: ${seedPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(seedPath, "utf8");
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log(`Applying seed: ${DEMO_SEED}`);
    await client.query(sql);

    const { rows } = await client.query(
      `SELECT COUNT(*)::int AS n FROM restaurants WHERE id::text LIKE '550e8400-e29b-41d4-a716-446655441%'`
    );
    const { rows: avail } = await client.query(
      `SELECT COUNT(*)::int AS n FROM restaurants
       WHERE id::text LIKE '550e8400-e29b-41d4-a716-446655441%' AND available_table_count > 0`
    );

    console.log(`Seed complete: ${rows[0].n} demo restaurants (${avail[0].n} with tables available).`);
    console.log("Demo diner X-User-Id: 550e8400-e29b-41d4-a716-446655440001");
    console.log("See database/seeds/README.md for map origin and API examples.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
