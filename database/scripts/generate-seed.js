#!/usr/bin/env node
/**
 * BE: Generate a real-data Manhattan seed (002_manhattan_real.sql) from the
 * cleaned NYC restaurant dataset used by the ML pipeline.
 *
 * Strategy (agreed with backend lead):
 *   - Restaurant IDENTITY (name, address, lat/lng, cuisine) comes from real
 *     data so the app DB shares restaurant_id space with the ML model
 *     ("fully connected" MVP) and the demo looks credible.
 *   - `neighborhood` is resolved from real NYC NTA (Neighborhood Tabulation
 *     Area) boundary geometry via database/scripts/geo/ntaLookup.js, falling
 *     back to a coarse ZIP guess only if a coordinate misses every polygon.
 *   - `phone` and `is_wheelchair_accessible` are real when
 *     database/scripts/enrich-places.js has been run (Places API (New) —
 *     paid, requires GOOGLE_MAPS_API_KEY, see that script's header before
 *     running it) and read from database/scripts/data/places-cache.json;
 *     otherwise they fall back to deterministic simulation.
 *   - Remaining Tablé OPERATIONAL fields (capacity, available tables,
 *     busyness, hold window, manager, sensory_friendly) do not exist in any
 *     public dataset, so they stay SIMULATED deterministically (seeded by
 *     restaurant_id) — re-running this script without enrichment reproduces
 *     identical SQL.
 *
 * Source : ml-pipeline/notebooks/restaurant_clean.csv
 * Output : database/seeds/002_manhattan_real.sql
 *
 * Usage:
 *   node scripts/generate-seed.js
 *   node scripts/generate-seed.js --radius=2000 --limit=500
 *   node scripts/generate-seed.js --origin=40.7589,-73.9851
 *
 * Optional (paid) enrichment, run first for real phone/accessibility data:
 *   node scripts/enrich-places.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { lookupNeighborhood } = require("./geo/ntaLookup");
const { parseArgs, selectPool } = require("./lib/restaurantPool");

const OUTPUT_SQL = path.join(__dirname, "..", "seeds", "002_manhattan_real.sql");
const PLACES_CACHE_PATH = path.join(__dirname, "data", "places-cache.json");

// Demo identities shared with 001_demo_manhattan.sql / seeds/README.md
const DEMO_DINER_ID = "550e8400-e29b-41d4-a716-446655440001";
const DEMO_MANAGER_ID = "550e8400-e29b-41d4-a716-446655440002";

// Fixed namespace so restaurant_id -> UUID is stable across runs/machines.
const TABLE_NAMESPACE = "5f3e9b2a-1c4d-4e8f-9a7b-2d6c8e0f1a3b";

// ---------------------------------------------------------------------------
// Places API enrichment cache (see enrich-places.js) \u2014 phone + wheelchair
// accessibility, keyed by the same restaurant_id used throughout this file.
// Absent/empty when enrich-places.js hasn't been run; callers fall back to
// simulated values in that case.
// ---------------------------------------------------------------------------
function loadPlacesCache() {
  if (!fs.existsSync(PLACES_CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(PLACES_CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Deterministic UUIDv5 (namespaced SHA-1) — stable id per source restaurant
// ---------------------------------------------------------------------------
function uuidToBytes(uuid) {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

function uuidv5(name, namespaceUuid) {
  const hash = crypto.createHash("sha1");
  hash.update(uuidToBytes(namespaceUuid));
  hash.update(Buffer.from(name, "utf8"));
  const bytes = hash.digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

// ---------------------------------------------------------------------------
// Deterministic PRNG seeded from the source id (mulberry32)
// ---------------------------------------------------------------------------
function seedFromString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
function titleCase(input) {
  return input
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/'[A-Z]\b/g, (m) => m.toLowerCase()); // Patsy'S -> Patsy's
}

function streetFromAddress(address) {
  if (!address) return null;
  const cut = address.split(/,\s*MANHATTAN/i)[0] || address.split(",")[0];
  const street = titleCase(cut.trim()).replace(/\s{2,}/g, " ");
  return street || null;
}

function cuisineSlug(cuisine) {
  if (!cuisine) return null;
  const primary = cuisine.split(/[,/]/)[0].trim().toLowerCase();
  const slug = primary.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return slug || null;
}

// Approximate Manhattan ZIP -> neighborhood (fallback: "Manhattan")
const ZIP_NEIGHBORHOOD = {
  "10001": "Chelsea",
  "10002": "Lower East Side",
  "10003": "East Village",
  "10004": "Financial District",
  "10005": "Financial District",
  "10006": "Financial District",
  "10007": "Tribeca",
  "10009": "East Village",
  "10010": "Gramercy",
  "10011": "Chelsea",
  "10012": "NoHo",
  "10013": "Tribeca",
  "10014": "West Village",
  "10016": "Murray Hill",
  "10017": "Midtown East",
  "10018": "Garment District",
  "10019": "Hell's Kitchen",
  "10020": "Midtown",
  "10021": "Upper East Side",
  "10022": "Midtown East",
  "10023": "Upper West Side",
  "10024": "Upper West Side",
  "10025": "Upper West Side",
  "10026": "Harlem",
  "10027": "Harlem",
  "10028": "Upper East Side",
  "10029": "East Harlem",
  "10036": "Theater District",
  "10038": "Financial District",
  "10128": "Upper East Side",
};

function neighborhoodFromZip(zip) {
  return ZIP_NEIGHBORHOOD[zip] || "Manhattan";
}

// Real NTA (Neighborhood Tabulation Area) point-in-polygon lookup, falling
// back to the ZIP guess table only when a coordinate falls outside every
// Manhattan NTA polygon (bad geocode, or right on the borough line).
function resolveNeighborhood(lat, lng, zip) {
  return lookupNeighborhood(lat, lng) || neighborhoodFromZip(zip);
}

// ---------------------------------------------------------------------------
// Simulated operational fields (deterministic per source id)
// ---------------------------------------------------------------------------
function cuisineBenchmarkCheck(cuisine) {
  switch (cuisine) {
    case "french":
      return 85;
    case "italian":
      return 68;
    case "japanese":
      return 55;
    case "thai":
      return 42;
    case "cafe":
      return 32;
    case "american":
      return 48;
    default:
      return 45;
  }
}

function neighborhoodPremium(neighborhood) {
  if (["Midtown", "Midtown East", "Theater District", "Upper East Side"].includes(neighborhood)) {
    return 1.1;
  }
  if (["Hell's Kitchen", "Murray Hill", "Koreatown"].includes(neighborhood)) {
    return 1.05;
  }
  return 1;
}

function simulateOperations(sourceId, placesEntry, cuisine, neighborhood) {
  const rnd = mulberry32(seedFromString(sourceId));

  const capacity = 4 + Math.floor(rnd() * 17); // 4..20
  const busyness = Math.round(rnd() * 1000) / 1000; // 0.000..1.000

  // Tables loosely track (inverse) busyness; clamp into [0, capacity].
  let available = Math.round(capacity * (1 - busyness));
  available = Math.max(0, Math.min(capacity, available));

  const holdWindow = [10, 15, 20][Math.floor(rnd() * 3)];
  // Draw order preserved exactly as before so simulated fallback values for
  // restaurants without a Places match don't churn on every regeneration.
  const simulatedWheelchair = rnd() < 0.4;
  const sensory = rnd() < 0.25; // no public data source exists for this — stays simulated

  const dinnerOnly = rnd() < 0.2;
  const opensAt = dinnerOnly ? "17:00" : ["10:00", "11:00", "11:30"][Math.floor(rnd() * 3)];
  const closesAt = dinnerOnly ? "23:00" : ["21:00", "22:00", "23:00"][Math.floor(rnd() * 3)];
  const avgCheck = Math.round(cuisineBenchmarkCheck(cuisine) * neighborhoodPremium(neighborhood) * 100) / 100;

  // Real values from Places API (New) when enrich-places.js has resolved this
  // restaurant; otherwise fall back to the deterministic simulation so the
  // seed still works without ever running the (paid) enrichment step.
  const wheelchair =
    placesEntry && placesEntry.matched && placesEntry.wheelchairAccessibleEntrance !== null
      ? placesEntry.wheelchairAccessibleEntrance
      : simulatedWheelchair;
  const phone = placesEntry && placesEntry.matched ? placesEntry.phone : null;

  return {
    capacity,
    busyness,
    available,
    holdWindow,
    wheelchair,
    sensory,
    phone,
    opensAt,
    closesAt,
    avgCheck,
  };
}

// ---------------------------------------------------------------------------
// SQL emit
// ---------------------------------------------------------------------------
function sqlStr(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlBool(value) {
  return value ? "TRUE" : "FALSE";
}

function buildSql(records, meta) {
  const header = `-- 002_manhattan_real.sql — GENERATED FILE, DO NOT EDIT BY HAND.
-- Regenerate with: npm run generate:seed  (database/scripts/generate-seed.js)
--
-- Real Manhattan restaurant IDENTITY from ml-pipeline/notebooks/restaurant_clean.csv
-- (shared restaurant universe with the ML model). Operational fields
-- (capacity / available_table_count / busyness_score / hold_window /
-- manager / accessibility) are SIMULATED deterministically from the source id.
--
-- Source rows           : ${meta.totalSource}
-- Origin (lat,lng)      : ${meta.origin[0]}, ${meta.origin[1]}
-- Radius (m)            : ${meta.radius}
-- Selected restaurants  : ${records.length}
-- Generated at          : ${meta.generatedAt}

BEGIN;

-- Demo users (kept in sync with 001_demo_manhattan.sql) so manager FK + diner
-- discovery work even when this seed is applied on its own.
INSERT INTO users (id, display_name, budget_tier, dietary_tags, last_lat, last_lng)
VALUES
  ('${DEMO_DINER_ID}', 'Demo Diner', 'TIER_2', ARRAY['vegan'], ${meta.origin[0]}, ${meta.origin[1]}),
  ('${DEMO_MANAGER_ID}', 'Demo Manager', NULL, '{}', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_preferences (
  user_id, budget_tier, dietary_restrictions, preferred_cuisines, dining_styles
)
VALUES
  ('${DEMO_DINER_ID}', 'TIER_2', ARRAY['vegan'], '{}', '{}'),
  ('${DEMO_MANAGER_ID}', NULL, '{}', '{}', '{}')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO restaurants (
  id, name, latitude, longitude, address_line, neighborhood,
  hold_window_minutes, available_table_count, busyness_score,
  capacity, cuisine, phone,
  opens_at, closes_at, avg_check_per_cover,
  is_wheelchair_accessible, sensory_friendly, manager_user_id
)
VALUES
`;

  const valueRows = records.map((r) => {
    return (
      "  (" +
      [
        sqlStr(r.id),
        sqlStr(r.name),
        r.lat,
        r.lng,
        sqlStr(r.addressLine),
        sqlStr(r.neighborhood),
        r.holdWindow,
        r.available,
        r.busyness.toFixed(3),
        r.capacity,
        sqlStr(r.cuisine),
        sqlStr(r.phone),
        sqlStr(r.opensAt),
        sqlStr(r.closesAt),
        r.avgCheck.toFixed(2),
        sqlBool(r.wheelchair),
        sqlBool(r.sensory),
        r.managerId ? sqlStr(r.managerId) : "NULL",
      ].join(", ") +
      ")"
    );
  });

  const footer = `
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  address_line = EXCLUDED.address_line,
  neighborhood = EXCLUDED.neighborhood,
  hold_window_minutes = EXCLUDED.hold_window_minutes,
  available_table_count = EXCLUDED.available_table_count,
  busyness_score = EXCLUDED.busyness_score,
  capacity = EXCLUDED.capacity,
  cuisine = EXCLUDED.cuisine,
  phone = EXCLUDED.phone,
  opens_at = EXCLUDED.opens_at,
  closes_at = EXCLUDED.closes_at,
  avg_check_per_cover = EXCLUDED.avg_check_per_cover,
  is_wheelchair_accessible = EXCLUDED.is_wheelchair_accessible,
  sensory_friendly = EXCLUDED.sensory_friendly,
  manager_user_id = EXCLUDED.manager_user_id;

COMMIT;
`;

  return header + valueRows.join(",\n") + footer;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const args = parseArgs(process.argv.slice(2));
  const [oLat, oLng] = args.origin;

  const { all, pool } = selectPool(args);
  const placesCache = loadPlacesCache();
  const enrichedCount = pool.filter((r) => placesCache[r.sourceId]?.matched).length;

  const records = pool.map((r, index) => {
    const slug = cuisineSlug(r.cuisine);
    const neighborhood = resolveNeighborhood(r.lat, r.lng, r.zipcode);
    const ops = simulateOperations(r.sourceId, placesCache[r.sourceId], slug, neighborhood);
    return {
      id: uuidv5(r.sourceId, TABLE_NAMESPACE),
      name: titleCase(r.name).replace(/\s{2,}/g, " "),
      lat: r.lat,
      lng: r.lng,
      addressLine: streetFromAddress(r.address),
      neighborhood,
      cuisine: slug,
      phone: ops.phone,
      holdWindow: ops.holdWindow,
      available: ops.available,
      busyness: ops.busyness,
      capacity: ops.capacity,
      opensAt: ops.opensAt,
      closesAt: ops.closesAt,
      avgCheck: ops.avgCheck,
      wheelchair: ops.wheelchair,
      sensory: ops.sensory,
      // Give the demo manager 2 nearest venues so the B-side flow has data.
      managerId: index < 2 ? DEMO_MANAGER_ID : null,
    };
  });

  const sql = buildSql(records, {
    totalSource: all.length,
    origin: args.origin,
    radius: args.radius,
    generatedAt: new Date().toISOString(),
  });

  fs.writeFileSync(OUTPUT_SQL, sql, "utf8");

  const availableCount = records.filter((r) => r.available > 0).length;
  console.log(`Generated ${path.relative(process.cwd(), OUTPUT_SQL)}`);
  console.log(
    `  ${records.length} real restaurants within ${args.radius}m of ${oLat},${oLng}`
  );
  console.log(`  ${availableCount} with tables available (rest are "full")`);
  console.log(
    `  ${enrichedCount}/${records.length} enriched with real phone/accessibility (run enrich-places.js for the rest; others use simulated values)`
  );
  console.log(`  Manager (${DEMO_MANAGER_ID}) assigned to ${Math.min(2, records.length)} venue(s).`);
  console.log("Apply with: npm run seed:real");
}

main();
