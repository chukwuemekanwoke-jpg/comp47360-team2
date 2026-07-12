const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const { AppError, isUuid } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toBookingJson } = require("../../utils/serialize");
const { parseBodyLatLng, parseTransportMode, parsePartySize } = require("../../utils/validate");
const { createBooking } = require("../../services/createBooking");
const { cancelBooking } = require("../../services/cancelBooking");

const router = Router();

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
      partySize: rawPartySize = null,
    } = req.body ?? {};

    if (!restaurantId || !isUuid(restaurantId)) {
      throw new AppError(400, "VALIDATION_ERROR", "restaurantId must be a valid UUID");
    }

    if (offerId != null && !isUuid(offerId)) {
      throw new AppError(400, "VALIDATION_ERROR", "offerId must be a valid UUID");
    }

    const transportMode = parseTransportMode(rawTransportMode);
    const partySize = parsePartySize(rawPartySize);
    const { lat, lng } = parseBodyLatLng(userLat, userLng);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const bookingRow = await createBooking(client, {
        userId: req.userId,
        restaurantId,
        transportMode,
        userLat: lat,
        userLng: lng,
        offerId,
        partySize,
      });

      await client.query("COMMIT");
      res.status(201).json(toBookingJson(bookingRow));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

router.post(
  "/:bookingId/cancel",
  requireUser,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      throw new AppError(500, "INTERNAL_ERROR", "Database is not configured (DATABASE_URL)");
    }

    const { bookingId } = req.params;

    if (!bookingId || !isUuid(bookingId)) {
      throw new AppError(400, "VALIDATION_ERROR", "bookingId must be a valid UUID");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const bookingRow = await cancelBooking(client, {
        userId: req.userId,
        bookingId,
      });

      await client.query("COMMIT");
      res.status(200).json(toBookingJson(bookingRow));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
