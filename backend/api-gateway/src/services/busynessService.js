const { callMlBusyness } = require("./mlBusynessClient");

// JS Date#getDay() is 0=Sunday..6=Saturday; ml-service expects 0=Monday..6=Sunday.
function toMlDayOfWeek(jsDay) {
  return (jsDay + 6) % 7;
}

/**
 * Computes a live busyness prediction for a restaurant and records it to
 * availability_snapshots for history (rolling_busyness_7d, etc.). Returns
 * null on any ml-service failure/timeout so callers can fall back to the
 * restaurant's static busyness_score column — mirrors the fallback style
 * already used for campaign offer matching (createCampaignOffers.js).
 */
async function refreshRestaurantBusyness(pool, { id, latitude, longitude, availableTableCount }) {
  const now = new Date();

  let prediction;
  try {
    prediction = await callMlBusyness({
      restaurantId: id,
      hourOfDay: now.getHours(),
      dayOfWeek: toMlDayOfWeek(now.getDay()),
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
    });
  } catch (err) {
    console.warn(`[busyness] ml-service unavailable for restaurant ${id}, using stored value: ${err.message}`);
    return null;
  }

  const snapshotTableCount =
    Number.isInteger(prediction.availableTableCount) ? prediction.availableTableCount : availableTableCount;

  try {
    await pool.query(
      `INSERT INTO availability_snapshots (restaurant_id, available_table_count, busyness_score)
       VALUES ($1, $2, $3)`,
      [id, snapshotTableCount, prediction.busynessScore]
    );
  } catch (err) {
    // History write failing shouldn't take down the live prediction response.
    console.warn(`[busyness] failed to write availability_snapshots for restaurant ${id}: ${err.message}`);
  }

  return prediction;
}

module.exports = { refreshRestaurantBusyness, toMlDayOfWeek };
