-- Campaign TTL: same 15-minute window as flash-deal offers (team decision).
-- Lazy expiry marks overdue active campaigns as 'expired' and revokes pending offers.

BEGIN;

ALTER TYPE campaign_status ADD VALUE IF NOT EXISTS 'expired';

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill existing rows: 15 minutes from creation (may already be in the past).
UPDATE campaigns
SET expires_at = created_at + INTERVAL '15 minutes'
WHERE expires_at IS NULL;

ALTER TABLE campaigns
  ALTER COLUMN expires_at SET NOT NULL;

COMMENT ON COLUMN campaigns.expires_at IS
  'Campaign TTL end (MVP: created_at + 900s). Active campaigns past this are lazily expired.';

CREATE INDEX IF NOT EXISTS idx_campaigns_active_expires
  ON campaigns (expires_at)
  WHERE status = 'active';

INSERT INTO schema_migrations (version) VALUES ('010_add_campaign_expires_at')
ON CONFLICT (version) DO NOTHING;

COMMIT;
