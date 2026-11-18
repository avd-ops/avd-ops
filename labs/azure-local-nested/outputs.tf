output "resource_group_name" {
  description = "Resource group containing the disposable nested Azure Local lab."
  value       = azurerm_resource_group.lab.name
}

output "host_vm_id" {
  description = "Resource ID of the nested-virtualization Hyper-V host VM."
  value       = azurerm_windows_virtual_machine.host.id
}

output "host_vm_name" {
  description = "Name of the nested-virtualization Hyper-V host VM."
  value       = azurerm_windows_virtual_machine.host.name
}

output "custom_location_id" {
  description = "BYO Custom Location ID (AZL_CUSTOM_LOCATION_ID) consumed by avd-azure and avd-hcl."
  value       = local.effective_custom_location_id
}

output "azure_local_logical_network_id" {
  description = "BYO Arc Logical Network ID (AZL_LOGICAL_NET_ID) consumed by avd-azure and avd-hcl."
  value       = var.create_arc_vm_prereqs ? azapi_resource.logical_network[0].id : "${azurerm_resource_group.lab.id}/providers/Microsoft.AzureStackHCI/logicalNetworks/${local.logical_network_name}"
}

output "azure_local_image_id" {
  description = "BYO Azure Local Gallery Image ID (AZL_IMAGE_ID) consumed by avd-azure and avd-hcl."
  value       = var.create_arc_vm_prereqs ? azapi_resource.gallery_image[0].id : "${azurerm_resource_group.lab.id}/providers/Microsoft.AzureStackHCI/galleryImages/${local.gallery_image_name}"
}

output "local_smb_profile_path" {
  description = "Optional local SMB UNC path for FSLogix profiles (AZL_SMB_PATH) when enable_smb_share is true; null otherwise."
  value       = var.enable_smb_share ? "\\\\${local.nested_smb_ip}\\${var.smb_share_name}" : null
}

output "expires_at" {
  description = "UTC timestamp when the lab TTL expires for automated teardown."
  value       = local.common_tags["expires_at"]
}

output "hci_cluster_id" {
  description = "Resource ID of the Azure Local cluster resource when deploy_hci_cluster is true; null otherwise."
  value       = var.deploy_hci_cluster ? azapi_resource.hci_cluster[0].id : null
}

output "hci_location" {
  description = "Azure region used for Azure Local control-plane resources (Arc, cluster, Custom Location, Logical Network, Gallery Image)."
  value       = var.hci_location
}

output "env_exports" {
  description = "Shell export commands for avd-sandbox items 30 and 31."
  value = join("\n", compact([
    "export AZL_CUSTOM_LOCATION_ID=\"${local.effective_custom_location_id}\"",
    "export AZL_LOGICAL_NET_ID=\"${var.create_arc_vm_prereqs ? azapi_resource.logical_network[0].id : "${azurerm_resource_group.lab.id}/providers/Microsoft.AzureStackHCI/logicalNetworks/${local.logical_network_name}"}\"",
    "export AZL_IMAGE_ID=\"${var.create_arc_vm_prereqs ? azapi_resource.gallery_image[0].id : "${azurerm_resource_group.lab.id}/providers/Microsoft.AzureStackHCI/galleryImages/${local.gallery_image_name}"}\"",
    var.enable_smb_share ? "export AZL_SMB_PATH=\"\\\\\\\\${local.nested_smb_ip}\\\\${var.smb_share_name}\"" : null,
  ]))
}
