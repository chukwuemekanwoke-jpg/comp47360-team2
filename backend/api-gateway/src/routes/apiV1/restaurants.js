const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const requireRestaurantManager = require("../../middleware/requireRestaurantManager");
const { AppError, isUuid } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toRestaurantSummary, toRestaurantDetail } = require("../../utils/serialize");
const {
  parseLatLng,
  parseRadiusM,
  parseTransportMode,
  validateCreateRestaurantBody,
  validateRestaurantSettingsBody,
} = require("../../utils/validate");
const { resolveEtaResult } = require("../../services/etaResolver");
const { getCachedEta, setCachedEta } = require("../../utils/etaCache");
const { refreshRestaurantBusyness } = require("../../services/busynessService");
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
  is_wheelchair_accessible,
  sensory_friendly,
  address_line,
  hold_window_minutes,
  phone
`;

async function maybeUpdateUserLocation(pool, req, lat, lng) {
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
         available_table_count
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)
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
      ]
    );

    res.status(201).json(toRestaurantDetail(rows[0]));
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

    const { lat, lng } = parseLatLng(req.query.lat, req.query.lng);
    const radiusM = parseRadiusM(req.query.radiusM);

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
