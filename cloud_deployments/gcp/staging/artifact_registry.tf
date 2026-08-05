# Three Docker repos exist in this project. Only the first two are actually
# used by the running services — see the "tabl-app" note below.

# Auto-created by Cloud Run's "continuously deploy from repository" feature
# the first time api-gateway was deployed. This is what api-gateway's image
# actually comes from.
resource "google_artifact_registry_repository" "cloud_run_source_deploy" {
  project       = var.project_id
  location      = var.region
  repository_id = "cloud-run-source-deploy"
  format        = "DOCKER"
  description   = "Cloud Run Source Deployments"
}

# Legacy Container Registry compatibility repo (gcr.io), auto-created the
# first time ml-service was deployed via `gcr.io/<project>/...` image tags.
# This is what ml-service's image actually comes from. Google recommends not
# hand-editing these — import for visibility/state tracking, not day-to-day
# management.
resource "google_artifact_registry_repository" "gcr_io" {
  project       = var.project_id
  location      = "us"
  repository_id = "gcr.io"
  format        = "DOCKER"
}

# Created manually following this project's naming convention (see project
# memory: gcp-tabl-app-deployment), before the Cloud Run "continuously
# deploy" flow was set up. Imported here for state visibility, but note it's
# currently DEAD infrastructure — nothing builds or deploys into it; both
# services pull from the two repos above instead. Worth deciding later
# whether to migrate the Cloud Build triggers to push here, or delete it.
resource "google_artifact_registry_repository" "tabl_app" {
  project       = var.project_id
  location      = var.region
  repository_id = "tabl-app"
  format        = "DOCKER"
  description   = "Docker images for TABL app services (api-gateway, ml-service) — staging environment"
  docker_config {
    immutable_tags = false
  }
  cleanup_policy_dry_run = true
}
