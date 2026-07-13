-- Roll back RevPASH hourly view (dev only)

BEGIN;

DROP VIEW IF EXISTS restaurant_revpash_hourly;

DELETE FROM schema_migrations WHERE version = '007_restaurant_revpash_hourly_view';

COMMIT;
