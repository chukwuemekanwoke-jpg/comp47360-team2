# Tablé API Gateway

Node.js + Express service for Tablé MVP backend.

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- PostgreSQL running locally ([database/README.md](../../database/README.md))

## Setup

```bash
cd backend/api-gateway
npm install
cp .env.example .env
```

Set `DATABASE_URL` to match `database/.env` (Docker Postgres default shown in `.env.example`).

## Run

```bash
npm run dev
```

Server: `http://localhost:3001`

## Endpoints

### Infrastructure (BE-8)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | none | Liveness (BE-1) |
| GET | `/api/v1/status` | none | Readiness + DB ping |

### Users & onboarding (BE-11)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/users` | none | Create user after dummy login |
| GET | `/api/v1/users/me` | `X-User-Id` | Current user profile |
| PATCH | `/api/v1/users/me/preferences` | `X-User-Id` | Update budget, dietary tags, location |

### Discovery (BE-11)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/restaurants/nearby` | optional `X-User-Id` | Restaurants within radius (`availableTableCount > 0`) |
| GET | `/api/v1/restaurants/:restaurantId` | none | Restaurant detail for booking screen |
| GET | `/api/v1/restaurants/:restaurantId/eta` | none | Travel time + `canBook` vs hold window |

### Bookings (BE-12)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/bookings` | `X-User-Id` | Confirm reservation; decrements table count |

### Examples

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/status

# Create user
curl -X POST http://localhost:3001/api/v1/users \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Alex"}'

# Demo consumer (after npm run seed in database/)
curl http://localhost:3001/api/v1/users/me \
  -H 'X-User-Id: 550e8400-e29b-41d4-a716-446655440001'

curl -X PATCH http://localhost:3001/api/v1/users/me/preferences \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: 550e8400-e29b-41d4-a716-446655440001' \
  -d '{"budgetTier":"TIER_2","dietaryTags":["vegan"],"lastLat":40.7589,"lastLng":-73.9851}'

# Nearby discovery (Times Square demo origin)
curl 'http://localhost:3001/api/v1/restaurants/nearby?lat=40.7589&lng=-73.9851'

# Restaurant detail (replace with id from nearby response)
curl http://localhost:3001/api/v1/restaurants/550e8400-e29b-41d4-a716-446655441001

# ETA (walking default)
curl 'http://localhost:3001/api/v1/restaurants/550e8400-e29b-41d4-a716-446655441001/eta?lat=40.7589&lng=-73.9851'

# Create booking
curl -X POST http://localhost:3001/api/v1/bookings \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: 550e8400-e29b-41d4-a716-446655440001' \
  -d '{"restaurantId":"550e8400-e29b-41d4-a716-446655441001","transportMode":"walking","userLat":40.7589,"userLng":-73.9851}'
```

`/api/v1/status` response when DB is connected:

```json
{
  "status": "ok",
  "apiVersion": "v1",
  "database": "connected"
}
```

## Project layout (BE-8)

```text
backend/api-gateway/
├── src/
│   ├── index.js              # Start server, log DB status
│   ├── app.js                # Express app wiring
│   ├── config.js             # env (PORT, DATABASE_URL, CORS)
│   ├── errors.js             # AppError + UUID helper
│   ├── db/
│   │   └── pool.js           # pg Pool + checkConnection
│   ├── middleware/
│   │   ├── asyncHandler.js   # async route wrapper
│   │   ├── errorHandler.js   # JSON errors (BE-3 shape)
│   │   ├── notFound.js
│   │   └── requireUser.js    # X-User-Id stub (for Sprint 2 routes)
│   └── routes/
│       ├── health.js
│       └── apiV1/
│           └── index.js      # /api/v1/* routers mount here
├── .env.example
├── package.json
└── README.md
```

## API contract & architecture

- **BE-3:** [docs/api-contract-v0.md](../../docs/api-contract-v0.md)
- **BE-4:** [docs/adr/ADR-001.md](../../docs/adr/ADR-001.md)
- **BE-5:** [docs/data-strategy.md](../../docs/data-strategy.md)

Sprint 2+ business routes (`/restaurants`, `/bookings`, …) mount under `src/routes/apiV1/`.

## Related tickets

| Ticket | Status |
|--------|--------|
| BE-1 | Bootstrap + `/health` |
| **BE-8** | Gateway foundation |
| **BE-11** | Users + discovery (`/users`, `/restaurants/nearby`, `/restaurants/:id`) |
| **BE-12** | ETA + bookings (`/restaurants/:id/eta`, `POST /bookings`) |
| BE-13+ | Offers, campaigns, ML match |
