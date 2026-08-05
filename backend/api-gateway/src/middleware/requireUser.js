const { AppError, isUuid } = require("../errors");
const { getPool } = require("../db/pool");
const { verifyAccessToken } = require("../utils/jwt");
const config = require("../config");

function parseBearerToken(req) {
  const header = req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

async function loadUserAuthRow(pool, userId) {
  const { rows } = await pool.query(
    `SELECT id, token_version
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}

async function requireUser(req, _res, next) {
  const bearer = parseBearerToken(req);

  if (!bearer) {
    if (!config.allowLegacyUserHeader) {
      return next(
        new AppError(401, "UNAUTHORIZED", "Missing Authorization Bearer token")
      );
    }

    const userId = req.header("X-User-Id");
    if (!userId) {
      return next(
        new AppError(401, "UNAUTHORIZED", "Missing Authorization Bearer token or X-User-Id header")
      );
    }
    if (!isUuid(userId)) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid X-User-Id format"));
    }
  }

  const pool = getPool();
  if (!pool) {
    return next(
      new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)")
    );
  }

  if (bearer) {
    try {
      const { userId, tokenVersion } = verifyAccessToken(bearer);
      const row = await loadUserAuthRow(pool, userId);
      if (!row) {
        return next(new AppError(404, "NOT_FOUND", "User not found"));
      }
      if (Number(row.token_version) !== tokenVersion) {
        return next(new AppError(401, "UNAUTHORIZED", "Token has been revoked"));
      }
      req.userId = userId;
      req.authMethod = "jwt";
      return next();
    } catch (err) {
      return next(err);
    }
  }

  const userId = req.header("X-User-Id");
  const row = await loadUserAuthRow(pool, userId);
  if (!row) {
    return next(new AppError(404, "NOT_FOUND", "User not found"));
  }

  req.userId = userId;
  req.authMethod = "header";
  return next();
}

module.exports = requireUser;
