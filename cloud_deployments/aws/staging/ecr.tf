# One repo per service — equivalent to the GCP Artifact Registry repos.
# CodeBuild pushes to these; App Runner pulls from them (see compute.tf).

resource "aws_ecr_repository" "api_gateway" {
  name                 = "tabl/api-gateway"
  image_tag_mutability = "MUTABLE" # CodeBuild pushes a stable ":latest" tag each build — see cicd.tf note

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    app         = "tabl"
    environment = var.environment
    service     = "api-gateway"
  }
}

resource "aws_ecr_repository" "ml_service" {
  name                 = "tabl/ml-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    app         = "tabl"
    environment = var.environment
    service     = "ml-service"
  }
}

# Keep only the most recent 10 images per repo — avoids unbounded storage
# cost growth from every CI build.
locals {
  ecr_keep_last_10_policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "api_gateway" {
  repository = aws_ecr_repository.api_gateway.name
  policy     = local.ecr_keep_last_10_policy
}

resource "aws_ecr_lifecycle_policy" "ml_service" {
  repository = aws_ecr_repository.ml_service.name
  policy     = local.ecr_keep_last_10_policy
}
