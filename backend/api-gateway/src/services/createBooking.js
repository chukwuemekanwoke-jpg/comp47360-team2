const { AppError } = require("../errors");
const { resolveEtaResult } = require("./etaResolver");
const {
  lapseExpiredBookings,
  assertNoActiveBooking,
  pruneUserBookings,
} = require("./bookingLifecycle");
const {
  benchmarkAvgCheck,
  computeCheckAmount,
  DEFAULT_DURATION_MINUTES,
} = require("../utils/revpash");

const BOOKING_COLUMNS = `
  id, user_id, restaurant_id, offer_id, campaign_id,
  status, transport_mode, eta_minutes, hold_expires_at, confirmed_at
`;

async function createBooking(client, {
  userId,
  restaurantId,
  transportMode,
  userLat,
  userLng,
  offerId = null,
  partySize = 2,
}) {
  // Lapse timed-out holds for this user before the active-booking check so a
  // stale reservation cannot block a legitimate new booking (rules 1 + 2).
  await lapseExpiredBookings(client, { userId });
  await assertNoActiveBooking(client, userId);

  const { rows: restaurantRows } = await client.query(
    `SELECT id, latitude, longitude, hold_window_minutes, available_table_count,
            avg_check_per_cover, cuisine, neighborhood
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

  const etaResult = await resolveEtaResult({
    restaurantId,
    transportMode,
    userLat,
    userLng,
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
  let discountPercent = 0;

  if (offerId) {
    const { rows: offerRows } = await client.query(
      `SELECT o.id, o.status, o.expires_at, o.campaign_id, c.restaurant_id, c.discount_percent
       FROM offers o
       JOIN campaigns c ON c.id = o.campaign_id
       WHERE o.id = $1 AND o.user_id = $2
       FOR UPDATE`,
      [offerId, userId]
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
    discountPercent = offer.discount_percent;
  }

  const avgCheckPerCover =
    Number(restaurant.avg_check_per_cover)
    || benchmarkAvgCheck(restaurant.cuisine, restaurant.neighborhood);
  const checkAmount = computeCheckAmount(partySize, avgCheckPerCover, discountPercent);

  let bookingRows;
  try {
    ({ rows: bookingRows } = await client.query(
      `INSERT INTO bookings (
         user_id,
         restaurant_id,
         offer_id,
         campaign_id,
         status,
         transport_mode,
         eta_minutes,
         hold_expires_at,
         confirmed_at,
         party_size,
         seated_at,
         check_amount,
         duration_minutes
       )
       VALUES (
         $1, $2, $3, $4,
         'confirmed',
         $5,
         $6,
         NOW() + ($7 * INTERVAL '1 minute'),
         NOW(),
         $8,
         NOW(),
         $9,
         $10
       )
       RETURNING ${BOOKING_COLUMNS}`,
      [
        userId,
        restaurantId,
        resolvedOfferId,
        campaignId,
        transportMode,
        etaResult.etaMinutes,
        restaurant.hold_window_minutes,
        partySize,
        checkAmount,
        DEFAULT_DURATION_MINUTES,
      ]
    ));
  } catch (err) {
    // Race-safe fallback for idx_bookings_one_active_per_user
    if (err && err.code === "23505") {
      throw new AppError(409, "CONFLICT", "User already has an active booking");
    }
    throw err;
  }

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

  // Drop older history so each user keeps only the newest N rows (rule 3).
  await pruneUserBookings(client, userId);

  return { ...bookingRows[0], eta_source: etaResult.source };
}

module.exports = { createBooking, BOOKING_COLUMNS };
