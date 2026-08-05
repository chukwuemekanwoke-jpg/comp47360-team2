resource "azurerm_resource_group" "main" {
  name     = "tabl-${var.environment}-rg"
  location = var.location

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

resource "azurerm_virtual_network" "main" {
  name                = "tabl-${var.environment}-vnet"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  address_space       = [var.vnet_cidr]

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

# Delegated subnet for the Container Apps Environment's internal infra —
# equivalent role to the App Runner VPC Connector's subnets in the AWS
# config, but here it's the compute platform itself that's VNet-joined.
resource "azurerm_subnet" "container_apps" {
  name                 = "container-apps"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_cidr, 4, 0)]

  delegation {
    name = "container-apps-delegation"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Delegated subnet for PostgreSQL Flexible Server VNet integration —
# equivalent to the RDS DB subnet group in the AWS config.
resource "azurerm_subnet" "postgres" {
  name                 = "postgres"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_cidr, 4, 1)]

  delegation {
    name = "postgres-delegation"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Azure requires a private DNS zone for VNet-integrated ("private access
# mode") PostgreSQL Flexible Server — no equivalent step on GCP/AWS, where
# the DB subnet group alone was enough.
resource "azurerm_private_dns_zone" "postgres" {
  name                = "tabl-${var.environment}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "tabl-${var.environment}-postgres-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.main.id
}
