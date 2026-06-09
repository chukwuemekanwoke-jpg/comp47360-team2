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

## Endpoints (BE-8)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | none | Liveness (BE-1) |
| GET | `/api/v1/status` | none | Readiness + DB ping |

### Examples

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/status
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
| **BE-8** | **This foundation** |
| BE-11+ | P0 REST implementation |
