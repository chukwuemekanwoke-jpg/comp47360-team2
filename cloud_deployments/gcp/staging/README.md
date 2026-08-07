# Terraform — tabl-app-staging (reverse-engineered)

**Author:** Chukwuemeka Nwoke — Integration Lead / Scrum Master

These `.tf` files were hand-written to match what's **already deployed** in
`tabl-app-staging`, discovered live via `gcloud` on 2026-07-28 — not a
greenfield design. The goal of the import step below is to get Terraform
state to match reality with **zero** actual infrastructure changes. Only
`tabl-app-staging` is covered; `tabl-app-prod` is a separate, later exercise.

## Status

| Step | Done? |
| --- | --- |
| `.tf` files written from live `gcloud` state | Yes (2026-07-28) |
| Terraform installed | Yes — `winget install Hashicorp.Terraform` (v1.15.8) |
| `terraform init` | Yes — Google provider v6.50.0, `.terraform.lock.hcl` committed |
| `terraform validate` / `terraform fmt` | Yes, clean — see "Bugs found during validation" below |
| `terraform.tfvars` created (real DB password set) | **No** — still a placeholder, not committed |
| `terraform import` (any resource) | **No** — nothing has been imported yet |
| `terraform plan` reviewed | **No** |
| `terraform apply` | **No, and shouldn't happen casually — see below** |

## Prerequisites

```bash
# Terraform itself — already installed in this dev environment via:
#   winget install --id Hashicorp.Terraform --source winget
terraform -version   # need >= 1.5

# Already done in this environment, but if starting fresh elsewhere:
gcloud auth application-default login
gcloud config set project tabl-app-staging
```

## Setup

```bash
cd cloud_deployments/gcp/staging
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set tabl_app_db_password to the REAL current
# tabl_app Cloud SQL password (Cloud SQL never exposes it via gcloud —
# get it from wherever it was originally stored, e.g. a password manager
# or the DATABASE_URL secret's value in Secret Manager)

terraform init
```

## Bugs found during validation

Written from `gcloud` output before ever running Terraform against it, so
two things didn't survive first contact with `terraform validate` —fixed
now, documented here so the "why" isn't lost:

- **`require_ssl` on `google_sql_database_instance.ip_configuration`** —
  doesn't exist on provider v6 (superseded by `ssl_mode`, which was already
  set correctly). Removed.
- **`maintenance_window.day` must be `1–7`** (Monday=1…Sunday=7) — the raw
  value copied from `gcloud`'s output was `0`, which the provider rejects.
  Set to `7` (Sunday) to match the original intent; worth double-checking
  against the actual Console setting once the real `terraform import` runs,
  in case `0` meant something else (e.g. "no preference") that just has no
  valid Terraform equivalent.

`terraform fmt` also normalized alignment across a few files — cosmetic
only, no behavior change.

## Import — run these in order

Each one should exit with "Import successful!" and zero resource changes.
If any command shows a diff afterward in `terraform plan`, **stop and
reconcile the `.tf` file before importing the next resource** — don't plow
ahead with a config that doesn't match reality.

```bash
# 1. Artifact Registry (no dependencies)
terraform import google_artifact_registry_repository.cloud_run_source_deploy \
  projects/tabl-app-staging/locations/europe-west1/repositories/cloud-run-source-deploy

terraform import google_artifact_registry_repository.gcr_io \
  projects/tabl-app-staging/locations/us/repositories/gcr.io

terraform import google_artifact_registry_repository.tabl_app \
  projects/tabl-app-staging/locations/europe-west1/repositories/tabl-app

# 2. Cloud SQL (instance, then database, then user)
terraform import google_sql_database_instance.tabl_db_staging \
  tabl-app-staging/tabl-db-staging

terraform import google_sql_database.table_dev \
  tabl-app-staging/tabl-db-staging/table_dev

terraform import google_sql_user.tabl_app \
  tabl-app-staging/tabl-db-staging/tabl_app

# 3. Secret Manager secrets, then their IAM bindings
terraform import 'google_secret_manager_secret.app_secrets["DATABASE_URL"]' \
  projects/tabl-app-staging/secrets/DATABASE_URL
terraform import 'google_secret_manager_secret.app_secrets["GOOGLE_MAPS_API_KEY"]' \
  projects/tabl-app-staging/secrets/GOOGLE_MAPS_API_KEY
terraform import 'google_secret_manager_secret.app_secrets["JWT_SECRET"]' \
  projects/tabl-app-staging/secrets/JWT_SECRET
terraform import 'google_secret_manager_secret.app_secrets["MAPS_JS_API_KEY"]' \
  projects/tabl-app-staging/secrets/MAPS_JS_API_KEY

terraform import 'google_secret_manager_secret_iam_member.app_secrets_accessor["DATABASE_URL"]' \
  "projects/tabl-app-staging/secrets/DATABASE_URL roles/secretmanager.secretAccessor serviceAccount:881755269293-compute@developer.gserviceaccount.com"
terraform import 'google_secret_manager_secret_iam_member.app_secrets_accessor["GOOGLE_MAPS_API_KEY"]' \
  "projects/tabl-app-staging/secrets/GOOGLE_MAPS_API_KEY roles/secretmanager.secretAccessor serviceAccount:881755269293-compute@developer.gserviceaccount.com"
terraform import 'google_secret_manager_secret_iam_member.app_secrets_accessor["JWT_SECRET"]' \
  "projects/tabl-app-staging/secrets/JWT_SECRET roles/secretmanager.secretAccessor serviceAccount:881755269293-compute@developer.gserviceaccount.com"
terraform import 'google_secret_manager_secret_iam_member.app_secrets_accessor["MAPS_JS_API_KEY"]' \
  "projects/tabl-app-staging/secrets/MAPS_JS_API_KEY roles/secretmanager.secretAccessor serviceAccount:881755269293-compute@developer.gserviceaccount.com"

# 4. Cloud Run services (depends on secrets + Cloud SQL existing in state)
terraform import google_cloud_run_v2_service.api_gateway \
  projects/tabl-app-staging/locations/europe-west1/services/api-gateway

terraform import google_cloud_run_v2_service.ml_service \
  projects/tabl-app-staging/locations/europe-west1/services/ml-service

# 5. Cloud Build triggers
terraform import google_cloudbuild_trigger.api_gateway_deploy \
  projects/tabl-app-staging/locations/global/triggers/f62ea6e4-24f2-4612-a414-f7df9f3649c1

terraform import google_cloudbuild_trigger.ml_service_deploy \
  projects/tabl-app-staging/locations/global/triggers/5145acb2-9e48-4abf-bc81-ac850633010f
```

## After importing: verify, don't apply blindly

```bash
terraform plan
```

Expect **zero changes**, except almost certainly:
- `template[0].containers[0].image` on both Cloud Run services (see the big
  comment in `cloud_run.tf` — this is intentionally `ignore_changes`d, so it
  shouldn't show up; if it does, the `ignore_changes` block didn't take and
  needs checking).
- Possibly minor formatting diffs on the Cloud Build `build` step order or
  the exact `google_sql_database_instance` settings — Google's API sometimes
  returns fields in a different shape than what you write; adjust the `.tf`
  to match `plan`'s output rather than the other way around, since `plan` is
  reflecting the real resource.

**Do not run `terraform apply` casually.** The whole point of this exercise
is state parity with zero real changes. Only `apply` once `plan` shows
exactly what you intend to change — and for a shared staging environment,
treat any `apply` the same as a deploy: know what it's about to do first.

## Known issues surfaced during discovery (not fixed by this Terraform config)

- **`tabl-app` Artifact Registry repo is unused** — both services actually
  pull from `cloud-run-source-deploy` (Artifact Registry) and `gcr.io`
  (legacy Container Registry) respectively. Imported here for state
  visibility only; decide later whether to migrate the build triggers to use
  it, or delete it.
- **`ml-service` uses the legacy `gcr.io` registry**, while `api-gateway`
  uses modern Artifact Registry. Inconsistent, but both work; migrating
  `ml-service` to Artifact Registry is a separate task (change the Cloud
  Build trigger's image path in `cloud_build.tf` + GCP Console).
- **`DATABASE_URL` secret is pinned to version `6`, `MAPS_JS_API_KEY` to
  version `1`** — neither uses `latest`. Confirm whether that's intentional
  before rotating either secret, since adding a new version won't take
  effect until these `.tf` files (and the live services) are updated to
  point at the new version number.
- **Staging database is named `table_dev`**, not `table_staging` — a known
  deviation (project memory: gcp-tabl-app-deployment) from an earlier
  incident, reflected as-is in `cloud_sql.tf`.
