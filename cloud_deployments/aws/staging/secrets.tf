# Same rule as secrets.tf in the GCP config: these manage the secret
# *containers* only. Values are never set here and never touch this repo or
# Terraform state — populate them out-of-band via the Console or
# `aws secretsmanager put-secret-value`, run by hand.

locals {
  secret_names = [
    "DATABASE_URL",
    "GOOGLE_MAPS_API_KEY",
    "JWT_SECRET",
    "MAPS_JS_API_KEY",
  ]
}

resource "aws_secretsmanager_secret" "app_secrets" {
  for_each = toset(local.secret_names)
  name     = "tabl/${var.environment}/${each.value}"

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}
