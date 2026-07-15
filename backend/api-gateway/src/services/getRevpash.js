const WINDOW_SQL = `
  SELECT
    COALESCE(SUM(total_revenue), 0)::numeric(12, 2) AS revenue,
    COALESCE(SUM(available_seat_hours), 0)::numeric(12, 2) AS available_seat_hours
  FROM restaurant_revpash_hourly
  WHERE restaurant_id = $1
    AND bucket_start >= CASE $2
      WHEN 'today' THEN date_trunc('day', timezone('America/New_York', NOW()))
      WHEN 'week' THEN date_trunc('day', timezone('America/New_York', NOW())) - INTERVAL '6 days'
      WHEN 'month' THEN date_trunc('day', timezone('America/New_York', NOW())) - INTERVAL '29 days'
    END
    AND bucket_start < date_trunc('day', timezone('America/New_York', NOW())) + INTERVAL '1 day'
`;

async function getRevpashSummary(pool, { restaurantId, window }) {
  const { rows } = await pool.query(WINDOW_SQL, [restaurantId, window]);

  const revenue = Number(rows[0]?.revenue ?? 0);
  const availableSeatHours = Number(rows[0]?.available_seat_hours ?? 0);
  const revpash =
    availableSeatHours > 0
      ? Math.round((revenue / availableSeatHours) * 100) / 100
      : 0;

  return {
    restaurantId,
    window,
    revenue,
    availableSeatHours,
    revpash,
  };
}

module.exports = { getRevpashSummary, WINDOW_SQL };
