terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # Local state to start (matches how this project was built: click-through in
  # the GCP Console, one step at a time). Move to a GCS backend once you're
  # comfortable — a bucket in this same project is the natural next step so
  # state isn't just a file on one laptop.
  # backend "gcs" {
  #   bucket = "tabl-app-staging-tfstate"
  #   prefix = "staging"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
