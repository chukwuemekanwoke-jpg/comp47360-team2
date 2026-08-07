# Tablé Postman collections

**Author:** Yang Liu — Backend Lead

## Files

| File | Purpose |
|------|---------|
| `table-integration-journeys.postman_collection.json` | End-to-end smoke journeys for local/staging API gateway |

## Prerequisites

1. PostgreSQL running with migrations applied (`cd database && npm run migrate`)
2. Demo seeds applied (`npm run seed`) — optional for C-side; demo manager uses `manager@demo.com` / `password123`
3. API gateway running at `http://localhost:3001` (`cd backend/api-gateway && npm run dev`)

## Import

1. Open Postman → **Import** → select `table-integration-journeys.postman_collection.json`
2. Collection variable `baseUrl` defaults to `http://localhost:3001` — change for staging

## Folders

| Folder | Covers |
|--------|--------|
| **Infrastructure** | `GET /health`, `GET /api/v1/status` |
| **C-side** | Register/login → preferences → nearby → book → offers → accept → cancel booking |
| **B-side: dashboard** | Manager login → bookings → RevPASH → create campaign → active campaign → settings → cancel → logout |
| **B-side: merchant onboarding** | Register new manager → create restaurant (`POST /restaurants`) |

## Variables (auto-set by tests)

- `customerToken`, `customerUserId` — C-side auth
- `managerToken`, `managerUserId` — B-side auth
- `restaurantId` — from nearby search, manager login, or create restaurant
- `offerId` — from offer inbox (accept step skipped if empty)
- `campaignId` — from create/active campaign steps

## Notes

- **Accept pending offer** requires a pending offer in the diner inbox (run a B-side campaign first, or use seeded data).
- **Cancel campaign** requires `campaignId` from the create/active campaign steps in the same run.
- Endpoints **not yet in collection** (backend pending): none for campaign offers (shipped 2026-07-21).

Contract reference: [api-contract-v0.md](../api-contract-v0.md), [openapi-v0.yaml](../openapi-v0.yaml).
