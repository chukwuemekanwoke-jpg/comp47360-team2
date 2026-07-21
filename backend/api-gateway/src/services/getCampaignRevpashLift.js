const { AppError } = require("../errors");
const {
  computeRevpash,
  computeRevpashLiftPercent,
  isOffPeakLocalHour,
} = require("../utils/revpash");

const LIFT_SQL = `
WITH campaign AS (
  SELECT
    c.id,
    c.restaurant_id,
    c.created_at,
    COALESCE(c.completed_at, c.cancelled_at, NOW()) AS ended_at,
    EXTRACT(ISODOW FROM timezone('America/New_York', c.created_at))::int AS campaign_dow,
    EXTRACT(HOUR FROM timezone('America/New_York', c.created_at))::int AS campaign_hour
  FROM campaigns c
  WHERE c.id = $2
    AND c.restaurant_id = $1
),
restaurant AS (
  SELECT r.capacity
  FROM restaurants r
  JOIN campaign c ON c.restaurant_id = r.id
),
organic AS (
  SELECT
    COALESCE(SUM(b.check_amount), 0)::numeric AS revenue,
    GREATEST(
      COUNT(
        DISTINCT date_trunc(
          'day',
          timezone('America/New_York', COALESCE(b.seated_at, b.confirmed_at, b.created_at))
        )
      )::int,
      1
    ) AS day_count
  FROM campaign c
  JOIN bookings b ON b.restaurant_id = c.restaurant_id
  WHERE b.campaign_id IS NULL
    AND b.status IN ('confirmed', 'completed')
    AND EXTRACT(
          ISODOW
          FROM timezone('America/New_York', COALESCE(b.seated_at, b.confirmed_at, b.created_at))
        ) = c.campaign_dow
    AND EXTRACT(
          HOUR
          FROM timezone('America/New_York', COALESCE(b.seated_at, b.confirmed_at, b.created_at))
        ) = c.campaign_hour
    AND COALESCE(b.seated_at, b.confirmed_at, b.created_at) >= c.created_at - INTERVAL '30 days'
    AND COALESCE(b.seated_at, b.confirmed_at, b.created_at) < c.created_at
),
deal AS (
  SELECT COALESCE(SUM(b.check_amount), 0)::numeric AS revenue
  FROM campaign c
  JOIN bookings b ON b.campaign_id = c.id
  WHERE b.status IN ('confirmed', 'completed')
),
duration AS (
  SELECT GREATEST(
    EXTRACT(EPOCH FROM (c.ended_at - c.created_at)) / 3600.0,
    1.0
  ) AS campaign_hours
  FROM campaign c
)
SELECT
  c.id AS campaign_id,
  c.campaign_hour,
  r.capacity,
  o.revenue AS organic_revenue,
  o.day_count AS organic_day_count,
  d.revenue AS deal_revenue,
  dur.campaign_hours
FROM campaign c
CROSS JOIN restaurant r
CROSS JOIN organic o
CROSS JOIN deal d
CROSS JOIN duration dur
`;

async function getCampaignRevpashLift(pool, { restaurantId, campaignId }) {
  const { rows } = await pool.query(LIFT_SQL, [restaurantId, campaignId]);

  if (rows.length === 0) {
    throw new AppError(404, "NOT_FOUND", "Campaign not found");
  }

  const row = rows[0];
  const capacity = Number(row.capacity);
  const organicSeatHours = capacity * Number(row.organic_day_count);
  const dealSeatHours = capacity * Number(row.campaign_hours);
  const organicRevpash = computeRevpash(row.organic_revenue, organicSeatHours);
  const dealRevpash = computeRevpash(row.deal_revenue, dealSeatHours);

  return {
    campaignId: row.campaign_id,
    organicRevpash,
    dealRevpash,
    liftPercent: computeRevpashLiftPercent(organicRevpash, dealRevpash),
    offPeak: isOffPeakLocalHour(row.campaign_hour),
  };
}

module.exports = { getCampaignRevpashLift, LIFT_SQL };
