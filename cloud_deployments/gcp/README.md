# GCP — Terraform

| Directory | Environment | GCP project | Status |
| --- | --- | --- | --- |
| [`staging/`](./staging/README.md) | Staging | `tabl-app-staging` | Reverse-engineered from live state 2026-07-28, not yet imported/applied |
| `prod/` | Production | `tabl-app-prod` | Not started |

## Why "reverse-engineered"

Everything under `staging/` was infrastructure that already existed —
built by hand, step by step, through the GCP Console (see project memory:
gcp-tabl-app-deployment). These `.tf` files were written to *match* that
live state, discovered via `gcloud`, so that `terraform import` can bring
it under Terraform management with zero actual infrastructure changes.
They are not a from-scratch design.

See [`staging/README.md`](./staging/README.md) for the full import
procedure, prerequisites, and a list of infra inconsistencies discovered
along the way (unused Artifact Registry repo, mixed gcr.io/Artifact
Registry usage, pinned secret versions) that are worth fixing later but
are deliberately left as-is in this config for now.

## Prod

Not started. Once staging is confirmed importable with a clean `terraform
plan`, the same approach (describe live `tabl-app-prod` resources, write
matching `.tf`, import) should be repeated there — `tabl-app-prod` is a
fully separate GCP project per the environment-isolation decision in
project memory, so nothing here is reused directly, only used as a
template.
