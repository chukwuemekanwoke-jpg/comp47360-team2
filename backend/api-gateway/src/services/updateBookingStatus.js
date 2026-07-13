const { AppError } = require("../errors");
const { BOOKING_COLUMNS } = require("./createBooking");
const {
  claimConfirmedBooking,
  releaseConfirmedBooking,
} = require("./bookingSideEffects");

const BOOKING_STATUSES = new Set([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

const TERMINAL_STATUSES = new Set(["cancelled", "completed", "no_show"]);

const ALLOWED_TRANSITIONS = {
  pending: new Set(["confirmed", "cancelled", "completed", "no_show"]),
  confirmed: new Set(["cancelled", "completed", "no_show"]),
};

async function updateBookingStatus(client, { managerUserId, bookingId, status }) {
  const { rows } = await client.query(
    `SELECT
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
       r.manager_user_id
     FROM bookings b
     JOIN restaurants r ON r.id = b.restaurant_id
     WHERE b.id = $1
     FOR UPDATE OF b`,
    [bookingId]
  );

  if (rows.length === 0) {
    throw new AppError(404, "NOT_FOUND", "Booking not found");
  }

  const booking = rows[0];

  if (!booking.manager_user_id || booking.manager_user_id !== managerUserId) {
    throw new AppError(401, "UNAUTHORIZED", "Not authorized to manage this booking");
  }

  if (booking.status === status) {
    return booking;
  }

  if (TERMINAL_STATUSES.has(booking.status)) {
    throw new AppError(409, "CONFLICT", "Booking status can no longer be changed");
  }

  const allowedTargets = ALLOWED_TRANSITIONS[booking.status];
  if (!allowedTargets || !allowedTargets.has(status)) {
    throw new AppError(
      409,
      "CONFLICT",
      `Cannot change booking status from ${booking.status} to ${status}`
    );
  }

  const wasConfirmed = booking.status === "confirmed";
  const willRelease = wasConfirmed && (status === "cancelled" || status === "no_show");
  const willClaim = booking.status === "pending" && status === "confirmed";

  if (willClaim) {
    await claimConfirmedBooking(client, booking);
  }

  const statusFragments = ["status = $2"];
  const values = [bookingId, status];

  if (status === "cancelled") {
    statusFragments.push("cancelled_at = NOW()");
  }
  if (status === "confirmed") {
    statusFragments.push("confirmed_at = COALESCE(confirmed_at, NOW())");
  }
  if (status === "completed") {
    statusFragments.push("seated_at = COALESCE(seated_at, NOW())");
  }

  const { rows: updatedRows } = await client.query(
    `UPDATE bookings
     SET ${statusFragments.join(", ")}
     WHERE id = $1
     RETURNING ${BOOKING_COLUMNS}`,
    values
  );

  if (willRelease) {
    await releaseConfirmedBooking(client, booking);
  }

  return updatedRows[0];
}

module.exports = {
  updateBookingStatus,
  BOOKING_STATUSES,
  ALLOWED_TRANSITIONS,
};
