const config = require("../config");
const { buildEtaResult, finalizeEtaResult } = require("../utils/geo");
const { getDistanceMatrixDurationMinutes } = require("./googleDistanceMatrix");

/**
 * Resolve an ETA result, preferring the Google Distance Matrix API for
 * transit-validated travel times. Falls back to the local haversine estimate
 * when no API key is configured or the call fails/times out, so the booking
 * flow keeps working offline (mirrors the BE-14 ML-match fallback pattern).
 */
async function resolveEtaResult({ restaurantId, transportMode, userLat, userLng, restaurant }) {
  if (config.googleMapsApiKey) {
    try {
      const etaMinutes = await getDistanceMatrixDurationMinutes({
        originLat: userLat,
        originLng: userLng,
        destLat: Number(restaurant.latitude),
        destLng: Number(restaurant.longitude),
        transportMode,
      });

      return finalizeEtaResult({
        restaurantId,
        transportMode,
        etaMinutes,
        holdWindowMinutes: restaurant.hold_window_minutes,
        source: "google",
      });
    } catch (err) {
      console.warn(
        `[BE-12] Google Distance Matrix unavailable, using haversine estimate: ${err.message}`
      );
    }
  }

  return buildEtaResult({ restaurantId, transportMode, userLat, userLng, restaurant });
}

module.exports = { resolveEtaResult };
