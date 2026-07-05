const config = require("../config");

// Tablé transport modes -> Google Routes API `travelMode` values.
const MODE_MAP = {
  walking: "WALK",
  driving: "DRIVE",
  transit: "TRANSIT",
  cycling: "BICYCLE",
};

// Routes API returns durations as protobuf strings like "244s".
function parseDurationSeconds(duration) {
  if (typeof duration !== "string") {
    return NaN;
  }
  const match = duration.match(/^(\d+(?:\.\d+)?)s$/);
  return match ? Number(match[1]) : NaN;
}

function buildWaypoint(lat, lng) {
  return { waypoint: { location: { latLng: { latitude: lat, longitude: lng } } } };
}

/**
 * Fetch travel time (minutes) from the Google Routes API (computeRouteMatrix)
 * for a single origin/destination pair. Throws on missing key, network/timeout,
 * non-OK HTTP, or an unroutable pair so the caller can fall back to a local
 * estimate. Kept name-compatible with the previous Distance Matrix client so
 * the resolver/route/booking layers are unchanged.
 */
async function getDistanceMatrixDurationMinutes({
  originLat,
  originLng,
  destLat,
  destLng,
  transportMode,
}) {
  if (!config.googleMapsApiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY not configured");
  }

  const travelMode = MODE_MAP[transportMode] || MODE_MAP.walking;

  const body = {
    origins: [buildWaypoint(originLat, originLng)],
    destinations: [buildWaypoint(destLat, destLng)],
    travelMode,
  };

  // routingPreference is only valid for DRIVE / TWO_WHEELER; sending it for
  // WALK/BICYCLE/TRANSIT returns HTTP 400.
  if (travelMode === "DRIVE") {
    body.routingPreference = "TRAFFIC_AWARE";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.etaTimeoutMs);

  try {
    const response = await fetch(config.googleRoutesUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": config.googleMapsApiKey,
        "X-Goog-FieldMask": "originIndex,destinationIndex,duration,condition",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Routes API HTTP ${response.status}: ${detail}`);
    }

    const elements = await response.json();
    const element = Array.isArray(elements) ? elements[0] : null;

    if (!element) {
      throw new Error("Routes API returned no matrix elements");
    }

    if (element.condition !== "ROUTE_EXISTS") {
      throw new Error(`Routes API condition ${element.condition || "MISSING"}`);
    }

    const seconds = parseDurationSeconds(element.duration);
    if (!Number.isFinite(seconds)) {
      throw new Error(`Routes API duration unparseable: ${element.duration}`);
    }

    return Math.max(1, Math.ceil(seconds / 60));
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { getDistanceMatrixDurationMinutes, MODE_MAP, parseDurationSeconds };
