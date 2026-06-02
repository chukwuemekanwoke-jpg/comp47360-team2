# Tablé database (PostgreSQL)

**BE-2:** Schema design v1 — migrations, ERD, and local setup for the Tablé MVP.

| Doc | Purpose |
|-----|---------|
| [schema.md](./schema.md) | ER diagram, P0 story mapping, table reference |
| [migrations/001_initial_schema.sql](./migrations/001_initial_schema.sql) | DDL v1 |
| [migrations/001_initial_schema.down.sql](./migrations/001_initial_schema.down.sql) | Roll back v1 (dev only) |

## Prerequisites

- PostgreSQL **14+** (15+ recommended)
- Node.js 18+ (for the migration runner)

## Quick start

```bash
cd database
cp .env.example .env
# Edit DATABASE_URL, then create the database:
createdb table_dev   # or: psql -c "CREATE DATABASE table_dev;"

npm install
npm run migrate
```

Verify:

```bash
psql "$DATABASE_URL" -c "\dt"
```

Expected tables: `users`, `restaurants`, `campaigns`, `offers`, `bookings`, `availability_snapshots`, `schema_migrations`.

## Environment

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/table_dev` |

Copy from [`.env.example`](./.env.example). Never commit `.env`.

## Migrations

| Command | Action |
|---------|--------|
| `npm run migrate` | Apply pending SQL in `migrations/` |
| `npm run migrate:down` | Run `001_initial_schema.down.sql` (drops all v1 tables) |

Migration tracking uses the `schema_migrations` table.

## Geospatial queries (1.5 km discovery)

Schema v1 stores **WGS84** `latitude` / `longitude` on `restaurants`. No PostGIS required for local dev.

Example haversine filter (metres) — use in API or SQL:

```sql
-- Parameters: :lat, :lng, :radius_m (use 1500 for product spec)
SELECT *
FROM (
  SELECT r.*,
    6371000 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(:lat)) * cos(radians(r.latitude))
        * cos(radians(r.longitude) - radians(:lng))
        + sin(radians(:lat)) * sin(radians(r.latitude))
      ))
    ) AS distance_m
  FROM restaurants r
  WHERE r.available_table_count > 0
) nearby
WHERE nearby.distance_m <= :radius_m
ORDER BY nearby.distance_m;
```

> **Note:** PostgreSQL requires `GROUP BY` or subquery if using `HAVING` without aggregate; the API layer often computes haversine in Node for clarity. See BE-6 spike.

Optional PostGIS: `migrations/002_postgis_optional.sql` (not applied by default).

## Related backend tickets

| Ticket | Status |
|--------|--------|
| BE-1 | API gateway bootstrap |
| **BE-2** | **This schema** |
| BE-3 | API contract v0 |
| BE-9 | Seed data (Sprint 2) |

## Docker (optional)

```bash
docker run --name table-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=table_dev \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Then set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/table_dev`.
