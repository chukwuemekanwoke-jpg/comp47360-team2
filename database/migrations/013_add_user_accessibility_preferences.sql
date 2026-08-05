-- Diner-side accessibility requirements, scored against the venue-side
-- restaurants.is_wheelchair_accessible / sensory_friendly attributes during
-- flash-deal matching.
--
-- Named "requires_*" rather than mirroring the restaurant column names: on the
-- venue side these describe what the room offers, on the user side they
-- describe what the diner needs.

BEGIN;

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS requires_wheelchair_access BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_sensory_friendly BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN user_preferences.requires_wheelchair_access IS
  'Diner needs step-free access; pairs with restaurants.is_wheelchair_accessible.';
COMMENT ON COLUMN user_preferences.requires_sensory_friendly IS
  'Diner needs a low-stimulation room; pairs with restaurants.sensory_friendly.';

-- Migration 011 mirrors preference edits back onto the legacy users columns for
-- rollback safety. There is no legacy home for these two fields, so they are
-- deliberately left out of that trigger's UPDATE OF column list.

INSERT INTO schema_migrations (version) VALUES ('013_add_user_accessibility_preferences')
ON CONFLICT (version) DO NOTHING;

COMMIT;
