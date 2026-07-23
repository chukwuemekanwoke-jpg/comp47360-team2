const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const requireRestaurantManager = require("../../middleware/requireRestaurantManager");
const { getPool } = require("../../db/pool");
const { toRestaurantBookingJson } = require("../../utils/serialize");
const { lapseExpiredBookings } = require("../../services/bookingLifecycle");

const router = Router({ mergeParams: true });

const BOOKING_COLUMNS = `
  b.id,
  b.user_id,
  b.restaurant_id,
  b.offer_id,
  b.campaign_id,
  b.status,
  b.transport_mode,
  b.eta_minutes,
  b.hold_expires_at,
  b.confirmed_at,
  u.display_name AS user_display_name
`;

router.use(requireUser);
router.use(requireRestaurantManager);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await lapseExpiredBookings(client, { restaurantId: req.restaurantId });
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    const { rows } = await pool.query(
      `SELECT ${BOOKING_COLUMNS}
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.restaurant_id = $1
       ORDER BY b.created_at DESC`,
      [req.restaurantId]
    );

    res.status(200).json({
      bookings: rows.map(toRestaurantBookingJson),
    });
  })
);

module.exports = router;
