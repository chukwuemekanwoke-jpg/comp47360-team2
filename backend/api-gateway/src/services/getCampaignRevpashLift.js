const { AppError } = require("../errors");

const BOOKING_STATUSES_SQL = "('confirmed', 'completed')";
const BASELINE_WINDOW_SQL = "INTERVAL '30 days'";

// Per-campaign RevPASH lift (SCRUM-309 / TABL-215 Phase 2) — organic vs. deal
// RevPASH comparison for a single flash-deal campaign. See
// docs/architecture/data-strategy.md §11 for the base RevPASH real-vs-simulated context;
// this is a new comparison on top of the same restaurant_revpash_hourly view
// added in migration 007.
//
// Methodology:
//   - "Deal" side: revenue from bookings tied to this campaign, over seat-hours
//     available during the campaign's own active window (created_at -> completed/
//     cancelled/now).
//   - "Organic" side: revenue from this restaurant's non-campaign bookings
//     (campaign_id IS NULL) in the SAME hour-of-day, over the trailing 30 days
//     before the campaign started — not "right now", since the campaign's own
//     hour(s) often have little/no organic booking activity by definition
//     (that's usually why a deal ran then), which would bias a same-window
//     comparison toward an artificially inflated lift.
//   - offPeak: true when that hour's organic baseline sits below the
//     restaurant's median hourly revpash (computed from the same trailing
//     window), i.e. the campaign targeted a genuinely quiet hour.
async function getCampaignRevpashLift(pool, { restaurantId, campaignId }) {
  const { rows: campaignRows } = await pool.query(
    `SELECT id, created_at, completed_at, cancelled_at
     FROM campaigns
     WHERE id = $1 AND restaurant_id = $2`,
    [campaignId, restaurantId]
  );

  if (campaignRows.length === 0) {
    throw new AppError(404, "NOT_FOUND", "Campaign not found");
  }

  const campaign = campaignRows[0];
  const dealStart = campaign.created_at;
  const dealEnd = campaign.completed_at || campaign.cancelled_at || new Date();

  const { rows: dealRows } = await pool.query(
    `SELECT
       EXTRACT(HOUR FROM timezone('America/New_York', $2::timestamptz))::int AS deal_hour,
       COALESCE(SUM(b.check_amount), 0)::numeric(12, 2) AS revenue
     FROM bookings b
     WHERE b.campaign_id = $1
       AND b.status IN ${BOOKING_STATUSES_SQL}`,
    [campaignId, dealStart]
  );

  const dealHour = dealRows[0].deal_hour;
  const dealRevenue = Number(dealRows[0].revenue);

  const { rows: dealCapacityRows } = await pool.query(
    `SELECT COALESCE(SUM(available_seat_hours), 0)::numeric(12, 2) AS seat_hours
     FROM restaurant_revpash_hourly
     WHERE restaurant_id = $1
       AND bucket_start >= timezone('America/New_York', $2::timestamptz)
       AND bucket_start < timezone('America/New_York', $3::timestamptz)`,
    [restaurantId, dealStart, dealEnd]
  );

  const dealSeatHours = Number(dealCapacityRows[0].seat_hours);

  const { rows: organicRows } = await pool.query(
    `SELECT COALESCE(SUM(b.check_amount), 0)::numeric(12, 2) AS revenue
     FROM bookings b
     WHERE b.restaurant_id = $1
       AND b.campaign_id IS NULL
       AND b.status IN ${BOOKING_STATUSES_SQL}
       AND COALESCE(b.seated_at, b.confirmed_at, b.created_at) >= $2::timestamptz - ${BASELINE_WINDOW_SQL}
       AND COALESCE(b.seated_at, b.confirmed_at, b.created_at) < $2::timestamptz
       AND EXTRACT(HOUR FROM timezone('America/New_York', COALESCE(b.seated_at, b.confirmed_at, b.created_at)))::int = $3`,
    [restaurantId, dealStart, dealHour]
  );

  const organicRevenue = Number(organicRows[0].revenue);

  const { rows: organicCapacityRows } = await pool.query(
    `SELECT
       COALESCE(SUM(available_seat_hours), 0)::numeric(12, 2) AS seat_hours,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY revpash) AS median_revpash
     FROM restaurant_revpash_hourly
     WHERE restaurant_id = $1
       AND bucket_start >= timezone('America/New_York', $2::timestamptz - ${BASELINE_WINDOW_SQL})
       AND bucket_start < timezone('America/New_York', $2::timestamptz)
       AND EXTRACT(HOUR FROM bucket_start)::int = $3`,
    [restaurantId, dealStart, dealHour]
  );

  const organicSeatHours = Number(organicCapacityRows[0].seat_hours);
  const medianRevpash =
    organicCapacityRows[0].median_revpash !== null
      ? Number(organicCapacityRows[0].median_revpash)
      : null;

  const dealRevpash = dealSeatHours > 0 ? round(dealRevenue / dealSeatHours, 2) : 0;
  const organicRevpash = organicSeatHours > 0 ? round(organicRevenue / organicSeatHours, 2) : 0;

  // No organic baseline for this hour yet (new venue, or genuinely never
  // booked organically at this hour) — nothing meaningful to divide by, so
  // report no lift rather than a misleading infinite/undefined percentage.
  const liftPercent =
    organicRevpash > 0 ? round(((dealRevpash - organicRevpash) / organicRevpash) * 100, 1) : 0;

  const offPeak = medianRevpash !== null && organicRevpash < medianRevpash;

  return {
    campaignId,
    organicRevpash,
    dealRevpash,
    liftPercent,
    offPeak,
  };
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

module.exports = { getCampaignRevpashLift };
