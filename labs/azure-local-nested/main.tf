locals {
  rg_name                  = "rg-${var.prefix}-azl-lab"
  host_vm_name             = "${var.prefix}-host01"
  custom_location_name     = "${var.prefix}-cl"
  logical_network_name     = "${var.prefix}-lnet"
  gallery_image_name       = "${var.prefix}-${var.gallery_image_os}"
  host_private_ip          = "10.240.0.10"
  nested_smb_ip            = var.logical_network_gateway
  effective_admin_password = var.admin_password != "" ? var.admin_password : random_password.host_admin[0].result

  effective_custom_location_id = var.custom_location_id != "" ? var.custom_location_id : "${azurerm_resource_group.lab.id}/providers/Microsoft.ExtendedLocation/customLocations/${local.custom_location_name}"

  gallery_image_map = {
    "win11-24h2-avd" = {
      publisher = "MicrosoftWindowsDesktop"
      offer     = "windows-11"
      sku       = "win11-24h2-avd"
    }
    "win11-23h2-avd" = {
      publisher = "MicrosoftWindowsDesktop"
      offer     = "windows-11"
      sku       = "win11-23h2-avd"
    }
    "ws2022-datacenter" = {
      publisher = "MicrosoftWindowsServer"
      offer     = "WindowsServer"
      sku       = "2022-datacenter-azure-edition"
    }
    "ws2025-datacenter" = {
      publisher = "MicrosoftWindowsServer"
      offer     = "WindowsServer"
      sku       = "2025-datacenter-azure-edition"
    }
  }

  common_tags = merge(
    {
      purpose       = "azure-local-nested-lab"
      avd_ops_lab   = "azure-local-23h2"
      ttl_hours     = tostring(var.ttl_hours)
      expires_at    = timeadd(time_static.created.rfc3339, "${var.ttl_hours}h")
      auto_teardown = "true"
    },
    var.tags,
  )
}

data "azurerm_client_config" "current" {}

resource "time_static" "created" {}

resource "random_password" "host_admin" {
  count            = var.admin_password == "" ? 1 : 0
  length           = 24
  special          = true
  override_special = "!@#%^*_-+"
  min_lower        = 3
  min_upper        = 3
  min_numeric      = 3
  min_special      = 2
}

resource "azurerm_resource_group" "lab" {
  name     = local.rg_name
  location = var.location
  tags     = local.common_tags
}

resource "azurerm_virtual_network" "lab" {
  name                = "${var.prefix}-vnet"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  address_space       = ["10.240.0.0/16"]
  tags                = local.common_tags
}

resource "azurerm_subnet" "host" {
  name                 = "snet-host"
  resource_group_name  = azurerm_resource_group.lab.name
  virtual_network_name = azurerm_virtual_network.lab.name
  address_prefixes     = ["10.240.0.0/24"]
}

resource "azurerm_network_security_group" "host" {
  name                = "${var.prefix}-nsg"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  tags                = local.common_tags

  dynamic "security_rule" {
    for_each = var.allowed_rdp_cidr != "" ? [1] : []
    content {
      name                       = "AllowInboundRdpFromOperator"
      priority                   = 100
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = "3389"
      source_address_prefix      = var.allowed_rdp_cidr
      destination_address_prefix = "*"
    }
  }
}

resource "azurerm_subnet_network_security_group_association" "host" {
  subnet_id                 = azurerm_subnet.host.id
  network_security_group_id = azurerm_network_security_group.host.id
}

resource "azurerm_public_ip" "nat" {
  name                = "${var.prefix}-nat-pip"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = local.common_tags
}

resource "azurerm_nat_gateway" "lab" {
  name                = "${var.prefix}-natgw"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  sku_name            = "Standard"
  tags                = local.common_tags
}

resource "azurerm_nat_gateway_public_ip_association" "lab" {
  nat_gateway_id       = azurerm_nat_gateway.lab.id
  public_ip_address_id = azurerm_public_ip.nat.id
}

resource "azurerm_subnet_nat_gateway_association" "host" {
  subnet_id      = azurerm_subnet.host.id
  nat_gateway_id = azurerm_nat_gateway.lab.id
}

resource "azurerm_network_interface" "host" {
  name                           = "${local.host_vm_name}-nic"
  location                       = azurerm_resource_group.lab.location
  resource_group_name            = azurerm_resource_group.lab.name
  accelerated_networking_enabled = true
  tags                           = local.common_tags

  ip_configuration {
    name                          = "ipconfig1"
    subnet_id                     = azurerm_subnet.host.id
    private_ip_address_allocation = "Static"
    private_ip_address            = local.host_private_ip
  }
}

resource "azurerm_windows_virtual_machine" "host" {
  name                = local.host_vm_name
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  size                = var.host_vm_size
  admin_username      = var.admin_username
  admin_password      = local.effective_admin_password
  network_interface_ids = [
    azurerm_network_interface.host.id,
  ]
  tags = local.common_tags

  identity {
    type = "SystemAssigned"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 256
  }

  source_image_reference {
    publisher = "MicrosoftWindowsServer"
    offer     = "WindowsServer"
    sku       = "2022-datacenter-g2"
    version   = "latest"
  }
}

resource "azurerm_managed_disk" "s2d_data" {
  count                = var.data_disk_count
  name                 = "${local.host_vm_name}-data-${count.index}"
  location             = azurerm_resource_group.lab.location
  resource_group_name  = azurerm_resource_group.lab.name
  storage_account_type = "Premium_LRS"
  create_option        = "Empty"
  disk_size_gb         = var.data_disk_size_gb
  tags                 = local.common_tags
}

resource "azurerm_virtual_machine_data_disk_attachment" "s2d_data" {
  count              = var.data_disk_count
  managed_disk_id    = azurerm_managed_disk.s2d_data[count.index].id
  virtual_machine_id = azurerm_windows_virtual_machine.host.id
  lun                = count.index
  caching            = "None"
}

resource "azurerm_dev_test_global_vm_shutdown_schedule" "host" {
  count              = var.enable_auto_shutdown ? 1 : 0
  virtual_machine_id = azurerm_windows_virtual_machine.host.id
  location           = azurerm_resource_group.lab.location
  enabled            = true

  daily_recurrence_time = var.auto_shutdown_time
  timezone              = var.auto_shutdown_timezone

  notification_settings {
    enabled = false
  }

  tags = local.common_tags
}

resource "azurerm_virtual_machine_run_command" "bootstrap" {
  count              = var.run_bootstrap ? 1 : 0
  name               = "${local.host_vm_name}-bootstrap"
  location           = azurerm_resource_group.lab.location
  virtual_machine_id = azurerm_windows_virtual_machine.host.id
  tags               = local.common_tags

  source {
    script = file("${path.module}/scripts/Bootstrap-NestedAzureLocal.ps1")
  }

  parameter {
    name  = "NatCidr"
    value = var.logical_network_cidr
  }

  parameter {
    name  = "NatGatewayIp"
    value = var.logical_network_gateway
  }

  parameter {
    name  = "EnableSmbShare"
    value = tostring(var.enable_smb_share)
  }

  parameter {
    name  = "SmbShareName"
    value = var.smb_share_name
  }

  parameter {
    name  = "HciOsImageUrl"
    value = var.hci_os_image_url
  }

  parameter {
    name  = "NestedNodeIp"
    value = var.nested_node_ip
  }

  parameter {
    name  = "ArcTenantId"
    value = var.arc_tenant_id != "" ? var.arc_tenant_id : (var.tenant_id != "" ? var.tenant_id : data.azurerm_client_config.current.tenant_id)
  }

  parameter {
    name  = "ArcSubscriptionId"
    value = var.subscription_id != "" ? var.subscription_id : data.azurerm_client_config.current.subscription_id
  }

  parameter {
    name  = "ResourceGroupName"
    value = azurerm_resource_group.lab.name
  }

  parameter {
    name  = "Location"
    value = azurerm_resource_group.lab.location
  }

  protected_parameter {
    name  = "NestedAdminPassword"
    value = local.effective_admin_password
  }

  protected_parameter {
    name  = "ArcSpAppId"
    value = var.arc_sp_app_id
  }

  protected_parameter {
    name  = "ArcSpSecret"
    value = var.arc_sp_secret
  }

  depends_on = [azurerm_virtual_machine_data_disk_attachment.s2d_data]
}

resource "azapi_resource" "hci_cluster" {
  count     = var.deploy_hci_cluster ? 1 : 0
  type      = "Microsoft.AzureStackHCI/clusters@2024-04-01"
  name      = "${var.prefix}-cluster"
  parent_id = azurerm_resource_group.lab.id
  location  = azurerm_resource_group.lab.location
  tags      = local.common_tags

  identity {
    type = "SystemAssigned"
  }

  body = {
    properties = {
      desiredProperties = {
        windowsServerSubscription = "Disabled"
        diagnosticLevel           = "Basic"
      }
    }
  }
}

resource "azapi_resource" "logical_network" {
  count     = var.create_arc_vm_prereqs ? 1 : 0
  type      = "Microsoft.AzureStackHCI/logicalNetworks@2024-01-01"
  name      = local.logical_network_name
  parent_id = azurerm_resource_group.lab.id
  location  = azurerm_resource_group.lab.location
  tags      = local.common_tags

  body = {
    extendedLocation = {
      type = "CustomLocation"
      name = local.effective_custom_location_id
    }
    properties = {
      vmSwitchName = "azl-nested-switch"
      subnets = [
        {
          name = "default"
          properties = {
            addressPrefix      = var.logical_network_cidr
            ipAllocationMethod = "Static"
            ipPools = [
              {
                start = var.logical_network_ip_pool_start
                end   = var.logical_network_ip_pool_end
              }
            ]
            routeTable = {
              properties = {
                routes = [
                  {
                    name = "default-route"
                    properties = {
                      addressPrefix    = "0.0.0.0/0"
                      nextHopIpAddress = var.logical_network_gateway
                    }
                  }
                ]
              }
            }
          }
        }
      ]
      dhcpOptions = {
        dnsServers = var.logical_network_dns_servers
      }
    }
  }
}

resource "azapi_resource" "gallery_image" {
  count     = var.create_arc_vm_prereqs ? 1 : 0
  type      = "Microsoft.AzureStackHCI/galleryImages@2024-01-01"
  name      = local.gallery_image_name
  parent_id = azurerm_resource_group.lab.id
  location  = azurerm_resource_group.lab.location
  tags      = local.common_tags

  body = {
    extendedLocation = {
      type = "CustomLocation"
      name = local.effective_custom_location_id
    }
    properties = {
      osType              = "Windows"
      cloudInitDataSource = "NoCloud"
      hyperVGeneration    = "V2"
      identifier          = local.gallery_image_map[var.gallery_image_os]
      version = {
        name = "latest"
      }
    }
  }
}
