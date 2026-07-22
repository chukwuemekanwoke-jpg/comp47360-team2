-- Booking lifecycle constraints (demo rules):
-- 1. At most one active (pending/confirmed) booking per user
-- 2. Hold expiry is enforced in the API (lazy lapse); this index backs rule 1

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_one_active_per_user
  ON bookings (user_id)
  WHERE status IN ('pending', 'confirmed');

COMMENT ON INDEX idx_bookings_one_active_per_user IS
  'Enforces a single active booking per user (pending or confirmed)';

INSERT INTO schema_migrations (version) VALUES ('009_booking_lifecycle_rules')
ON CONFLICT (version) DO NOTHING;

COMMIT;
