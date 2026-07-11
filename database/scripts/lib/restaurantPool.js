/**
 * Shared restaurant-pool selection logic used by both generate-seed.js and
 * enrich-places.js. Both scripts MUST select the exact same restaurant
 * subset (same source CSV, same distance filter/sort/limit) so that
 * places-cache.json entries line up with the rows generate-seed.js emits.
 */

const fs = require("fs");
const path = require("path");

const SOURCE_CSV = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "ml-pipeline",
  "notebooks",
  "restaurant_clean.csv"
);

function parseArgs(argv) {
  const args = { radius: 1500, limit: 300, origin: [40.7589, -73.9851] };
  for (const a of argv) {
    if (a.startsWith("--radius=")) args.radius = Number(a.split("=")[1]);
    else if (a.startsWith("--limit=")) args.limit = Number(a.split("=")[1]);
    else if (a.startsWith("--origin=")) {
      const [lat, lng] = a.split("=")[1].split(",").map(Number);
      args.origin = [lat, lng];
    }
  }
  return args;
}

// Minimal RFC-4180 CSV parsing (handles quoted fields with commas/quotes)
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function readRestaurants(csvPath) {
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^﻿/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const col = Object.fromEntries(header.map((h, i) => [h, i]));

  const seen = new Set();
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
    const id = (f[col.restaurant_id] || "").trim();
    if (!id || seen.has(id)) continue;

    const lat = Number(f[col.lat]);
    const lng = Number(f[col.lon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const name = (f[col.name] || "").trim();
    if (!name) continue;

    seen.add(id);
    rows.push({
      sourceId: id,
      name,
      cuisine: (f[col.cuisine] || "").trim(),
      address: (f[col.address] || "").trim(),
      zipcode: (f[col.zipcode] || "").trim(),
      lat,
      lng,
    });
  }
  return rows;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Returns { all, pool } — `all` is every parsed CSV row (for reporting
// totals), `pool` is the distance-filtered/sorted/limited selection that
// generate-seed.js turns into SQL rows.
function selectPool(args, csvPath = SOURCE_CSV) {
  const all = readRestaurants(csvPath);
  const [oLat, oLng] = args.origin;

  const pool = all
    .map((r) => ({ ...r, distance: haversineMeters(oLat, oLng, r.lat, r.lng) }))
    .filter((r) => r.distance <= args.radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, args.limit);

  return { all, pool };
}

module.exports = {
  SOURCE_CSV,
  parseArgs,
  parseCsvLine,
  readRestaurants,
  haversineMeters,
  selectPool,
};
