-- Roll back the preference split. The compatibility trigger keeps the legacy
-- users columns current, so dropping the dedicated table does not lose the
-- fields supported before migration 011.

BEGIN;

DROP TRIGGER IF EXISTS users_create_default_preferences ON users;
DROP FUNCTION IF EXISTS create_default_user_preferences();

DROP TRIGGER IF EXISTS user_preferences_sync_legacy_columns ON user_preferences;
DROP FUNCTION IF EXISTS sync_legacy_user_preference_columns();

DROP TRIGGER IF EXISTS user_preferences_set_updated_at ON user_preferences;
DROP TABLE IF EXISTS user_preferences;

DELETE FROM schema_migrations WHERE version = '011_create_user_preferences';

COMMIT;
