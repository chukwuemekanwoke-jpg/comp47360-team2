const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const { AppError } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toUserJson, toOfferInboxItem, toBookingJson } = require("../../utils/serialize");
const {
  validateBudgetTier,
  validateDietaryTags,
  requireNonEmptyString,
} = require("../../utils/validate");
const { expirePendingOffers } = require("../../services/offers");
const { lapseExpiredBookings } = require("../../services/bookingLifecycle");

const router = Router();

const USER_COLUMNS =
  "id, display_name, budget_tier, dietary_tags, last_lat, last_lng, created_at";

const BOOKING_COLUMNS =
  "id, user_id, restaurant_id, offer_id, campaign_id, status, transport_mode, eta_minutes, hold_expires_at, confirmed_at";

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

router.get(
  "/me/offers",
  requireUser,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const statusFilter = req.query.status;

    if (statusFilter != null && statusFilter !== "pending") {
      throw new AppError(400, "VALIDATION_ERROR", "status filter must be pending when provided");
    }

    await expirePendingOffers(pool, req.userId);

    const params = [req.userId];
    let statusClause = "";

    if (statusFilter === "pending") {
      statusClause = "AND o.status = 'pending'";
    }

    const { rows } = await pool.query(
      `SELECT
         o.id,
         o.campaign_id,
         o.status,
         o.expires_at,
         c.discount_percent,
         c.restaurant_id,
         r.name AS restaurant_name
       FROM offers o
       JOIN campaigns c ON c.id = o.campaign_id
       JOIN restaurants r ON r.id = c.restaurant_id
       WHERE o.user_id = $1
       ${statusClause}
       ORDER BY o.created_at DESC`,
      params
    );

    const now = new Date();
    res.status(200).json({
      offers: rows.map((row) => toOfferInboxItem(row, now)),
    });
  })
);

router.get(
  "/me/bookings",
  requireUser,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await lapseExpiredBookings(client, { userId: req.userId });
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    const { rows } = await pool.query(
      `SELECT ${BOOKING_COLUMNS}
       FROM bookings
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.status(200).json({
      bookings: rows.map(toBookingJson),
    });
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
