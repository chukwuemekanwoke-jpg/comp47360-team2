const { callMlBusyness } = require("./mlBusynessClient");

// JS Date#getDay() is 0=Sunday..6=Saturday; ml-service expects 0=Monday..6=Sunday.
function toMlDayOfWeek(jsDay) {
  return (jsDay + 6) % 7;
}

/**
 * Booking-history stats that let the ml-service mature a merchant's score
 * from pure location prior (day 0) toward its own observed bookings over
 * the first 30 days: merchant age, trailing-30d confirmed/completed booking
 * volume, and how many of those landed in the same (weekday, hour±1) bucket
 * being predicted. Returns null on any failure so the prediction degrades
 * to the location-only path instead of erroring.
 *
 * Bookings are near-immediate (15-minute holds), so booking created_at is a
 * usable proxy for dining time. Hour comparison is circular (23 vs 0 = 1h).
 */
async function fetchBookingMaturityStats(pool, restaurantId, dayOfWeek, hourOfDay) {
  try {
    const { rows } = await pool.query(
      `SELECT
         GREATEST(0, EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 86400.0)::float
           AS days_since_onboarding,
         r.capacity,
         COUNT(b.id)::int AS total_30d,
         COUNT(b.id) FILTER (
           WHERE (EXTRACT(ISODOW FROM b.created_at)::int - 1) = $2
             AND LEAST(
                   ABS(EXTRACT(HOUR FROM b.created_at)::int - $3),
                   24 - ABS(EXTRACT(HOUR FROM b.created_at)::int - $3)
                 ) <= 1
         )::int AS same_bucket_30d
       FROM restaurants r
       LEFT JOIN bookings b
         ON b.restaurant_id = r.id
        AND b.status IN ('confirmed', 'completed')
        AND b.created_at >= NOW() - INTERVAL '30 days'
       WHERE r.id = $1
       GROUP BY r.id`,
      [restaurantId, dayOfWeek, hourOfDay]
    );
    if (rows.length === 0) return null;
    const stats = rows[0];
    return {
      daysSinceOnboarding: Number(stats.days_since_onboarding),
      capacity: stats.capacity != null ? Number(stats.capacity) : undefined,
      recentBookingsTotal30d: Number(stats.total_30d),
      recentBookingsSameBucket30d: Number(stats.same_bucket_30d),
    };
  } catch (err) {
    console.warn(`[busyness] booking-maturity stats unavailable for restaurant ${restaurantId}: ${err.message}`);
    return null;
  }
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
  const hourOfDay = now.getHours();
  const dayOfWeek = toMlDayOfWeek(now.getDay());

  const maturityStats = await fetchBookingMaturityStats(pool, id, dayOfWeek, hourOfDay);

  let prediction;
  try {
    prediction = await callMlBusyness({
      restaurantId: id,
      hourOfDay,
      dayOfWeek,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      ...(maturityStats || {}),
    });
  } catch (err) {
    console.warn(`[busyness] ml-service unavailable for restaurant ${id}, using stored value: ${err.message}`);
    return null;
  }

  if (!prediction || typeof prediction.busynessScore !== "number") {
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

module.exports = { refreshRestaurantBusyness, fetchBookingMaturityStats, toMlDayOfWeek };
