data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------
# App Runner: two roles, same split as Cloud Run's single default compute SA
# actually plays two conceptual roles there. AWS separates them explicitly:
#   - access role  → used by the App Runner *service* to pull from ECR
#   - instance role → used by the *running container* to call other AWS APIs
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "apprunner_build_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_ecr_access" {
  name               = "tabl-${var.environment}-apprunner-ecr-access"
  assume_role_policy = data.aws_iam_policy_document.apprunner_build_trust.json
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_access" {
  role       = aws_iam_role.apprunner_ecr_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

data "aws_iam_policy_document" "apprunner_instance_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["tasks.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_instance" {
  name               = "tabl-${var.environment}-apprunner-instance"
  assume_role_policy = data.aws_iam_policy_document.apprunner_instance_trust.json
}

data "aws_iam_policy_document" "apprunner_secrets_read" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [for s in aws_secretsmanager_secret.app_secrets : s.arn]
  }
}

resource "aws_iam_role_policy" "apprunner_secrets_read" {
  name   = "secrets-read"
  role   = aws_iam_role.apprunner_instance.id
  policy = data.aws_iam_policy_document.apprunner_secrets_read.json
}

# ---------------------------------------------------------------------------
# CodeBuild: builds the Docker image and pushes to ECR (equivalent to the
# "Build"/"Push" steps in the GCP Cloud Build trigger's inline build.steps).
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "codebuild_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "codebuild" {
  name               = "tabl-${var.environment}-codebuild"
  assume_role_policy = data.aws_iam_policy_document.codebuild_trust.json
}

data "aws_iam_policy_document" "codebuild_permissions" {
  statement {
    sid = "Logs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["*"]
  }
  statement {
    sid = "EcrAuth"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }
  statement {
    sid = "EcrPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = [
      aws_ecr_repository.api_gateway.arn,
      aws_ecr_repository.ml_service.arn,
    ]
  }
  statement {
    sid = "ArtifactBucket"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:GetBucketLocation",
    ]
    resources = [
      aws_s3_bucket.pipeline_artifacts.arn,
      "${aws_s3_bucket.pipeline_artifacts.arn}/*",
    ]
  }
}

resource "aws_iam_role_policy" "codebuild_permissions" {
  name   = "codebuild-permissions"
  role   = aws_iam_role.codebuild.id
  policy = data.aws_iam_policy_document.codebuild_permissions.json
}

# ---------------------------------------------------------------------------
# CodePipeline: orchestrates source (GitHub via CodeStar connection) → build
# (CodeBuild above). Equivalent to the trigger + pipeline wrapper around the
# GCP Cloud Build trigger's `github { push { branch } }` block.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "codepipeline_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codepipeline.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "codepipeline" {
  name               = "tabl-${var.environment}-codepipeline"
  assume_role_policy = data.aws_iam_policy_document.codepipeline_trust.json
}

data "aws_iam_policy_document" "codepipeline_permissions" {
  statement {
    sid = "ArtifactBucket"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:GetBucketVersioning",
    ]
    resources = [
      aws_s3_bucket.pipeline_artifacts.arn,
      "${aws_s3_bucket.pipeline_artifacts.arn}/*",
    ]
  }
  statement {
    sid       = "CodeStarConnection"
    actions   = ["codestar-connections:UseConnection"]
    resources = [aws_codestarconnections_connection.github.arn]
  }
  statement {
    sid = "CodeBuild"
    actions = [
      "codebuild:BatchGetBuilds",
      "codebuild:StartBuild",
    ]
    resources = [
      aws_codebuild_project.api_gateway.arn,
      aws_codebuild_project.ml_service.arn,
    ]
  }
}

resource "aws_iam_role_policy" "codepipeline_permissions" {
  name   = "codepipeline-permissions"
  role   = aws_iam_role.codepipeline.id
  policy = data.aws_iam_policy_document.codepipeline_permissions.json
}
