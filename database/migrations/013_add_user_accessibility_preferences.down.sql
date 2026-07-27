-- Drops the diner-side accessibility requirements. These fields have no legacy
-- mirror on users, so rolling back discards them.

BEGIN;

ALTER TABLE user_preferences
  DROP COLUMN IF EXISTS requires_wheelchair_access,
  DROP COLUMN IF EXISTS requires_sensory_friendly;

DELETE FROM schema_migrations
WHERE version = '013_add_user_accessibility_preferences';

COMMIT;
