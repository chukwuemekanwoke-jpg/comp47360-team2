BEGIN;

DROP TABLE IF EXISTS historical_taxi_demand;

DELETE FROM schema_migrations
WHERE version = '012_create_historical_taxi_demand';

COMMIT;
