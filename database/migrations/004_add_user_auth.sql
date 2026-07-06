-- User email/password authentication (JWT)

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON users (LOWER(email))
  WHERE email IS NOT NULL;

INSERT INTO schema_migrations (version) VALUES ('004_add_user_auth')
ON CONFLICT (version) DO NOTHING;

COMMIT;
