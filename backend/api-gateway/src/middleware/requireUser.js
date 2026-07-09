const { AppError, isUuid } = require("../errors");
const { getPool } = require("../db/pool");

async function requireUser(req, _res, next) {
  const userId = req.header("X-User-Id");
  if (!userId) {
    return next(new AppError(401, "UNAUTHORIZED", "Missing X-User-Id header"));
  }
  if (!isUuid(userId)) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid X-User-Id format"));
  }

  const pool = getPool();
  if (!pool) {
    return next(
      new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)")
    );
  }

  const { rows } = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
  if (rows.length === 0) {
    return next(new AppError(404, "NOT_FOUND", "User not found"));
  }

  req.userId = userId;
  return next();
}

module.exports = requireUser;
