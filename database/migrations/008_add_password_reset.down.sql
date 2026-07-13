-- Roll back password reset columns (dev only)

BEGIN;

ALTER TABLE users
  DROP COLUMN IF EXISTS password_reset_expires_at,
  DROP COLUMN IF EXISTS password_reset_token_hash;

DELETE FROM schema_migrations WHERE version = '008_add_password_reset';

COMMIT;
