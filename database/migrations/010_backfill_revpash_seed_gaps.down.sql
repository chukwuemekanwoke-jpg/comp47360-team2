-- No safe "down" for this migration: it's a NULL-only backfill (COALESCE),
-- and there is no record of which rows were NULL before it ran vs. already
-- populated by migration 006 or the API's benchmarkAvgCheck path. Re-nulling
-- everything would be destructive and wrong for rows that were legitimately
-- populated beforehand. This file only removes the migration's ledger entry
-- so it can be re-applied (still safe/idempotent) if needed -- it does not
-- revert any data.

BEGIN;

DELETE FROM schema_migrations WHERE version = '010_backfill_revpash_seed_gaps';

COMMIT;
