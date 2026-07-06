BEGIN;

DROP INDEX IF EXISTS users_email_unique_idx;

ALTER TABLE users
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS token_version;

DELETE FROM schema_migrations WHERE version = '004_add_user_auth';

COMMIT;
