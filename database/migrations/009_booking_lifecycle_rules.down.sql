-- Reverse 009_booking_lifecycle_rules

BEGIN;

DROP INDEX IF EXISTS idx_bookings_one_active_per_user;

DELETE FROM schema_migrations WHERE version = '009_booking_lifecycle_rules';

COMMIT;
