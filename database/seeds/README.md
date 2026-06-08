# Demo seed data (BE-9)

Fictional Manhattan restaurants for local development and Sprint 2 API testing. Coordinates are realistic; names are **not** real venues.

## Quick start

```bash
cd database
npm run db:up      # if Postgres not running
npm run migrate    # once per fresh database
npm run seed
```

## Demo map origin (Story 2.1 — 1.5 km radius)

Use this point in `GET /api/v1/restaurants/nearby` (when implemented):

| Field | Value |
|-------|--------|
| `lat` | `40.7589` |
| `lng` | `-73.9851` |
| `radiusM` | `1500` (default) |

Near Times Square / Midtown — most seed restaurants fall within 1.5 km.

## Test users (`X-User-Id` header)

| Role | UUID | Notes |
|------|------|--------|
| Consumer (onboarded) | `550e8400-e29b-41d4-a716-446655440001` | `budget_tier=TIER_2`, `dietary_tags=[vegan]` |
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
