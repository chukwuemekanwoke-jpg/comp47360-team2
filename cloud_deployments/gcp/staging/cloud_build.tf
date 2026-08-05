# Both triggers use the classic (1st-gen) Cloud Build GitHub App connection
# to chukwuemekanwoke-jpg/comp47360-team2 — that connection itself lives
# outside Terraform (set up once via the GCP Console / GitHub App install)
# and isn't something `terraform import` can pull in as a separate resource
# here; these trigger blocks just reference it by owner/name.

resource "google_cloudbuild_trigger" "api_gateway_deploy" {
  project     = var.project_id
  name        = "api-gateway-deploy-staging"
  description = "Build and deploy to Cloud Run service api-gateway on push to \"^develop$\""
  location    = "global"

  github {
    owner = "chukwuemekanwoke-jpg"
    name  = "comp47360-team2"
    push {
      branch = "^develop$"
    }
  }

  service_account = "projects/${var.project_id}/serviceAccounts/${data.google_project.staging.number}-compute@developer.gserviceaccount.com"

  substitutions = {
    _AR_HOSTNAME   = "${var.region}-docker.pkg.dev"
    _AR_PROJECT_ID = var.project_id
    _AR_REPOSITORY = "cloud-run-source-deploy"
    _DEPLOY_REGION = var.region
    _PLATFORM      = "managed"
    _SERVICE_NAME  = "api-gateway"
  }

  tags = [
    "gcp-cloud-build-deploy-cloud-run",
    "gcp-cloud-build-deploy-cloud-run-managed",
    "api-gateway",
  ]

  build {
    step {
      id   = "Build"
      name = "gcr.io/cloud-builders/docker"
      args = [
        "build", "--no-cache", "-t",
        "$_AR_HOSTNAME/$_AR_PROJECT_ID/$_AR_REPOSITORY/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA",
        "backend/api-gateway",
        "-f", "backend/api-gateway/Dockerfile",
      ]
    }
    step {
      id   = "Push"
      name = "gcr.io/cloud-builders/docker"
      args = ["push", "$_AR_HOSTNAME/$_AR_PROJECT_ID/$_AR_REPOSITORY/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA"]
    }
    step {
      id         = "Deploy"
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk:slim"
      entrypoint = "gcloud"
      args = [
        "run", "services", "update", "$_SERVICE_NAME",
        "--platform=managed",
        "--image=$_AR_HOSTNAME/$_AR_PROJECT_ID/$_AR_REPOSITORY/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA",
        "--labels=managed-by=gcp-cloud-build-deploy-cloud-run,commit-sha=$COMMIT_SHA,gcb-build-id=$BUILD_ID,gcb-trigger-id=$_TRIGGER_ID",
        "--region=$_DEPLOY_REGION",
        "--quiet",
      ]
    }
    images = ["$_AR_HOSTNAME/$_AR_PROJECT_ID/$_AR_REPOSITORY/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA"]
    options {
      logging             = "CLOUD_LOGGING_ONLY"
      substitution_option = "ALLOW_LOOSE"
    }
  }
}

resource "google_cloudbuild_trigger" "ml_service_deploy" {
  project     = var.project_id
  name        = "ml-service-deploy-staging"
  description = "Build and deploy to Cloud Run service ml-service on push to \"^develop$\""
  location    = "global"

  github {
    owner = "chukwuemekanwoke-jpg"
    name  = "comp47360-team2"
    push {
      branch = "^develop$"
    }
  }

  service_account = "projects/${var.project_id}/serviceAccounts/${data.google_project.staging.number}-compute@developer.gserviceaccount.com"

  tags = [
    "gcp-cloud-build-deploy-cloud-run",
    "gcp-cloud-build-deploy-cloud-run-managed",
    "ml-service",
  ]

  build {
    step {
      id   = "Build"
      name = "gcr.io/cloud-builders/docker"
      args = [
        "build", "-t",
        "gcr.io/${var.project_id}/github.com/chukwuemekanwoke-jpg/comp47360-team2:$COMMIT_SHA",
        "-f", "Dockerfile", ".",
      ]
      dir = "ml-pipeline/fastapi-app"
    }
    step {
      id   = "Push"
      name = "gcr.io/cloud-builders/docker"
      args = ["push", "gcr.io/${var.project_id}/github.com/chukwuemekanwoke-jpg/comp47360-team2:$COMMIT_SHA"]
    }
    step {
      id         = "Deploy"
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk:slim"
      entrypoint = "gcloud"
      args = [
        "run", "services", "update", "ml-service",
        "--platform=managed",
        "--image=gcr.io/${var.project_id}/github.com/chukwuemekanwoke-jpg/comp47360-team2:$COMMIT_SHA",
        "--labels=managed-by=gcp-cloud-build-deploy-cloud-run,commit-sha=$COMMIT_SHA,gcb-build-id=$BUILD_ID,gcb-trigger-id=$_TRIGGER_ID",
        "--region=europe-west1",
        "--quiet",
      ]
    }
    images = ["gcr.io/${var.project_id}/github.com/chukwuemekanwoke-jpg/comp47360-team2:$COMMIT_SHA"]
    options {
      logging             = "CLOUD_LOGGING_ONLY"
      substitution_option = "ALLOW_LOOSE"
    }
  }
}
