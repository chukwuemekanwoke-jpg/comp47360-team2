const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const { authRateLimiter } = require("../../middleware/rateLimit");
const { AppError } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toUserJson } = require("../../utils/serialize");
const { hashPassword, verifyPassword } = require("../../utils/password");
const {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_TTL_MINUTES,
} = require("../../utils/passwordReset");
const { signAccessToken } = require("../../utils/jwt");
const config = require("../../config");

const router = Router();

router.use(authRateLimiter);

const LEGACY_AUTH_USER_COLUMNS =
  "id, display_name, budget_tier, dietary_tags, last_lat, last_lng, created_at, email, token_version";

const AUTH_PROFILE_COLUMNS = `
  u.id,
  u.display_name,
  p.budget_tier,
  p.dietary_restrictions AS dietary_tags,
  p.preferred_cuisines,
  p.dining_styles,
  u.last_lat,
  u.last_lng,
  u.created_at,
  u.email,
  u.token_version
`;

const PASSWORD_RESET_ACK_MESSAGE =
  "If an account exists for that email, a reset link has been sent.";

const PASSWORD_RESET_SUCCESS_MESSAGE = "Password updated successfully.";

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
    `SELECT ${AUTH_PROFILE_COLUMNS}, u.password_hash
     FROM users u
     JOIN user_preferences p ON p.user_id = u.id
     WHERE LOWER(u.email) = LOWER($1)`,
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
       RETURNING ${LEGACY_AUTH_USER_COLUMNS}`,
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

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const email = normalizeEmail(req.body?.email);
    const user = await findUserByEmail(pool, email);

    if (user?.password_hash) {
      const { rawToken, tokenHash } = generateResetToken();
      await pool.query(
        `UPDATE users
         SET password_reset_token_hash = $1,
             password_reset_expires_at = NOW() + ($2 * INTERVAL '1 minute'),
             updated_at = NOW()
         WHERE id = $3`,
        [tokenHash, RESET_TOKEN_TTL_MINUTES, user.id]
      );

      const resetUrl = `${config.webAppUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;
      console.log(`[password-reset] reset link for ${email}: ${resetUrl}`);
    }

    res.status(200).json({ message: PASSWORD_RESET_ACK_MESSAGE });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const rawToken = req.body?.token;
    if (typeof rawToken !== "string" || rawToken.trim() === "") {
      throw new AppError(400, "VALIDATION_ERROR", "token is required");
    }

    const newPassword = validatePassword(req.body?.newPassword);
    const tokenHash = hashResetToken(rawToken.trim());

    const { rows } = await pool.query(
      `SELECT id
       FROM users
       WHERE password_reset_token_hash = $1
         AND password_reset_expires_at > NOW()
         AND password_hash IS NOT NULL`,
      [tokenHash]
    );

    if (rows.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid or expired reset link");
    }

    const passwordHash = await hashPassword(newPassword);
    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token_hash = NULL,
           password_reset_expires_at = NULL,
           token_version = token_version + 1,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, rows[0].id]
    );

    res.status(200).json({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
  })
);

module.exports = router;
