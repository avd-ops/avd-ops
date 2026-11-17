variable "subscription_id" {
  description = "Optional Azure subscription ID. Leave empty to use ARM_SUBSCRIPTION_ID or current az login context."
  type        = string
  default     = ""
}

variable "tenant_id" {
  description = "Optional Microsoft Entra tenant ID. Leave empty to use ARM_TENANT_ID or current az login context."
  type        = string
  default     = ""
}

variable "location" {
  description = "Azure region for the nested Azure Local lab host. Defaults to centralus to align with avd-sandbox ADR-0006."
  type        = string
  default     = "centralus"

  validation {
    condition     = length(trimspace(var.location)) > 0
    error_message = "location must be non-empty."
  }
}

variable "prefix" {
  description = "Short lowercase alphanumeric prefix for all lab resources."
  type        = string
  default     = "azl23h2"

  validation {
    condition     = can(regex("^[a-z0-9]{3,10}$", var.prefix))
    error_message = "prefix must be 3-10 lowercase alphanumeric characters."
  }
}

variable "host_vm_size" {
  description = "Nested-virtualization-capable Azure VM SKU for the Hyper-V host (>= 16 vCPU, >= 128 GiB RAM; Standard_E32ds_v5 recommended)."
  type        = string
  default     = "Standard_E32ds_v5"

  validation {
    condition = contains([
      "Standard_E16ds_v5",
      "Standard_E32ds_v5",
      "Standard_E48ds_v5",
      "Standard_E64ds_v5",
      "Standard_E16ds_v6",
      "Standard_E32ds_v6",
      "Standard_D32ds_v5",
      "Standard_D64ds_v5",
      "Standard_M32ls",
      "Standard_M64ls",
    ], var.host_vm_size)
    error_message = "host_vm_size must be a nested-virtualization-capable SKU with at least 16 vCPUs and 128 GiB RAM."
  }
}

variable "data_disk_size_gb" {
  description = "Size in GiB of each Premium SSD data disk attached to the nested Hyper-V host."
  type        = number
  default     = 512

  validation {
    condition     = var.data_disk_size_gb >= 256 && var.data_disk_size_gb <= 4096 && floor(var.data_disk_size_gb) == var.data_disk_size_gb
    error_message = "data_disk_size_gb must be an integer between 256 and 4096."
  }
}

variable "data_disk_count" {
  description = "Number of Premium SSD data disks for nested Storage Spaces Direct / CSV."
  type        = number
  default     = 2

  validation {
    condition     = var.data_disk_count >= 2 && var.data_disk_count <= 4 && floor(var.data_disk_count) == var.data_disk_count
    error_message = "data_disk_count must be an integer between 2 and 4."
  }
}

variable "admin_username" {
  description = "Local administrator username for the Hyper-V host VM."
  type        = string
  default     = "azladmin"

  validation {
    condition     = !contains(["administrator", "admin", "root"], lower(var.admin_username)) && length(var.admin_username) >= 4
    error_message = "admin_username must be at least 4 characters and not a reserved name."
  }
}

variable "admin_password" {
  description = "Optional local administrator password for the Hyper-V host VM. If empty, a random password is generated."
  type        = string
  default     = ""
  sensitive   = true
}

variable "allowed_rdp_cidr" {
  description = "Optional source CIDR allowed for inbound RDP (3389). Leave empty (default) to deny inbound RDP and use Azure Bastion / Run Command."
  type        = string
  default     = ""

  validation {
    condition     = var.allowed_rdp_cidr == "" || (var.allowed_rdp_cidr != "*" && var.allowed_rdp_cidr != "0.0.0.0/0" && can(cidrhost(var.allowed_rdp_cidr, 0)))
    error_message = "allowed_rdp_cidr must be empty or a specific CIDR block (0.0.0.0/0 and * are not permitted)."
  }
}

variable "enable_auto_shutdown" {
  description = "Enable daily auto-shutdown schedule on the Hyper-V host VM as a spend guard."
  type        = bool
  default     = true
}

variable "auto_shutdown_time" {
  description = "Daily auto-shutdown time in HHmm 24-hour format."
  type        = string
  default     = "2000"

  validation {
    condition     = can(regex("^([01][0-9]|2[0-3])[0-5][0-9]$", var.auto_shutdown_time))
    error_message = "auto_shutdown_time must be 4-digit HHmm (0000-2359)."
  }
}

variable "auto_shutdown_timezone" {
  description = "Windows time zone ID for the auto-shutdown schedule."
  type        = string
  default     = "Central Standard Time"
}

variable "ttl_hours" {
  description = "Time-to-live in hours stamped onto the resource group and resources for automated sandbox expiry."
  type        = number
  default     = 8

  validation {
    condition     = var.ttl_hours >= 1 && var.ttl_hours <= 72 && floor(var.ttl_hours) == var.ttl_hours
    error_message = "ttl_hours must be an integer between 1 and 72."
  }
}

variable "enable_smb_share" {
  description = "Configure an internal SMB share on the nested host for FSLogix profile testing (AZL_SMB_PATH)."
  type        = bool
  default     = true
}

variable "smb_share_name" {
  description = "Name of the optional local SMB share for FSLogix profiles."
  type        = string
  default     = "profiles"

  validation {
    condition     = can(regex("^[a-zA-Z0-9_-]{1,32}$", var.smb_share_name))
    error_message = "smb_share_name must be 1-32 alphanumeric, underscore, or hyphen characters."
  }
}

variable "gallery_image_os" {
  description = "Azure Marketplace OS preset for the Azure Local gallery image."
  type        = string
  default     = "win11-24h2-avd"

  validation {
    condition     = contains(["win11-24h2-avd", "win11-23h2-avd", "ws2022-datacenter", "ws2025-datacenter"], var.gallery_image_os)
    error_message = "gallery_image_os must be one of: win11-24h2-avd, win11-23h2-avd, ws2022-datacenter, ws2025-datacenter."
  }
}

variable "logical_network_cidr" {
  description = "CIDR block for the nested Hyper-V NAT switch and Arc Logical Network."
  type        = string
  default     = "192.168.100.0/24"

  validation {
    condition     = can(cidrhost(var.logical_network_cidr, 0))
    error_message = "logical_network_cidr must be a valid IPv4 CIDR."
  }
}

variable "logical_network_gateway" {
  description = "Default gateway IP for the nested Arc Logical Network."
  type        = string
  default     = "192.168.100.1"
}

variable "logical_network_dns_servers" {
  description = "DNS server IPs assigned to Arc VMs on the Logical Network."
  type        = list(string)
  default     = ["168.63.129.16"]
}

variable "logical_network_ip_pool_start" {
  description = "Start IP of the Arc Logical Network static/DHCP pool."
  type        = string
  default     = "192.168.100.50"
}

variable "logical_network_ip_pool_end" {
  description = "End IP of the Arc Logical Network static/DHCP pool."
  type        = string
  default     = "192.168.100.99"
}

variable "custom_location_id" {
  description = "Optional existing Custom Location resource ID. Leave empty to derive the lab's deterministic Custom Location ID."
  type        = string
  default     = ""
}

variable "create_arc_vm_prereqs" {
  description = "Stage 2 toggle: set true after Azure Local 23H2+ and Arc Resource Bridge bootstrap completes to declaratively create the Arc Logical Network and Gallery Image."
  type        = bool
  default     = false
}

variable "run_bootstrap" {
  description = "Execute scripts/Bootstrap-NestedAzureLocal.ps1 on the Hyper-V host via VM Run Command during apply."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags merged onto all lab resources."
  type        = map(string)
  default     = {}
}
