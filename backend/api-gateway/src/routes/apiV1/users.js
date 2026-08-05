const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const { AppError } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toUserJson, toOfferInboxItem, toBookingJson } = require("../../utils/serialize");
const {
  validateBudgetTier,
  validateDietaryTags,
  validatePreferredCuisines,
  validateDiningStyles,
  validateBoolean,
  requireNonEmptyString,
} = require("../../utils/validate");
const { expirePendingOffers } = require("../../services/offers");
const { expireOverdueCampaigns } = require("../../services/expireCampaigns");
const { lapseExpiredBookings } = require("../../services/bookingLifecycle");

const router = Router();

const LEGACY_USER_COLUMNS =
  "id, display_name, budget_tier, dietary_tags, last_lat, last_lng, created_at";

const USER_PROFILE_COLUMNS = `
  u.id,
  u.display_name,
  p.budget_tier,
  p.dietary_restrictions AS dietary_tags,
  p.preferred_cuisines,
  p.dining_styles,
  p.requires_wheelchair_access,
  p.requires_sensory_friendly,
  u.last_lat,
  u.last_lng,
  u.created_at
`;

async function getUserProfile(db, userId) {
  const { rows } = await db.query(
    `SELECT ${USER_PROFILE_COLUMNS}
     FROM users u
     JOIN user_preferences p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0];
}

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
       RETURNING ${LEGACY_USER_COLUMNS}`,
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
    const user = await getUserProfile(pool, req.userId);
    res.status(200).json(toUserJson(user));
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

    await expireOverdueCampaigns(pool);
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
    const {
      budgetTier,
      dietaryTags,
      preferredCuisines,
      diningStyles,
      requiresWheelchairAccess,
      requiresSensoryFriendly,
      lastLat,
      lastLng,
    } = req.body ?? {};

    if (
      budgetTier === undefined
      && dietaryTags === undefined
      && preferredCuisines === undefined
      && diningStyles === undefined
      && requiresWheelchairAccess === undefined
      && requiresSensoryFriendly === undefined
      && lastLat === undefined
      && lastLng === undefined
    ) {
      throw new AppError(400, "VALIDATION_ERROR", "At least one preference field is required");
    }

    const preferenceUpdates = [];
    const preferenceValues = [];

    if (budgetTier !== undefined) {
      validateBudgetTier(budgetTier);
      preferenceUpdates.push(`budget_tier = $${preferenceValues.length + 1}`);
      preferenceValues.push(budgetTier);
    }

    if (dietaryTags !== undefined) {
      validateDietaryTags(dietaryTags);
      preferenceUpdates.push(
        `dietary_restrictions = $${preferenceValues.length + 1}`
      );
      preferenceValues.push(dietaryTags.map((tag) => tag.trim()));
    }

    if (preferredCuisines !== undefined) {
      validatePreferredCuisines(preferredCuisines);
      preferenceUpdates.push(
        `preferred_cuisines = $${preferenceValues.length + 1}`
      );
      preferenceValues.push(preferredCuisines.map((cuisine) => cuisine.trim()));
    }

    if (diningStyles !== undefined) {
      validateDiningStyles(diningStyles);
      preferenceUpdates.push(
        `dining_styles = $${preferenceValues.length + 1}`
      );
      preferenceValues.push(diningStyles.map((style) => style.trim()));
    }

    if (requiresWheelchairAccess !== undefined) {
      validateBoolean(requiresWheelchairAccess, "requiresWheelchairAccess");
      preferenceUpdates.push(
        `requires_wheelchair_access = $${preferenceValues.length + 1}`
      );
      preferenceValues.push(requiresWheelchairAccess);
    }

    if (requiresSensoryFriendly !== undefined) {
      validateBoolean(requiresSensoryFriendly, "requiresSensoryFriendly");
      preferenceUpdates.push(
        `requires_sensory_friendly = $${preferenceValues.length + 1}`
      );
      preferenceValues.push(requiresSensoryFriendly);
    }

    const locationUpdates = [];
    const locationValues = [];

    if (lastLat !== undefined) {
      const parsedLat = Number(lastLat);
      if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        throw new AppError(400, "VALIDATION_ERROR", "lastLat must be a number between -90 and 90");
      }
      locationUpdates.push(`last_lat = $${locationValues.length + 1}`);
      locationValues.push(parsedLat);
    }

    if (lastLng !== undefined) {
      const parsedLng = Number(lastLng);
      if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        throw new AppError(400, "VALIDATION_ERROR", "lastLng must be a number between -180 and 180");
      }
      locationUpdates.push(`last_lng = $${locationValues.length + 1}`);
      locationValues.push(parsedLng);
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Defensive for users created before migration 011's insert trigger.
      await client.query(
        `INSERT INTO user_preferences (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [req.userId]
      );

      if (preferenceUpdates.length > 0) {
        preferenceValues.push(req.userId);
        await client.query(
          `UPDATE user_preferences
           SET ${preferenceUpdates.join(", ")}
           WHERE user_id = $${preferenceValues.length}`,
          preferenceValues
        );
      }

      if (locationUpdates.length > 0) {
        locationValues.push(req.userId);
        await client.query(
          `UPDATE users
           SET ${locationUpdates.join(", ")}
           WHERE id = $${locationValues.length}`,
          locationValues
        );
      }

      const user = await getUserProfile(client, req.userId);
      await client.query("COMMIT");
      res.status(200).json(toUserJson(user));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
