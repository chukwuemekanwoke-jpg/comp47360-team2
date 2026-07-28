# DESIGN EXERCISE — same status as cloud_deployments/aws/staging: nothing
# runs on Azure today, every default below is a placeholder. `terraform
# apply` would CREATE real, billed infrastructure (Container Apps env,
# PostgreSQL Flexible Server, Key Vault, ACR, VNet). Review before applying.

variable "location" {
  description = "Azure region"
  type        = string
  default     = "westeurope" # placeholder — closest Azure region to GCP's europe-west1 / AWS's eu-west-1
}

variable "environment" {
  description = "Environment name, used in resource naming/tags"
  type        = string
  default     = "staging"
}

variable "github_owner" {
  description = "GitHub org/user that owns the repo"
  type        = string
  default     = "chukwuemekanwoke-jpg"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "comp47360-team2"
}

variable "github_branch" {
  description = "Branch that triggers deploys — matches the GCP/AWS configs (develop)"
  type        = string
  default     = "develop"
}

variable "db_admin_password" {
  description = "Admin password for the PostgreSQL Flexible Server. Never commit a real value — set via TF_VAR_db_admin_password or a gitignored terraform.tfvars."
  type        = string
  sensitive   = true
}

variable "db_admin_username" {
  description = "Admin username for the PostgreSQL Flexible Server"
  type        = string
  default     = "tabl_app"
}

variable "db_name" {
  description = "Database name created on the Flexible Server"
  type        = string
  default     = "tabl_app"
}

variable "vnet_cidr" {
  description = "CIDR block for the new VNet"
  type        = string
  default     = "10.30.0.0/16"
}
