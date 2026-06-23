# Deployment Guide

How code moves from a developer's machine to staging and (eventually) production, what GitHub Actions runs at each step, and how to troubleshoot when it doesn't.

## Branch strategy

| Branch | Purpose | Triggers |
|---|---|---|
| feature/* | Individual work | `ci.yml` on PR into `develop`/`integrate`/`main` |
| `integrate` | Cross-feature integration before promoting to `develop`/`main` | `ci.yml` on push/PR |
| `develop` | Staging branch | `ci.yml` on push; `deploy-staging.yml` on push |
| `main` | Production-ready | `ci.yml` on push/PR; **no automated production deploy yet** (see [Production deploy](#production-deploy-tagged-release-not-yet-implemented)) |

## 1. Local development

```bash
# from repo root (npm workspaces: database, backend/api-gateway, frontend/web-app, frontend/mobile-app)
npm install

# Postgres
cp database/.env.example database/.env
npm run db:up        # docker compose up -d (table-postgres on :5432)
npm run migrate
npm run seed          # optional demo data

# Backend
cp backend/api-gateway/.env.example backend/api-gateway/.env
npm run dev:backend   # nodemon, http://localhost:3001

# Web frontend
npm run dev:web       # vite, http://localhost:5173

# Mobile (separate terminal, from frontend/mobile-app)
cd frontend/mobile-app && npm start
```

Before opening a PR, run what CI will run:

```bash
cd backend/api-gateway && npm run check:openapi-drift && npm test
cd ../../frontend/web-app && npm run lint && npm run build
cd ../mobile-app && npm run lint
npx --yes @redocly/cli lint docs/openapi-v0.yaml
```

## 2. CI — `.github/workflows/ci.yml`

Runs on every push and PR to `main`, `develop`, and `integrate`. Five independent jobs, all must pass before merge:

| Job | What it checks | Failure means |
|---|---|---|
| `openapi-lint` | `docs/openapi-v0.yaml` is valid OpenAPI 3.0.3 (Redocly CLI) | Spec has a syntax/structural error |
| `web` | `frontend/web-app`: `npm ci`, `eslint`, `vite build` | Lint violation or build error in the web app |
| `mobile` | `frontend/mobile-app`: `npm ci`, `expo lint` | Lint violation in the Expo app |
| `backend` | `backend/api-gateway`: `npm ci`, **OpenAPI drift check**, Jest tests | Route/method mismatch between code and spec, or a failing test |
| `ml-pipeline` | `ml-pipeline/fastapi-app`: `pip install`, `python -c "import main"` | FastAPI app fails to import (missing dep, syntax error) |

### OpenAPI drift check (new this session)

`backend/api-gateway/scripts/check-openapi-drift.js` statically introspects the Express router tree (`health`, `apiV1`, `users`, `restaurants`, `bookings`, `offers`, `campaigns`) and diffs the resulting `METHOD /path` set against every path in `docs/openapi-v0.yaml`. It does **not** start a server or touch the database — it requires the router modules directly and reads `layer.route.path`/`layer.route.methods` off each one.

Run it locally:
```bash
cd backend/api-gateway
npm run check:openapi-drift
```

It fails (`exitCode = 1`) and lists two categories whenever they're non-empty:
- *Endpoints declared in docs/openapi-v0.yaml but not implemented in code* — someone wrote the contract but not the route.
- *Endpoints implemented in code but not declared in docs/openapi-v0.yaml* — someone shipped a route and forgot the spec.

**Maintenance note:** this script hardcodes the mount tree (which router is mounted at which prefix) rather than crawling Express's internal `_router.stack` regexes, which don't reliably round-trip back to plain path strings in modern Express. If you add a new router file or a new `router.use(prefix, subRouter)` mount, you must add it to the `mounts` array in `check-openapi-drift.js` or the check will silently miss those routes (false pass) rather than fail loud.

## 3. Staging deploy — `.github/workflows/deploy-staging.yml`

**Trigger:** push to `develop`, or manual `workflow_dispatch`.

```
git checkout develop
git merge integrate   # or fast-forward, per your merge policy
git push origin develop
```

That push alone kicks off the workflow. Jobs:

1. `build-web` — `npm ci` + `npm run build` in `frontend/web-app`, uploads `dist/` as a build artifact (`web-dist`, 7-day retention).
2. `build-backend` — `npm ci` in `backend/api-gateway` (install/compile check only, no deploy step here yet).
3. `deploy` — depends on both above, runs under the `staging` GitHub Environment, downloads `web-dist`, and currently just echoes a placeholder message. **No real infrastructure is wired up.**

To make this a real deploy, replace the `Deploy (TODO)` step with whatever target you pick (Docker push to a registry, SSH + rsync to a VM, Vercel/Netlify action, etc.), and add the needed secrets to the `staging` Environment in repo settings (Settings → Environments → staging).

## 4. Production deploy (tagged release) — not yet implemented

There is currently **no** `deploy-production.yml` or any workflow triggered by tags. If your intended flow is "tag a release on `main` → auto-deploy to production," that needs to be built. A typical shape, modeled on `deploy-staging.yml`:

```yaml
on:
  push:
    tags: ["v*.*.*"]
```

with the deploy job running under a `production` Environment (ideally with required reviewers configured for manual approval before the deploy step executes). Until this exists, promoting `develop` → `main` and cutting a tag does **not** trigger any deploy — it's a purely manual step today.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `backend` job fails on "Check API matches OpenAPI contract" | A route was added/removed/renamed in code without updating `docs/openapi-v0.yaml`, or vice versa | Run `npm run check:openapi-drift` locally, read the two lists it prints, fix the side that's behind |
| Drift check passes locally but a route is missing from CI's view | New router file or `.use()` mount not added to the `mounts` array in `check-openapi-drift.js` | Add `{ prefix: "...", router: require(...) }` for the new mount |
| `backend` job fails on `npm test` | A Jest spec in `backend/api-gateway/src/__tests__/` failed | Run `npm test` locally from `backend/api-gateway`; tests use `createApp()` directly via Supertest, no DB needed for `/health` and `/api/v1/status` |
| `openapi-lint` fails | Invalid YAML or schema in `docs/openapi-v0.yaml` (e.g. duplicate mapping key, bad `$ref`) | Run `npx --yes @redocly/cli lint docs/openapi-v0.yaml` locally; the error includes a line/column |
| `web` job fails on lint | ESLint violation, `--max-warnings 0` means even warnings fail the build | `cd frontend/web-app && npm run lint` locally and fix reported issues |
| `web` job fails on build | Vite build error, often a bad import or env var assumption | `cd frontend/web-app && npm run build` locally to reproduce |
| `mobile` job fails | `expo lint` violation | `cd frontend/mobile-app && npm run lint` locally |
| `ml-pipeline` job fails on import | Missing dependency in `requirements.txt`, or `main.py` has a top-level error | `cd ml-pipeline/fastapi-app && pip install -r requirements.txt && python -c "import main"` locally |
| `deploy-staging.yml` "deploys" but nothing changes externally | The `deploy` job is still a placeholder (`echo` only) | Expected — no staging infra is connected yet; see [Staging deploy](#3-staging-deploy--githubworkflowsdeploy-stagingyml) |
| Pushing a tag does nothing | No tag-triggered workflow exists | Expected — see [Production deploy](#4-production-deploy-tagged-release--not-yet-implemented); this must be built before tags do anything |
| `gh pr create` fails with "Resource not accessible by personal access token" | The token used by `gh auth login` lacks `repo`/`pull_request` write scope (common with fine-grained PATs missing the "Pull requests: Read and write" permission) | `gh auth login` again via the browser/OAuth flow (not a restricted fine-grained PAT), or edit the existing fine-grained token's permissions, then `gh auth refresh` |
| Merging `develop`/`integrate` into `main` produces conflicts in `offers.js`/`restaurants.js`/`users.js`/`campaigns.js` | Two branches added implementations or stub routes at the same location (this happened once already — stub `501` routes on `integrate` collided with the real BE-13 offers/campaigns implementation merged into `main`) | Prefer the real implementation over any stub; after resolving, re-run `npm run check:openapi-drift` and `npm test` before committing the merge |

## Changes made this session (for context)

- Added `ci.yml` and `deploy-staging.yml` from scratch.
- Repointed `deploy-staging.yml` to trigger on `develop` (was `main`) to match the `develop`-is-staging convention.
- Added `develop` to `ci.yml`'s trigger branches (was `main`/`integrate` only).
- Replaced `backend/api-gateway`'s stub `test` script (`exit 1` always) with a real Jest + Supertest suite (`src/__tests__/app.test.js`): `/health`, `/api/v1/status`, unknown-route 404.
- Added `scripts/check-openapi-drift.js` and wired it into the `backend` CI job as a blocking step.
- Resolved real drift the checker found: documented `GET /api/v1/status` in the spec, and (temporarily) stubbed out offers/campaigns endpoints that were in the spec but not in code.
- Merged `main`'s real offers/campaigns implementation (PR #15, BE-13) into `integrate`, discarding the now-redundant stubs, and extended the OpenAPI spec to cover two campaign-manager routes (`GET .../campaigns`, `GET .../campaigns/active`) that existed in code but weren't documented.
- Opened [PR #16](https://github.com/chukwuemekanwoke-jpg/comp47360-team2/pull/16): `integrate` → `main`.
