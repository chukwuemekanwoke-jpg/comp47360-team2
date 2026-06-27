#!/usr/bin/env node
/**
 * BE-9: Load seed SQL into PostgreSQL.
 * Idempotent: re-run updates rows (ON CONFLICT in seed files).
 *
 * Default      : applies 001_demo_manhattan.sql (fixed-UUID fixtures for tests).
 * With --real  : also applies 002_manhattan_real.sql (real-data demo + ML link).
 *                Generate that file first with `npm run generate:seed`.
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SEEDS_DIR = path.join(__dirname, "..", "seeds");
const DEMO_SEED = "001_demo_manhattan.sql";
const REAL_SEED = "002_manhattan_real.sql";

const includeReal = process.argv.includes("--real");

async function applySeed(client, fileName) {
  const seedPath = path.join(SEEDS_DIR, fileName);
  if (!fs.existsSync(seedPath)) {
    if (fileName === REAL_SEED) {
      console.error(
        `Real seed not found: ${seedPath}\nRun "npm run generate:seed" first.`
      );
    } else {
      console.error(`Seed file not found: ${seedPath}`);
    }
    process.exit(1);
  }

  const sql = fs.readFileSync(seedPath, "utf8");
  console.log(`Applying seed: ${fileName}`);
  await client.query(sql);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Copy database/.env.example to database/.env");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    await applySeed(client, DEMO_SEED);
    if (includeReal) {
      await applySeed(client, REAL_SEED);
    }

    const { rows: total } = await client.query(
      `SELECT COUNT(*)::int AS n FROM restaurants`
    );
    const { rows: avail } = await client.query(
      `SELECT COUNT(*)::int AS n FROM restaurants WHERE available_table_count > 0`
    );

    console.log(
      `Seed complete: ${total[0].n} restaurants total (${avail[0].n} with tables available).`
    );
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
