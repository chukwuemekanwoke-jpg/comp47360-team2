# Equivalent to the two Cloud Build triggers in the GCP config. Build steps
# are inline (via CodeBuild's `buildspec` argument) rather than a
# buildspec.yml file in the app repo, mirroring how the GCP triggers keep
# their build steps inline in the trigger resource too — nothing in the app
# repo itself needs to change for either cloud's CI/CD to work.

# --- One-time manual step, cannot be fully automated by Terraform ---------
# `aws_codestarconnections_connection` is created in PENDING status.
# Terraform cannot complete the GitHub OAuth handshake — after `apply`, go to
# CodePipeline > Settings > Connections in the AWS Console and click
# "Update pending connection" once. Equivalent to installing the Cloud
# Build GitHub App the first time on the GCP side.
resource "aws_codestarconnections_connection" "github" {
  name          = "tabl-${var.environment}-github"
  provider_type = "GitHub"
}

resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket = "tabl-${var.environment}-pipeline-artifacts-${data.aws_caller_identity.current.account_id}"

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "pipeline_artifacts" {
  bucket                  = aws_s3_bucket.pipeline_artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------------------------------------------------------------------------
# api-gateway build + pipeline
# ---------------------------------------------------------------------------

resource "aws_codebuild_project" "api_gateway" {
  name         = "tabl-${var.environment}-api-gateway-build"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true # required to run `docker build` inside CodeBuild

    environment_variable {
      name  = "ECR_REPO_URL"
      value = aws_ecr_repository.api_gateway.repository_url
    }
    environment_variable {
      name  = "AWS_REGION"
      value = var.region
    }
  }

  source {
    type = "CODEPIPELINE"
    buildspec = yamlencode({
      version = "0.2"
      phases = {
        pre_build = {
          commands = [
            "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO_URL",
          ]
        }
        build = {
          commands = [
            # Same Dockerfile + build context as the GCP trigger's Build step
            "docker build --no-cache -t $ECR_REPO_URL:latest -f backend/api-gateway/Dockerfile backend/api-gateway",
          ]
        }
        post_build = {
          commands = [
            "docker push $ECR_REPO_URL:latest",
          ]
        }
      }
    })
  }

  tags = {
    app         = "tabl"
    environment = var.environment
    service     = "api-gateway"
  }
}

resource "aws_codepipeline" "api_gateway" {
  name     = "tabl-${var.environment}-api-gateway-deploy"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]
      configuration = {
        ConnectionArn    = aws_codestarconnections_connection.github.arn
        FullRepositoryId = "${var.github_owner}/${var.github_repo}"
        BranchName       = var.github_branch
      }
    }
  }

  stage {
    name = "Build"
    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      configuration = {
        ProjectName = aws_codebuild_project.api_gateway.name
      }
    }
  }
}

# ---------------------------------------------------------------------------
# ml-service build + pipeline
# ---------------------------------------------------------------------------

resource "aws_codebuild_project" "ml_service" {
  name         = "tabl-${var.environment}-ml-service-build"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable {
      name  = "ECR_REPO_URL"
      value = aws_ecr_repository.ml_service.repository_url
    }
    environment_variable {
      name  = "AWS_REGION"
      value = var.region
    }
  }

  source {
    type = "CODEPIPELINE"
    buildspec = yamlencode({
      version = "0.2"
      phases = {
        pre_build = {
          commands = [
            "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO_URL",
          ]
        }
        build = {
          commands = [
            # Same Dockerfile + build context as the GCP trigger's Build step
            "docker build -t $ECR_REPO_URL:latest -f ml-pipeline/fastapi-app/Dockerfile ml-pipeline/fastapi-app",
          ]
        }
        post_build = {
          commands = [
            "docker push $ECR_REPO_URL:latest",
          ]
        }
      }
    })
  }

  tags = {
    app         = "tabl"
    environment = var.environment
    service     = "ml-service"
  }
}

resource "aws_codepipeline" "ml_service" {
  name     = "tabl-${var.environment}-ml-service-deploy"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]
      configuration = {
        ConnectionArn    = aws_codestarconnections_connection.github.arn
        FullRepositoryId = "${var.github_owner}/${var.github_repo}"
        BranchName       = var.github_branch
      }
    }
  }

  stage {
    name = "Build"
    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      configuration = {
        ProjectName = aws_codebuild_project.ml_service.name
      }
    }
  }
}
