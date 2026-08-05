BEGIN;

DROP INDEX IF EXISTS idx_campaigns_active_expires;

ALTER TABLE campaigns
  DROP COLUMN IF EXISTS expires_at;

-- PostgreSQL cannot easily remove an enum value; leave 'expired' in place on rollback.
DELETE FROM schema_migrations WHERE version = '010_add_campaign_expires_at';

COMMIT;
