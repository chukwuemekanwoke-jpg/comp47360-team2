-- Google-style restaurant rating metadata.
-- Values remain NULL until a trusted enrichment/import process supplies them.

BEGIN;

ALTER TABLE restaurants
  ADD COLUMN rating NUMERIC(2, 1)
    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  ADD COLUMN reviews INTEGER
    CHECK (reviews IS NULL OR reviews >= 0);

COMMENT ON COLUMN restaurants.rating IS
  'External aggregate rating from 0.0 to 5.0; NULL when unavailable.';
COMMENT ON COLUMN restaurants.reviews IS
  'External aggregate review count; NULL when unavailable.';

INSERT INTO schema_migrations (version)
VALUES ('013_add_restaurant_rating_reviews')
ON CONFLICT (version) DO NOTHING;

COMMIT;
