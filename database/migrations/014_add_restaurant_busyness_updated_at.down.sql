-- Rolling back only loses refresh bookkeeping; busyness_score itself and the
-- availability_snapshots history are untouched.

BEGIN;

DROP INDEX IF EXISTS idx_restaurants_busyness_updated_at;

ALTER TABLE restaurants
  DROP COLUMN IF EXISTS busyness_updated_at;

DELETE FROM schema_migrations
WHERE version = '014_add_restaurant_busyness_updated_at';

COMMIT;
