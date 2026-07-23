-- Backfill RevPASH input fields for restaurants seeded before this migration
-- (originally numbered 009, renumbered to 010 to avoid a collision with the
-- concurrently-merged 009_booking_lifecycle_rules)
-- (SCRUM-277 / TABL-604 performance-testing review surfaced this: the bulk
-- generate-seed.js insert of ~300 real Manhattan restaurants left
-- opens_at/closes_at/avg_check_per_cover NULL on every one of them, since
-- migration 006's one-time backfill ran before that batch existed. NULL
-- avg_check_per_cover means computeCheckAmount() silently produces
-- check_amount = $0.00 for every booking at these restaurants
-- (Number(null) === 0 in JS) -- RevPASH reads as zero revenue for ~92% of
-- the restaurant pool with no error anywhere.
--
-- Reapplies the exact same COALESCE logic already proven in migration 006
-- (identical cuisine/neighborhood benchmark as utils/revpash.js's
-- benchmarkAvgCheck/neighborhoodPremium) -- safe to run repeatedly, only
-- touches rows still NULL.

BEGIN;

UPDATE restaurants
SET
  opens_at = COALESCE(opens_at, '11:00'::time),
  closes_at = COALESCE(closes_at, '22:00'::time),
  avg_check_per_cover = COALESCE(
    avg_check_per_cover,
    CASE COALESCE(LOWER(cuisine), '')
      WHEN 'french' THEN 85.00
      WHEN 'italian' THEN 68.00
      WHEN 'japanese' THEN 55.00
      WHEN 'thai' THEN 42.00
      WHEN 'cafe' THEN 32.00
      WHEN 'american' THEN 48.00
      ELSE 45.00
    END
    * CASE
      WHEN neighborhood IN ('Midtown', 'Midtown East', 'Theater District', 'Upper East Side')
        THEN 1.10
      WHEN neighborhood IN ('Hell''s Kitchen', 'Murray Hill', 'Koreatown')
        THEN 1.05
      ELSE 1.00
    END
  );

-- Same rationale for any bookings that slipped through without RevPASH
-- inputs (mirrors migration 006's bookings backfill; harmless no-op if
-- everything's already populated).
UPDATE bookings
SET
  party_size = COALESCE(party_size, 2),
  seated_at = COALESCE(seated_at, confirmed_at, created_at),
  duration_minutes = COALESCE(duration_minutes, 90),
  check_amount = COALESCE(
    check_amount,
    (
      SELECT ROUND(
        2
        * r.avg_check_per_cover
        * COALESCE(1 - c.discount_percent::numeric / 100, 1),
        2
      )
      FROM restaurants r
      LEFT JOIN campaigns c ON c.id = bookings.campaign_id
      WHERE r.id = bookings.restaurant_id
    )
  )
WHERE status IN ('confirmed', 'completed');

INSERT INTO schema_migrations (version) VALUES ('010_backfill_revpash_seed_gaps')
ON CONFLICT (version) DO NOTHING;

COMMIT;
