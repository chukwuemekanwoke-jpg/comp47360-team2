# Seed data

**Authors:** Yang Liu — Backend Lead · Chukwuemeka Nwoke — Integration Lead / Scrum Master

Four complementary seeds:

| File | Data | Use for |
|------|------|---------|
| `001_demo_manhattan.sql` | 15 **fictional** venues, fixed UUIDs | Deterministic API/integration tests, examples in docs |
| `002_manhattan_real.sql` | ~300 **real** Manhattan venues (generated) | Demo, frontend map, and ML connectivity (shared `restaurant_id` universe) |
| `003_demo_revpash_bookings.sql` | Sample completed/confirmed bookings | RevPASH view smoke data for merchant dashboard |
| `004_historical_taxi_demand.sql` | ~39.5k rows, NYC TLC drop-off zone/hour aggregates (July 2025) | Static ML pipeline demand features (`historical_taxi_demand`) |

After migration `006_add_revpash_fields`, both restaurant seeds populate `opens_at`, `closes_at`, and `avg_check_per_cover` for RevPASH.

`001` names are **not** real venues; `002` identity (name/address/coords/cuisine) is
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

## Real-data seed (002)

```bash
npm run generate:seed   # rebuild 002_manhattan_real.sql from the cleaned CSV
npm run seed:real       # apply 001 + 002

# tune the generated subset:
node scripts/generate-seed.js --radius=2000 --limit=500
node scripts/generate-seed.js --origin=40.7589,-73.9851
```

`generate-seed.js` derives stable UUIDv5 ids from the source `restaurant_id`, so
re-running produces identical SQL (safe `ON CONFLICT DO UPDATE`). For a fully clean
slate (drops stale rows from earlier attempts): `npm run db:reset && npm run migrate && npm run seed:real`.

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
