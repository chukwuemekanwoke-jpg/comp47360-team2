const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const { AppError, isUuid } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toBookingJson } = require("../../utils/serialize");
const { parseBodyLatLng, parseTransportMode } = require("../../utils/validate");
const { buildEtaResult } = require("../../utils/geo");

const router = Router();

const BOOKING_COLUMNS = `
  id, user_id, restaurant_id, offer_id, campaign_id,
  status, transport_mode, eta_minutes, hold_expires_at, confirmed_at
`;

router.post(
  "/",
  requireUser,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const {
      restaurantId,
      transportMode: rawTransportMode,
      userLat,
      userLng,
      offerId = null,
    } = req.body ?? {};

    if (!restaurantId || !isUuid(restaurantId)) {
      throw new AppError(400, "VALIDATION_ERROR", "restaurantId must be a valid UUID");
    }

    if (offerId != null && !isUuid(offerId)) {
      throw new AppError(400, "VALIDATION_ERROR", "offerId must be a valid UUID");
    }

    const transportMode = parseTransportMode(rawTransportMode);
    const { lat, lng } = parseBodyLatLng(userLat, userLng);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows: restaurantRows } = await client.query(
        `SELECT id, latitude, longitude, hold_window_minutes, available_table_count
         FROM restaurants
         WHERE id = $1
         FOR UPDATE`,
        [restaurantId]
      );

      if (restaurantRows.length === 0) {
        throw new AppError(404, "NOT_FOUND", "Restaurant not found");
      }

      const restaurant = restaurantRows[0];

      if (restaurant.available_table_count <= 0) {
        throw new AppError(409, "CONFLICT", "No tables available at this restaurant");
      }

      const etaResult = buildEtaResult({
        restaurantId,
        transportMode,
        userLat: lat,
        userLng: lng,
        restaurant,
      });

      if (!etaResult.canBook) {
        throw new AppError(
          409,
          "CONFLICT",
          "ETA exceeds the restaurant hold window",
          { etaMinutes: etaResult.etaMinutes, holdWindowMinutes: etaResult.holdWindowMinutes }
        );
      }

      let campaignId = null;
      let resolvedOfferId = null;

      if (offerId) {
        const { rows: offerRows } = await client.query(
          `SELECT o.id, o.status, o.expires_at, o.campaign_id, c.restaurant_id
           FROM offers o
           JOIN campaigns c ON c.id = o.campaign_id
           WHERE o.id = $1 AND o.user_id = $2
           FOR UPDATE`,
          [offerId, req.userId]
        );

        if (offerRows.length === 0) {
          throw new AppError(409, "CONFLICT", "Offer not found for this user");
        }

        const offer = offerRows[0];

        if (offer.status !== "pending") {
          throw new AppError(409, "CONFLICT", "Offer is no longer available");
        }

        if (new Date(offer.expires_at) <= new Date()) {
          throw new AppError(409, "CONFLICT", "Offer has expired");
        }

        if (offer.restaurant_id !== restaurantId) {
          throw new AppError(409, "CONFLICT", "Offer does not apply to this restaurant");
        }

        campaignId = offer.campaign_id;
        resolvedOfferId = offer.id;
      }

      const { rows: bookingRows } = await client.query(
        `INSERT INTO bookings (
           user_id,
           restaurant_id,
           offer_id,
           campaign_id,
           status,
           transport_mode,
           eta_minutes,
           hold_expires_at,
           confirmed_at
         )
         VALUES (
           $1, $2, $3, $4,
           'confirmed',
           $5,
           $6,
           NOW() + ($7 * INTERVAL '1 minute'),
           NOW()
         )
         RETURNING ${BOOKING_COLUMNS}`,
        [
          req.userId,
          restaurantId,
          resolvedOfferId,
          campaignId,
          transportMode,
          etaResult.etaMinutes,
          restaurant.hold_window_minutes,
        ]
      );

      await client.query(
        `UPDATE restaurants
         SET available_table_count = available_table_count - 1
         WHERE id = $1`,
        [restaurantId]
      );

      if (resolvedOfferId) {
        await client.query(
          `UPDATE offers
           SET status = 'accepted', accepted_at = NOW()
           WHERE id = $1`,
          [resolvedOfferId]
        );
      }

      await client.query("COMMIT");
      res.status(201).json(toBookingJson(bookingRows[0]));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
