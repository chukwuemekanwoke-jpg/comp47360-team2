const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { AppError, isUuid } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toRestaurantSummary, toRestaurantDetail } = require("../../utils/serialize");
const { parseLatLng, parseRadiusM, parseTransportMode } = require("../../utils/validate");
const { buildEtaResult } = require("../../utils/geo");
const { getCachedEta, setCachedEta } = require("../../utils/etaCache");

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
  r.busyness_score,
  r.is_wheelchair_accessible,
  r.sensory_friendly,
  r.address_line,
  r.hold_window_minutes
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

    const etaResult = buildEtaResult({
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

    res.status(200).json(toRestaurantDetail(rows[0]));
  })
);

router.post(
  "/:restaurantId/campaigns",
  asyncHandler(async (_req, _res) => {
    throw new AppError(501, "NOT_IMPLEMENTED", "Lull-mitigation campaigns are not implemented yet");
  })
);

module.exports = router;
