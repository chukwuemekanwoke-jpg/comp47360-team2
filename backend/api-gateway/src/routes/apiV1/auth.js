const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const { AppError } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toUserJson } = require("../../utils/serialize");
const { hashPassword, verifyPassword } = require("../../utils/password");
const { signAccessToken } = require("../../utils/jwt");

const router = Router();

const USER_COLUMNS =
  "id, display_name, budget_tier, dietary_tags, last_lat, last_lng, created_at, email, token_version";

function normalizeEmail(value) {
  if (typeof value !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", "email must be a string");
  }
  const email = value.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new AppError(400, "VALIDATION_ERROR", "email must be a valid email address");
  }
  return email;
}

function validatePassword(value) {
  if (typeof value !== "string" || value.length < 8) {
    throw new AppError(400, "VALIDATION_ERROR", "password must be at least 8 characters");
  }
  return value;
}

async function findUserByEmail(pool, email) {
  const { rows } = await pool.query(
    `SELECT ${USER_COLUMNS}, password_hash
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  return rows[0] ?? null;
}

async function findPrimaryRestaurantId(pool, userId) {
  const { rows } = await pool.query(
    `SELECT id
     FROM restaurants
     WHERE manager_user_id = $1
     ORDER BY name ASC
     LIMIT 1`,
    [userId]
  );
  return rows[0]?.id ?? null;
}

function authResponse(row, token, restaurantId) {
  const user = toUserJson(row);
  return {
    token,
    user,
    userId: user.id,
    restaurantId,
  };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const email = normalizeEmail(req.body?.email);
    const password = validatePassword(req.body?.password);
    const displayName =
      typeof req.body?.displayName === "string" && req.body.displayName.trim()
        ? req.body.displayName.trim()
        : email.split("@")[0];

    const existing = await findUserByEmail(pool, email);
    if (existing) {
      throw new AppError(409, "CONFLICT", "An account with this email already exists");
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await pool.query(
      `INSERT INTO users (display_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING ${USER_COLUMNS}`,
      [displayName, email, passwordHash]
    );

    const user = rows[0];
    const token = signAccessToken({
      userId: user.id,
      tokenVersion: user.token_version,
    });
    const restaurantId = await findPrimaryRestaurantId(pool, user.id);

    res.status(201).json(authResponse(user, token, restaurantId));
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const email = normalizeEmail(req.body?.email);
    const password = validatePassword(req.body?.password);

    const user = await findUserByEmail(pool, email);
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const token = signAccessToken({
      userId: user.id,
      tokenVersion: user.token_version,
    });
    const restaurantId = await findPrimaryRestaurantId(pool, user.id);

    res.status(200).json(authResponse(user, token, restaurantId));
  })
);

router.post(
  "/logout",
  requireUser,
  asyncHandler(async (req, res) => {
    const pool = getPool();

    if (req.authMethod === "jwt") {
      await pool.query(
        `UPDATE users
         SET token_version = token_version + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [req.userId]
      );
    }

    res.status(200).json({ status: "logged_out" });
  })
);

module.exports = router;
