# Equivalent to cloud_run.tf / compute.tf in the GCP/AWS configs.
#
# Behavioral difference worth knowing: Cloud Run and App Runner both watch
# a tag and auto-redeploy when it changes. Container Apps has no
# equivalent — pushing a new image to the same ACR tag does NOT
# automatically create a new revision. The GitHub Actions workflow
# (github-actions-workflow.yml.example) has to explicitly run
# `az containerapp update --image ...` after each push. Because of that,
# the `image` field here will drift from whatever's actually deployed after
# the first real deploy — same reasoning as GCP's ignore_changes on image,
# applied here for the same practical reason (Terraform shouldn't fight the
# CI-driven deploys).

resource "azurerm_container_app_environment" "main" {
  name                     = "tabl-${var.environment}-env"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  infrastructure_subnet_id = azurerm_subnet.container_apps.id

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

resource "azurerm_container_app" "api_gateway" {
  name                         = "api-gateway-${var.environment}"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_apps.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.container_apps.id
  }

  secret {
    name                = "jwt-secret"
    key_vault_secret_id = azurerm_key_vault_secret.app_secrets["JWT-SECRET"].versionless_id
    identity            = azurerm_user_assigned_identity.container_apps.id
  }
  secret {
    name                = "database-url"
    key_vault_secret_id = azurerm_key_vault_secret.app_secrets["DATABASE-URL"].versionless_id
    identity            = azurerm_user_assigned_identity.container_apps.id
  }
  secret {
    name                = "google-maps-api-key"
    key_vault_secret_id = azurerm_key_vault_secret.app_secrets["GOOGLE-MAPS-API-KEY"].versionless_id
    identity            = azurerm_user_assigned_identity.container_apps.id
  }
  secret {
    name                = "maps-js-api-key"
    key_vault_secret_id = azurerm_key_vault_secret.app_secrets["MAPS-JS-API-KEY"].versionless_id
    identity            = azurerm_user_assigned_identity.container_apps.id
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 0 # scale-to-zero, matching Cloud Run/App Runner's consumption model
    max_replicas = 5

    container {
      name   = "api-gateway"
      image  = "${azurerm_container_registry.main.login_server}/api-gateway:latest"
      cpu    = 0.5   # closest Container Apps increment to GCP's 1000m / AWS's 1024 (1 vCPU) at the free/consumption tier
      memory = "1Gi" # 0.5 vCPU requires >= 1Gi in Container Apps' allowed combinations

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "ML_SERVICE_URL"
        value = "https://${azurerm_container_app.ml_service.ingress[0].fqdn}"
      }
      env {
        name  = "CORS_ORIGINS"
        value = "https://tabl-app-staging.web.app" # placeholder — same Firebase Hosting origin as the GCP/AWS configs
      }
      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }
      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
      env {
        name        = "GOOGLE_MAPS_API_KEY"
        secret_name = "google-maps-api-key"
      }
      env {
        name        = "MAPS_JS_API_KEY"
        secret_name = "maps-js-api-key"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 8080
        path      = "/health"
      }
      readiness_probe {
        transport = "HTTP"
        port      = 8080
        path      = "/health"
      }
    }
  }

  tags = {
    app         = "tabl"
    environment = var.environment
    service     = "api-gateway"
  }

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}

resource "azurerm_container_app" "ml_service" {
  name                         = "ml-service-${var.environment}"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_apps.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.container_apps.id
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 0
    max_replicas = 5

    container {
      name   = "ml-service"
      image  = "${azurerm_container_registry.main.login_server}/ml-service:latest"
      cpu    = 0.5
      memory = "1Gi"

      liveness_probe {
        transport = "HTTP"
        port      = 8080
        path      = "/health"
      }
      readiness_probe {
        transport = "HTTP"
        port      = 8080
        path      = "/health"
      }
    }
  }

  tags = {
    app         = "tabl"
    environment = var.environment
    service     = "ml-service"
  }

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}
