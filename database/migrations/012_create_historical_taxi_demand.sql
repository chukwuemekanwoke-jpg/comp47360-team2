-- Static historical taxi-demand features for the ML pipeline.
-- Data loading is intentionally separate from this schema migration.

BEGIN;

CREATE TABLE historical_taxi_demand (
  source_year          SMALLINT NOT NULL,
  taxi_zone_id         SMALLINT NOT NULL,
  month                SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  weekday              SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  hour                 SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  dropoff_count        INTEGER NOT NULL CHECK (dropoff_count >= 0),
  passenger_count_sum  BIGINT NOT NULL CHECK (passenger_count_sum >= 0),
  avg_trip_distance    DOUBLE PRECISION
    CHECK (avg_trip_distance IS NULL OR avg_trip_distance >= 0),
  PRIMARY KEY (source_year, taxi_zone_id, month, weekday, hour)
);

COMMENT ON TABLE historical_taxi_demand IS
  'Monthly weekday/hour taxi drop-off aggregates used as static ML proxy features.';
COMMENT ON COLUMN historical_taxi_demand.source_year IS
  'Calendar year of the source trip records.';
COMMENT ON COLUMN historical_taxi_demand.weekday IS
  'Pandas weekday convention: Monday=0 through Sunday=6.';
COMMENT ON COLUMN historical_taxi_demand.avg_trip_distance IS
  'Mean trip distance in miles; nullable when the source group has no valid distances.';

INSERT INTO schema_migrations (version)
VALUES ('012_create_historical_taxi_demand')
ON CONFLICT (version) DO NOTHING;

COMMIT;
