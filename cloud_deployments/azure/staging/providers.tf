terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Local state to start, matching the GCP/AWS configs. Move to an Azure
  # Storage backend before this is ever real.
  # backend "azurerm" {
  #   resource_group_name  = "tabl-tfstate-rg"
  #   storage_account_name = "tabltfstate"
  #   container_name       = "tfstate"
  #   key                  = "azure/staging/terraform.tfstate"
  # }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
  }
}
