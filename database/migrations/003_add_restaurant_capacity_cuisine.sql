-- Add static venue attributes: total table capacity and primary cuisine type

BEGIN;

ALTER TABLE restaurants
  ADD COLUMN capacity INTEGER NOT NULL DEFAULT 8
    CHECK (capacity > 0),
  ADD COLUMN cuisine TEXT;

ALTER TABLE restaurants
  ADD CONSTRAINT restaurants_available_within_capacity
    CHECK (available_table_count <= capacity);

COMMENT ON COLUMN restaurants.capacity IS
  'Total table capacity (max concurrent tables offered on Tablé)';
COMMENT ON COLUMN restaurants.cuisine IS
  'Primary cuisine slug, e.g. italian, thai, american';

INSERT INTO schema_migrations (version) VALUES ('003_add_restaurant_capacity_cuisine');

COMMIT;
