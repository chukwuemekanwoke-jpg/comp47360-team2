# Running Tablé locally with Docker

**Author:** Milo Dennehy - Mobile App Lead

The whole platform — web app, mobile app, API gateway, ML inference service, and
Postgres — runs from a single `docker compose up`. No Node, Python, PostgreSQL,
or Expo CLI install required; Docker is the only prerequisite.

This is the recommended way to run Tablé since the staging environment was
decommissioned (see [`cloud_deployments/README.md`](../../cloud_deployments/README.md)).

> **Scope:** local development and demos only. Every port binds to `127.0.0.1`
> by default, so the stack is reachable from your machine and nowhere else.
> That is deliberate and you should leave it that way — see
> [Exposure and security](#exposure-and-security).

---

## Quick start

```bash
git clone <repo-url> && cd comp47360-team2

cp .env.example .env          # defaults work as-is; API keys are optional
docker compose up -d --build  # first run: ~5 min, mostly the ML image
```

Then open **<http://localhost:5173>**.

Log in to the merchant dashboard with the seeded demo account:

| Field | Value |
|---|---|
| Email | `manager@demo.com` |
| Password | `password123` |

To confirm everything came up:

```bash
docker compose ps            # all services "running"; migrate shows "exited (0)"
curl localhost:3001/health   # {"status":"ok"}
curl localhost:8000/health   # {"status":"healthy","model_loaded":true,...}
curl localhost:5173/health   # proxied through nginx to the gateway
```

The mobile app is opt-in — see [Mobile app](#mobile-app-expo) below:

```bash
docker compose --profile mobile up -d mobile
```

The first `up` takes a few minutes — the ML image installs a ~1 GB scientific
Python stack (xgboost, scikit-learn, pandas, pyproj). Later runs are cached and
start in seconds. The ML service also needs ~30 s after start to load the
XGBoost pipeline and its parquet feature tables before it reports healthy.

---

## What runs

| Service | Image built from | Container port | On your machine | Purpose |
|---|---|---|---|---|
| `web` | [`frontend/web-app/Dockerfile`](../../frontend/web-app/Dockerfile) | 80 | <http://localhost:5173> | React/Vite bundle served by nginx, which also reverse-proxies `/api` |
| `api-gateway` | [`backend/api-gateway/Dockerfile`](../../backend/api-gateway/Dockerfile) | 3001 | <http://localhost:3001> | Node/Express REST API |
| `ml-service` | [`ml-pipeline/fastapi-app/Dockerfile`](../../ml-pipeline/fastapi-app/Dockerfile) | 8080 | <http://localhost:8000> | FastAPI busyness prediction + deal matching |
| `postgres` | `postgres:16-alpine` | 5432 | `localhost:5432` | Application database |
| `migrate` | [`database/Dockerfile`](../../database/Dockerfile) | — | — | One-shot: applies migrations + seeds, then exits |
| `mobile` | [`frontend/mobile-app/Dockerfile`](../../frontend/mobile-app/Dockerfile) | 8081 | <http://localhost:8081> | Expo dev server — `--profile mobile` |
| `pgadmin` | `dpage/pgadmin4` | 80 | <http://localhost:5050> | Optional DB UI — `--profile tools` |

Boot order is enforced by health and completion conditions, so one `up` is
enough: Postgres becomes healthy → `migrate` applies the schema and seed data
and exits 0 → `api-gateway` starts → `web` starts.

```
   browser ──▶ web (nginx, :5173)
                 │ static bundle
                 └─ /api/* ──┐
                             ├──▶ api-gateway (:3001) ──┬──▶ postgres (:5432)
   phone / browser ──────────┘                          └──▶ ml-service (:8000)
     via mobile (Expo, :8081)                 ▲
                                     migrate ─┘  (runs once, then exits)
```

Because nginx proxies `/api` to the gateway, the browser only ever talks to one
origin — CORS never enters the picture for the web app. The gateway is *also*
published on `localhost:3001` so the mobile app, Postman, and `curl` can reach
it directly.

---

## Exposure and security

This stack is built to run on one machine. Every published port binds to
`127.0.0.1` — set by `BIND_ADDR` in `.env` — so nothing else on your Wi-Fi,
your university network, or the internet can reach it.

That default is not paranoia. The stack deliberately runs with several
properties that make it unsafe to expose:

| | |
|---|---|
| `ALLOW_LEGACY_USER_HEADER=true` | A bare `X-User-Id: <uuid>` header is accepted as proof of identity — no token needed. The seed UUIDs are published in [`database/seeds/README.md`](../../database/seeds/README.md). Anything that can reach the gateway can act as any user. |
| `JWT_SECRET=dev-jwt-secret-change-me` | Published in `.env.example`, so valid tokens can be forged for any account. |
| `POSTGRES_PASSWORD=postgres`, pgAdmin `admin`/`admin` | Default credentials on the database and its admin UI. |
| `GET /api/v1/config/maps-key` | Unauthenticated by design — the browser has to fetch it. Anyone reaching the gateway can harvest your browser Maps key, which is why that key must carry an HTTP-referrer restriction. |

None of these are bugs to fix for local use; they are what makes the demo
frictionless. They are simply incompatible with being reachable.

**Do not set `BIND_ADDR=0.0.0.0` to share a demo with someone.** Screen-share
instead, or have them run their own copy — it's one command.

### What loopback binding costs you

Nothing, for any of the supported workflows:

| | Works on the default? |
|---|---|
| Web app, API, psql, pgAdmin from this machine | Yes |
| Host-side Vite / nodemon against the containers | Yes |
| Expo web preview at `localhost:8081` | Yes |
| Expo tunnel — ngrok dials outbound from inside the container | Yes |
| iOS simulator (uses `localhost`) | Yes |
| Android emulator (`10.0.2.2` aliases this machine's loopback) | Yes |
| Physical phone, over the tunnel | Yes |
| Physical phone, over the LAN (`EXPO_START_ARGS=--host lan`) | No — needs `BIND_ADDR=0.0.0.0` |

A physical phone used to need `BIND_ADDR=0.0.0.0` to reach the API. It no longer
does: the dev server proxies `/api/*` to the gateway, so API calls ride the
tunnel alongside the bundle and never touch a published port. Only LAN mode still
needs the ports opened up — and while they are, everyone on your network can act
as any user in your database. On untrusted Wi-Fi, use the tunnel instead.

### What is safe to share

The **Expo tunnel** is the one outward-facing path, and it is wider than it
looks — treat the URL as granting full access to your local stack:

- It serves the Metro bundler on port 8081, **and `/api/*` proxied through to the
  api-gateway**. That is what makes a phone work, but it also means anyone with
  the URL reaches your API — which is running with the publicly-known dev
  `JWT_SECRET` and `ALLOW_LEGACY_USER_HEADER=true`, and so will let them act as
  any user in your database. Postgres itself is not exposed.
- It does not serve raw project files. Requests for `/.env`, `/app.json`, or
  any source path return 404; Metro only serves transformed bundles.
- It *does* serve your app's JavaScript, and inlines every `EXPO_PUBLIC_*`
  variable into it. **Never put a secret behind an `EXPO_PUBLIC_` prefix** —
  that prefix means "ship this to every client", and
  [`frontend/mobile-app/.env`](../../frontend/mobile-app/.env) is bind-mounted into
  the container. Variables without the prefix are not inlined.
- The URL is unguessable but not secret, and ngrok logs it. **Stop the tunnel
  when you're done: `docker compose stop mobile`.** Don't leave it running
  unattended, and don't paste the URL anywhere public.

---

## Where the API keys go

**Everything goes in the root `.env`** (created by `cp .env.example .env`). It is
gitignored — never commit it. Compose reads it automatically and injects the
values into the right containers.

Both keys below are **optional**. The stack starts and every core journey —
register, discover, book, flash deals, merchant dashboard — works without them.
Each one degrades to a documented fallback rather than failing.

Both come from the same Google Cloud project (console.cloud.google.com → APIs &
Services → Credentials → Create API key), but they **must be two separate keys**,
because they need opposite restrictions.

### `GOOGLE_MAPS_API_KEY` — server-side transit ETA

| | |
|---|---|
| **Used by** | `api-gateway` → [`services/etaResolver.js`](../../backend/api-gateway/src/services/etaResolver.js), [`services/googleDistanceMatrix.js`](../../backend/api-gateway/src/services/googleDistanceMatrix.js) |
| **Google API to enable** | **Routes API** |
| **Application restriction** | **None.** Called server-to-server from inside the container, which has no HTTP referrer — a referrer restriction would reject every call. Restrict by *API* (Routes API only) instead. |
| **Without it** | ETAs fall back to a local haversine distance + fixed-speed estimate. Booking still works; the ETA is just less accurate. |

### `MAPS_JS_API_KEY` — browser-side map and place picker

| | |
|---|---|
| **Used by** | `web` → [`components/RestaurantLocationPicker.jsx`](../../frontend/web-app/src/components/RestaurantLocationPicker.jsx), which fetches the key at runtime from `GET /api/v1/config/maps-key` |
| **Google APIs to enable** | **Maps JavaScript API** + **Places API** |
| **Application restriction** | **HTTP referrers**, allowing `http://localhost:5173/*`. This key is shipped to the browser, so it *must* be referrer-locked — which is exactly why it can't be the same key as the one above. |
| **Without it** | `/config/maps-key` returns 404 and the restaurant location picker falls back to manual latitude/longitude entry. |

> If you change `WEB_PORT`, update the referrer restriction to match.

After editing `.env`, restart to pick the keys up:

```bash
docker compose up -d api-gateway
```

### A third key, only for native Android builds

`GOOGLE_MAPS_ANDROID_API_KEY` is read by
[`frontend/mobile-app/app.config.js`](../../frontend/mobile-app/app.config.js) when
the native Android project is generated. It is **not** part of the Docker stack —
it only matters for `expo prebuild` / EAS builds, and belongs in
`frontend/mobile-app/.env.local` or an EAS secret. The Expo web preview and the
dev server described below don't need it.

### Other values in `.env`

| Variable | Default | Notes |
|---|---|---|
| `JWT_SECRET` | `dev-jwt-secret-change-me` | Fine locally. Anything deployed must override it — the gateway refuses to boot under `NODE_ENV=production` without one. |
| `POSTGRES_USER` / `_PASSWORD` / `_DB` | `postgres` / `postgres` / `table_dev` | Changing these only affects a fresh volume. |
| `BIND_ADDR` | `127.0.0.1` | Which address the ports publish on. Leave it — see [Exposure and security](#exposure-and-security). |
| `WEB_PORT`, `API_PORT`, `ML_PORT`, `POSTGRES_PORT`, `EXPO_PORT`, `PGADMIN_PORT` | 5173, 3001, 8000, 5432, 8081, 5050 | Change if a port is already taken. |
| `SEED_ARGS` | `--real` | What gets seeded on first boot — see [Seed data](#seed-data). |
| `VITE_API_URL` | `/api/v1` | **Build-time.** Baked into the web bundle; needs `--build` to change (see [below](#changing-vite_api_url)). |
| `EXPO_START_ARGS`, `EXPO_HOST` | `--tunnel`, `localhost` | Mobile only — see [Mobile app](#mobile-app-expo). |
| `EXPO_PUBLIC_API_URL` | *(empty)* | Mobile only. Leave empty: the app derives its API base from the dev server that served it. Set it only to pin the app at a specific gateway. |
| `ALLOW_LEGACY_USER_HEADER` | `true` | Lets a raw `X-User-Id` header stand in for a login, for demos and Postman. Never enable anywhere reachable from outside your machine. |

One key **not** needed to run the stack:
[`database/scripts/enrich-places.js`](../../database/scripts/enrich-places.js) also
reads `GOOGLE_MAPS_API_KEY`, but it is a one-off **billed** Google Places
backfill run by hand outside Docker. It is not part of `docker compose up`.

---

## Mobile app (Expo)

The `mobile` service runs the Expo dev server in **development mode** — your
source is bind-mounted in, so edits hot-reload without rebuilding anything. It is
the one service here that doesn't serve a pre-built artefact.

It's behind a profile because it's large and only mobile work needs it:

```bash
docker compose --profile mobile up -d mobile
docker compose logs -f mobile
```

One dev server, port 8081, two ways to use it.

### Option 1 — in a browser (fastest way to see and click the app)

Open **<http://localhost:8081>**. That's it.

Expo serves the app through `react-native-web`, and this app already ships web
variants of its native-only screens
([`MapTab.web.tsx`](../../frontend/mobile-app/src/app/tabs/MapTab.web.tsx),
[`WebMap.tsx`](../../frontend/mobile-app/src/components/WebMap.tsx) with Leaflet,
[`LocationComponent.web.tsx`](../../frontend/mobile-app/src/components/LocationComponent.web.tsx),
[`ModalSheet.web.tsx`](../../frontend/mobile-app/src/components/ModalSheet.web.tsx)),
so the map, location, and sheet UI all render. No phone, no emulator, no Xcode,
no Android Studio.

The first page load takes ~15 s while Metro bundles ~5 MB of JavaScript;
afterwards it's instant and edits hot-reload.

This is the right choice for reviewing UI work, demoing, or checking that a
change renders. It is not a substitute for testing native behaviour — gestures,
native maps, push notifications, and haptics need a real device.

### Option 2 — on a real phone, over the tunnel

The default `EXPO_START_ARGS=--tunnel` makes Expo open an **ngrok tunnel**, so
the app is served from a public `https://…exp.direct` URL:

```bash
npm run docker:mobile             # starts the server, waits, prints the URL
npm run docker:mobile:url         # reprints it later
```

Open that URL in Expo Go (as `exp://…`) or a dev build, or load the `https://…`
form in a phone browser for Expo web. Expo also draws a QR code for the same
tunnel, but `docker compose logs` mangles the block characters it is made of, so
the printed URL is what to rely on. Under the hood both commands just read the
hostname back out of the logs:

```bash
docker compose logs mobile | grep -oE '[a-z0-9-]+\.exp\.direct' | tail -1
```

Tunnel mode is the recommended path because it needs no LAN IP, no port
forwarding, and works on networks that block device-to-device traffic — which
covers most university and office Wi-Fi. It also works when the phone is on
cellular rather than your Wi-Fi.

Two things to know:

- **API calls ride the tunnel too — there is nothing to configure.** Expo's
  tunnel only carries the JavaScript bundle, so on its own a phone would load
  the app and then fail every request (`localhost` on a phone is the phone). To
  close that gap the Expo dev server proxies `/api/*` through to the gateway
  ([`frontend/mobile-app/metro.config.js`](../../frontend/mobile-app/metro.config.js)),
  which puts the API on the same origin as the bundle, and the app resolves that
  origin at runtime ([`frontend/mobile-app/index.js`](../../frontend/mobile-app/index.js)).

  So the phone reaches the backend over the tunnel's public https URL, with no
  LAN IP to look up and `BIND_ADDR` left at loopback. Leave
  `EXPO_PUBLIC_API_URL` empty for this to work — setting it pins the app at that
  address instead and turns the auto-detection off.

  The flip side: anyone with the tunnel URL can reach your API. See
  [What is safe to share](#what-is-safe-to-share).

- **The QR code targets a development build**, not Expo Go, because the app
  depends on `expo-dev-client`. If you don't have a dev build installed, add
  `--go` (`EXPO_START_ARGS=--tunnel --go`) — with the caveat that not all of the
  app's native modules exist in Expo Go.

Tunnel startup occasionally fails on the first attempt. The container is set to
restart, so it retries on its own; just watch for `Tunnel ready.` in the logs.

### Option 3 — LAN mode (faster, works offline)

If the phone is on the same Wi-Fi and that network allows device-to-device
traffic, LAN mode skips ngrok and is noticeably quicker to start:

```bash
# in .env
BIND_ADDR=0.0.0.0                             # required — publishes 8081 on the LAN
EXPO_START_ARGS=--host lan
EXPO_HOST=192.168.1.23                        # this machine's LAN IP
```

```bash
docker compose up -d
docker compose restart mobile
```

`EXPO_HOST` is what Metro advertises in the bundle URL and QR code — without it
the container would advertise its own internal Docker IP, which no phone can
reach.

API calls need no configuration here either: they go to the dev server on
`192.168.1.23:8081` along with the bundle, and it proxies them onward. Port 3001
does not have to be published for the app to work.

### Simulators and emulators

Nothing to configure — the app targets whichever origin served it, and the dev
server proxies onward from there:

| Target | Point it at | API base it resolves |
|---|---|---|
| Browser (Expo web) | `http://localhost:8081` | `http://localhost:8081/api/v1` |
| iOS simulator | `http://localhost:8081` | `http://localhost:8081/api/v1` |
| Android emulator | `http://10.0.2.2:8081` | `http://10.0.2.2:8081/api/v1` |
| Physical phone | the tunnel URL | `https://<tunnel-host>/api/v1` |

The simulator/emulator itself runs on your host, not in Docker — Xcode and
Android Studio can't usefully be containerised. Point them at the dev server on
port 8081.

### Interactive Expo commands

The container keeps a TTY, so the usual keyboard shortcuts still work if you
attach:

```bash
docker attach table-mobile     # then press r (reload), j (debugger), ? (help)
                               # detach with Ctrl-P Ctrl-Q — NOT Ctrl-C
```

---

## Everyday commands

npm shortcuts exist for the common ones (`npm run docker:up`, `docker:down`,
`docker:logs`, `docker:ps`, `docker:reset`) — all equivalent to the plain
`docker compose` calls below.

```bash
docker compose up -d --build      # start (or apply changes to) everything
docker compose ps                 # what's running, and health status
docker compose logs -f            # tail all services
docker compose logs -f api-gateway
docker compose --profile '*' down      # stop everything, keep the database
docker compose --profile '*' down -v   # stop everything and DELETE the database volume
docker compose restart api-gateway
```

Use `--profile '*'` when shutting down. A plain `docker compose down` skips
profile services, and if `mobile` or `pgadmin` is running it fails with
`Network table_table-network Resource is still in use`.

Profiles are opt-in and need naming to start, too:

```bash
docker compose --profile mobile up -d mobile
docker compose --profile tools  up -d pgadmin
docker compose --profile '*'    up -d          # everything
```

### After changing code

Except for `mobile`, the containers run built artefacts and do not hot-reload.
Rebuild the service you touched:

```bash
docker compose up -d --build api-gateway   # backend/api-gateway/src/**
docker compose up -d --build web           # frontend/web-app/**, frontend/packages/shared/**
docker compose up -d --build ml-service    # ml-pipeline/fastapi-app/**
docker compose up -d --build migrate       # new file in database/migrations/**
```

`mobile` is the exception — its source is bind-mounted, so edits to
`frontend/mobile-app/**` and `frontend/packages/shared/**` apply immediately. It
only needs a rebuild when its **dependencies** change.

For a tight edit-refresh loop on the other services, run the one you're working
on from the host instead — see
[Hybrid workflow](#hybrid-workflow-host-side-dev-against-dockerised-dependencies).

### Database access

```bash
docker compose exec postgres psql -U postgres -d table_dev
docker compose exec postgres psql -U postgres -d table_dev -c '\dt'
```

Or start pgAdmin:

```bash
docker compose --profile tools up -d pgadmin   # http://localhost:5050
```

Inside pgAdmin, connect to host **`postgres`**, port **5432** — not
`localhost:5432`, which is the host mapping and isn't reachable from within the
Docker network.

`npm run db:backup` still works: it shells into the `table-postgres` container
and writes a `pg_dump` to `database/backups/` (gitignored — those dumps contain
real password hashes).

### Seed data

The `migrate` service runs migrations then seeds on every `up`. Both steps are
idempotent, so re-running is harmless. Control what gets seeded with `SEED_ARGS`
in `.env`:

| `SEED_ARGS` | Loads |
|---|---|
| *(empty)* | 15 fictional Manhattan venues + RevPASH booking fixtures |
| `--real` *(default)* | …plus 3,000 real Manhattan venues ([`006_manhattan_real_3000.sql`](../../database/seeds/006_manhattan_real_3000.sql)) |
| `--taxi-demand` | …plus ~39.5k historical NYC TLC taxi rows (slow, ML features only) |
| `--real --taxi-demand` | everything |

```bash
# change SEED_ARGS in .env, then:
docker compose up migrate
```

Full start from scratch, wiping all data:

```bash
docker compose down -v
docker compose up -d --build
```

Details on each seed file: [`database/seeds/README.md`](../../database/seeds/README.md).

---

## Hybrid workflow: host-side dev against dockerised dependencies

Rebuilding an image on every edit is fine for the services you aren't working
on, and painful for the one you are. Run that one on the host and let Docker
provide the rest — every port matches what the non-Docker workflow already
expects, so no configuration changes are needed.

**Web app with hot reload:**

```bash
docker compose up -d                        # full stack
docker compose stop web                     # free port 5173
npm install                                 # once, at the repo root
npm run dev:web                             # vite on :5173
```

Vite's dev proxy already forwards `/api` to `localhost:3001`
([`vite.config.js`](../../frontend/web-app/vite.config.js)), which is the
containerised gateway. Nothing else to configure.

**Backend with nodemon:**

```bash
docker compose up -d
docker compose stop api-gateway

cp backend/api-gateway/.env.example backend/api-gateway/.env
# in that file, keep the defaults: DATABASE_URL points at localhost:5432 and
# ML_SERVICE_URL at localhost:8000 — both published by the containers above
npm run dev:backend                         # nodemon on :3001
```

**Just the database**, for anyone running everything else natively:

```bash
npm run db:up      # docker compose up -d postgres
npm run migrate
npm run seed
```

---

## Changing `VITE_API_URL`

`VITE_API_URL` is baked into the web bundle at **build** time, not read at
runtime, so changing it requires a rebuild:

```bash
# in .env
VITE_API_URL=http://localhost:3001/api/v1

docker compose up -d --build web
```

The default `/api/v1` is a same-origin relative path that nginx proxies to the
gateway. Only switch to an absolute URL if you specifically want the browser to
call the gateway directly — the gateway's `CORS_ORIGINS` already allows
`http://localhost:5173`, so both work.

(`EXPO_PUBLIC_API_URL` is different: the Expo dev server reads it at bundle
time, so no image rebuild is needed — but it does need
`docker compose --profile mobile up -d mobile`, **not**
`docker compose restart mobile`. `restart` reuses the container's existing
environment and will silently keep the old value.)

---

## Troubleshooting

**`port is already allocated`** — something else holds the port. Change the
matching `*_PORT` in `.env` and `docker compose up -d` again. A stray
`table-postgres` from the retired `database/docker-compose.yml` is the usual
culprit for 5432: `docker rm -f table-postgres`.

**`web` won't start / `api-gateway` never becomes healthy** — `web` waits for the
gateway's health check, and the gateway waits for `migrate` to exit 0. Look at
the actual failure:

```bash
docker compose ps          # find the unhealthy or non-zero-exit service
docker compose logs migrate
docker compose logs api-gateway
```

**`migrate` exits 1 with `could not create unique index`** — the database volume
holds rows that violate a constraint a later migration adds. This happens with a
volume that predates the current migration set. Reset it:
`docker compose down -v && docker compose up -d`.

**ML service stuck "starting"** — normal for ~30 s on a cold start while the
XGBoost pipeline and parquet tables load. If it stays unhealthy past a minute,
`docker compose logs ml-service`.

**Blank page at :5173, or API calls 502** — the SPA loaded but nginx couldn't
reach the gateway. Check `docker compose ps api-gateway`; nginx resolves the
gateway per-request, so it will recover on its own once the gateway is healthy.

**Mobile: `failed to start tunnel`** — transient. The container restarts itself;
watch for `Tunnel ready.` in `docker compose logs -f mobile`. If it never
succeeds, fall back to LAN mode (`EXPO_START_ARGS=--host lan`).

**Mobile: app loads on the phone but every request fails** — usually
`EXPO_PUBLIC_API_URL` is set. That pins the app at a fixed address and disables
the auto-detection that makes the tunnel work; if it points at `localhost`, that
means the phone itself. Empty it and `docker compose restart mobile`.

If it is already empty, check the dev server's proxy: `502` responses and
`[metro] /api proxy ... failed` in `docker compose logs mobile` mean the gateway
is unreachable — confirm it's healthy with `docker compose ps`.

**Mobile: `Cannot find module 'autoprefixer'`** — the image installs the full
workspace tree specifically to avoid this; you'll only see it if the install was
narrowed. Rebuild with `docker compose --profile mobile build --no-cache mobile`.

**Rebuild didn't pick up my change** — `docker compose up -d` alone reuses the
existing image. Add `--build`.

**Everything is wedged** — nuclear reset (deletes the database):

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## Notes on what changed

- **`database/docker-compose.yml` has been removed.** Its Postgres and pgAdmin
  services are now part of the root `docker-compose.yml`, so there is one compose
  project instead of two competing for the container name `table-postgres` and
  port 5432. `npm run db:up` / `db:down` / `db:logs` / `db:reset` still work —
  they now target the root file and the `postgres` service. Note that
  `npm run db:reset` runs `docker compose down -v`, which now stops the whole
  stack, not just the database.
- **This stack uses a fresh `table_pg_data` volume.** The old
  `database_table_pg_data` volume is left untouched on disk but is *not* adopted:
  clusters created by the old compose file predate
  `009_booking_lifecycle_rules` and can hold booking rows that violate the unique
  index it adds, so migrating one forward fails. Everything in it is
  reproducible from migrations + seeds. Remove it when you're ready:
  `docker volume rm database_table_pg_data`.
- **Both frontend images build from the repo root**, using the root
  npm-workspaces lockfile rather than the per-app ones. The root lockfile is what
  CI validates on every PR; `frontend/web-app/package-lock.json` has drifted out
  of sync with its own `package.json` and `npm ci` rejects it. That drift also
  breaks `deploy-staging.yml`'s `build-web` job and is worth fixing separately
  (`cd frontend/web-app && npm install`).
- **The mobile image installs every workspace, not just its own.**
  `frontend/mobile-app/postcss.config.js` loads `autoprefixer`, but the only
  workspace that declares it is `frontend/web-app`; on a developer's machine it
  works purely through workspace hoisting. Declaring `autoprefixer` in
  `frontend/mobile-app/package.json` would let the image install just its own
  subtree.

---

## Related docs

| Doc | Covers |
|---|---|
| [`docs/ops/deployment-guide.md`](./deployment-guide.md) | Branch flow, branch protection, and what CI runs |
| [`cloud_deployments/README.md`](../../cloud_deployments/README.md) | Terraform IaC for cloud infrastructure (currently unapplied everywhere) |
| [`database/README.md`](../../database/README.md) | Schema, migrations, and seed mechanics |
| [`backend/api-gateway/README.md`](../../backend/api-gateway/README.md) | API endpoints, auth, rate limiting |
| [`frontend/mobile-app/README.md`](../../frontend/mobile-app/README.md) | Native builds, EAS, push notifications |
| [`ml-pipeline/fastapi-app/README.md`](../../ml-pipeline/fastapi-app/README.md) | ML endpoints and model details |
