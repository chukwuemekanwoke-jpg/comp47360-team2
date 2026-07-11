#!/usr/bin/env node
/**
 * Enrich the real-Manhattan restaurant pool (same selection as
 * generate-seed.js — see lib/restaurantPool.js) with phone number and
 * wheelchair-accessibility from Places API (New) Text Search, caching
 * results to database/scripts/data/places-cache.json.
 *
 * generate-seed.js reads that cache automatically and overrides its
 * simulated `phone`/`is_wheelchair_accessible` values wherever a match
 * exists. Restaurants with no cache entry keep the simulated fallback, so
 * it's always safe to run generate-seed.js without ever running this script.
 *
 * COST: this calls a paid Google API. Each uncached restaurant costs one
 * Text Search (New) call requesting nationalPhoneNumber (Enterprise SKU) +
 * accessibilityOptions (Pro SKU) — bills at the Enterprise rate, currently
 * ~$35 / 1000 calls beyond Google's free monthly allowance. For the default
 * 300-restaurant pool that's a few dollars at most, likely free under the
 * monthly allowance, but confirm current pricing/quota in the Google Cloud
 * Console before running against a much larger --limit.
 *
 * Requires GOOGLE_MAPS_API_KEY (backend/api-gateway/.env) to have
 * "Places API (New)" enabled on its GCP project — it's currently only
 * confirmed enabled for the Routes API used by googleDistanceMatrix.js.
 * Enable it at: console.cloud.google.com -> APIs & Services -> Library.
 *
 * Safe to re-run: already-cached restaurants are skipped, and the cache is
 * saved after every request so an interrupted run loses no progress/spend.
 *
 * Usage:
 *   node scripts/enrich-places.js
 *   node scripts/enrich-places.js --radius=2000 --limit=500
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "backend", "api-gateway", ".env"),
});
const { parseArgs, selectPool } = require("./lib/restaurantPool");

const CACHE_PATH = path.join(__dirname, "data", "places-cache.json");
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = "places.id,places.nationalPhoneNumber,places.accessibilityOptions";
const REQUEST_DELAY_MS = 150; // stay well under Places API QPS limits

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function lookupPlace(name, address) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: `${name}, ${address}`,
      maxResultCount: 1,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Places API HTTP ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const place = data.places && data.places[0];
  if (!place) return { matched: false };

  return {
    matched: true,
    placeId: place.id || null,
    phone: place.nationalPhoneNumber || null,
    wheelchairAccessibleEntrance:
      (place.accessibilityOptions && place.accessibilityOptions.wheelchairAccessibleEntrance) ?? null,
  };
}

async function main() {
  if (!API_KEY) {
    console.error(
      "GOOGLE_MAPS_API_KEY not set in backend/api-gateway/.env — aborting before spending anything."
    );
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const { pool } = selectPool(args);
  const cache = loadCache();

  const todo = pool.filter((r) => !cache[r.sourceId]);
  console.log(
    `Pool: ${pool.length} restaurants. Already cached: ${pool.length - todo.length}. To fetch: ${todo.length}.`
  );
  if (todo.length === 0) {
    console.log("Nothing to do — cache already covers this pool.");
    return;
  }

  let matched = 0;
  let failed = 0;

  for (let i = 0; i < todo.length; i++) {
    const r = todo[i];
    try {
      const result = await lookupPlace(r.name, r.address);
      cache[r.sourceId] = { ...result, fetchedAt: new Date().toISOString() };
      if (result.matched) matched++;
      console.log(`[${i + 1}/${todo.length}] ${r.name} -> ${result.matched ? "matched" : "no match"}`);
    } catch (err) {
      failed++;
      console.error(`[${i + 1}/${todo.length}] ${r.name} -> ERROR: ${err.message}`);
    }

    // Save after every call so an interrupted run doesn't lose progress
    // (and doesn't re-spend on restaurants already resolved).
    saveCache(cache);
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(
    `Done. Matched ${matched}/${todo.length} (${failed} errors). Cache written to ${CACHE_PATH}.`
  );
  console.log("Re-run generate-seed.js to bake these values into the seed SQL.");
}

main();
