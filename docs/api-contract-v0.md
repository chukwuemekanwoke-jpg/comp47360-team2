# Tablé API Contract v0 (BE-3)

**Status:** Draft for Sprint 1 sign-off · **Implements in:** Sprint 2–3 (`backend/api-gateway`)  
**Database:** [database/schema.md](../database/schema.md) (BE-2)  
**Architecture:** [docs/adr/ADR-001.md](./adr/ADR-001.md) (BE-4)  
**Data:** [docs/data-strategy.md](./data-strategy.md) (BE-5)  
**Base URL (local):** `http://localhost:3001`

---

## 1. Conventions

### 1.1 Versioning

- Path prefix: `/api/v1` (recommended when routes are implemented).
- Sprint 1 health check may remain at `/health` without prefix until gateway refactor.

### 1.2 Authentication (MVP stub)

No real login in P0. Client sends a stable user id after dummy onboarding:

```http
X-User-Id: 550e8400-e29b-41d4-a716-446655440000
```

| Rule | Detail |
|------|--------|
| Missing header | `401` on protected routes |
| Invalid UUID | `400` |
| User not found | `404` |

`POST /api/v1/users` creates a user and returns `id` for subsequent requests.

### 1.3 JSON

- `Content-Type: application/json`
- Field names: **camelCase** in HTTP bodies/responses.
- Timestamps: ISO 8601 UTC (`2026-06-02T12:00:00.000Z`).
- UUIDs: RFC 4122 strings.

### 1.4 Errors

All non-2xx responses use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": {}
  }
}
```

| HTTP | `code` | When |
|------|--------|------|
| 400 | `VALIDATION_ERROR` | Bad query/body |
| 401 | `UNAUTHORIZED` | Missing/invalid auth |
| 404 | `NOT_FOUND` | Resource missing |
| 409 | `CONFLICT` | No tables, expired offer, ETA too long |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### 1.5 Product constants

| Constant | Value | Story |
|----------|-------|-------|
| Discovery radius | `1500` m | 2.1 |
| Reservation hold window | `15` min (per restaurant, default) | 3.1, 3.2 |
| Flash deal TTL | `900` s from offer `createdAt` | 4.1 |
| Campaign discount | `10`–`50` % | 5.1 |

---

## 2. Enums

### `BudgetTier` (UI → API)

| UI | API |
|----|-----|
| € | `TIER_1` |
| €€ | `TIER_2` |
| €€€ | `TIER_3` |

### `TransportMode`

`walking` | `driving` | `transit` | `cycling`

### `OfferStatus`

`pending` | `accepted` | `expired` | `revoked`

### `CampaignStatus`

`active` | `completed` | `cancelled`

### `BookingStatus`

`pending` | `confirmed` | `cancelled` | `completed` | `no_show`

---

## 3. Shared types

### `RestaurantSummary` (discovery map)

```json
{
  "id": "uuid",
  "name": "Juniper Table",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "neighborhood": "Midtown",
  "availableTableCount": 2,
  "busynessScore": 0.35,
  "distanceMeters": 420,
  "isWheelchairAccessible": false,
  "sensoryFriendly": false
}
```

### `RestaurantDetail` (booking screen)

Extends summary with:

```json
{
  "addressLine": "123 Example St",
  "holdWindowMinutes": 15,
  "availableTableCount": 2
}
```

### `EtaResult` (Story 3.1 / 3.2)

```json
{
  "restaurantId": "uuid",
  "transportMode": "walking",
  "etaMinutes": 12,
  "holdWindowMinutes": 15,
  "canBook": true,
  "message": "ETA: 12 mins (Within 15 min hold window)"
}
```

When `etaMinutes > holdWindowMinutes`:

```json
{
  "etaMinutes": 25,
  "holdWindowMinutes": 15,
  "canBook": false,
  "message": "You are too far to guarantee this table."
}
```

### `OfferInboxItem` (Story 4.1)

```json
{
  "id": "uuid",
  "campaignId": "uuid",
  "restaurantId": "uuid",
  "restaurantName": "Juniper Table",
  "status": "pending",
  "discountPercent": 20,
  "expiresAt": "2026-06-02T12:15:00.000Z",
  "secondsRemaining": 540,
  "canAccept": true
}
```

Server sets `canAccept: false` when `status !== "pending"` or `now >= expiresAt`.

---

## 4. Endpoints

### 4.1 Health

#### `GET /health`

**Auth:** none  

**Response `200`:**

```json
{ "status": "ok" }
```

---

### 4.2 Users & onboarding (Story 1.1)

#### `POST /api/v1/users`

Create consumer after dummy login.

**Auth:** none  

**Request:**

```json
{
  "displayName": "Alex"
}
```

**Response `201`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Alex",
  "budgetTier": null,
  "dietaryTags": [],
  "createdAt": "2026-06-02T10:00:00.000Z"
}
```

#### `PATCH /api/v1/users/me/preferences`

**Auth:** `X-User-Id`  

**Request:**

```json
{
  "budgetTier": "TIER_2",
  "dietaryTags": ["vegan", "halal"],
  "lastLat": 40.758,
  "lastLng": -73.9855
}
```

**Response `200`:** full user object with updated fields.

**Validation:**

- `budgetTier`: required for onboarding complete; one of `TIER_1` | `TIER_2` | `TIER_3`
- `dietaryTags`: array of strings; use `[]` or `["none"]` for no restriction

#### `GET /api/v1/users/me`

**Auth:** `X-User-Id`  

**Response `200`:** user profile (same shape as create + preferences).

---

### 4.3 Discovery (Story 2.1)

#### `GET /api/v1/restaurants/nearby`

Returns restaurants within radius with `availableTableCount > 0`.

**Auth:** optional (guest map allowed); if `X-User-Id` present, may update `lastLat`/`lastLng` from query.

**Query:**

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `lat` | yes | — | WGS84 latitude |
| `lng` | yes | — | WGS84 longitude |
| `radiusM` | no | `1500` | Metres |

**Response `200`:**

```json
{
  "origin": { "lat": 40.758, "lng": -73.9855 },
  "radiusM": 1500,
  "restaurants": [ /* RestaurantSummary[] */ ]
}
```

**P1 extension:** `neighborhood=Manhattan` when GPS denied (Story 2.2) — geocode then same response shape.

---

### 4.4 Restaurant detail & ETA (Stories 2.1, 3.1, 3.2)

#### `GET /api/v1/restaurants/:restaurantId`

**Response `200`:** `RestaurantDetail`  

**Response `404`:** unknown id

#### `GET /api/v1/restaurants/:restaurantId/eta`

Compute travel time once when opening restaurant page (per user story).

**Query:**

| Param | Required | Description |
|-------|----------|-------------|
| `lat` | yes | User latitude |
| `lng` | yes | User longitude |
| `mode` | no | `walking` (default) |

**Response `200`:** `EtaResult`

**Implementation notes:**

- Backend may call Google Distance Matrix or OSRM (see architecture ADR).
- Cache per `(restaurantId, lat, lng, mode)` for **5 minutes** to limit API cost.
- `canBook` is computed server-side: `etaMinutes <= holdWindowMinutes`.

---

### 4.5 Bookings (Stories 3.1, 3.2, 5.2)

#### `POST /api/v1/bookings`

**Auth:** `X-User-Id`  

**Request:**

```json
{
  "restaurantId": "uuid",
  "transportMode": "walking",
  "userLat": 40.758,
  "userLng": -73.9855,
  "offerId": null
}
```

Include `offerId` when confirming from flash deal flow.

**Response `201`:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "restaurantId": "uuid",
  "offerId": null,
  "campaignId": null,
  "status": "confirmed",
  "transportMode": "walking",
  "etaMinutes": 12,
  "holdExpiresAt": "2026-06-02T10:15:00.000Z",
  "confirmedAt": "2026-06-02T10:00:00.000Z"
}
```

**Errors:**

| Condition | HTTP | `code` |
|-----------|------|--------|
| ETA exceeds hold window | 409 | `CONFLICT` |
| `availableTableCount === 0` | 409 | `CONFLICT` |
| Invalid/expired offer | 409 | `CONFLICT` |

**Side effects (server):**

- Decrement `restaurants.availableTableCount` by 1.
- If `offerId` set: mark offer `accepted`, link booking; may complete campaign (DB trigger).

#### `GET /api/v1/users/me/bookings`

**Auth:** `X-User-Id`  

**Response `200`:** `{ "bookings": [ ... ] }`

#### `POST /api/v1/bookings/:bookingId/cancel` (P1 — Story 4.2)

**Auth:** `X-User-Id`  

**Response `200`:** booking with `status: "cancelled"`; restore table count / offer state.

---

### 4.6 Offers inbox (Story 4.1)

#### `GET /api/v1/users/me/offers`

**Auth:** `X-User-Id`  

**Query:** `status=pending` (optional filter)

**Response `200`:**

```json
{
  "offers": [
    {
      "id": "uuid",
      "campaignId": "uuid",
      "restaurantId": "uuid",
      "restaurantName": "Juniper Table",
      "status": "pending",
      "discountPercent": 20,
      "expiresAt": "2026-06-02T12:15:00.000Z",
      "secondsRemaining": 540,
      "canAccept": true
    }
  ]
}
```

Server runs expiry pass: `pending` + `now >= expiresAt` → `expired`, `canAccept: false`.

#### `POST /api/v1/offers/:offerId/accept`

**Auth:** `X-User-Id`  

Validates not expired, then returns booking payload or redirects client to `POST /bookings` with `offerId`.

**Response `200`:**

```json
{
  "offerId": "uuid",
  "status": "accepted",
  "booking": { /* Booking object */ }
}
```

**Response `409`:** expired or revoked (Story 4.1 — button disabled equivalent).

---

### 4.7 B-side campaigns (Stories 5.1, 5.2)

#### `POST /api/v1/restaurants/:restaurantId/campaigns`

**Auth:** `X-User-Id` must match restaurant `managerUserId` (MVP: any manager seed user).

**Request:**

```json
{
  "tableQuota": 2,
  "discountPercent": 20
}
```

**Validation:** `discountPercent` 10–50 (Story 5.1).

**Response `201`:**

```json
{
  "id": "uuid",
  "restaurantId": "uuid",
  "status": "active",
  "tableQuota": 2,
  "tablesClaimed": 0,
  "discountPercent": 20,
  "createdAt": "2026-06-02T11:00:00.000Z"
}
```

**Async (Sprint 3):** ML service creates `offers` for matched users (`POST` internal or job).

#### `GET /api/v1/restaurants/:restaurantId/campaigns`

**Auth:** manager  

**Response `200`:** `{ "campaigns": [ ... ] }`

#### `GET /api/v1/restaurants/:restaurantId/campaigns/active`

Single active campaign or `null`.

---

## 5. ML service (BE-7 preview)

Internal or service-to-service — not exposed to mobile/web directly in v0.

#### `POST http://localhost:8000/api/v1/match` (FastAPI)

**Request:**

```json
{
  "campaignId": "uuid",
  "restaurantId": "uuid",
  "candidateLimit": 10
}
```

**Response `200`:**

```json
{
  "matchedUserIds": ["uuid", "uuid"],
  "scores": [0.92, 0.87]
}
```

Gateway then inserts `offers` with `expiresAt = now() + 900s`.

---

## 6. P0 endpoint checklist

| Priority | Method | Path | Story |
|----------|--------|------|-------|
| P0 | GET | `/health` | — |
| P0 | POST | `/api/v1/users` | 1.1 |
| P0 | PATCH | `/api/v1/users/me/preferences` | 1.1 |
| P0 | GET | `/api/v1/restaurants/nearby` | 2.1 |
| P0 | GET | `/api/v1/restaurants/:id` | 2.1, 3.x |
| P0 | GET | `/api/v1/restaurants/:id/eta` | 3.1, 3.2 |
| P0 | POST | `/api/v1/bookings` | 3.x, 5.2 |
| P0 | GET | `/api/v1/users/me/offers` | 4.1 |
| P0 | POST | `/api/v1/offers/:id/accept` | 4.1, 5.2 |
| P0 | POST | `/api/v1/restaurants/:id/campaigns` | 5.2 |
| P1 | GET | `/api/v1/restaurants/nearby?neighborhood=` | 2.2 |
| P1 | POST | `/api/v1/bookings/:id/cancel` | 4.2 |

---

## 7. Web prototype mapping

Current mock types (`frontend/web-app/app/types.ts` on prototype branch) map to API fields:

| Mock field | API field |
|------------|-----------|
| `Restaurant.id` | `RestaurantSummary.id` (UUID string) |
| `availableTables` | `availableTableCount` |
| `etaMinutes` | from `GET .../eta` → `etaMinutes` |
| `distance` | `distanceMeters` (format in UI) |
| `mapX` / `mapY` | replace with `latitude` / `longitude` or map SDK |
| `FlashDeal.countdown` | derive from `secondsRemaining` |

---

## 8. Sprint 2 implementation order

1. `POST /users`, `PATCH /users/me/preferences`
2. `GET /restaurants/nearby`, `GET /restaurants/:id`
3. `GET /restaurants/:id/eta`, `POST /bookings`
4. `GET /users/me/offers`, `POST /offers/:id/accept`
5. `POST /restaurants/:id/campaigns`

---

## 9. Changelog

| Version | Date | Notes |
|---------|------|-------|
| v0 | 2026-06-02 | Initial BE-3 contract aligned with schema v1 |
