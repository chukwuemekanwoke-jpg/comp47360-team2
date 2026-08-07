# Seed data

**Authors:** Yang Liu — Backend Lead · Chukwuemeka Nwoke — Integration Lead / Scrum Master · Milo Dennehy - Mobile App Lead

Complementary seeds:

| File | Data | Use for |
|------|------|---------|
| `001_demo_manhattan.sql` | 15 **fictional** venues, fixed UUIDs | Deterministic API/integration tests, examples in docs |
| `002_manhattan_real.sql` | ~300 **real** Manhattan venues + demo users (generated) | Superseded by `006` — a smaller subset, kept for a lightweight demo |
| `003_demo_revpash_bookings.sql` | Sample completed/confirmed bookings | RevPASH view smoke data for merchant dashboard |
| `004_historical_taxi_demand.sql` | ~39.5k rows, NYC TLC drop-off zone/hour aggregates (July 2025) | Static ML pipeline demand features (`historical_taxi_demand`) |
| `005_restaurant_managers.sql` | One manager user per venue + `manager_user_id` links (1,402) | B-side login/dashboard testing against real venues |
| `006_manhattan_real_3000.sql` | **3,000** real venues, `restaurants` table only (generated) | **The real-data seed** — `npm run seed:real`, the Docker stack, and populating a fresh Cloud SQL database from scratch |

After migration `006_add_revpash_fields`, both restaurant seeds populate `opens_at`, `closes_at`, and `avg_check_per_cover` for RevPASH.

`001` names are **not** real venues; `002`/`006` identity (name/address/coords/cuisine) is
real (from `ml-pipeline/notebooks/restaurant_clean.csv`), while operational fields
(capacity, available tables, busyness, hold window, manager, accessibility) are
**simulated deterministically** — no public dataset has those.

## Quick start

```bash
cd database
npm run db:up      # if Postgres not running
npm run migrate    # once per fresh database
npm run seed       # fictional fixtures + RevPASH demo bookings (001 + 003)
```

## Real-data seed (006) — the default

`npm run seed:real` (and the Docker `migrate` service, which runs `seed.js
--real` because `SEED_ARGS=--real`) applies **`006_manhattan_real_3000.sql`**:

```bash
npm run generate:seed:full   # rebuild 006_manhattan_real_3000.sql from the cleaned CSV
npm run seed:real            # apply 001 + 003 + 006
```

For a fully clean slate (drops stale rows from earlier attempts):
`npm run db:reset && npm run migrate && npm run seed:real`.

`002_manhattan_real.sql` is the older 300-venue fixture. Its ids are a strict
subset of `006`'s, so nothing needs migrating — apply it only if you specifically
want the small set, and note that `002` *also* inserts the demo users and links
some venues to Demo Manager, which `006` deliberately does not:

```bash
npm run generate:seed   # rebuild 002_manhattan_real.sql
psql "$DATABASE_URL" -f seeds/002_manhattan_real.sql

# tune the generated subset:
node scripts/generate-seed.js --radius=2000 --limit=500
node scripts/generate-seed.js --origin=40.7589,-73.9851
```

Both generators derive stable UUIDv5 ids from the source `restaurant_id`, so
re-running produces identical SQL (safe `ON CONFLICT DO UPDATE`).

## `006` in detail — also the seed for deployed / Cloud SQL databases

The same file populates the `restaurants` table of a **fresh deployed database**
from scratch, with no Node tooling in the loop:

```bash
npm run generate:seed:full        # rebuild 006_manhattan_real_3000.sql (3,000 venues)
psql "$DATABASE_URL" -f seeds/006_manhattan_real_3000.sql
```

Differences from `002`:

- **3,000** venues (the nearest 3,000 of the 3,203 inside the default 1.5 km demo
  radius) rather than 300.
- **Touches only `restaurants`** — no `users`, no `user_preferences`, no foreign
  keys — so it runs against a Cloud SQL instance before any account exists and
  never clobbers accounts managed elsewhere. No user or manager id appears
  anywhere in the file.
- **All 23 columns** of `restaurants` (migrations 001–014) are listed explicitly
  in table order, so the insert mirrors the table instead of relying on defaults.
- **6 batched `INSERT`s** of 500 rows in one transaction, plus a guarded block
  that fills the optional PostGIS `location` column when `002_postgis_optional`
  has been applied (a no-op otherwise).

Four columns are written as `NULL` because this seed does not own them. Seed them
separately:

| Column | Owned by |
|--------|----------|
| `manager_user_id` | `005_restaurant_managers.sql` |
| `rating`, `reviews` | enrichment import (migration `013`) |
| `busyness_updated_at` | ml-service refresh (migration `014`) |

Those four — and `created_at` — are excluded from the `ON CONFLICT DO UPDATE`, so
re-running the seed refreshes venue data without wiping manager links, ratings, or
busyness timestamps written by anything else. `updated_at` is maintained by the
`restaurants_set_updated_at` trigger.

Ids are the same UUIDv5-of-`restaurant_id` values used everywhere else, so `002`'s
300 venues are a strict subset — applying both is safe and yields 3,000 rows.

Tuning:

```bash
node scripts/generate-restaurants-seed.js --limit=5000 --radius=3000
node scripts/generate-restaurants-seed.js --out=/tmp/restaurants.sql --batch=1000
```

**Manager links:** `005_restaurant_managers.sql` references venues drawn from the
whole source CSV, not just the demo radius, so on the default 3,000-venue
selection only 391 of its 1,402 links resolve (the rest match no row and are
skipped). For a database where every manager link resolves, generate the full
universe first:

```bash
node scripts/generate-restaurants-seed.js --radius=20000 --limit=11000   # 10,504 venues
psql "$DATABASE_URL" -f seeds/006_manhattan_real_3000.sql
psql "$DATABASE_URL" -f seeds/005_restaurant_managers.sql                # 1,402/1,402 linked
```

## Historical taxi demand seed (004)

```bash
npm run seed:taxi-demand   # apply 001 + 003 + 004
```

Requires migration `012_create_historical_taxi_demand` (creates the table this
seeds). Source: NYC TLC yellow taxi trip data for July 2025
(`ml-pipeline/notebooks/yellow_tripdata_2025-07_taxi_zone_hourly.csv`, produced by
`ml-pipeline/notebooks/taxi_data_convert_parquet_to_csv.ipynb`), aggregated to one
row per (`source_year`, `taxi_zone_id`, `month`, `weekday`, `hour`) — 39,491 rows
from 3,897,746 trips. `taxi_zone_id` is the **drop-off** zone (`DOLocationID`):
drop-offs near a restaurant are the foot-traffic signal this feeds into the ML
pipeline. Records outside the nominal 2025-07 window (a small number of stray
timestamps present in every monthly TLC file) are filtered out before aggregation.

Large (~1.6 MB SQL, 40 batched `INSERT`s) and unrelated to the restaurant/booking
seeds, so it's opt-in rather than part of the default `npm run seed`. Safe to
re-run — uses `ON CONFLICT DO UPDATE` on the table's composite primary key.

## Demo map origin (Story 2.1 — 1.5 km radius)

Use this point in `GET /api/v1/restaurants/nearby`:

| Field | Value |
|-------|--------|
| `lat` | `40.7589` |
| `lng` | `-73.9851` |
| `radiusM` | `1500` (default) |

Near Times Square / Midtown — most seed restaurants fall within 1.5 km.

## Test users (dev / interim `X-User-Id` header)

Until JWT login is wired on all clients, pass these UUIDs via `X-User-Id` or use matching accounts after `POST /api/v1/auth/login`.

| Role | UUID | Notes |
|------|------|--------|
| Consumer (onboarded) | `550e8400-e29b-41d4-a716-446655440001` | `user_preferences.budget_tier=TIER_2`, `dietary_restrictions=[vegan]` |
| Restaurant manager | `550e8400-e29b-41d4-a716-446655440002` | Manages Maple Room + Tablé Demo Central |

## Restaurants summary

| UUID suffix | Name | Tables available | Notes |
|-------------|------|------------------|--------|
| `...441001` | The Maple Room | 3 | B-side manager linked |
| `...441002` | Harbor & Hearth | 2 | |
| `...441003` | East 44th Bistro | 4 | Wheelchair accessible |
| `...441004` | Herald Square Grill | 1 | |
| `...441005` | Columbus Table | 2 | Sensory friendly |
| `...441006` | Empire Eats (Full) | **0** | Hidden on map (filter test) |
| `...441007` | Lincoln Lane Café | 2 | EDI flags |
| `...441008` | Murray Hill Kitchen | 3 | |
| `...441009` | Grand Central Fare | 2 | |
| `...441010` | Hell's Kitchen Social | 1 | |
| `...441011` | Bryant Park Table | 3 | |
| `...441012` | Koreatown Noodle Bar | 2 | |
| `...441013` | Restaurant Row House (Full) | **0** | Filter test |
| `...441014` | Midtown Mercantile | 4 | |
| `...441015` | Tablé Demo Central | 2 | Manager linked |

Full IDs prefix: `550e8400-e29b-41d4-a716-44665544`.

## Verify in psql

```sql
SELECT name, available_table_count, neighborhood
FROM restaurants
WHERE id::text LIKE '550e8400-e29b-41d4-a716-446655441%'
ORDER BY name;
```

## Re-run seed

Safe to run `npm run seed` again — uses `ON CONFLICT DO UPDATE` for demo UUIDs only.
