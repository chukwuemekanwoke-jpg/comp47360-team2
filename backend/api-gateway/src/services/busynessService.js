const { callMlBusyness } = require("./mlBusynessClient");
const config = require("../config");

// Venues with a refresh already running, so concurrent /nearby requests don't
// each fire an ml-service call for the same restaurant.
const inFlight = new Set();

// Venues whose last refresh failed. Without this, a down ml-service would be
// retried by every single nearby search for every stale venue.
const failureCooldownUntil = new Map();
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

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

  try {
    // Cache the result on the restaurant itself. /nearby serves this column
    // directly, and busyness_updated_at is what makes the refresh skippable
    // for the next hour.
    await pool.query(
      `UPDATE restaurants
       SET busyness_score = $1, busyness_updated_at = NOW()
       WHERE id = $2`,
      [prediction.busynessScore, id]
    );
  } catch (err) {
    console.warn(`[busyness] failed to persist score for restaurant ${id}: ${err.message}`);
  }

  return prediction;
}

function isStale(row, now, ttlMs) {
  if (!row.busyness_updated_at) {
    return true;
  }
  return now - new Date(row.busyness_updated_at).getTime() >= ttlMs;
}

function lastRefreshedAt(row) {
  // Never-scored venues sort first — they have no usable score at all.
  return row.busyness_updated_at ? new Date(row.busyness_updated_at).getTime() : 0;
}

/**
 * Picks which of the supplied restaurant rows are due a refresh: stale by
 * TTL, not already refreshing, not in post-failure cooldown, stalest first,
 * and never more than `limit` of them.
 */
function selectStaleRestaurants(rows, { now, ttlMs, limit }) {
  return rows
    .filter((row) => {
      if (inFlight.has(row.id)) {
        return false;
      }
      const cooldownUntil = failureCooldownUntil.get(row.id);
      if (cooldownUntil != null) {
        if (cooldownUntil > now) {
          return false;
        }
        failureCooldownUntil.delete(row.id);
      }
      return isStale(row, now, ttlMs);
    })
    .sort((a, b) => lastRefreshedAt(a) - lastRefreshedAt(b))
    .slice(0, limit);
}

/**
 * Refreshes stale venues out of band. Callers hand over the rows they just
 * served and do not await this: the response already went out with the stored
 * scores, and the fresh values land in the table for the next request.
 *
 * Resolves with the ids actually refreshed so tests (and callers that do want
 * to wait) can assert on it. Never rejects.
 */
async function refreshStaleBusyness(pool, rows, options = {}) {
  const now = options.now ?? Date.now();
  const ttlMs = options.ttlMs ?? config.busynessRefreshTtlMs;
  const limit = options.limit ?? config.busynessRefreshMaxPerRequest;

  const due = selectStaleRestaurants(rows, { now, ttlMs, limit });
  if (due.length === 0) {
    return [];
  }

  due.forEach((row) => inFlight.add(row.id));

  const refreshed = await Promise.all(
    due.map(async (row) => {
      try {
        const prediction = await refreshRestaurantBusyness(pool, {
          id: row.id,
          latitude: row.latitude,
          longitude: row.longitude,
          availableTableCount: row.available_table_count,
        });

        if (!prediction) {
          failureCooldownUntil.set(row.id, now + FAILURE_COOLDOWN_MS);
          return null;
        }
        return row.id;
      } catch (err) {
        // refreshRestaurantBusyness already swallows ml-service failures, so
        // reaching here means something unexpected — still must not escape a
        // fire-and-forget call and become an unhandled rejection.
        failureCooldownUntil.set(row.id, Date.now() + FAILURE_COOLDOWN_MS);
        console.warn(`[busyness] background refresh failed for restaurant ${row.id}: ${err.message}`);
        return null;
      } finally {
        inFlight.delete(row.id);
      }
    })
  );

  return refreshed.filter((id) => id !== null);
}

/** Fire-and-forget wrapper for request handlers. */
function scheduleBusynessRefresh(pool, rows, options) {
  return refreshStaleBusyness(pool, rows, options).catch((err) => {
    console.warn(`[busyness] background refresh batch failed: ${err.message}`);
    return [];
  });
}

// Test seam: module-level dedupe state would otherwise leak between cases.
function resetBusynessRefreshState() {
  inFlight.clear();
  failureCooldownUntil.clear();
}

module.exports = {
  refreshRestaurantBusyness,
  refreshStaleBusyness,
  scheduleBusynessRefresh,
  selectStaleRestaurants,
  resetBusynessRefreshState,
  fetchBookingMaturityStats,
  toMlDayOfWeek,
  FAILURE_COOLDOWN_MS,
};
