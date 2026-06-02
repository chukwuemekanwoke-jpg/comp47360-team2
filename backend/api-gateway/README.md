# Tablé API Gateway

Node.js + Express service for Tablé MVP backend (Sprint 1: BE-1 bootstrap).

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm

## Setup

```bash
cd backend/api-gateway
npm install
cp .env.example .env
```

Edit `.env` if you need a port other than `3001`. Do not commit `.env` (it is gitignored).

> **Note:** The app uses `process.env.PORT` with default `3001`. Loading `.env` automatically (via `dotenv`) can be added in a later ticket; until then you can run `PORT=4000 npm run dev` or export `PORT` in your shell.

## Run

Development (auto-restart on file changes):

```bash
npm run dev
```

Production-style (no auto-restart):

```bash
npm start
```

Server default: `http://localhost:3001`

## Health check

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{ "status": "ok" }
```

## Project layout

```text
backend/api-gateway/
├── src/
│   └── index.js      # App entry + routes
├── .env.example      # Environment template (safe to commit)
├── package.json
└── README.md
```

## API contract

- **BE-3:** [docs/api-contract-v0.md](../../docs/api-contract-v0.md) (human-readable)
- OpenAPI machine-readable: [docs/openapi-v0.yaml](../../docs/openapi-v0.yaml)

Implement routes under `/api/v1` per contract in Sprint 2–3.

## Related tickets

- **BE-1:** Bootstrap + health endpoint (this service)
- **BE-2:** PostgreSQL schema + migrations (`database/`) — see `database/README.md` and `database/schema.md`
- **BE-3:** API contract v0 (`docs/api-contract-v0.md`)
