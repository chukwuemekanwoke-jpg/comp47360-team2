# Two managed identities, splitting the same two conceptual roles as the
# AWS config's access role / instance role:
#   - container_apps  → runtime identity: pulls from ACR, reads Key Vault
#   - github_actions   → CI identity: pushes to ACR, updates the Container Apps

resource "azurerm_user_assigned_identity" "container_apps" {
  name                = "tabl-${var.environment}-container-apps-identity"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

resource "azurerm_role_assignment" "container_apps_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.container_apps.principal_id
}

resource "azurerm_role_assignment" "container_apps_kv_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.container_apps.principal_id
}

# ---------------------------------------------------------------------------
# GitHub Actions OIDC — federated identity, no stored Azure client secret in
# GitHub. See github-actions-workflow.yml.example for the workflow that
# assumes this identity.
# ---------------------------------------------------------------------------

resource "azurerm_user_assigned_identity" "github_actions" {
  name                = "tabl-${var.environment}-github-actions-identity"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

resource "azurerm_federated_identity_credential" "github_actions" {
  name                = "github-${var.github_owner}-${var.github_repo}-${var.github_branch}"
  resource_group_name = azurerm_resource_group.main.name
  parent_id           = azurerm_user_assigned_identity.github_actions.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  subject             = "repo:${var.github_owner}/${var.github_repo}:ref:refs/heads/${var.github_branch}"
}

resource "azurerm_role_assignment" "github_actions_acr_push" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPush"
  principal_id         = azurerm_user_assigned_identity.github_actions.principal_id
}

# Broad but simple — scopes to the whole resource group so the workflow can
# call `az containerapp update`. Worth narrowing to a Container-Apps-specific
# built-in role once verified against the real subscription (couldn't
# confirm the exact role name without `az` access from this environment).
resource "azurerm_role_assignment" "github_actions_contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.github_actions.principal_id
}
