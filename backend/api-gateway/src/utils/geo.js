const SPEED_KMH = {
  walking: 5,
  driving: 25,
  transit: 15,
  cycling: 12,
};

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
}

function computeEtaMinutes(distanceMeters, transportMode) {
  const speedKmh = SPEED_KMH[transportMode] ?? SPEED_KMH.walking;
  return Math.max(1, Math.ceil((distanceMeters / 1000 / speedKmh) * 60));
}

function buildEtaMessage(etaMinutes, holdWindowMinutes, canBook) {
  if (canBook) {
    return `ETA: ${etaMinutes} mins (Within ${holdWindowMinutes} min hold window)`;
  }
  return "You are too far to guarantee this table.";
}

// Assemble the ETA response from an already-resolved duration (minutes).
// `source` records how etaMinutes was obtained ("google" | "estimate").
function finalizeEtaResult({ restaurantId, transportMode, etaMinutes, holdWindowMinutes, source }) {
  const canBook = etaMinutes <= holdWindowMinutes;

  return {
    restaurantId,
    transportMode,
    etaMinutes,
    holdWindowMinutes,
    canBook,
    message: buildEtaMessage(etaMinutes, holdWindowMinutes, canBook),
    source,
  };
}

// Local haversine + fixed-speed estimate (fallback when Google is unavailable).
function buildEtaResult({ restaurantId, transportMode, userLat, userLng, restaurant }) {
  const distanceMeters = haversineMeters(
    userLat,
    userLng,
    Number(restaurant.latitude),
    Number(restaurant.longitude)
  );
  const etaMinutes = computeEtaMinutes(distanceMeters, transportMode);

  return finalizeEtaResult({
    restaurantId,
    transportMode,
    etaMinutes,
    holdWindowMinutes: restaurant.hold_window_minutes,
    source: "estimate",
  });
}

module.exports = {
  SPEED_KMH,
  haversineMeters,
  computeEtaMinutes,
  buildEtaMessage,
  finalizeEtaResult,
  buildEtaResult,
};
