-- Password recovery tokens (forgot / reset password flow)

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN users.password_reset_token_hash IS
  'SHA-256 hash of a single-use password reset token; raw token only sent by email';
COMMENT ON COLUMN users.password_reset_expires_at IS
  'Expiry for password_reset_token_hash';

INSERT INTO schema_migrations (version) VALUES ('008_add_password_reset')
ON CONFLICT (version) DO NOTHING;

COMMIT;
