-- RevPASH metric inputs (SCRUM-302 / TABL-118 Phase 1)
-- See docs/architecture/data-strategy.md §11 and docs/architecture/database-schema.md

BEGIN;

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS opens_at TIME,
  ADD COLUMN IF NOT EXISTS closes_at TIME,
  ADD COLUMN IF NOT EXISTS avg_check_per_cover NUMERIC(8, 2)
    CHECK (avg_check_per_cover IS NULL OR avg_check_per_cover > 0);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS party_size INTEGER
    CHECK (party_size IS NULL OR (party_size >= 1 AND party_size <= 20)),
  ADD COLUMN IF NOT EXISTS seated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_amount NUMERIC(10, 2)
    CHECK (check_amount IS NULL OR check_amount >= 0),
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER
    CHECK (duration_minutes IS NULL OR duration_minutes > 0);

ALTER TABLE restaurants
  ADD CONSTRAINT restaurants_hours_valid CHECK (
    (opens_at IS NULL AND closes_at IS NULL)
    OR (opens_at IS NOT NULL AND closes_at IS NOT NULL AND closes_at > opens_at)
  );

COMMENT ON COLUMN restaurants.opens_at IS
  'Local opening time; merchant onboarding or Places enrichment';
COMMENT ON COLUMN restaurants.closes_at IS
  'Local closing time; merchant onboarding or Places enrichment';
COMMENT ON COLUMN restaurants.avg_check_per_cover IS
  'Average spend per cover (USD); benchmark seed until POS data exists';

COMMENT ON COLUMN bookings.party_size IS
  'Party size entered by the diner at booking time';
COMMENT ON COLUMN bookings.seated_at IS
  'Check-in time; defaults to confirmed_at when host flow is absent';
COMMENT ON COLUMN bookings.check_amount IS
  'Simulated check total until payment/POS integration exists';
COMMENT ON COLUMN bookings.duration_minutes IS
  'Simulated table turn time (minutes); default 90 until departed_at exists';

-- Backfill restaurant hours and cuisine/neighborhood benchmark checks
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

-- Backfill existing bookings with simulated RevPASH inputs
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

INSERT INTO schema_migrations (version) VALUES ('006_add_revpash_fields')
ON CONFLICT (version) DO NOTHING;

COMMIT;
