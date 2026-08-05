const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const requireRestaurantManager = require("../../middleware/requireRestaurantManager");
const { AppError, isUuid } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toRestaurantSummary, toRestaurantDetail, toRevpashJson } = require("../../utils/serialize");
const {
  parseLatLng,
  parseNearbyQuery,
  parseTransportMode,
  validateCreateRestaurantBody,
  validateRestaurantSettingsBody,
} = require("../../utils/validate");
const { resolveEtaResult } = require("../../services/etaResolver");
const { getCachedEta, setCachedEta } = require("../../utils/etaCache");
const {
  refreshRestaurantBusyness,
  scheduleBusynessRefresh,
} = require("../../services/busynessService");
const { getRevpashSummary } = require("../../services/getRevpash");
const config = require("../../config");
const {
  benchmarkAvgCheck,
  DEFAULT_CLOSES_AT,
  DEFAULT_OPENS_AT,
  parseRevpashWindow,
} = require("../../utils/revpash");
const campaignsRouter = require("./campaigns");
const restaurantBookingsRouter = require("./restaurantBookings");

const router = Router();

const HAVERSINE_SQL = `
  (
    6371000 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians($1)) * cos(radians(r.latitude))
          * cos(radians(r.longitude) - radians($2))
        + sin(radians($1)) * sin(radians(r.latitude))
      ))
    )
  )
`;

const RESTAURANT_COLUMNS = `
  r.id,
  r.name,
  r.latitude,
  r.longitude,
  r.neighborhood,
  r.available_table_count,
  r.capacity,
  r.cuisine,
  r.busyness_score,
  r.busyness_updated_at,
  r.rating,
  r.reviews,
  r.is_wheelchair_accessible,
  r.sensory_friendly,
  r.address_line,
  r.hold_window_minutes,
  r.phone
`;

const RESTAURANT_RETURNING_COLUMNS = `
  id,
  name,
  latitude,
  longitude,
  neighborhood,
  available_table_count,
  capacity,
  cuisine,
  busyness_score,
  rating,
  reviews,
  is_wheelchair_accessible,
  sensory_friendly,
  address_line,
  hold_window_minutes,
  phone
`;

async function maybeUpdateUserLocation(pool, req, lat, lng) {
  // This guest endpoint has no JWT middleware. Only preserve the legacy
  // X-User-Id location update in explicitly-enabled local/demo environments;
  // otherwise an arbitrary UUID could be used to overwrite another user's
  // matching location.
  if (!config.allowLegacyUserHeader) {
    return;
  }

  const userId = req.header("X-User-Id");
  if (!userId || !isUuid(userId)) {
    return;
  }

  await pool.query(
    `UPDATE users
     SET last_lat = $1, last_lng = $2
     WHERE id = $3`,
    [lat, lng, userId]
  );
}

router.use("/:restaurantId/campaigns", campaignsRouter);
router.use("/:restaurantId/bookings", restaurantBookingsRouter);

router.post(
  "/",
  requireUser,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const input = validateCreateRestaurantBody(req.body);
    const avgCheckPerCover = benchmarkAvgCheck(input.cuisine, input.neighborhood);

    const { rows } = await pool.query(
      `INSERT INTO restaurants (
         name,
         latitude,
         longitude,
         address_line,
         neighborhood,
         phone,
         cuisine,
         is_wheelchair_accessible,
         sensory_friendly,
         manager_user_id,
         available_table_count,
         opens_at,
         closes_at,
         avg_check_per_cover
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $12, $13)
       RETURNING ${RESTAURANT_RETURNING_COLUMNS}`,
      [
        input.name,
        input.latitude,
        input.longitude,
        input.addressLine,
        input.neighborhood,
        input.phone,
        input.cuisine,
        input.isWheelchairAccessible,
        input.sensoryFriendly,
        req.userId,
        input.opensAt,
        input.closesAt,
        avgCheckPerCover,
      ]
    );

    // Onboarding attaches the merchant's location to the prediction system
    // immediately: run a location-prior busyness score (day-0 merchants have
    // no booking history, so the ml-service scores purely from area taxi +
    // foot-traffic signals) and persist it as the initial stored score.
    const restaurant = rows[0];
    const prediction = await refreshRestaurantBusyness(pool, {
      id: restaurant.id,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      availableTableCount: restaurant.available_table_count,
    });
    if (prediction) {
      try {
        await pool.query(
          `UPDATE restaurants SET busyness_score = $1, updated_at = NOW() WHERE id = $2`,
          [prediction.busynessScore, restaurant.id]
        );
        restaurant.busyness_score = prediction.busynessScore;
      } catch (err) {
        console.warn(`[busyness] failed to persist onboarding score for restaurant ${restaurant.id}: ${err.message}`);
      }
    }

    res.status(201).json(toRestaurantDetail(restaurant));
  })
);

router.patch(
  "/:restaurantId/settings",
  requireUser,
  requireRestaurantManager,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const updates = validateRestaurantSettingsBody(req.body);
    const setClauses = [];
    const values = [];
    let index = 1;

    for (const [column, value] of Object.entries(updates)) {
      setClauses.push(`${column} = $${index}`);
      values.push(value);
      index += 1;
    }

    values.push(req.restaurantId);

    const { rows } = await pool.query(
      `UPDATE restaurants
       SET ${setClauses.join(", ")},
           updated_at = NOW()
       WHERE id = $${index}
       RETURNING ${RESTAURANT_RETURNING_COLUMNS}`,
      values
    );

    res.status(200).json(toRestaurantDetail(rows[0]));
  })
);

router.get(
  "/nearby",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const { lat, lng, radiusM } = parseNearbyQuery({
      lat: req.query.lat,
      lng: req.query.lng,
      radiusM: req.query.radiusM,
      neighborhood: req.query.neighborhood,
    });

    await maybeUpdateUserLocation(pool, req, lat, lng);

    const { rows } = await pool.query(
      `WITH nearby AS (
         SELECT
           ${RESTAURANT_COLUMNS},
           ${HAVERSINE_SQL} AS distance_meters
         FROM restaurants r
         WHERE r.available_table_count > 0
       )
       SELECT *
       FROM nearby
       WHERE distance_meters <= $3
       ORDER BY distance_meters ASC`,
      [lat, lng, radiusM]
    );

    res.status(200).json({
      origin: { lat, lng },
      radiusM,
      restaurants: rows.map(toRestaurantSummary),
    });

    // Deliberately not awaited: the response above is already sent with the
    // stored scores. Venues whose busyness_updated_at is older than the TTL
    // get recomputed in the background, so the next search serves fresh
    // values without any request paying for the ml-service round trip.
    scheduleBusynessRefresh(pool, rows);
  })
);

router.get(
  "/:restaurantId/eta",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const { restaurantId } = req.params;
    if (!isUuid(restaurantId)) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid restaurantId format");
    }

    const { lat, lng } = parseLatLng(req.query.lat, req.query.lng);
    const transportMode = parseTransportMode(req.query.mode);

    const cached = getCachedEta(restaurantId, lat, lng, transportMode);
    if (cached) {
      return res.status(200).json(cached);
    }

    const { rows } = await pool.query(
      `SELECT id, latitude, longitude, hold_window_minutes
       FROM restaurants
       WHERE id = $1`,
      [restaurantId]
    );

    if (rows.length === 0) {
      throw new AppError(404, "NOT_FOUND", "Restaurant not found");
    }

    const etaResult = await resolveEtaResult({
      restaurantId,
      transportMode,
      userLat: lat,
      userLng: lng,
      restaurant: rows[0],
    });

    setCachedEta(restaurantId, lat, lng, transportMode, etaResult);
    res.status(200).json(etaResult);
  })
);

router.get(
  "/:restaurantId/revpash",
  requireUser,
  requireRestaurantManager,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const window = parseRevpashWindow(req.query.window);
    const summary = await getRevpashSummary(pool, {
      restaurantId: req.restaurantId,
      window,
    });

    res.status(200).json(toRevpashJson(summary));
  })
);

router.get(
  "/:restaurantId",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const { restaurantId } = req.params;
    if (!isUuid(restaurantId)) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid restaurantId format");
    }

    const { rows } = await pool.query(
      `SELECT ${RESTAURANT_COLUMNS}
       FROM restaurants r
       WHERE r.id = $1`,
      [restaurantId]
    );

    if (rows.length === 0) {
      throw new AppError(404, "NOT_FOUND", "Restaurant not found");
    }

    const restaurant = rows[0];
    const prediction = await refreshRestaurantBusyness(pool, {
      id: restaurant.id,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      availableTableCount: restaurant.available_table_count,
    });
    // Only the busyness score is live-updated here — available_table_count
    // stays the real, booking-driven DB value; the ml-service's simulated
    // table count is recorded to availability_snapshots for history only.
    if (prediction) {
      restaurant.busyness_score = prediction.busynessScore;
    }

    res.status(200).json(toRestaurantDetail(restaurant));
  })
);

module.exports = router;
