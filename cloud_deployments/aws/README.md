# AWS — Terraform

| Directory | Environment | Status |
| --- | --- | --- |
| [`staging/`](./staging/README.md) | Staging (design exercise) | Written 2026-07-28 as a from-scratch design mirroring GCP staging's architecture; `init`/`validate`/`fmt` clean, never `plan`'d or `apply`'d against a real account |
| `prod/` | Production | Not started |

Unlike [`../gcp/`](../gcp/README.md), nothing here is reverse-engineered
from a live deployment — TABL doesn't run on AWS today. See
[`staging/README.md`](./staging/README.md) for the architecture mapping,
what's a placeholder vs. real, and why `apply` would create real billed
infrastructure rather than just adopting existing resources.
