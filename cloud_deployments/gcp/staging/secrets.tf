# These manage the secret *containers* and IAM only. Secret *values* (the
# actual JWT signing key, DB connection string, API keys) are never read by
# `gcloud secrets describe`/list and are NOT in this repo or state — they
# stay populated out-of-band (Console, or `gcloud secrets versions add`
# run by hand). Do not add a "secret_data"/version resource here with a
# plaintext value.

locals {
  secret_names = [
    "DATABASE_URL",
    "GOOGLE_MAPS_API_KEY",
    "JWT_SECRET",
    "MAPS_JS_API_KEY",
  ]
}

resource "google_secret_manager_secret" "app_secrets" {
  for_each  = toset(local.secret_names)
  project   = var.project_id
  secret_id = each.value

  replication {
    auto {}
  }
}

# Both Cloud Run services run as the default compute service account, which
# needs secretAccessor on each secret to inject it as an env var.
resource "google_secret_manager_secret_iam_member" "app_secrets_accessor" {
  for_each  = google_secret_manager_secret.app_secrets
  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.staging.number}-compute@developer.gserviceaccount.com"
}

data "google_project" "staging" {
  project_id = var.project_id
}
