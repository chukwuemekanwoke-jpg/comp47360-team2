BEGIN;

ALTER TABLE restaurants
  DROP COLUMN IF EXISTS reviews,
  DROP COLUMN IF EXISTS rating;

DELETE FROM schema_migrations
WHERE version = '013_add_restaurant_rating_reviews';

COMMIT;
