-- Roll back capacity + cuisine columns (dev only)

BEGIN;

ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_available_within_capacity;
ALTER TABLE restaurants DROP COLUMN IF EXISTS cuisine;
ALTER TABLE restaurants DROP COLUMN IF EXISTS capacity;

DELETE FROM schema_migrations WHERE version = '003_add_restaurant_capacity_cuisine';

COMMIT;
