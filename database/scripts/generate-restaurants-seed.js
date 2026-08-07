#!/usr/bin/env node
/**
 * Generate a standalone, restaurants-only seed for a fresh Postgres (Cloud SQL
 * or local) — 006_manhattan_real_3000.sql by default.
 *
 * Why this exists alongside generate-seed.js:
 *   - generate-seed.js emits 002_manhattan_real.sql: a 300-venue demo fixture
 *     that also inserts the two demo users + user_preferences rows so the
 *     B-side manager flow works on its own.
 *   - This script emits the full ~3k venue pool and touches ONLY the
 *     `restaurants` table: no users, no user_preferences, no foreign keys.
 *     That makes it safe to run against a Cloud SQL instance where accounts
 *     are managed elsewhere (or don't exist yet), and it is the file to use
 *     when populating the restaurant table from scratch.
 *
 * Row values are produced by the SAME buildRecords() as generate-seed.js, so a
 * restaurant appearing in both files gets byte-identical values, and ids stay
 * the stable UUIDv5(source restaurant_id) shared with the ML pipeline. Re-runs
 * with the same flags reproduce identical SQL (bar the generated-at header).
 *
 * `manager_user_id` is deliberately left untouched (not in the column list),
 * so this seed neither requires nor clobbers manager links. Apply
 * 005_restaurant_managers.sql afterwards to attach managers.
 *
 * Source : ml-pipeline/notebooks/restaurant_clean.csv
 * Output : database/seeds/006_manhattan_real_3000.sql
 *
 * Usage:
 *   npm run generate:seed:full
 *   node scripts/generate-restaurants-seed.js --limit=3000
 *   node scripts/generate-restaurants-seed.js --radius=3000 --limit=5000
 *   node scripts/generate-restaurants-seed.js --out=/tmp/restaurants.sql
 *
 * Apply (Cloud SQL — migrations must already be applied):
 *   psql "$DATABASE_URL" -f database/seeds/006_manhattan_real_3000.sql
 */

const fs = require("fs");
const path = require("path");
const { parseArgs, selectPool } = require("./lib/restaurantPool");
const { loadPlacesCache, buildRecords, sqlStr, sqlBool } = require("./generate-seed");

const DEFAULT_OUTPUT = path.join(
  __dirname,
  "..",
  "seeds",
  "006_manhattan_real_3000.sql"
);

// Rows per INSERT. Postgres handles a single 3k-row VALUES list fine, but
// batching keeps the file readable, keeps any error message pointing at a
// small block, and stays well clear of client-side statement size limits.
const DEFAULT_BATCH_SIZE = 500;

// Every column of `restaurants` after migrations 001–014, in ordinal order, so
// the INSERT mirrors the table exactly rather than relying on defaults.
//
//   value   — how to render the column for a source record
//   refresh — whether a re-run's ON CONFLICT DO UPDATE rewrites it
//
// refresh:false marks columns this seed does not own. They are written as NULL
// on a from-scratch load (so the column set stays complete) but are never
// clobbered afterwards by whatever does own them: manager_user_id belongs to
// 005_restaurant_managers.sql, rating/reviews to the enrichment import
// (migration 013), busyness_updated_at to the ml-service (migration 014), and
// created_at is immutable. updated_at is left to the restaurants_set_updated_at
// trigger, which fires on every UPDATE.
const COLUMNS = [
  { name: "id", value: (r) => sqlStr(r.id), refresh: false },
  { name: "name", value: (r) => sqlStr(r.name), refresh: true },
  { name: "latitude", value: (r) => r.lat, refresh: true },
  { name: "longitude", value: (r) => r.lng, refresh: true },
  { name: "address_line", value: (r) => sqlStr(r.addressLine), refresh: true },
  { name: "neighborhood", value: (r) => sqlStr(r.neighborhood), refresh: true },
  { name: "hold_window_minutes", value: (r) => r.holdWindow, refresh: true },
  { name: "available_table_count", value: (r) => r.available, refresh: true },
  { name: "busyness_score", value: (r) => r.busyness.toFixed(3), refresh: true },
  { name: "is_wheelchair_accessible", value: (r) => sqlBool(r.wheelchair), refresh: true },
  { name: "sensory_friendly", value: (r) => sqlBool(r.sensory), refresh: true },
  { name: "manager_user_id", value: () => "NULL", refresh: false },
  { name: "created_at", value: () => "NOW()", refresh: false },
  { name: "updated_at", value: () => "NOW()", refresh: false },
  { name: "capacity", value: (r) => r.capacity, refresh: true },
  { name: "cuisine", value: (r) => sqlStr(r.cuisine), refresh: true },
  { name: "phone", value: (r) => sqlStr(r.phone), refresh: true },
  { name: "opens_at", value: (r) => sqlStr(r.opensAt), refresh: true },
  { name: "closes_at", value: (r) => sqlStr(r.closesAt), refresh: true },
  { name: "avg_check_per_cover", value: (r) => r.avgCheck.toFixed(2), refresh: true },
  { name: "rating", value: () => "NULL", refresh: false },
  { name: "reviews", value: () => "NULL", refresh: false },
  { name: "busyness_updated_at", value: () => "NULL", refresh: false },
];

function parseLocalArgs(argv) {
  // parseArgs defaults limit to 300 (the 002 fixture size); this seed is the
  // full pool, so default higher unless the caller says otherwise.
  const args = parseArgs(argv);
  if (!argv.some((a) => a.startsWith("--limit="))) args.limit = 3000;

  const outArg = argv.find((a) => a.startsWith("--out="));
  const batchArg = argv.find((a) => a.startsWith("--batch="));
  return {
    ...args,
    out: outArg ? path.resolve(outArg.split("=")[1]) : DEFAULT_OUTPUT,
    batchSize: batchArg ? Number(batchArg.split("=")[1]) : DEFAULT_BATCH_SIZE,
  };
}

function valueRow(r) {
  return "  (" + COLUMNS.map((c) => c.value(r)).join(", ") + ")";
}

function buildSql(records, meta) {
  const conflictUpdates = COLUMNS.filter((c) => c.refresh)
    .map((c) => `  ${c.name} = EXCLUDED.${c.name}`)
    .join(",\n");

  // Wrap the 23-column list rather than emitting one very long line.
  const columnList = COLUMNS.map((c) => c.name).reduce((lines, name) => {
    const last = lines[lines.length - 1];
    if (last && (last + ", " + name).length <= 76) {
      lines[lines.length - 1] = last + ", " + name;
    } else {
      lines.push(name);
    }
    return lines;
  }, []).map((l) => "  " + l).join(",\n");

  const header = `-- 006_manhattan_real_3000.sql — GENERATED FILE, DO NOT EDIT BY HAND.
-- Regenerate with: npm run generate:seed:full
-- (database/scripts/generate-restaurants-seed.js)
--
-- Standalone RESTAURANTS-ONLY seed: populates the \`restaurants\` table from
-- scratch on any Postgres (Cloud SQL included) once migrations 001–014 have
-- been applied. Inserts nothing into \`users\`, so it has no FK dependencies
-- and can run before any account exists.
--
-- Restaurant IDENTITY (name, address, lat/lng, cuisine) is real, from
-- ml-pipeline/notebooks/restaurant_clean.csv — the same restaurant universe
-- (and the same UUIDv5 ids) the ML model uses. Operational fields (capacity /
-- available_table_count / busyness_score / hold_window / hours /
-- avg_check_per_cover / accessibility) are SIMULATED deterministically from
-- the source id: no public dataset carries them, and seeding them this way
-- means a re-run reproduces identical values.
--
-- COLUMNS: every column of \`restaurants\` after migrations 001–014 is listed
-- explicitly, in table order, so the insert mirrors the table rather than
-- leaning on defaults. Four are deliberately written as NULL, because this
-- seed does not own them — seed them separately:
--   manager_user_id      -> 005_restaurant_managers.sql
--   rating, reviews      -> enrichment import (migration 013)
--   busyness_updated_at  -> ml-service refresh (migration 014)
-- No user or manager ids appear anywhere in this file.
--
-- Idempotent: ON CONFLICT (id) DO UPDATE refreshes the venue columns in place,
-- so re-running neither fails nor duplicates. The four columns above are
-- excluded from that UPDATE, so a re-run never clobbers manager links,
-- ratings, or busyness timestamps written by anything else. created_at is
-- likewise preserved; updated_at is maintained by the
-- restaurants_set_updated_at trigger.
--
-- The optional PostGIS \`location\` column (migration 002_postgis_optional) is
-- populated by a guarded block at the end of this file — a no-op when that
-- migration has not been applied.
--
-- Source rows           : ${meta.totalSource}
-- Origin (lat,lng)      : ${meta.origin[0]}, ${meta.origin[1]}
-- Radius (m)            : ${meta.radius}
-- Selected restaurants  : ${records.length}
-- Batches               : ${Math.ceil(records.length / meta.batchSize)} × ${meta.batchSize} rows
-- Generated at          : ${meta.generatedAt}
--
-- Apply:
--   psql "$DATABASE_URL" -f database/seeds/006_manhattan_real_3000.sql

BEGIN;

`;

  const batches = [];
  for (let i = 0; i < records.length; i += meta.batchSize) {
    const slice = records.slice(i, i + meta.batchSize);
    const from = i + 1;
    const to = i + slice.length;
    batches.push(
      `-- Restaurants ${from}–${to} of ${records.length}\n` +
        `INSERT INTO restaurants (\n${columnList}\n)\nVALUES\n` +
        slice.map(valueRow).join(",\n") +
        `\nON CONFLICT (id) DO UPDATE SET\n${conflictUpdates};\n`
    );
  }

  // Keep the optional geography column in step when PostGIS is in play; a
  // plain no-op on databases that never applied 002_postgis_optional.
  const postgisBlock = `
-- Optional PostGIS column (002_postgis_optional). Skipped when absent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'location'
  ) THEN
    UPDATE restaurants
    SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography;
  END IF;
END
$$;
`;

  return header + batches.join("\n") + postgisBlock + "\nCOMMIT;\n";
}

function main() {
  const args = parseLocalArgs(process.argv.slice(2));
  const [oLat, oLng] = args.origin;

  const { all, pool } = selectPool(args);
  const placesCache = loadPlacesCache();
  const enrichedCount = pool.filter((r) => placesCache[r.sourceId]?.matched).length;

  // managedVenues: 0 — this seed must not reference the users table.
  const records = buildRecords(pool, placesCache, { managedVenues: 0 });

  const sql = buildSql(records, {
    totalSource: all.length,
    origin: args.origin,
    radius: args.radius,
    batchSize: args.batchSize,
    generatedAt: new Date().toISOString(),
  });

  fs.writeFileSync(args.out, sql, "utf8");

  const availableCount = records.filter((r) => r.available > 0).length;
  console.log(`Generated ${path.relative(process.cwd(), args.out)}`);
  console.log(
    `  ${records.length} real restaurants within ${args.radius}m of ${oLat},${oLng}`
  );
  console.log(`  ${availableCount} with tables available (rest are "full")`);
  console.log(
    `  ${enrichedCount}/${records.length} enriched with real phone/accessibility ` +
      `(run enrich-places.js for the rest; others use simulated values)`
  );
  console.log(`  ${Math.ceil(records.length / args.batchSize)} batched INSERTs, restaurants table only`);
  console.log(`Apply with: psql "$DATABASE_URL" -f ${path.relative(process.cwd(), args.out)}`);
}

if (require.main === module) {
  main();
}

module.exports = { buildSql, COLUMNS };
