/**
 * Point-in-polygon neighborhood lookup against NYC's 2020 Neighborhood
 * Tabulation Areas (NTA) boundaries — replaces the hardcoded ZIP guess table
 * with the real geometry from data.cityofnewyork.us (resource 9nt8-h7nd).
 *
 * Data snapshot: database/scripts/data/manhattan_nta.geojson (38 Manhattan
 * NTAs). Regenerate with:
 *   curl -G "https://data.cityofnewyork.us/resource/9nt8-h7nd.geojson" \
 *     --data-urlencode "$where=boroname='Manhattan'" \
 *     --data-urlencode "$limit=200" \
 *     -o database/scripts/data/manhattan_nta.geojson
 */

const fs = require("fs");
const path = require("path");

const GEOJSON_PATH = path.join(__dirname, "..", "data", "manhattan_nta.geojson");

let cachedFeatures = null;

function loadFeatures() {
  if (cachedFeatures) return cachedFeatures;
  const raw = fs.readFileSync(GEOJSON_PATH, "utf8");
  const geojson = JSON.parse(raw);
  cachedFeatures = geojson.features;
  return cachedFeatures;
}

// Ray-casting point-in-ring test. ring: [[lng, lat], ...], point: [lng, lat].
function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// polygonCoords: [outerRing, hole1, hole2, ...]
function pointInPolygon(point, polygonCoords) {
  if (!pointInRing(point, polygonCoords[0])) return false;
  for (let i = 1; i < polygonCoords.length; i++) {
    if (pointInRing(point, polygonCoords[i])) return false; // inside a hole
  }
  return true;
}

function pointInMultiPolygon(point, multiPolygonCoords) {
  return multiPolygonCoords.some((poly) => pointInPolygon(point, poly));
}

/**
 * Returns the NTA name (e.g. "Chelsea-Hudson Yards") containing (lat, lng),
 * or null if the point falls outside every Manhattan NTA polygon (e.g. a
 * geocoding error placed it in the river, or just across the borough line).
 */
function lookupNeighborhood(lat, lng) {
  const point = [lng, lat]; // GeoJSON coordinate order is [lng, lat]
  const features = loadFeatures();
  for (const feature of features) {
    const geom = feature.geometry;
    let hit = false;
    if (geom.type === "Polygon") {
      hit = pointInPolygon(point, geom.coordinates);
    } else if (geom.type === "MultiPolygon") {
      hit = pointInMultiPolygon(point, geom.coordinates);
    }
    if (hit) return feature.properties.ntaname;
  }
  return null;
}

module.exports = { lookupNeighborhood };
