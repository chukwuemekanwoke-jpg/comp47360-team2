-- RevPASH hourly aggregation view (SCRUM-302 / TABL-118 Phase 2)
-- RevPASH = total_revenue / available_seat_hours per local hour bucket (America/New_York)

BEGIN;

CREATE OR REPLACE VIEW restaurant_revpash_hourly AS
WITH booking_hours AS (
  SELECT
    b.restaurant_id,
    date_trunc(
      'hour',
      timezone('America/New_York', COALESCE(b.seated_at, b.confirmed_at, b.created_at))
    ) AS bucket_start,
    SUM(COALESCE(b.check_amount, 0))::numeric(12, 2) AS total_revenue,
    COUNT(*)::int AS booking_count
  FROM bookings b
  WHERE b.status IN ('confirmed', 'completed')
  GROUP BY b.restaurant_id, 2
),
eligible_days AS (
  SELECT DISTINCT
    bh.restaurant_id,
    date_trunc('day', bh.bucket_start) AS day_start
  FROM booking_hours bh
  UNION
  SELECT
    r.id,
    date_trunc('day', timezone('America/New_York', NOW()))
  FROM restaurants r
  WHERE r.opens_at IS NOT NULL
    AND r.closes_at IS NOT NULL
),
open_hour_spine AS (
  SELECT
    ed.restaurant_id,
    gs.bucket_start,
    r.capacity::numeric AS available_seat_hours
  FROM eligible_days ed
  JOIN restaurants r ON r.id = ed.restaurant_id
  CROSS JOIN LATERAL generate_series(
    ed.day_start + r.opens_at,
    ed.day_start + r.closes_at - INTERVAL '1 hour',
    INTERVAL '1 hour'
  ) AS gs(bucket_start)
  WHERE r.opens_at IS NOT NULL
    AND r.closes_at IS NOT NULL
    AND r.closes_at > r.opens_at
)
SELECT
  spine.restaurant_id,
  spine.bucket_start,
  COALESCE(bh.total_revenue, 0)::numeric(12, 2) AS total_revenue,
  spine.available_seat_hours,
  COALESCE(bh.booking_count, 0) AS booking_count,
  ROUND(
    COALESCE(bh.total_revenue, 0) / NULLIF(spine.available_seat_hours, 0),
    4
  ) AS revpash
FROM open_hour_spine spine
LEFT JOIN booking_hours bh
  ON bh.restaurant_id = spine.restaurant_id
 AND bh.bucket_start = spine.bucket_start;

COMMENT ON VIEW restaurant_revpash_hourly IS
  'Hourly RevPASH buckets in America/New_York local time: revenue, seat-hours, and revpash.';

INSERT INTO schema_migrations (version) VALUES ('007_restaurant_revpash_hourly_view')
ON CONFLICT (version) DO NOTHING;

COMMIT;
