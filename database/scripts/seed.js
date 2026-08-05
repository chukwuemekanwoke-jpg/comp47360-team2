#!/usr/bin/env node
/**
 * BE-9: Load seed SQL into PostgreSQL.
 * Idempotent: re-run updates rows (ON CONFLICT in seed files).
 *
 * Default            : applies 001_demo_manhattan.sql (fixed-UUID fixtures for tests).
 * With --real        : also applies 002_manhattan_real.sql (real-data demo + ML link).
 *                       Generate that file first with `npm run generate:seed`.
 * With --taxi-demand : also applies 004_historical_taxi_demand.sql (static NYC TLC
 *                       drop-off zone/hour aggregates for the ML pipeline). Large
 *                       (~39k rows) and unrelated to the restaurant/booking data, so
 *                       it's opt-in rather than part of the default seed.
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SEEDS_DIR = path.join(__dirname, "..", "seeds");
const DEMO_SEED = "001_demo_manhattan.sql";
const REAL_SEED = "002_manhattan_real.sql";
const REVPASH_SEED = "003_demo_revpash_bookings.sql";
const TAXI_DEMAND_SEED = "004_historical_taxi_demand.sql";

const includeReal = process.argv.includes("--real");
const includeTaxiDemand = process.argv.includes("--taxi-demand");

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
    await applySeed(client, REVPASH_SEED);
    if (includeReal) {
      await applySeed(client, REAL_SEED);
    }
    if (includeTaxiDemand) {
      await applySeed(client, TAXI_DEMAND_SEED);
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

    if (includeTaxiDemand) {
      const { rows: taxi } = await client.query(
        `SELECT COUNT(*)::int AS n FROM historical_taxi_demand`
      );
      console.log(`historical_taxi_demand: ${taxi[0].n} rows.`);
    }

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
