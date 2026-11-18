mock_provider "azurerm" {
  mock_data "azurerm_client_config" {
    defaults = {
      subscription_id = "00000000-0000-0000-0000-000000000000"
      tenant_id       = "00000000-0000-0000-0000-000000000000"
    }
  }
  mock_resource "azurerm_resource_group" {
    defaults = {
      id       = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab"
      location = "centralus"
    }
  }
  mock_resource "azurerm_virtual_network" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab/providers/Microsoft.Network/virtualNetworks/azl23h2-vnet"
    }
  }
  mock_resource "azurerm_subnet" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab/providers/Microsoft.Network/virtualNetworks/azl23h2-vnet/subnets/snet-host"
    }
  }
  mock_resource "azurerm_network_security_group" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab/providers/Microsoft.Network/networkSecurityGroups/azl23h2-nsg"
    }
  }
  mock_resource "azurerm_public_ip" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab/providers/Microsoft.Network/publicIPAddresses/azl23h2-nat-pip"
    }
  }
  mock_resource "azurerm_nat_gateway" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab/providers/Microsoft.Network/natGateways/azl23h2-natgw"
    }
  }
  mock_resource "azurerm_network_interface" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab/providers/Microsoft.Network/networkInterfaces/azl23h2-host01-nic"
    }
  }
  mock_resource "azurerm_managed_disk" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab/providers/Microsoft.Compute/disks/azl23h2-host01-data-0"
    }
  }
  mock_resource "azurerm_windows_virtual_machine" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab/providers/Microsoft.Compute/virtualMachines/azl23h2-host01"
    }
  }
}

mock_provider "azapi" {
  mock_resource "azapi_resource" {
    defaults = {
      id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-azl23h2-azl-lab/providers/Microsoft.AzureStackHCI/logicalNetworks/azl23h2-lnet"
    }
  }
}

mock_provider "random" {
  mock_resource "random_password" {
    defaults = {
      result = "Mock-Only-Password-123!"
    }
  }
}

mock_provider "time" {
  mock_resource "time_static" {
    defaults = {
      rfc3339 = "2026-11-17T12:00:00Z"
    }
  }
}

run "stage1_provisions_host_with_spend_guards_and_byo_outputs" {
  command = apply

  assert {
    condition     = azurerm_resource_group.lab.location == "centralus"
    error_message = "Default lab region must be centralus."
  }

  assert {
    condition     = azurerm_windows_virtual_machine.host.size == "Standard_E32ds_v5"
    error_message = "Default host VM SKU must be Standard_E32ds_v5 for nested virtualization."
  }

  assert {
    condition     = length(azurerm_dev_test_global_vm_shutdown_schedule.host) == 1
    error_message = "Auto-shutdown schedule spend guard must be enabled by default."
  }

  assert {
    condition     = azurerm_resource_group.lab.tags["ttl_hours"] == "8" && azurerm_resource_group.lab.tags["auto_teardown"] == "true"
    error_message = "Resource group must carry ttl_hours and auto_teardown tags."
  }

  assert {
    condition     = length(azapi_resource.logical_network) == 0 && length(azapi_resource.gallery_image) == 0
    error_message = "Stage 1 leaves Arc VM prerequisites off until Custom Location is bootstrapped."
  }

  assert {
    condition     = output.local_smb_profile_path == "\\\\192.168.100.1\\profiles"
    error_message = "Default local_smb_profile_path must point to the nested NAT SMB share."
  }

  assert {
    condition     = can(regex("AZL_CUSTOM_LOCATION_ID", output.env_exports)) && can(regex("AZL_LOGICAL_NET_ID", output.env_exports)) && can(regex("AZL_IMAGE_ID", output.env_exports)) && can(regex("AZL_SMB_PATH", output.env_exports))
    error_message = "env_exports must include all four AZL_* variables."
  }
}

run "stage2_creates_arc_logical_network_and_gallery_image" {
  command = apply

  variables {
    create_arc_vm_prereqs = true
    enable_smb_share      = false
    gallery_image_os      = "ws2025-datacenter"
  }

  assert {
    condition     = length(azapi_resource.logical_network) == 1 && length(azapi_resource.gallery_image) == 1
    error_message = "Stage 2 must create both logical_network and gallery_image resources."
  }

  assert {
    condition     = azapi_resource.logical_network[0].body.extendedLocation.type == "CustomLocation"
    error_message = "Logical network must bind to CustomLocation extendedLocation."
  }

  assert {
    condition     = azapi_resource.gallery_image[0].body.properties.identifier.sku == "2025-datacenter-azure-edition"
    error_message = "Gallery image identifier must match selected gallery_image_os."
  }

  assert {
    condition     = output.local_smb_profile_path == null
    error_message = "local_smb_profile_path must be null when enable_smb_share is false."
  }
}

run "rejects_small_non_nested_sku" {
  command = plan

  variables {
    host_vm_size = "Standard_D4s_v5"
  }

  expect_failures = [
    var.host_vm_size,
  ]
}

run "rejects_wildcard_rdp_cidr" {
  command = plan

  variables {
    allowed_rdp_cidr = "0.0.0.0/0"
  }

  expect_failures = [
    var.allowed_rdp_cidr,
  ]
}

run "handsoff_cluster_and_https_image_url" {
  command = apply

  variables {
    deploy_hci_cluster = true
    hci_os_image_url   = "https://example.invalid/azl23h2.vhdx"
  }

  assert {
    condition     = length(azapi_resource.hci_cluster) == 1 && output.hci_cluster_id != null && azapi_resource.hci_cluster[0].location == "eastus"
    error_message = "deploy_hci_cluster = true must create the Microsoft.AzureStackHCI/clusters resource in hci_location (default eastus)."
  }
}

run "rejects_non_https_hci_os_image_url" {
  command = plan

  variables {
    hci_os_image_url = "http://example.invalid/azl23h2.vhdx"
  }

  expect_failures = [
    var.hci_os_image_url,
  ]
}

run "rejects_unsupported_hci_location" {
  command = plan

  variables {
    hci_location = "centralus"
  }

  expect_failures = [
    var.hci_location,
  ]
}
