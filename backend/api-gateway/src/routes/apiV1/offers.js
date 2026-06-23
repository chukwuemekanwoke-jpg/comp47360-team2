const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const { AppError, isUuid } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toBookingJson } = require("../../utils/serialize");
const { DEFAULT_TRANSPORT_MODE } = require("../../utils/validate");
const { createBooking } = require("../../services/createBooking");

const router = Router();

router.post(
  "/:offerId/accept",
  requireUser,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const { offerId } = req.params;
    if (!isUuid(offerId)) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid offerId format");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows: offerRows } = await client.query(
        `SELECT o.id, o.status, o.expires_at, c.restaurant_id
         FROM offers o
         JOIN campaigns c ON c.id = o.campaign_id
         WHERE o.id = $1 AND o.user_id = $2
         FOR UPDATE`,
        [offerId, req.userId]
      );

      if (offerRows.length === 0) {
        throw new AppError(404, "NOT_FOUND", "Offer not found");
      }

      const offer = offerRows[0];

      if (offer.status !== "pending") {
        throw new AppError(409, "CONFLICT", "Offer is no longer available");
      }

      if (new Date(offer.expires_at) <= new Date()) {
        throw new AppError(409, "CONFLICT", "Offer has expired");
      }

      const { rows: userRows } = await client.query(
        `SELECT last_lat, last_lng FROM users WHERE id = $1`,
        [req.userId]
      );

      const user = userRows[0];
      if (user.last_lat == null || user.last_lng == null) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "User location is required — update preferences with lastLat and lastLng"
        );
      }

      const bookingRow = await createBooking(client, {
        userId: req.userId,
        restaurantId: offer.restaurant_id,
        transportMode: DEFAULT_TRANSPORT_MODE,
        userLat: Number(user.last_lat),
        userLng: Number(user.last_lng),
        offerId,
      });

      await client.query("COMMIT");

      res.status(200).json({
        offerId,
        status: "accepted",
        booking: toBookingJson(bookingRow),
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
