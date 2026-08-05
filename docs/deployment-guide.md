# Deployment Guide

How code moves from a developer's machine to staging and (eventually) production, what GitHub Actions runs at each step, and how to troubleshoot when it doesn't.

> **Infra status (2026-08-05): no GCP infrastructure currently exists for TABL.** Both `tabl-app-staging` and `tabl-app-prod` were deleted 2026-08-01 (billing account closed) — see [`cloud_deployments/README.md`](../cloud_deployments/README.md). The branch/CI flow below is unaffected, but the staging deploy step in [`deploy-staging.yml`](#3-staging-deploy--githubworkflowsdeploy-stagingyml) now targets a project that no longer exists (logged as **R-26** in `RISK_REGISTER.md`). Until new infra is provisioned, the app only runs locally via Docker — see [`cloud_deployments/README.md`'s "Running the app with Docker"](../cloud_deployments/README.md#running-the-app-with-docker).

## Branch strategy

Code flows one direction only: **`feature/*` → `integrate` → `develop` → `main`**. Each branch only ever receives merges from the branch immediately below it in this chain — never skip a step (e.g. don't merge a feature branch straight into `develop`, and don't merge `integrate` straight into `main`).

| Branch | Purpose | Receives merges from | Triggers |
|---|---|---|---|
| `feature/*` | Individual work | — | `ci.yml` on PR into `integrate` |
| `integrate` | Where features land first and get integration-tested together, before anything touches a deploy-triggering branch | `feature/*` | `ci.yml` on push/PR |
| `develop` | Staging — only ever receives already-integrated, already-green code | `integrate` | `ci.yml` on push/PR; `deploy-staging.yml` on push |
| `main` | Production-ready | `develop` | `ci.yml` on push/PR; **no automated production deploy yet** (see [Production deploy](#production-deploy-tagged-release-not-yet-implemented)) |

**Why this order and not `develop` → `integrate` → `main`:** `develop` triggers a staging deploy on push. If individual features merged into `develop` before being integration-tested together on `integrate`, every feature merge would kick off a staging deploy of code that hasn't been checked against the rest of the in-flight work — defeating the purpose of having an integration branch at all. Promoting `integrate` → `develop` should be a deliberate, intentional step once a batch of features is confirmed to work together, not an automatic side effect of merging one feature.

One naming wrinkle worth knowing: "develop" conventionally implies "where active development happens," but in this flow it sits *downstream* of `integrate` as a staging gate. Renaming it (e.g. to `staging`) would be clearer, but is a separate decision — not done as part of this guide.

## Branch protection

Set up via GitHub → Settings → Rules → Rulesets → New ruleset → New branch ruleset. Create one ruleset per protected branch.

| Branch | Protect? | Rules |
|---|---|---|
| `main` | Yes | Require PR before merging; require all 5 `ci.yml` status checks; block force pushes; restrict deletions |
| `develop` | Yes | Same as `main` |
| `integrate` | No (for now) | Active feature-merge target — protecting it would fight the workflow it's meant to support. Revisit once the team grows beyond one merger |

For each ruleset on `main`/`develop`:
- **Target branches:** include by pattern, the exact branch name (`main` or `develop`)
- **Restrict deletions:** on
- **Block force pushes:** on
- **Require a pull request before merging:** on, with 0 required approvals for now (raise to 1+ once there's more than one regular reviewer)
- **Require status checks to pass:** on, add all five:
  - `Lint OpenAPI contract`
  - `Web app (lint + build)`
  - `Mobile app (lint)`
  - `API gateway (install + test)`
  - `ML pipeline (FastAPI install + import check)`
  - Leave "Require branches to be up to date before merging" **off** initially — it forces a rebase/merge from base before every merge, which adds friction not worth paying yet at this team size
- **Bypass list:** leave empty, including for yourself as admin — the only way to actually verify the rules hold is to not exempt anyone

**Gotcha:** a status check only appears in that picker once GitHub has seen it reported at least once on the repo. If `ci.yml` has only ever run on `integrate`, the picker will show the checks fine (GitHub lists checks seen anywhere in the repo), but you still want the workflow file itself present on `main`/`develop` — otherwise pushes to those branches won't trigger `ci.yml` at all, regardless of what's in the picker. Confirm with:
```bash
git show origin/main:.github/workflows/ci.yml > /dev/null && echo "present" || echo "missing"
```

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

**Status as of 2026-08-05: confirmed broken.** `tabl-app-staging` (both the GCP project and the Firebase project riding on it) was deleted 2026-08-01. The next promotion after that (PR #120, `integrate`→`develop`) confirmed the failure in a live run: `build-web` and `build-backend` passed, but `deploy` failed at "Deploy to Firebase Hosting" — `FirebaseError: ... Project tabl-app-staging has been deleted.` ([run 30995772392](https://github.com/chukwuemekanwoke-jpg/comp47360-team2/actions/runs/30995772392)). Logged as **R-26** in `RISK_REGISTER.md`.

**Trigger:** push to `develop`, or manual `workflow_dispatch`.

```
git checkout develop
git merge integrate   # promote a confirmed-good integration batch, not an individual feature
git push origin develop
```

That push alone kicks off the workflow. Jobs:

1. `build-web` — `npm ci` + `npm run build` in `frontend/web-app`, uploads `dist/` as a build artifact (`web-dist`, 7-day retention). Unaffected by the infra loss — this job doesn't touch GCP.
2. `build-backend` — `npm ci` in `backend/api-gateway` (install/compile check only). The job's own comment notes `api-gateway` deploys separately via a Cloud Build trigger configured directly on the Cloud Run service (confirmed live via R-02/R-03 in `RISK_REGISTER.md`) — that trigger, and the Cloud Run service it deployed to, no longer exist.
3. `deploy` — depends on both above, runs under the `staging` GitHub Environment, downloads `web-dist`, and deploys it to Firebase Hosting (`projectId: tabl-app-staging`) via `FirebaseExtended/action-hosting-deploy@v0`. **This step stopped being a placeholder on 2026-07-09** (commit `b8a37cd`) — contrary to what an earlier version of this guide said, it was already a real, working deploy for over three weeks before the target project was deleted. It will now fail (or silently deploy nothing) since that project is gone.

To make this a real deploy again: either stand up new GCP/Firebase staging infrastructure from scratch (the Terraform under [`cloud_deployments/gcp/staging`](../cloud_deployments/gcp/staging) was written to match the old live state but was never `terraform import`-ed or `apply`-ed, so it can't just be reapplied as-is — treat it as a design reference only) and repoint this workflow plus rebuild `api-gateway`'s Cloud Build trigger, or explicitly retire this deploy step and rely on local Docker (see [`cloud_deployments/README.md`](../cloud_deployments/README.md)) until infra exists again. Whichever path, add any needed secrets to the `staging` Environment in repo settings (Settings → Environments → staging).

## 4. Production deploy (tagged release) — not yet implemented

There is currently **no** `deploy-production.yml` or any workflow triggered by tags. If your intended flow is "tag a release on `main` → auto-deploy to production," that needs to be built. A typical shape, modeled on `deploy-staging.yml`:

```yaml
on:
  push:
    tags: ["v*.*.*"]
```

with the deploy job running under a `production` Environment (ideally with required reviewers configured for manual approval before the deploy step executes). Until this exists, promoting `develop` → `main` and cutting a tag does **not** trigger any deploy — it's a purely manual step today. As of 2026-08-05 there is also no `tabl-app-prod` GCP/Firebase project to deploy to even manually (deleted 2026-08-01, same as staging) — building this workflow and (re)provisioning production infrastructure are now two separate prerequisites, not one.

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
| `deploy-staging.yml` fails (or "succeeds" but nothing changes) at the Firebase Hosting deploy step | `tabl-app-staging` GCP/Firebase project was deleted 2026-08-01 — the deploy target no longer exists (R-26 in `RISK_REGISTER.md`) | Expected until new infra is provisioned; run the app locally via Docker instead — see [`cloud_deployments/README.md`](../cloud_deployments/README.md) |
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
- Opened and merged [PR #16](https://github.com/chukwuemekanwoke-jpg/comp47360-team2/pull/16): `integrate` → `main`, landing `ci.yml`/`deploy-staging.yml` on `main` for the first time and triggering a real (passing) push-event run there.
- Fixed three real CI bugs surfaced once the workflows actually ran end to end: an over-strict Redocly ruleset, and missing `eslint`/`eslint-config-expo` dependencies in both frontend apps (plus the real lint findings they then surfaced).
- Settled on the branch flow `feature/* → integrate → develop → main` (not `develop → integrate → main`), since `develop` triggers staging deploys and shouldn't receive unintegrated feature work directly. Documented branch protection rules accordingly (see [Branch protection](#branch-protection)).
- `develop` was still missing `ci.yml`/`deploy-staging.yml` as of this update — promote `integrate` → `develop` to pick them up before setting up its ruleset.
