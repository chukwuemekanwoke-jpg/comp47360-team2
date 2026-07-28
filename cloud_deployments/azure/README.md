# Azure — Terraform

| Directory | Environment | Status |
| --- | --- | --- |
| [`staging/`](./staging/README.md) | Staging (design exercise) | Written 2026-07-28 as a from-scratch design mirroring GCP staging's architecture; `init`/`validate`/`fmt` clean, never `plan`'d or `apply`'d against a real subscription |
| `prod/` | Production | Not started |

Same status as [`../aws/`](../aws/README.md) — nothing here is
reverse-engineered from a live deployment, since TABL doesn't run on Azure
today. See [`staging/README.md`](./staging/README.md) for the architecture
mapping, the one real structural difference from GCP/AWS (CI/CD trigger is
a GitHub Actions workflow file, not an Azure resource), and why `apply`
would create real billed infrastructure.
