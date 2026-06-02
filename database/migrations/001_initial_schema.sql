-- BE-2: Tablé PostgreSQL schema v1
-- Run via: npm run migrate (see database/README.md)

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions (optional PostGIS — see README if extension install fails)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------
CREATE TYPE budget_tier AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');

CREATE TYPE campaign_status AS ENUM ('active', 'completed', 'cancelled');

CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

CREATE TYPE transport_mode AS ENUM ('walking', 'driving', 'transit', 'cycling');

-- ---------------------------------------------------------------------------
-- users — Story 1.1 (onboarding: budget + dietary tags for ML)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name    TEXT,
  budget_tier     budget_tier,
  dietary_tags    TEXT[] NOT NULL DEFAULT '{}',
  last_lat        DOUBLE PRECISION,
  last_lng        DOUBLE PRECISION,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.budget_tier IS 'Maps to UI: TIER_1=€, TIER_2=€€, TIER_3=€€€';
COMMENT ON COLUMN users.dietary_tags IS 'e.g. vegan, halal; empty array = no restriction';

-- ---------------------------------------------------------------------------
-- restaurants — Story 2.1, 3.1/3.2 (discovery + hold window)
-- ---------------------------------------------------------------------------
CREATE TABLE restaurants (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  latitude                DOUBLE PRECISION NOT NULL,
  longitude               DOUBLE PRECISION NOT NULL,
  address_line            TEXT,
  neighborhood            TEXT,
  hold_window_minutes     INTEGER NOT NULL DEFAULT 15
    CHECK (hold_window_minutes > 0),
  available_table_count   INTEGER NOT NULL DEFAULT 0
    CHECK (available_table_count >= 0),
  busyness_score          NUMERIC(4, 3)
    CHECK (busyness_score IS NULL OR (busyness_score >= 0 AND busyness_score <= 1)),
  is_wheelchair_accessible BOOLEAN NOT NULL DEFAULT FALSE,
  sensory_friendly        BOOLEAN NOT NULL DEFAULT FALSE,
  manager_user_id         UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT restaurants_lat_lng_valid CHECK (
    latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
  )
);

CREATE INDEX idx_restaurants_availability
  ON restaurants (available_table_count)
  WHERE available_table_count > 0;

CREATE INDEX idx_restaurants_neighborhood ON restaurants (neighborhood);

-- ---------------------------------------------------------------------------
-- campaigns — Story 5.2 (B-side lull mitigation; auto-complete on quota)
-- ---------------------------------------------------------------------------
CREATE TABLE campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id     UUID NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
  status            campaign_status NOT NULL DEFAULT 'active',
  table_quota       INTEGER NOT NULL CHECK (table_quota > 0),
  tables_claimed    INTEGER NOT NULL DEFAULT 0 CHECK (tables_claimed >= 0),
  discount_percent  INTEGER NOT NULL
    CHECK (discount_percent BETWEEN 10 AND 50),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  CONSTRAINT campaigns_quota_not_exceeded CHECK (tables_claimed <= table_quota)
);

CREATE INDEX idx_campaigns_restaurant_active
  ON campaigns (restaurant_id)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- offers — Story 4.1 (900s TTL inbox items; 1-to-1 flash deals)
-- ---------------------------------------------------------------------------
CREATE TABLE offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status          offer_status NOT NULL DEFAULT 'pending',
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT offers_unique_user_campaign UNIQUE (campaign_id, user_id)
);

CREATE INDEX idx_offers_user_inbox
  ON offers (user_id, status, expires_at);

CREATE INDEX idx_offers_campaign_pending
  ON offers (campaign_id)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- bookings — Story 3.1/3.2 (ETA-validated holds) + 5.2 (claim counts)
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  restaurant_id     UUID NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
  offer_id          UUID REFERENCES offers (id) ON DELETE SET NULL,
  campaign_id       UUID REFERENCES campaigns (id) ON DELETE SET NULL,
  status            booking_status NOT NULL DEFAULT 'pending',
  transport_mode    transport_mode,
  eta_minutes       INTEGER CHECK (eta_minutes IS NULL OR eta_minutes >= 0),
  hold_expires_at   TIMESTAMPTZ NOT NULL,
  confirmed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_offer_campaign_consistent CHECK (
    (offer_id IS NULL AND campaign_id IS NULL)
    OR (offer_id IS NOT NULL AND campaign_id IS NOT NULL)
  )
);

CREATE INDEX idx_bookings_user ON bookings (user_id, created_at DESC);
CREATE INDEX idx_bookings_restaurant_active
  ON bookings (restaurant_id)
  WHERE status IN ('pending', 'confirmed');

-- ---------------------------------------------------------------------------
-- availability_snapshots — simulated / historical busyness (OpenTable feeds)
-- ---------------------------------------------------------------------------
CREATE TABLE availability_snapshots (
  id                      BIGSERIAL PRIMARY KEY,
  restaurant_id           UUID NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
  recorded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  available_table_count   INTEGER NOT NULL CHECK (available_table_count >= 0),
  busyness_score          NUMERIC(4, 3)
    CHECK (busyness_score IS NULL OR (busyness_score >= 0 AND busyness_score <= 1))
);

CREATE INDEX idx_availability_snapshots_restaurant_time
  ON availability_snapshots (restaurant_id, recorded_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER restaurants_set_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ---------------------------------------------------------------------------
-- Campaign auto-complete when table quota is reached (Story 5.2)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_campaign_after_booking_confirm()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id UUID;
  v_quota INTEGER;
  v_claimed INTEGER;
BEGIN
  IF NEW.status <> 'confirmed' OR NEW.campaign_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  v_campaign_id := NEW.campaign_id;

  UPDATE campaigns
  SET tables_claimed = tables_claimed + 1
  WHERE id = v_campaign_id AND status = 'active'
  RETURNING table_quota, tables_claimed INTO v_quota, v_claimed;

  IF v_claimed >= v_quota THEN
    UPDATE campaigns
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_campaign_id AND status = 'active';

    UPDATE offers
    SET status = 'revoked'
    WHERE campaign_id = v_campaign_id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_campaign_quota
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE PROCEDURE sync_campaign_after_booking_confirm();

-- ---------------------------------------------------------------------------
-- Schema version tracking
-- ---------------------------------------------------------------------------
CREATE TABLE schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');

COMMIT;
