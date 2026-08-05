# Azure — Terraform (design exercise, mirrors GCP staging)

**Not reverse-engineered from anything real — nothing runs on Azure today.**
A from-scratch design mirroring
[`cloud_deployments/gcp/staging`](../../gcp/staging/README.md)'s
architecture (same spirit as [`cloud_deployments/aws/staging`](../../aws/staging/README.md)).
`location`, subscription references, and GitHub repo values are
placeholders — review every default in `variables.tf` before trusting it.

**`terraform apply` would CREATE real, billed Azure infrastructure** —
Container Apps Environment, PostgreSQL Flexible Server, Key Vault, ACR, a
VNet. Do not apply against a real subscription without understanding that.

## Architecture (GCP → AWS → Azure mapping)

| GCP | AWS | Azure (this config) |
| --- | --- | --- |
| Cloud Run | App Runner | **Container Apps** |
| Artifact Registry | ECR | **Azure Container Registry (ACR)** |
| Cloud SQL (Postgres) | RDS Postgres | **PostgreSQL Flexible Server**, VNet-integrated |
| Secret Manager | Secrets Manager | **Key Vault** |
| Cloud Build trigger | CodePipeline+CodeBuild+CodeStar | **GitHub Actions + OIDC** (see below — structurally different) |
| Default compute SA | Access role + instance role | User-assigned managed identity (runtime) + separate one (CI) |

## The one structural difference from GCP/AWS

Cloud Build triggers and CodePipeline are both *cloud-side* resources,
fully expressible as Terraform resources in their own provider. Azure has
no clean equivalent — Azure DevOps Pipelines would work but needs a
separate Azure DevOps org and a separate Terraform provider, for no real
benefit here. So the actual CI/CD trigger is a **GitHub Actions workflow**,
which lives in the git repo, not as Azure infrastructure:

- `identity.tf` sets up the Azure side: a user-assigned identity with a
  federated credential (OIDC — no stored Azure secret in GitHub), scoped to
  push to ACR and update the Container Apps.
- [`github-actions-workflow.yml.example`](./github-actions-workflow.yml.example)
  is the GitHub-side half — a template, **not** placed into
  `.github/workflows/` automatically. That directory drives real CI for the
  whole repo, so copying it in is a separate decision from reviewing this
  Terraform.

**Also unlike Cloud Run/App Runner:** Container Apps does not auto-redeploy
when a new image lands on an existing tag. The workflow template has to
explicitly call `az containerapp update --image ...` after each push — see
the comment at the top of `compute.tf`.

## Prerequisites

```bash
terraform -version   # need >= 1.5
az --version          # Azure CLI, for auth
az login              # or a service principal — needs real credentials for a real subscription
```

## Setup

```bash
cd cloud_deployments/azure/staging
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: real location, real db_admin_password (or use
# TF_VAR_db_admin_password instead)

terraform init
terraform validate
terraform plan
```

**Read the plan output before ever running `apply`.** This creates on the
order of 20+ resources across a resource group, VNet + 2 delegated subnets,
private DNS zone + link, ACR, Flexible Server + database, Key Vault + 4
secrets, 2 managed identities + federated credential + role assignments,
Container Apps environment + 2 apps.

## Known gaps / things a real deployment would need to revisit

- **Postgres version is a guess (`16`)** — GCP runs Postgres 18; verify
  what Flexible Server actually supports in `var.location` before applying,
  it may already support 18.
- **Instance sizing is approximate** — `GP_Standard_D2s_v3` (2 vCPU)
  targets GCP's `db-custom-2-8192`'s vCPU count, but memory/IO won't match
  exactly. Container Apps' `0.5 vCPU / 1Gi` is the closest available
  increment to GCP's `1000m`/`512Mi`, not an exact match either.
- **`github_actions_contributor` role assignment is scoped to the whole
  resource group** using the generic `Contributor` role — narrowing to a
  Container-Apps-specific built-in role would be tighter, but the exact
  role name couldn't be confirmed without `az` access to a real
  subscription from this environment.
- **No custom domain/TLS** — Container Apps' default
  `*.<region>.azurecontainerapps.io` domain is used as-is, matching how the
  GCP/AWS configs use their platforms' default domains too.
- **State is local** — same as the GCP/AWS configs; move to the
  commented-out `azurerm` backend in `providers.tf` before this is ever real.
- **`terraform init`/`validate`/`fmt` have been run; `plan`/`apply` have
  not** — no Azure subscription is configured in this environment. `plan`
  will likely surface issues `validate` can't catch (exact Postgres
  version/SKU availability in the real region, role assignment name
  correctness, etc.).
