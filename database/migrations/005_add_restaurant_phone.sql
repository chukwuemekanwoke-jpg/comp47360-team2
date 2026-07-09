-- Merchant venue contact phone (restaurant registration)

BEGIN;

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS phone TEXT;

INSERT INTO schema_migrations (version) VALUES ('005_add_restaurant_phone')
ON CONFLICT (version) DO NOTHING;

COMMIT;
