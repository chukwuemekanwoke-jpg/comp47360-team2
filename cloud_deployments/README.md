# Cloud deployments

Terraform configs for TABL's cloud infrastructure, one directory per
provider:

| Provider | Status |
| --- | --- |
| [`gcp/`](./gcp/README.md) | In progress — `staging` reverse-engineered from the live `tabl-app-staging` project |
| [`aws/`](./aws/README.md) | Design exercise — `staging` written from scratch to mirror GCP's architecture, never applied to a real account |
| [`azure/`](./azure/README.md) | Design exercise — same as AWS, `staging` mirrors GCP's architecture, never applied to a real subscription |

GCP is where the app actually runs today (Cloud Run + Cloud SQL, see
[`gcp/README.md`](./gcp/README.md)) — that config is reverse-engineered
from live infrastructure, so `terraform import` there is safe (no changes).
The AWS and Azure configs are the opposite: greenfield designs that mirror
GCP's shape, where `terraform apply` would *create* new, billed
infrastructure — see [`aws/staging/README.md`](./aws/staging/README.md) and
[`azure/staging/README.md`](./azure/staging/README.md) before running
anything there.
