-- Tracks when busyness_score was last recomputed by the ml-service, so the
-- nearby-search path can refresh only stale venues instead of calling the
-- model on every request.
--
-- Deliberately NOT restaurants.updated_at: the restaurants_set_updated_at
-- trigger fires on every column change, and available_table_count moves on
-- each booking/cancellation. Keying the refresh off updated_at would leave the
-- busiest venues — the ones whose score matters most — never refreshing.

BEGIN;

-- Nullable with no default: metadata-only on PG11+, so this stays instant on a
-- populated table. NULL reads as "never scored" and refreshes on first use.
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS busyness_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN restaurants.busyness_updated_at IS
  'Last successful ml-service busyness refresh; NULL means never scored.';

-- Backfill from existing snapshot history so a long-running database does not
-- treat every venue as stale on the first nearby request after deploy. A
-- freshly seeded database has no snapshots, where this is simply a no-op.
UPDATE restaurants r
SET busyness_updated_at = s.last_recorded_at
FROM (
  SELECT restaurant_id, MAX(recorded_at) AS last_recorded_at
  FROM availability_snapshots
  GROUP BY restaurant_id
) s
WHERE s.restaurant_id = r.id;

-- Supports the "stale or never scored" scan; NULLs sort first by default.
CREATE INDEX IF NOT EXISTS idx_restaurants_busyness_updated_at
  ON restaurants (busyness_updated_at);

INSERT INTO schema_migrations (version) VALUES ('014_add_restaurant_busyness_updated_at')
ON CONFLICT (version) DO NOTHING;

COMMIT;
