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

### Bookings (BE-12, BE-16)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/bookings` | `X-User-Id` | Confirm reservation; decrements table count |
| GET | `/api/v1/users/me/bookings` | `X-User-Id` | List the current user's bookings (newest first) |

### Offers & campaigns (BE-13)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/restaurants/:restaurantId/campaigns` | manager `X-User-Id` | Create flash-deal campaign + heuristic offers |
| GET | `/api/v1/restaurants/:restaurantId/campaigns` | manager | List campaigns |
| GET | `/api/v1/restaurants/:restaurantId/campaigns/active` | manager | Active campaign or `null` |
| GET | `/api/v1/users/me/offers` | `X-User-Id` | Offer inbox (`?status=pending` optional) |
| POST | `/api/v1/offers/:offerId/accept` | `X-User-Id` | Accept offer → confirmed booking |

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

# List my bookings (Demo Diner)
curl http://localhost:3001/api/v1/users/me/bookings \
  -H 'X-User-Id: 550e8400-e29b-41d4-a716-446655440001'

# B-side: create campaign (Demo Manager on The Maple Room)
curl -X POST http://localhost:3001/api/v1/restaurants/550e8400-e29b-41d4-a716-446655441001/campaigns \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: 550e8400-e29b-41d4-a716-446655440002' \
  -d '{"tableQuota":2,"discountPercent":20}'

# C-side: offer inbox (Demo Diner)
curl http://localhost:3001/api/v1/users/me/offers \
  -H 'X-User-Id: 550e8400-e29b-41d4-a716-446655440001'

# Accept offer (replace OFFER_ID from inbox response)
curl -X POST http://localhost:3001/api/v1/offers/OFFER_ID/accept \
  -H 'X-User-Id: 550e8400-e29b-41d4-a716-446655440001'
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
| **BE-13** | Offers + campaigns (inbox, accept, manager campaigns) |
| **BE-14** | ML match integration (`POST /api/v1/match` via FastAPI on campaign create) |
| **BE-16** | List my bookings (`GET /api/v1/users/me/bookings`) |
| BE-15, BE-17+ | Availability simulator, remaining P1 routes |

## ML match (BE-14)

When a manager creates a campaign, the gateway:

1. Queries nearby diners in Postgres (1.5 km radius)
2. Calls FastAPI `POST {ML_SERVICE_URL}/api/v1/match` with `campaignId`, `restaurantId`, `candidateLimit`, and `candidates[]`
3. Inserts `offers` for returned `matchedUserIds` (900s TTL)
4. Falls back to nearest-distance matching if ML is unreachable

Start the ML service before testing campaigns:

```bash
cd ml-pipeline/fastapi-app
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set in `backend/api-gateway/.env`:

```text
ML_SERVICE_URL=http://localhost:8000
```
