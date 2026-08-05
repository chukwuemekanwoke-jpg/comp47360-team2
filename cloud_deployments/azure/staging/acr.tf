# ACR names must be globally unique across all of Azure, alphanumeric only
# (no hyphens/underscores) — unlike GCP Artifact Registry / AWS ECR, whose
# names only need to be unique within the project/account. The random
# suffix avoids a name collision with someone else's registry.

resource "random_id" "acr_suffix" {
  byte_length = 3
}

resource "azurerm_container_registry" "main" {
  name                = "tablacr${var.environment}${random_id.acr_suffix.hex}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false # push/pull via managed identity role assignments instead, see identity.tf

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}
