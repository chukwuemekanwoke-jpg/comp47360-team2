const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const { AppError } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toUserJson } = require("../../utils/serialize");
const {
  validateBudgetTier,
  validateDietaryTags,
  requireNonEmptyString,
} = require("../../utils/validate");

const router = Router();

const USER_COLUMNS =
  "id, display_name, budget_tier, dietary_tags, last_lat, last_lng, created_at";

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const displayName = requireNonEmptyString(req.body?.displayName, "displayName");

    const { rows } = await pool.query(
      `INSERT INTO users (display_name)
       VALUES ($1)
       RETURNING ${USER_COLUMNS}`,
      [displayName]
    );

    res.status(201).json(toUserJson(rows[0]));
  })
);

router.get(
  "/me",
  requireUser,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [req.userId]
    );

    res.status(200).json(toUserJson(rows[0]));
  })
);

router.patch(
  "/me/preferences",
  requireUser,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { budgetTier, dietaryTags, lastLat, lastLng } = req.body ?? {};

    if (
      budgetTier === undefined
      && dietaryTags === undefined
      && lastLat === undefined
      && lastLng === undefined
    ) {
      throw new AppError(400, "VALIDATION_ERROR", "At least one preference field is required");
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (budgetTier !== undefined) {
      validateBudgetTier(budgetTier);
      updates.push(`budget_tier = $${paramIndex++}`);
      values.push(budgetTier);
    }

    if (dietaryTags !== undefined) {
      validateDietaryTags(dietaryTags);
      updates.push(`dietary_tags = $${paramIndex++}`);
      values.push(dietaryTags);
    }

    if (lastLat !== undefined) {
      const parsedLat = Number(lastLat);
      if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        throw new AppError(400, "VALIDATION_ERROR", "lastLat must be a number between -90 and 90");
      }
      updates.push(`last_lat = $${paramIndex++}`);
      values.push(parsedLat);
    }

    if (lastLng !== undefined) {
      const parsedLng = Number(lastLng);
      if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        throw new AppError(400, "VALIDATION_ERROR", "lastLng must be a number between -180 and 180");
      }
      updates.push(`last_lng = $${paramIndex++}`);
      values.push(parsedLng);
    }

    values.push(req.userId);

    const { rows } = await pool.query(
      `UPDATE users
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING ${USER_COLUMNS}`,
      values
    );

    res.status(200).json(toUserJson(rows[0]));
  })
);

module.exports = router;
