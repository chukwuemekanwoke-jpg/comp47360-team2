# Cloud deployments

**Author:** Chukwuemeka Nwoke — Integration Lead / Scrum Master

Terraform configs for TABL's cloud infrastructure, one directory per
provider:

| Provider | Status |
| --- | --- |
| [`gcp/`](./gcp/README.md) | **Decommissioned** — both `tabl-app-staging` and `tabl-app-prod` GCP projects were deleted and the billing account closed on 2026-08-01. The `.tf` files under `gcp/` still describe that infrastructure as it existed on 2026-07-28, but there is nothing left to `terraform import` against; treat them as historical record, not a live target |
| [`aws/`](./aws/README.md) | Design exercise — `staging` written from scratch to mirror GCP's architecture, never applied to a real account |
| [`azure/`](./azure/README.md) | Design exercise — same as AWS, `staging` mirrors GCP's architecture, never applied to a real subscription |

**Nothing here currently points at a live cloud environment.** Until a
provider is (re)provisioned, the two application containers only run
locally — see [Running the app with Docker](#running-the-app-with-docker)
below. The AWS and Azure configs remain greenfield designs where
`terraform apply` would *create* new, billed infrastructure — see
[`aws/staging/README.md`](./aws/staging/README.md) and
[`azure/staging/README.md`](./azure/staging/README.md) before running
anything there.

## Related deployment docs

This directory is one of three places deployment-relevant docs live in this
repo — they cover different layers and don't overlap:

| Doc | Covers |
| --- | --- |
| [`docs/ops/docker-local.md`](../docs/ops/docker-local.md) | **Running the whole application locally in Docker** — the root `docker-compose.yml`, where API keys go, seeding, and hot-reload workflows. Start here if you just want the app running. |
| [`docs/ops/deployment-guide.md`](../docs/ops/deployment-guide.md) | Branch flow (`feature/* → integrate → develop → main`), branch protection, and what `ci.yml` / `deploy-staging.yml` do in GitHub Actions. Process/CI, not containers. |
| [`database/README.md`](../database/README.md) | Schema, migrations, and seed mechanics. The database container itself is now part of the root compose stack. |
| This file / `gcp/`, `aws/`, `azure/` | Terraform IaC for cloud infrastructure (Cloud Run, Cloud SQL, Artifact Registry, etc.) — currently unapplied everywhere (see table above). |

## Running the app with Docker

A root-level [`docker-compose.yml`](../docker-compose.yml) wires the whole
platform together. Full guide: [`docs/ops/docker-local.md`](../docs/ops/docker-local.md).

```bash
cp .env.example .env
docker compose up -d --build          # web, api-gateway, ml-service, postgres
docker compose --profile mobile up -d mobile   # optional: Expo dev server
```

| Service | Dockerfile | Container port | Published on |
| --- | --- | --- | --- |
| Web app (React/Vite → nginx) | [`frontend/web-app/Dockerfile`](../frontend/web-app/Dockerfile) | `:80` | `:5173` |
| API gateway (Node/Express) | [`backend/api-gateway/Dockerfile`](../backend/api-gateway/Dockerfile) | `:8080` default, `PORT=3001` in compose | `:3001` |
| ML inference service (FastAPI) | [`ml-pipeline/fastapi-app/Dockerfile`](../ml-pipeline/fastapi-app/Dockerfile) | `:8080` (`PORT` env var) | `:8000` |
| Migration/seed runner (one-shot) | [`database/Dockerfile`](../database/Dockerfile) | — | — |
| Expo dev server (dev mode, opt-in) | [`frontend/mobile-app/Dockerfile`](../frontend/mobile-app/Dockerfile) | `:8081` | `:8081` |
| PostgreSQL | `postgres:16-alpine` | `:5432` | `:5432` |

All application images carry a `HEALTHCHECK`, which is what compose uses to
sequence startup (Postgres healthy → migrations applied → gateway → web).

Verify:

```bash
curl http://localhost:3001/health
curl http://localhost:8000/health
curl http://localhost:5173/health   # via the web container's nginx proxy
```

The two application images are still buildable and runnable standalone if you
need one in isolation:

```bash
docker build -t tabl-api-gateway ./backend/api-gateway
docker build -t tabl-ml-service ./ml-pipeline/fastapi-app
```

### Where this fits with the cloud configs above

The `gcp/staging` Terraform (now historical, per the table above) shows
how these same two images were previously built by Cloud Build and pushed
to Artifact Registry for deployment to Cloud Run — see
[`gcp/staging/artifact_registry.tf`](./gcp/staging/artifact_registry.tf)
and [`gcp/staging/cloud_build.tf`](./gcp/staging/cloud_build.tf). That
pipeline has no live target today; the local compose stack above is the
only way to run these images until a provider is (re)provisioned.
