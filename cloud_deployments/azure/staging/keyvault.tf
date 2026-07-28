# Equivalent to secrets.tf in the GCP/AWS configs, with one real difference:
# azurerm_key_vault_secret REQUIRES a value at creation — Azure has no
# "create the container, set the value later" mode like GCP Secret Manager
# or AWS Secrets Manager do. Using an obvious non-secret placeholder value
# plus `ignore_changes = [value]`, so Terraform creates the named secret
# (so Container Apps has something to reference) but never touches the
# real value once someone sets it via `az keyvault secret set`.

data "azurerm_client_config" "current" {}

resource "random_id" "kv_suffix" {
  byte_length = 3
}

resource "azurerm_key_vault" "main" {
  name                = "tabl-kv-${random_id.kv_suffix.hex}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  rbac_authorization_enabled = true
  purge_protection_enabled   = false # design exercise — enable for anything real, prevents accidental permanent secret loss window from being skippable

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

# Lets whoever/whatever runs `terraform apply` (a human, or later a CI
# identity) actually create the placeholder secrets below.
resource "azurerm_role_assignment" "terraform_secrets_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

locals {
  secret_names = [
    "DATABASE-URL", # Key Vault secret names can't contain underscores — hyphens only
    "GOOGLE-MAPS-API-KEY",
    "JWT-SECRET",
    "MAPS-JS-API-KEY",
  ]
}

resource "azurerm_key_vault_secret" "app_secrets" {
  for_each     = toset(local.secret_names)
  name         = each.value
  value        = "CHANGE_ME_OUT_OF_BAND"
  key_vault_id = azurerm_key_vault.main.id

  lifecycle {
    ignore_changes = [value]
  }

  depends_on = [azurerm_role_assignment.terraform_secrets_officer]
}
