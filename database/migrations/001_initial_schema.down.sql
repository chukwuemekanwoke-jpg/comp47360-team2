-- Roll back BE-2 schema v1 (destructive — dev only)

BEGIN;

DROP TRIGGER IF EXISTS bookings_campaign_quota ON bookings;
DROP TRIGGER IF EXISTS restaurants_set_updated_at ON restaurants;
DROP TRIGGER IF EXISTS users_set_updated_at ON users;

DROP FUNCTION IF EXISTS sync_campaign_after_booking_confirm();
DROP FUNCTION IF EXISTS set_updated_at();

DROP TABLE IF EXISTS schema_migrations;
DROP TABLE IF EXISTS availability_snapshots;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS offers;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS transport_mode;
DROP TYPE IF EXISTS booking_status;
DROP TYPE IF EXISTS offer_status;
DROP TYPE IF EXISTS campaign_status;
DROP TYPE IF EXISTS budget_tier;

COMMIT;
