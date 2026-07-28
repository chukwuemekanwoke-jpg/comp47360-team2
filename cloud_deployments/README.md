# Cloud deployments

Terraform configs for TABL's cloud infrastructure, one directory per
provider:

| Provider | Status |
| --- | --- |
| [`gcp/`](./gcp/README.md) | In progress — `staging` reverse-engineered from the live `tabl-app-staging` project |
| [`azure/`](./azure/README.md) | Not started |
| [`aws/`](./aws/README.md) | Not started |

GCP is where the app actually runs today (Cloud Run + Cloud SQL, see
[`gcp/README.md`](./gcp/README.md)). Azure and AWS directories exist as
placeholders for future multi-cloud work — nothing runs there yet.
