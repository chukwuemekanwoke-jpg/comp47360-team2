-- Separate user preference data from account/profile identity.
-- Legacy users.budget_tier and users.dietary_tags remain temporarily as a
-- rollback-compatible mirror; application reads/writes move to this table.

BEGIN;

CREATE TABLE user_preferences (
  user_id                  UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  budget_tier              budget_tier,
  dietary_restrictions     TEXT[] NOT NULL DEFAULT '{}',
  preferred_cuisines       TEXT[] NOT NULL DEFAULT '{}',
  dining_styles            TEXT[] NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_preferences IS
  'One-to-one categorized preferences for consumer onboarding and matching.';
COMMENT ON COLUMN user_preferences.dietary_restrictions IS
  'Dietary requirements such as vegan, vegetarian, halal, or gluten-free.';
COMMENT ON COLUMN user_preferences.preferred_cuisines IS
  'Cuisine preferences such as Italian, Japanese, or Mexican.';
COMMENT ON COLUMN user_preferences.dining_styles IS
  'Dining-context preferences such as casual, family, date-night, or business.';

-- Existing clients stored cuisines, dining styles, and actual dietary
-- restrictions together in users.dietary_tags. Categorize the known values
-- during backfill and preserve every unknown tag as a dietary restriction.
INSERT INTO user_preferences (
  user_id,
  budget_tier,
  dietary_restrictions,
  preferred_cuisines,
  dining_styles
)
SELECT
  u.id,
  u.budget_tier,
  ARRAY(
    SELECT tag
    FROM unnest(u.dietary_tags) AS tag
    WHERE LOWER(tag) NOT IN (
      'american', 'cafe', 'chinese', 'french', 'indian', 'italian',
      'japanese', 'korean', 'mediterranean', 'mexican', 'thai', 'vietnamese'
    )
      AND LOWER(tag) NOT IN ('casual', 'family', 'date-night', 'business')
  ),
  ARRAY(
    SELECT tag
    FROM unnest(u.dietary_tags) AS tag
    WHERE LOWER(tag) IN (
      'american', 'cafe', 'chinese', 'french', 'indian', 'italian',
      'japanese', 'korean', 'mediterranean', 'mexican', 'thai', 'vietnamese'
    )
  ),
  ARRAY(
    SELECT tag
    FROM unnest(u.dietary_tags) AS tag
    WHERE LOWER(tag) IN ('casual', 'family', 'date-night', 'business')
  )
FROM users u
ON CONFLICT (user_id) DO NOTHING;

CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Every future user receives a preference row, including users inserted
-- directly by seed scripts rather than through the API.
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id, budget_tier, dietary_restrictions)
  VALUES (NEW.id, NEW.budget_tier, NEW.dietary_tags)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_create_default_preferences
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE PROCEDURE create_default_user_preferences();

-- Temporary compatibility mirror for rollback and older application
-- revisions. A later contract migration may remove the two legacy columns
-- after all deployed consumers read user_preferences.
CREATE OR REPLACE FUNCTION sync_legacy_user_preference_columns()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    budget_tier = NEW.budget_tier,
    dietary_tags =
      NEW.dietary_restrictions || NEW.preferred_cuisines || NEW.dining_styles
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_sync_legacy_columns
  AFTER INSERT OR UPDATE OF
    budget_tier, dietary_restrictions, preferred_cuisines, dining_styles
  ON user_preferences
  FOR EACH ROW EXECUTE PROCEDURE sync_legacy_user_preference_columns();

INSERT INTO schema_migrations (version) VALUES ('011_create_user_preferences')
ON CONFLICT (version) DO NOTHING;

COMMIT;
