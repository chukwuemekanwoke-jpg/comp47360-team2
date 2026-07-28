# Both services are deployed by Cloud Run's native "continuously deploy from
# repository" feature (Cloud Build trigger on push to `develop` — see
# cloud_build.tf), which calls `gcloud run services update --image=...` on
# every push. That means `image`, deploy-tracking labels, and the
# `client`/`client_version` fields change on every single deploy — if
# Terraform tried to manage those, every `plan` after a push would show a
# diff wanting to roll the image back to whatever's in this file. The
# `ignore_changes` blocks below are load-bearing, not optional cleanup: they
# let Terraform own the *shape* of each service (resources, scaling, secrets,
# DB attachment) while Cloud Build keeps owning *what's currently deployed*.

resource "google_cloud_run_v2_service" "api_gateway" {
  name     = "api-gateway"
  project  = var.project_id
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account                  = "${data.google_project.staging.number}-compute@developer.gserviceaccount.com"
    timeout                          = "300s"
    max_instance_request_concurrency = 80

    scaling {
      max_instance_count = 20
    }

    containers {
      # Placeholder — real value tracks whatever Cloud Build last pushed.
      # `terraform import` will pick up the current tag; ignore_changes below
      # keeps it from mattering after that.
      image = "europe-west1-docker.pkg.dev/${var.project_id}/cloud-run-source-deploy/comp47360-team2/api-gateway:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
        startup_cpu_boost = true
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "ML_SERVICE_URL"
        value = "https://ml-service-pkzkrctrya-ew.a.run.app"
      }
      env {
        name  = "CORS_ORIGINS"
        value = "https://tabl-app-staging.web.app"
      }
      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.app_secrets["JWT_SECRET"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret = google_secret_manager_secret.app_secrets["DATABASE_URL"].secret_id
            # Pinned to version 6, NOT "latest" — discovered as-is via
            # `gcloud run services describe`. Worth checking whether that's
            # intentional (e.g. avoiding an untested newer version) or just
            # never got bumped after a rotation.
            version = "6"
          }
        }
      }
      env {
        name = "GOOGLE_MAPS_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.app_secrets["GOOGLE_MAPS_API_KEY"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "MAPS_JS_API_KEY"
        value_source {
          secret_key_ref {
            secret = google_secret_manager_secret.app_secrets["MAPS_JS_API_KEY"].secret_id
            # Also pinned, to version 1 — same note as DATABASE_URL above.
            version = "1"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 1
        period_seconds         = 10
        failure_threshold      = 3
        timeout_seconds        = 1
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.tabl_db_staging.connection_name]
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].labels,
      client,
      client_version,
    ]
  }

  depends_on = [google_secret_manager_secret_iam_member.app_secrets_accessor]
}

resource "google_cloud_run_v2_service" "ml_service" {
  name     = "ml-service"
  project  = var.project_id
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account                  = "${data.google_project.staging.number}-compute@developer.gserviceaccount.com"
    timeout                          = "300s"
    max_instance_request_concurrency = 80

    scaling {
      max_instance_count = 20
    }

    containers {
      # Placeholder — see note on api-gateway above. ml-service pulls from
      # the legacy gcr.io repo, not Artifact Registry, unlike api-gateway.
      image = "gcr.io/${var.project_id}/github.com/chukwuemekanwoke-jpg/comp47360-team2:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
        startup_cpu_boost = true
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        period_seconds    = 10
        failure_threshold = 3
        timeout_seconds   = 1
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 1
        period_seconds         = 10
        failure_threshold      = 3
        timeout_seconds        = 4
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].labels,
      client,
      client_version,
    ]
  }
}
