resource "google_sql_database_instance" "tabl_db_staging" {
  project             = var.project_id
  name                = "tabl-db-staging"
  region              = var.region
  database_version    = "POSTGRES_18"
  deletion_protection = true

  settings {
    tier              = "db-custom-2-8192"
    edition           = "ENTERPRISE"
    availability_type = "ZONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    location_preference {
      zone = "europe-west1-b"
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "17:00"
      location                       = "eu"
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    maintenance_window {
      day          = 0 # Sunday
      hour         = 0
      update_track = "canary"
    }

    ip_configuration {
      ipv4_enabled    = true
      ssl_mode        = "ENCRYPTED_ONLY"
      require_ssl     = false
    }

    password_validation_policy {
      enable_password_policy     = true
      min_length                 = 8
      complexity                 = "COMPLEXITY_DEFAULT"
      disallow_username_substring = true
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    user_labels = {
      app = "tabl"
      env = "staging"
    }
  }
}

# NOTE: naming deviation (see project memory: gcp-tabl-app-deployment) — the
# convention was `table_<env>`, but `table_staging` was deleted during
# troubleshooting on 2026-07-09. The staging api-gateway now points at a
# database literally named `table_dev`. Reflected as-is here; don't
# "correct" this name without also updating the DATABASE_URL secret and
# every service that reads it.
resource "google_sql_database" "table_dev" {
  project  = var.project_id
  name     = "table_dev"
  instance = google_sql_database_instance.tabl_db_staging.name
}

resource "google_sql_user" "tabl_app" {
  project  = var.project_id
  name     = "tabl_app"
  instance = google_sql_database_instance.tabl_db_staging.name
  password = var.tabl_app_db_password

  lifecycle {
    # The live password is already set and unknown to Terraform/gcloud (Cloud
    # SQL never exposes it). Prevent `terraform apply` from resetting it to
    # whatever var.tabl_app_db_password happens to be at import time.
    ignore_changes = [password]
  }
}
