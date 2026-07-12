# Tablé API Contract v0 (BE-3)

**Status:** v0.3 · **Implementation:** `backend/api-gateway`  
**Database:** [database/schema.md](../database/schema.md) (BE-2)  
**Architecture:** [docs/adr/ADR-001.md](./adr/ADR-001.md) (BE-4)  
**Data:** [docs/data-strategy.md](./data-strategy.md) (BE-5)  
**Base URL (local):** `http://localhost:3001`

---

## 1. Conventions

### 1.1 Versioning

- Path prefix: `/api/v1` for business routes.
- Liveness: `GET /health` (no prefix). Readiness: `GET /api/v1/status`.

### 1.2 Authentication

Tablé uses **JWT** (Bearer token) for authenticated requests.

**Register / login:**

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
```

Both return `{ "token": "<jwt>", "user": { ... } }`. Clients send:

```http
Authorization: Bearer <jwt>
```

**Interim dev header** (supported until all clients migrate):

```http
X-User-Id: 550e8400-e29b-41d4-a716-446655440000
```

The gateway accepts either `Authorization: Bearer` (preferred) or `X-User-Id` on protected routes.

| Rule | Detail |
|------|--------|
| Missing/invalid auth | `401` on protected routes |
| Invalid UUID (legacy header) | `400` |
| User not found | `404` |

`POST /api/v1/users` remains for lightweight consumer onboarding (returns `id` for legacy flows).

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
  "message": "ETA: 12 mins (Within 15 min hold window)",
  "source": "google"
}
```

When `etaMinutes > holdWindowMinutes`:

```json
{
  "etaMinutes": 25,
  "holdWindowMinutes": 15,
  "canBook": false,
  "message": "You are too far to guarantee this table.",
  "source": "estimate"
}
```

`source` records how `etaMinutes` was derived (BE-12):

| Value | Meaning |
|-------|---------|
| `google` | Live Google Routes API (`computeRouteMatrix`) duration |
| `estimate` | Local haversine + fixed-speed fallback (no API key, timeout, or API error) |

This graceful degradation keeps booking working offline; `canBook` is always computed the same way (`etaMinutes <= holdWindowMinutes`).

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

**Auth:** Bearer JWT or `X-User-Id` (interim)  

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

**Auth:** Bearer JWT or `X-User-Id` (interim)  

**Response `200`:** user profile (same shape as create + preferences).

#### `POST /api/v1/auth/register`

**Auth:** none  

**Request:**

```json
{
  "email": "alex@example.com",
  "password": "secure-password",
  "displayName": "Alex"
}
```

**Response `201`:** `{ "token": "<jwt>", "user": { ... } }`

#### `POST /api/v1/auth/login`

**Auth:** none  

**Request:**

```json
{
  "email": "alex@example.com",
  "password": "secure-password"
}
```

**Response `200`:** `{ "token": "<jwt>", "user": { ... }, "userId": "<uuid>", "restaurantId": "<uuid>|null" }`

#### `POST /api/v1/auth/logout`

**Auth:** Bearer JWT (preferred)  

Invalidates the current token server-side by incrementing `token_version`.

**Response `200`:** `{ "status": "logged_out" }`

---

### 4.3 Discovery (Story 2.1)

#### `GET /api/v1/restaurants/nearby`

Returns restaurants within radius with `availableTableCount > 0`.

**Auth:** optional (guest map allowed); if Bearer JWT or `X-User-Id` present, may update `lastLat`/`lastLng` from query.

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

#### `POST /api/v1/restaurants`

Create a venue owned by the authenticated manager (`manager_user_id` set server-side from JWT).

**Auth:** Bearer JWT or `X-User-Id`

**Request:**

```json
{
  "name": "The Maple Room",
  "addressLine": "125 W 44th St",
  "phone": "+1 212-555-0100",
  "latitude": 40.7614,
  "longitude": -73.9857,
  "cuisine": "american",
  "neighborhood": "Midtown",
  "isWheelchairAccessible": false,
  "sensoryFriendly": false
}
```

**Response `201`:** `RestaurantDetail` (new `availableTableCount` defaults to `0`)

#### `PATCH /api/v1/restaurants/:restaurantId/settings`

Update accessibility flags for a restaurant the caller manages.

**Auth:** manager Bearer JWT or `X-User-Id`

**Request:** `{ "isWheelchairAccessible"?: boolean, "sensoryFriendly"?: boolean }` (at least one field)

**Response `200`:** `RestaurantDetail`

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

- Backend calls the Google **Routes API** (`computeRouteMatrix`) when `GOOGLE_MAPS_API_KEY` is set, mapping `walking→WALK`, `driving→DRIVE`, `cycling→BICYCLE`, `transit→TRANSIT`; falls back to a local haversine estimate otherwise (BE-12). The chosen path is reported via `EtaResult.source`.
- Cache per `(restaurantId, lat, lng, mode)` for **5 minutes** to limit API cost.
- `canBook` is computed server-side: `etaMinutes <= holdWindowMinutes`.

---

### 4.5 Bookings (Stories 3.1, 3.2, 5.2)

#### `POST /api/v1/bookings`

**Auth:** Bearer JWT or `X-User-Id` (interim)  

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
  "confirmedAt": "2026-06-02T10:00:00.000Z",
  "source": "google"
}
```

`source` (`google` | `estimate`) reports how the booking ETA was resolved at confirmation time. It is **only** returned on `POST /bookings`; it is not persisted, so historical bookings from `GET /users/me/bookings` omit it.

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

**Auth:** Bearer JWT or `X-User-Id` (interim)  

**Response `200`:** `{ "bookings": [ ... ] }`

#### `GET /api/v1/restaurants/:restaurantId/bookings`

**Auth:** manager Bearer JWT or `X-User-Id` (interim)  

**Response `200`:** `{ "bookings": [ ... ] }` — newest first.

#### `POST /api/v1/bookings/:bookingId/cancel` (P1 — Story 4.2)

**Auth:** Bearer JWT or `X-User-Id` (interim)  

**Response `200`:** booking with `status: "cancelled"`; restore table count / offer state.

---

### 4.6 Offers inbox (Story 4.1)

#### `GET /api/v1/users/me/offers`

**Auth:** Bearer JWT or `X-User-Id` (interim)  

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

**Auth:** Bearer JWT or `X-User-Id` (interim)  

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

**Auth:** manager Bearer JWT or `X-User-Id` (interim); must match restaurant `managerUserId` (MVP: any manager seed user).

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

On create, the gateway calls the ML match service and inserts `offers` for matched users (`expiresAt = now + 900s`).

#### `GET /api/v1/restaurants/:restaurantId/campaigns`

**Auth:** manager  

**Response `200`:** `{ "campaigns": [ ... ] }`

#### `GET /api/v1/restaurants/:restaurantId/campaigns/active`

Single active campaign or `null`.

#### `POST /api/v1/restaurants/:restaurantId/campaigns/:campaignId/cancel`

**Auth:** manager  

Cancels an `active` campaign, sets `status: "cancelled"`, and revokes pending offers for that campaign.

**Response `200`:** updated `Campaign`  

**Response `409`:** campaign is not active (already completed or cancelled)

---

## 5. ML service (BE-7 / BE-14)

Internal or service-to-service — not exposed to mobile/web directly in v0. The gateway calls this when a manager creates a campaign.

#### `POST http://localhost:8000/api/v1/match` (FastAPI)

The gateway runs a spatial SQL query for nearby diners first, then sends the pre-filtered `candidates[]` for the ML service to rank and return the top `candidateLimit` user ids.

**Request:**

```json
{
  "campaignId": "uuid",
  "restaurantId": "uuid",
  "candidateLimit": 2,
  "candidates": [
    {
      "userId": "uuid",
      "budgetTier": "TIER_2",
      "dietaryTags": ["vegan"],
      "distanceMeters": 320
    }
  ]
}
```

**Response `200`:**

```json
{
  "matchedUserIds": ["uuid", "uuid"],
  "scores": [0.92, 0.87]
}
```

Gateway then inserts `offers` with `expiresAt = now() + 900s`. If the ML service is unreachable, the gateway falls back to nearest-distance matching (BE-14).

---

## 6. Endpoint checklist

### 6.1 Shipped (P0 / P1 — on `integrate`)

| Priority | Method | Path | Story |
|----------|--------|------|-------|
| P0 | GET | `/health` | — |
| P0 | GET | `/api/v1/status` | — |
| P0 | POST | `/api/v1/users` | 1.1 |
| P0 | PATCH | `/api/v1/users/me/preferences` | 1.1 |
| P0 | GET | `/api/v1/users/me` | 1.1 |
| P0 | GET | `/api/v1/restaurants/nearby` | 2.1 |
| P0 | GET | `/api/v1/restaurants/:id` | 2.1, 3.x |
| P0 | GET | `/api/v1/restaurants/:id/eta` | 3.1, 3.2 |
| P0 | POST | `/api/v1/bookings` | 3.x, 5.2 |
| P0 | GET | `/api/v1/users/me/bookings` | 3.x |
| P0 | GET | `/api/v1/users/me/offers` | 4.1 |
| P0 | POST | `/api/v1/offers/:id/accept` | 4.1, 5.2 |
| P0 | POST | `/api/v1/restaurants/:id/campaigns` | 5.2 |
| P0 | GET | `/api/v1/restaurants/:id/campaigns` | 5.2 |
| P0 | GET | `/api/v1/restaurants/:id/campaigns/active` | 5.2 |
| P0 | POST | `/api/v1/restaurants/:id/campaigns/:campaignId/cancel` | 5.2 |
| P0 | GET | `/api/v1/restaurants/:id/bookings` | 5.2 |
| P0 | POST | `/api/v1/auth/register` | — |
| P0 | POST | `/api/v1/auth/login` | — |
| P0 | POST | `/api/v1/auth/logout` | — |
| P0 | POST | `/api/v1/restaurants` | B-side onboarding |
| P0 | PATCH | `/api/v1/restaurants/:id/settings` | B-side settings |

### 6.2 Planned (documented, not yet implemented)

| Priority | Method | Path | Story |
|----------|--------|------|-------|
| P1 | GET | `/api/v1/restaurants/nearby?neighborhood=` | 2.2 |
| P1 | POST | `/api/v1/bookings/:id/cancel` | 4.2 |
| P1 | PATCH | `/api/v1/bookings/:id/status` | 5.2 dashboard |
| P1 | GET | `/api/v1/restaurants/:id/campaigns/:campaignId/offers` | 5.2 live tracker |
| P1 | GET | `/api/v1/restaurants/:id/revpash` | 5.1 RevPASH |

---

## 7. Client type mapping

Shared TypeScript types (`frontend/packages/shared/src/types.ts`) map to API fields:

| Mock field | API field |
|------------|-----------|
| `Restaurant.id` | `RestaurantSummary.id` (UUID string) |
| `availableTables` | `availableTableCount` |
| `etaMinutes` | from `GET .../eta` → `etaMinutes` |
| `distance` | `distanceMeters` (format in UI) |
| `mapX` / `mapY` | replace with `latitude` / `longitude` or map SDK |
| `FlashDeal.countdown` | derive from `secondsRemaining` |

---

## 8. Changelog

| Version | Date | Notes |
|---------|------|-------|
| v0 | 2026-06-02 | Initial BE-3 contract aligned with schema v1 |
| v0.1 | 2026-06-29 | Add `EtaResult`/`Booking` `source` field (BE-12 Google Routes API + estimate fallback); ML match `candidates[]` (BE-14) |
| v0.2 | 2026-07-04 | JWT auth; merchant bookings endpoint; Routes API naming; align client types path |
| v0.3 | 2026-07-12 | Merchant restaurant create/settings; campaign cancel; refresh §6 endpoint checklist; auth logout |
