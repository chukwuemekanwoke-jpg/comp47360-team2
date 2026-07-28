# DESIGN EXERCISE — every default below is a placeholder, not a real
# account/region decision. This mirrors cloud_deployments/gcp/staging in
# structure, but unlike that config (imported from a live environment),
# nothing here exists yet: `terraform apply` would CREATE real, billed AWS
# infrastructure. Do not apply without replacing these with real values and
# understanding the cost (App Runner + RDS + NAT/VPC endpoints are not free).

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1" # placeholder — pick based on where users actually are; europe-west1 (GCP) ~ eu-west-1/eu-west-2 (AWS)
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
  description = "Branch that triggers deploys — matches the GCP Cloud Build triggers (^develop$)"
  type        = string
  default     = "develop"
}

variable "db_password" {
  description = "Password for the app RDS user. Never commit a real value — set via TF_VAR_db_password or a gitignored terraform.tfvars. Must satisfy RDS password rules (no '/', '@', '\"', or spaces)."
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Initial database name created on the RDS instance"
  type        = string
  default     = "tabl_app"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "tabl_app"
}

variable "vpc_cidr" {
  description = "CIDR block for the new VPC (App Runner VPC Connector + RDS live here)"
  type        = string
  default     = "10.20.0.0/16"
}
