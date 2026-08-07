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
| [migrations/013_add_restaurant_rating_reviews.sql](./migrations/013_add_restaurant_rating_reviews.sql) | Nullable restaurant aggregate rating and review count |
| [migrations/013_add_user_accessibility_preferences.sql](./migrations/013_add_user_accessibility_preferences.sql) | Diner-side `requires_wheelchair_access`/`requires_sensory_friendly` on `user_preferences`, enforced as a hard filter in flash-deal matching |
| [migrations/014_add_restaurant_busyness_updated_at.sql](./migrations/014_add_restaurant_busyness_updated_at.sql) | `restaurants.busyness_updated_at` — last ml-service refresh, drives stale-venue rescoring in `GET /restaurants/nearby` |

## Prerequisites

- PostgreSQL **14+** (15+ recommended)
- Node.js 18+ (for the migration runner)

## Quick start (Docker — recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2).

**If you want the whole application**, migrations and seeds run automatically —
just start the stack from the repo root and skip this section entirely:

```bash
cp .env.example .env
docker compose up -d --build   # the `migrate` service applies schema + seeds
```

See [`docs/docker-local.md`](../docs/docker-local.md).

**If you only want Postgres** (everything else running natively):

```bash
cd database
cp .env.example .env
npm install
npm run db:up          # starts only the `postgres` service from the root compose file
npm run migrate        # wait until healthy, then apply schema
npm run seed           # BE-9: demo Manhattan restaurants + test users
```

Verify:

```bash
docker compose -f ../docker-compose.yml ps
psql "$DATABASE_URL" -c "\dt"
```

Expected tables: `users`, `user_preferences`, `restaurants`, `campaigns`, `offers`, `bookings`, `availability_snapshots`, `historical_taxi_demand`, `schema_migrations`.

| Command            | Action                                    |
| ------------------ | ----------------------------------------- |
| `npm run db:up`    | Start the Postgres container in background |
| `npm run db:down`  | Stop the Postgres container (keeps data volume) |
| `npm run db:reset` | **Deletes all data** and starts fresh. Note this runs `docker compose down -v`, which stops the whole stack, not just Postgres |
| `npm run db:logs`  | Follow Postgres logs                      |

> These scripts target the root [`docker-compose.yml`](../docker-compose.yml).
> The old `database/docker-compose.yml` was folded into it so that the two files
> stop competing for the `table-postgres` container name and port 5432.

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

Configuration: the root [`docker-compose.yml`](../docker-compose.yml), `postgres` service.

| Setting         | Default                                                      |
| --------------- | ------------------------------------------------------------ |
| Container name  | `table-postgres`                                             |
| Image           | `postgres:16-alpine`                                         |
| Database        | `table_dev` (`POSTGRES_DB`)                                  |
| User / password | `postgres` / `postgres` (`POSTGRES_USER` / `POSTGRES_PASSWORD`) |
| Host port       | `5432` (override with `POSTGRES_PORT`)                       |
| Named volume    | `table_pg_data`                                              |

Those variables come from the **root** `.env` (`cp .env.example .env` at the repo
root), which is what Compose reads. `database/.env` is separate and only feeds
the Node scripts in `scripts/` — `migrate.js`, `seed.js`, and friends — which
need `DATABASE_URL` when you run them from your host.

If port **5432** is already in use, set this in the root `.env`:

```bash
POSTGRES_PORT=5433
```

and this in `database/.env`, so the host-side scripts follow:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/table_dev
```

Then run `npm run db:up` again.

## Local backups

`npm run db:backup` dumps the running `table-postgres` container to
`database/backups/table_dev_<timestamp>.sql` via `pg_dump` inside the
container (no local Postgres client needed).

**`database/backups/` is gitignored — never commit a raw dump.** It contains
every user's `password_hash` and real email addresses; committing it would
put durable, crackable credentials in git history. Keep backups local, or
move real backup/restore needs to Cloud SQL's own automated backups/exports
once deployed.

Restore a dump:

```bash
docker exec -i table-postgres psql -U postgres -d table_dev < database/backups/table_dev_20260728_120000.sql
```
