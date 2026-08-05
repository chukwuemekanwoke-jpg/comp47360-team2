# Equivalent to google_sql_database_instance / aws_db_instance in the other
# two configs. GP_Standard_D2s_v3 (General Purpose, 2 vCPU) is the closest
# match to GCP's db-custom-2-8192 — same vCPU count, though the exact
# memory/IO profile won't line up precisely across all three clouds.
#
# Version note: GCP's config uses Postgres 18. Flexible Server's supported
# version list moves independently of GCP/AWS's — check
# `az postgres flexible-server list-skus` (or the Azure docs) for what's
# actually available in `var.location` before applying; 16 below is a
# placeholder in case 18 isn't offered yet on Azure.

resource "azurerm_postgresql_flexible_server" "main" {
  name                = "tabl-db-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  version  = "16" # placeholder — verify against Azure's currently supported versions, may already support 18
  sku_name = "GP_Standard_D2s_v3"

  storage_mb            = 32768
  backup_retention_days = 7

  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password

  delegated_subnet_id = azurerm_subnet.postgres.id
  private_dns_zone_id = azurerm_private_dns_zone.postgres.id

  tags = {
    app         = "tabl"
    environment = var.environment
  }

  lifecycle {
    # Same reasoning as the GCP/AWS configs — the real password gets
    # rotated out-of-band; don't let `apply` silently reset it.
    ignore_changes = [administrator_password]
  }

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
