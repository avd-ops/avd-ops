<#
.SYNOPSIS
  Prepares a nested-virtualization Azure Windows Server 2022 host VM for a
  single-node Azure Local 23H2+ disposable sandbox cluster.

.DESCRIPTION
  Enables Hyper-V, initializes attached data disks for nested VM storage,
  creates an internal NAT vSwitch (azl-nested-switch), optionally creates a
  local SMB share for FSLogix profile testing, and creates the nested
  Azure Local VM shell with ExposeVirtualizationExtensions enabled.
#>
[CmdletBinding()]
param(
  [string]$NatCidr = "192.168.100.0/24",
  [string]$NatGatewayIp = "192.168.100.1",
  [string]$EnableSmbShare = "true",
  [string]$SmbShareName = "profiles",
  [string]$SwitchName = "azl-nested-switch",
  [string]$NestedVmName = "azl-node01",
  [int]$NestedVmMemoryStartupGB = 96,
  [int]$NestedVmProcessorCount = 16
)

$ErrorActionPreference = "Stop"

Write-Host "[1/5] Installing Hyper-V and RSAT-Hyper-V-Tools..."
$hvFeature = Get-WindowsFeature -Name Hyper-V
if (-not $hvFeature.Installed) {
  Install-WindowsFeature -Name Hyper-V -IncludeManagementTools -Restart:$false | Out-Null
}

Write-Host "[2/5] Initializing raw data disks for nested VM and S2D storage..."
$rawDisks = Get-Disk | Where-Object { $_.PartitionStyle -eq "RAW" -and $_.OperationalStatus -eq "Offline" -or ($_.PartitionStyle -eq "RAW") }
if ($rawDisks) {
  $first = $true
  foreach ($disk in $rawDisks) {
    if ($first) {
      Initialize-Disk -Number $disk.Number -PartitionStyle GPT -PassThru |
        New-Partition -DriveLetter D -UseMaximumSize |
        Format-Volume -FileSystem NTFS -NewFileSystemLabel "NestedVMs" -Confirm:$false | Out-Null
      $first = $false
    }
  }
}

$vmRoot = "D:\NestedAzureLocal"
New-Item -ItemType Directory -Path $vmRoot -Force | Out-Null

Write-Host "[3/5] Configuring internal Hyper-V NAT vSwitch ($SwitchName -> $NatCidr)..."
if (-not (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue)) {
  New-VMSwitch -SwitchName $SwitchName -SwitchType Internal | Out-Null
}

$ifAlias = "vEthernet ($SwitchName)"
$existingIp = Get-NetIPAddress -InterfaceAlias $ifAlias -AddressFamily IPv4 -ErrorAction SilentlyContinue
if (-not $existingIp) {
  $prefixLen = [int]($NatCidr.Split('/')[1])
  New-NetIPAddress -IPAddress $NatGatewayIp -PrefixLength $prefixLen -InterfaceAlias $ifAlias | Out-Null
}

if (-not (Get-NetNat -Name "AzlNestedNat" -ErrorAction SilentlyContinue)) {
  New-NetNat -Name "AzlNestedNat" -InternalIPInterfaceAddressPrefix $NatCidr | Out-Null
}

if ($EnableSmbShare -eq "true") {
  Write-Host "[4/5] Configuring local SMB share ($SmbShareName) for FSLogix profile testing..."
  $sharePath = Join-Path $vmRoot $SmbShareName
  New-Item -ItemType Directory -Path $sharePath -Force | Out-Null
  if (-not (Get-SmbShare -Name $SmbShareName -ErrorAction SilentlyContinue)) {
    New-SmbShare -Name $SmbShareName -Path $sharePath -FullAccess "Administrators" -EncryptData $true | Out-Null
  }
} else {
  Write-Host "[4/5] Skipping local SMB share (EnableSmbShare=$EnableSmbShare)."
}

Write-Host "[5/5] Creating nested Azure Local VM shell ($NestedVmName) with nested virtualization..."
if (-not (Get-VM -Name $NestedVmName -ErrorAction SilentlyContinue)) {
  $osVhd = Join-Path $vmRoot "$NestedVmName-os.vhdx"
  $dataVhd1 = Join-Path $vmRoot "$NestedVmName-s2d-01.vhdx"
  $dataVhd2 = Join-Path $vmRoot "$NestedVmName-s2d-02.vhdx"
  New-VHD -Path $osVhd -SizeBytes 128GB -Dynamic | Out-Null
  New-VHD -Path $dataVhd1 -SizeBytes 256GB -Dynamic | Out-Null
  New-VHD -Path $dataVhd2 -SizeBytes 256GB -Dynamic | Out-Null

  New-VM -Name $NestedVmName -MemoryStartupBytes ($NestedVmMemoryStartupGB * 1GB) -Generation 2 -VHDPath $osVhd -SwitchName $SwitchName -Path $vmRoot | Out-Null
  Set-VM -Name $NestedVmName -ProcessorCount $NestedVmProcessorCount -StaticMemory -AutomaticCheckpointsEnabled $false
  Set-VMProcessor -VMName $NestedVmName -ExposeVirtualizationExtensions $true
  Get-VMNetworkAdapter -VMName $NestedVmName | Set-VMNetworkAdapter -MacAddressSpoofing On
  Add-VMHardDiskDrive -VMName $NestedVmName -Path $dataVhd1 | Out-Null
  Add-VMHardDiskDrive -VMName $NestedVmName -Path $dataVhd2 | Out-Null
}

Write-Host "Bootstrap complete. Attach Azure Stack HCI 23H2+ ISO/VHDX to $NestedVmName, register with Arc (azcmagent), and deploy single-node cluster + Arc Resource Bridge."
