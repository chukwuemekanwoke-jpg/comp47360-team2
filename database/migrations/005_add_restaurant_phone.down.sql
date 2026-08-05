BEGIN;

ALTER TABLE restaurants
  DROP COLUMN IF EXISTS phone;

DELETE FROM schema_migrations WHERE version = '005_add_restaurant_phone';

COMMIT;
