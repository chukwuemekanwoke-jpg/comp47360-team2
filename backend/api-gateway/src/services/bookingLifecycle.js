const { AppError } = require("../errors");
const { releaseConfirmedBooking } = require("./bookingSideEffects");

/** Statuses that block a second booking (Milo demo rule 1). */
const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"];

/** Max retained booking rows per user (Milo demo rule 3). */
const MAX_BOOKINGS_PER_USER = 5;

const BOOKING_COLUMNS = `
  id, user_id, restaurant_id, offer_id, campaign_id,
  status, transport_mode, eta_minutes, hold_expires_at, confirmed_at
`;

/**
 * Cancel active bookings whose hold window has passed, restoring inventory
 * for confirmed holds (Milo demo rule 2 — lazy expiry, no cron).
 */
async function lapseExpiredBookings(client, { userId = null, restaurantId = null } = {}) {
  const conditions = [
    `status IN ('pending', 'confirmed')`,
    `hold_expires_at <= NOW()`,
  ];
  const params = [];

  if (userId) {
    params.push(userId);
    conditions.push(`user_id = $${params.length}`);
  }
  if (restaurantId) {
    params.push(restaurantId);
    conditions.push(`restaurant_id = $${params.length}`);
  }

  const { rows } = await client.query(
    `SELECT ${BOOKING_COLUMNS}
     FROM bookings
     WHERE ${conditions.join(" AND ")}
     FOR UPDATE`,
    params
  );

  for (const booking of rows) {
    const wasConfirmed = booking.status === "confirmed";

    await client.query(
      `UPDATE bookings
       SET status = 'cancelled',
           cancelled_at = NOW()
       WHERE id = $1`,
      [booking.id]
    );

    if (wasConfirmed) {
      await releaseConfirmedBooking(client, booking);
    }
  }

  return rows.length;
}

/**
 * Reject a second concurrent booking for the same user (rule 1).
 * Call after lapseExpiredBookings so timed-out holds do not block.
 */
async function assertNoActiveBooking(client, userId) {
  const { rows } = await client.query(
    `SELECT id
     FROM bookings
     WHERE user_id = $1
       AND status IN ('pending', 'confirmed')
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [userId]
  );

  if (rows.length > 0) {
    throw new AppError(
      409,
      "CONFLICT",
      "User already has an active booking",
      { bookingId: rows[0].id }
    );
  }
}

/**
 * Keep only the newest N bookings per user (rule 3). Safe with rule 1:
 * the sole active booking is always among the newest rows.
 */
async function pruneUserBookings(client, userId, { keep = MAX_BOOKINGS_PER_USER } = {}) {
  const { rowCount } = await client.query(
    `DELETE FROM bookings
     WHERE id IN (
       SELECT id FROM (
         SELECT id
         FROM bookings
         WHERE user_id = $1
         ORDER BY created_at DESC, id DESC
         OFFSET $2
       ) old
     )`,
    [userId, keep]
  );
  return rowCount ?? 0;
}

module.exports = {
  ACTIVE_BOOKING_STATUSES,
  MAX_BOOKINGS_PER_USER,
  lapseExpiredBookings,
  assertNoActiveBooking,
  pruneUserBookings,
};
