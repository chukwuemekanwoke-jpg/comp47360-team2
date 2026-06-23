const { AppError, isUuid } = require("../errors");
const { getPool } = require("../db/pool");

async function requireRestaurantManager(req, _res, next) {
  const restaurantId = req.params.restaurantId;

  if (!restaurantId || !isUuid(restaurantId)) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid restaurantId format"));
  }

  const pool = getPool();
  if (!pool) {
    return next(
      new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)")
    );
  }

  const { rows } = await pool.query(
    `SELECT id, manager_user_id
     FROM restaurants
     WHERE id = $1`,
    [restaurantId]
  );

  if (rows.length === 0) {
    return next(new AppError(404, "NOT_FOUND", "Restaurant not found"));
  }

  if (!rows[0].manager_user_id) {
    return next(new AppError(401, "UNAUTHORIZED", "Restaurant has no assigned manager"));
  }

  if (rows[0].manager_user_id !== req.userId) {
    return next(new AppError(401, "UNAUTHORIZED", "Not authorized to manage this restaurant"));
  }

  req.restaurantId = restaurantId;
  return next();
}

module.exports = requireRestaurantManager;
