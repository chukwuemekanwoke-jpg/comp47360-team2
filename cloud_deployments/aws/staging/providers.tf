terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state to start, matching the GCP config's approach. Move to an S3 +
  # DynamoDB backend before this is ever used for real — local state for a
  # shared environment is a footgun waiting to happen.
  # backend "s3" {
  #   bucket         = "tabl-app-staging-tfstate"
  #   key            = "aws/staging/terraform.tfstate"
  #   region         = "eu-west-1"
  #   dynamodb_table = "tabl-app-tfstate-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.region
}
