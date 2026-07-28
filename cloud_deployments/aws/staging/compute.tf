# Equivalent to cloud_run.tf in the GCP config. One key design difference:
# GCP pins the deployed image to a specific commit SHA tag, which forced
# `ignore_changes` on the image field to avoid fighting Cloud Build's
# deploys. Here, CodeBuild instead pushes a stable ":latest" tag per
# service, and App Runner's `auto_deployments_enabled = true` watches that
# exact tag and redeploys automatically on push — so the image identifier
# string in this file never changes, and no ignore_changes is needed.

resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "tabl-${var.environment}-connector"
  subnets            = aws_subnet.private[*].id
  security_groups    = [aws_security_group.apprunner_connector.id]

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

resource "aws_apprunner_service" "api_gateway" {
  service_name = "api-gateway-${var.environment}"

  source_configuration {
    auto_deployments_enabled = true

    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.api_gateway.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "8080"

        runtime_environment_variables = {
          NODE_ENV       = "production"
          ML_SERVICE_URL = aws_apprunner_service.ml_service.service_url
          CORS_ORIGINS   = "https://tabl-app-staging.web.app" # placeholder — same Firebase Hosting origin as the GCP config
        }

        runtime_environment_secrets = {
          JWT_SECRET          = aws_secretsmanager_secret.app_secrets["JWT_SECRET"].arn
          DATABASE_URL        = aws_secretsmanager_secret.app_secrets["DATABASE_URL"].arn
          GOOGLE_MAPS_API_KEY = aws_secretsmanager_secret.app_secrets["GOOGLE_MAPS_API_KEY"].arn
          MAPS_JS_API_KEY     = aws_secretsmanager_secret.app_secrets["MAPS_JS_API_KEY"].arn
        }
      }
    }
  }

  instance_configuration {
    cpu               = "1024" # 1 vCPU — matches GCP's 1000m
    memory            = "512"  # matches GCP's 512Mi
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  # Needs the VPC connector to reach RDS privately — ml-service (below)
  # doesn't touch the database, so it skips this.
  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }

  tags = {
    app         = "tabl"
    environment = var.environment
    service     = "api-gateway"
  }
}

resource "aws_apprunner_service" "ml_service" {
  service_name = "ml-service-${var.environment}"

  source_configuration {
    auto_deployments_enabled = true

    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.ml_service.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "8080"
      }
    }
  }

  instance_configuration {
    cpu               = "1024"
    memory            = "512"
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }

  tags = {
    app         = "tabl"
    environment = var.environment
    service     = "ml-service"
  }
}
