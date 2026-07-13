const { AppError } = require("../errors");
const { BOOKING_COLUMNS } = require("./createBooking");
const { releaseConfirmedBooking } = require("./bookingSideEffects");

const CANCELLABLE_STATUSES = new Set(["pending", "confirmed"]);

async function cancelBooking(client, { userId, bookingId }) {
  const { rows } = await client.query(
    `SELECT ${BOOKING_COLUMNS}
     FROM bookings
     WHERE id = $1 AND user_id = $2
     FOR UPDATE`,
    [bookingId, userId]
  );

  if (rows.length === 0) {
    throw new AppError(404, "NOT_FOUND", "Booking not found");
  }

  const booking = rows[0];

  if (booking.status === "cancelled") {
    throw new AppError(409, "CONFLICT", "Booking is already cancelled");
  }

  if (!CANCELLABLE_STATUSES.has(booking.status)) {
    throw new AppError(409, "CONFLICT", "Booking cannot be cancelled");
  }

  const wasConfirmed = booking.status === "confirmed";

  const { rows: updatedRows } = await client.query(
    `UPDATE bookings
     SET status = 'cancelled',
         cancelled_at = NOW()
     WHERE id = $1
     RETURNING ${BOOKING_COLUMNS}, cancelled_at`,
    [bookingId]
  );

  if (wasConfirmed) {
    await releaseConfirmedBooking(client, booking);
  }

  return updatedRows[0];
}

module.exports = { cancelBooking };
