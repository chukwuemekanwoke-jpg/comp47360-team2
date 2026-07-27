# Tablé database (PostgreSQL)

**BE-2:** Schema design v1 — migrations, ERD, and local setup for the Tablé MVP.

| Doc                                                                                | Purpose                                       |
| ---------------------------------------------------------------------------------- | --------------------------------------------- |
| [schema.md](./schema.md)                                                           | ER diagram, P0 story mapping, table reference |
| [migrations/001_initial_schema.sql](./migrations/001_initial_schema.sql)           | DDL v1                                        |
| [migrations/001_initial_schema.down.sql](./migrations/001_initial_schema.down.sql) | Roll back v1 (dev only)                       |
| [migrations/003_add_restaurant_capacity_cuisine.sql](./migrations/003_add_restaurant_capacity_cuisine.sql) | `restaurants.capacity`, `restaurants.cuisine` |
| [migrations/006_add_revpash_fields.sql](./migrations/006_add_revpash_fields.sql) | RevPASH inputs on `restaurants` and `bookings` |
| [migrations/008_add_password_reset.sql](./migrations/008_add_password_reset.sql) | Password reset token columns on `users` |
| [migrations/011_create_user_preferences.sql](./migrations/011_create_user_preferences.sql) | One-to-one categorized `user_preferences` table + legacy compatibility mirror |
| [migrations/012_create_historical_taxi_demand.sql](./migrations/012_create_historical_taxi_demand.sql) | Empty schema for year/month/weekday/hour taxi-demand aggregates |

## Prerequisites

- PostgreSQL **14+** (15+ recommended)
- Node.js 18+ (for the migration runner)

## Quick start (Docker — recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2).

```bash
cd database
cp .env.example .env
npm install
npm run db:up          # starts Postgres via docker-compose.yml
npm run migrate        # wait until healthy, then apply schema
npm run seed           # BE-9: demo Manhattan restaurants + test users
```

Verify:

```bash
docker compose ps
psql "$DATABASE_URL" -c "\dt"
```

Expected tables: `users`, `user_preferences`, `restaurants`, `campaigns`, `offers`, `bookings`, `availability_snapshots`, `historical_taxi_demand`, `schema_migrations`.

| Command            | Action                                    |
| ------------------ | ----------------------------------------- |
| `npm run db:up`    | Start database container in background    |
| `npm run db:down`  | Stop container (keeps data volume)        |
| `npm run db:reset` | Stop and **delete** all data, start fresh |
| `npm run db:logs`  | Follow Postgres logs                      |

## Quick start (native Postgres — optional)

If you already have PostgreSQL installed locally:

```bash
cd database
cp .env.example .env
createdb table_dev
npm install
npm run migrate
```

## Environment

| Variable       | Example                                                   |
| -------------- | --------------------------------------------------------- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/table_dev` |

Copy from [`.env.example`](./.env.example). Never commit `.env`.

## Migrations

| Command                | Action                                                  |
| ---------------------- | ------------------------------------------------------- |
| `npm run migrate`      | Apply pending SQL in `migrations/`                      |
| `npm run migrate:down` | Run `001_initial_schema.down.sql` (drops all v1 tables) |
| `npm run seed`         | Load demo data — [seeds/README.md](./seeds/README.md)   |

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

| Ticket   | Status                                                                  |
| -------- | ----------------------------------------------------------------------- |
| BE-1     | API gateway bootstrap                                                   |
| **BE-2** | **This schema**                                                         |
| BE-3     | API contract v0 — [docs/api-contract-v0.md](../docs/api-contract-v0.md) |
| BE-5     | Data strategy — [docs/data-strategy.md](../docs/data-strategy.md)       |
| BE-9     | Seed data — [seeds/README.md](./seeds/README.md)                        |

## Docker Compose

Configuration: [`docker-compose.yml`](./docker-compose.yml)

| Setting         | Default                                                      |
| --------------- | ------------------------------------------------------------ |
| Container name  | `table-postgres`                                             |
| Image           | `postgres:16-alpine`                                         |
| Database        | `table_dev`                                                  |
| User / password | `postgres` / `postgres`                                      |
| Host port       | `5432` (override with `POSTGRES_PORT` in `.env` for compose) |

If port **5432** is already in use, create `.env` with:

```bash
POSTGRES_PORT=5433
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/table_dev
```

Then run `npm run db:up` again.
