variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "tabl-app-staging"
}

variable "region" {
  description = "GCP region for regional resources"
  type        = string
  default     = "europe-west1"
}

variable "tabl_app_db_password" {
  description = "Password for the tabl_app Cloud SQL user. Not importable via gcloud (Cloud SQL never exposes it) — set it via TF_VAR_tabl_app_db_password or a tfvars file that is never committed. See project memory: must be alphanumeric only, no symbols (pg-connection-string breaks on unencoded special characters in the postgresql:// URL)."
  type        = string
  sensitive   = true
}
