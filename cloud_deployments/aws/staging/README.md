# AWS — Terraform (design exercise, mirrors GCP staging)

**Author:** Chukwuemeka Nwoke — Integration Lead / Scrum Master

**This is not reverse-engineered from anything real — nothing runs on AWS
today.** These files are a from-scratch design that mirrors
[`cloud_deployments/gcp/staging`](../../gcp/staging/README.md)'s
architecture, written as a design exercise (per explicit scoping — not
wired to a real AWS account yet). `region`, account references, and the
GitHub repo values are placeholders where noted; treat every default in
`variables.tf` as something to review, not something to trust blindly.

**Unlike the GCP config, there is no `terraform import` step here.**
`terraform apply` would *create* real AWS infrastructure — App Runner
services, an RDS instance, a VPC, CodePipeline/CodeBuild/S3, ECR repos —
all of which cost money the moment they exist, RDS and the App Runner VPC
connector especially. Do not `apply` this against a real AWS account
without understanding that.

## Architecture (GCP → AWS mapping)

| GCP (existing) | AWS (this config) |
| --- | --- |
| Cloud Run (`api-gateway`, `ml-service`) | App Runner |
| Artifact Registry / `gcr.io` | ECR (one repo per service) |
| Cloud SQL (Postgres) | RDS for PostgreSQL, in a dedicated VPC |
| Secret Manager | Secrets Manager |
| Cloud Build trigger (GitHub push) | CodePipeline + CodeBuild + CodeStar Connection |
| Default compute service account | App Runner access role (ECR pull) + instance role (Secrets Manager read) |

Key design difference worth understanding: GCP's Cloud Build trigger
deploys by pinning the image to a specific commit-SHA tag, which meant
`cloud_run.tf` needed `lifecycle { ignore_changes = [image] }` to avoid
Terraform fighting every CI deploy. Here, CodeBuild instead pushes a stable
`:latest` tag, and App Runner's `auto_deployments_enabled = true` watches
that tag and redeploys automatically — so the image identifier in
`compute.tf` never changes, and no `ignore_changes` is needed for it.

## Prerequisites

```bash
terraform -version   # need >= 1.5
aws --version         # AWS CLI, for auth
aws configure         # or `aws sso login` — needs real credentials for a real account
```

## Setup

```bash
cd cloud_deployments/aws/staging
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: real region, real db_password (or use
# TF_VAR_db_password instead — see variables.tf)

terraform init
terraform validate
terraform plan
```

**Read the plan output carefully before ever running `apply`.** Count the
resources it says it will create — this config creates on the order of 25+
resources (VPC, subnets, security groups, RDS, 2× ECR repos + lifecycle
policies, 4× Secrets Manager secrets, 4× IAM roles + policies, VPC
connector, 2× App Runner services, CodeStar connection, S3 bucket +
versioning + public access block, 2× CodeBuild projects, 2× CodePipelines).

## One manual step Terraform can't do

`aws_codestarconnections_connection.github` is created in `PENDING` status
— Terraform cannot complete the GitHub OAuth handshake. After `apply`:

1. AWS Console → **CodePipeline → Settings → Connections**
2. Find `tabl-staging-github`, click **Update pending connection**
3. Authorize the GitHub App for `chukwuemekanwoke-jpg/comp47360-team2`

Equivalent to the one-time Cloud Build GitHub App install on the GCP side —
both clouds need a manual human-in-the-loop step here, Terraform can't
avoid it.

## Known gaps / things a real deployment would need to revisit

- **Instance sizing is a guess.** `db.t3.medium` and App Runner's
  `1024`/`512` (1 vCPU/512MB) approximate GCP's `db-custom-2-8192` and
  Cloud Run's `1000m`/`512Mi`, but AWS's size increments don't map exactly
  — benchmark before trusting these for real traffic.
- **No custom domain / TLS setup** — App Runner's default `*.awsapprunner.com`
  domain is used as-is, matching how Cloud Run's default `*.run.app` domain
  is used in the GCP config.
- **No monitoring/alerting resources** — the GCP side doesn't have any
  either at this point, so this mirrors that gap rather than fixing it.
- **State is local** — same as GCP's config for now; move to the commented-out
  S3 backend in `providers.tf` before this is ever real.
- **Terraform has been `init`/`validate`/`fmt`-checked, but never `plan`'d or
  `apply`'d against a real AWS account** — plan will very likely surface
  issues that only show up against a real account (IAM permission gaps,
  region-specific AZ availability, etc.) that `validate` can't catch.
