-- Optional: enable PostGIS for geography-indexed queries (not run by default migrate).
-- Requires PostGIS installed on the server (e.g. postgis/postgis Docker image).
--
-- Apply manually:
--   psql "$DATABASE_URL" -f migrations/002_postgis_optional.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

UPDATE restaurants
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_location
  ON restaurants USING GIST (location);

-- Example nearby query (metres):
-- SELECT * FROM restaurants
-- WHERE ST_DWithin(
--   location,
--   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
--   1500
-- )
-- AND available_table_count > 0;

INSERT INTO schema_migrations (version) VALUES ('002_postgis_optional')
ON CONFLICT (version) DO NOTHING;

COMMIT;
