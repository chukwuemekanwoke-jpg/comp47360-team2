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
| [`docs/deployment-guide.md`](../docs/deployment-guide.md) | Branch flow (`feature/* → integrate → develop → main`), branch protection, and what `ci.yml` / `deploy-staging.yml` do in GitHub Actions. Process/CI, not containers. |
| [`database/README.md`](../database/README.md) | Running **Postgres** locally via `database/docker-compose.yml` (`npm run db:up`). Covers the database container only. |
| This file / `gcp/`, `aws/`, `azure/` | Terraform IaC for cloud infrastructure (Cloud Run, Cloud SQL, Artifact Registry, etc.) — currently unapplied everywhere (see table above). |

None of the three previously documented how to build and run the
**application** containers (`api-gateway`, `ml-service`) themselves — that's
what the section below fills in.

## Running the app with Docker

Two Dockerfiles exist for the application services, each buildable and
runnable standalone:

| Service | Dockerfile | Listens on |
| --- | --- | --- |
| API gateway (Node/Express) | [`backend/api-gateway/Dockerfile`](../backend/api-gateway/Dockerfile) | `:8080` (`PORT` env var) |
| ML inference service (FastAPI) | [`ml-pipeline/fastapi-app/Dockerfile`](../ml-pipeline/fastapi-app/Dockerfile) | `:8080` (`PORT` env var), includes a `HEALTHCHECK` against `/health` |

There is no root-level `docker-compose.yml` wiring all three services
(gateway, ML service, Postgres) together yet — the steps below run them
individually with plain `docker build`/`docker run`, composed with the
existing database compose file.

### 1. Database

```bash
cd database
cp .env.example .env
npm run db:up        # docker compose up -d — table-postgres on :5432
npm run migrate
npm run seed          # optional demo data
```

### 2. Build the two images

From the repo root:

```bash
docker build -t tabl-api-gateway ./backend/api-gateway
docker build -t tabl-ml-service ./ml-pipeline/fastapi-app
```

### 3. Run them

The ML service image listens on container port `8080`, but
`ML_SERVICE_URL` in `backend/api-gateway/.env.example` defaults to
`http://localhost:8000` — map the host port to match (or override
`ML_SERVICE_URL` to point at `:8080` instead):

```bash
docker run -d --name tabl-ml-service \
  -p 8000:8080 \
  tabl-ml-service

docker run -d --name tabl-api-gateway \
  -p 3001:8080 \
  -e PORT=8080 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/table_dev" \
  -e ML_SERVICE_URL="http://host.docker.internal:8000" \
  -e JWT_SECRET="dev-jwt-secret-change-me" \
  tabl-api-gateway
```

`host.docker.internal` resolves to the host machine from inside a
container on Docker Desktop (Windows/Mac); on Linux, use
`--network=host` or the Postgres container's name/IP on the shared
Docker network instead.

Verify:

```bash
curl http://localhost:3001/health
curl http://localhost:8000/health
```

### Where this fits with the cloud configs above

The `gcp/staging` Terraform (now historical, per the table above) shows
how these same two images were previously built by Cloud Build and pushed
to Artifact Registry for deployment to Cloud Run — see
[`gcp/staging/artifact_registry.tf`](./gcp/staging/artifact_registry.tf)
and [`gcp/staging/cloud_build.tf`](./gcp/staging/cloud_build.tf). That
pipeline has no live target today; the `docker build`/`docker run` steps
above are the only way to run these images until a provider is
(re)provisioned.
