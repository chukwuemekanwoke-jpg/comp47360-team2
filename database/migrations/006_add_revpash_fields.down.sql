-- Roll back RevPASH metric columns (dev only)

BEGIN;

ALTER TABLE restaurants
  DROP CONSTRAINT IF EXISTS restaurants_hours_valid;

ALTER TABLE bookings
  DROP COLUMN IF EXISTS duration_minutes,
  DROP COLUMN IF EXISTS check_amount,
  DROP COLUMN IF EXISTS seated_at,
  DROP COLUMN IF EXISTS party_size;

ALTER TABLE restaurants
  DROP COLUMN IF EXISTS avg_check_per_cover,
  DROP COLUMN IF EXISTS closes_at,
  DROP COLUMN IF EXISTS opens_at;

DELETE FROM schema_migrations WHERE version = '006_add_revpash_fields';

COMMIT;
