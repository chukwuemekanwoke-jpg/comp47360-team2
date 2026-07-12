const { AppError } = require("../errors");
const { BOOKING_COLUMNS } = require("./createBooking");

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
    await client.query(
      `UPDATE restaurants
       SET available_table_count = LEAST(available_table_count + 1, capacity)
       WHERE id = $1`,
      [booking.restaurant_id]
    );

    if (booking.offer_id) {
      await client.query(
        `UPDATE offers
         SET status = CASE
               WHEN expires_at > NOW() THEN 'pending'::offer_status
               ELSE 'expired'::offer_status
             END,
             accepted_at = NULL
         WHERE id = $1`,
        [booking.offer_id]
      );
    }

    if (booking.campaign_id) {
      const { rows: campaignRows } = await client.query(
        `UPDATE campaigns
         SET tables_claimed = GREATEST(tables_claimed - 1, 0)
         WHERE id = $1
         RETURNING table_quota, tables_claimed, status`,
        [booking.campaign_id]
      );

      const campaign = campaignRows[0];
      if (
        campaign &&
        campaign.status === "completed" &&
        campaign.tables_claimed < campaign.table_quota
      ) {
        await client.query(
          `UPDATE campaigns
           SET status = 'active',
               completed_at = NULL
           WHERE id = $1`,
          [booking.campaign_id]
        );
      }
    }
  }

  return updatedRows[0];
}

module.exports = { cancelBooking };
