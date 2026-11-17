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
$needsReboot = $false
if (-not $hvFeature.Installed) {
  $installResult = Install-WindowsFeature -Name Hyper-V -IncludeManagementTools -Restart:$false
  $needsReboot = ($installResult.RestartNeeded -eq "Yes")
}

Write-Host "[2/5] Initializing raw data disk for nested VM and S2D storage..."
$existingVol = Get-Volume -FileSystemLabel "NestedVMs" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existingVol -and $existingVol.DriveLetter) {
  $dataDrive = "$($existingVol.DriveLetter):"
} else {
  $usedLetters = @((Get-Volume | Where-Object { $_.DriveLetter }).DriveLetter | ForEach-Object { $_.ToString().ToUpperInvariant() })
  $targetLetter = @('F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z') |
    Where-Object { $_ -notin $usedLetters } |
    Select-Object -First 1
  if (-not $targetLetter) {
    throw "No free drive letter available for NestedVMs data disk."
  }
  $rawDisk = Get-Disk | Where-Object { $_.PartitionStyle -eq "RAW" } | Sort-Object Number | Select-Object -First 1
  if (-not $rawDisk) {
    throw "No RAW data disk found for NestedVMs."
  }
  Initialize-Disk -Number $rawDisk.Number -PartitionStyle GPT -PassThru |
    New-Partition -DriveLetter $targetLetter -UseMaximumSize |
    Format-Volume -FileSystem NTFS -NewFileSystemLabel "NestedVMs" -Confirm:$false | Out-Null
  $dataDrive = "${targetLetter}:"
}

$vmRoot = "$dataDrive\NestedAzureLocal"
New-Item -ItemType Directory -Path $vmRoot -Force | Out-Null

$configureHyperVScript = @"
`$ErrorActionPreference = "Stop"
if (-not (Get-VMSwitch -Name "$SwitchName" -ErrorAction SilentlyContinue)) {
  New-VMSwitch -SwitchName "$SwitchName" -SwitchType Internal | Out-Null
}
`$ifAlias = "vEthernet ($SwitchName)"
`$existingIp = Get-NetIPAddress -InterfaceAlias `$ifAlias -AddressFamily IPv4 -ErrorAction SilentlyContinue
if (-not `$existingIp) {
  `$prefixLen = [int]("$NatCidr".Split('/')[1])
  New-NetIPAddress -IPAddress "$NatGatewayIp" -PrefixLength `$prefixLen -InterfaceAlias `$ifAlias | Out-Null
}
if (-not (Get-NetNat -Name "AzlNestedNat" -ErrorAction SilentlyContinue)) {
  New-NetNat -Name "AzlNestedNat" -InternalIPInterfaceAddressPrefix "$NatCidr" | Out-Null
}
if ("$EnableSmbShare" -eq "true") {
  `$sharePath = Join-Path "$vmRoot" "$SmbShareName"
  New-Item -ItemType Directory -Path `$sharePath -Force | Out-Null
  if (-not (Get-SmbShare -Name "$SmbShareName" -ErrorAction SilentlyContinue)) {
    New-SmbShare -Name "$SmbShareName" -Path `$sharePath -FullAccess "Administrators" -EncryptData `$true | Out-Null
  }
}
if (-not (Get-VM -Name "$NestedVmName" -ErrorAction SilentlyContinue)) {
  `$osVhd = Join-Path "$vmRoot" "$NestedVmName-os.vhdx"
  `$dataVhd1 = Join-Path "$vmRoot" "$NestedVmName-s2d-01.vhdx"
  `$dataVhd2 = Join-Path "$vmRoot" "$NestedVmName-s2d-02.vhdx"
  New-VHD -Path `$osVhd -SizeBytes 128GB -Dynamic | Out-Null
  New-VHD -Path `$dataVhd1 -SizeBytes 256GB -Dynamic | Out-Null
  New-VHD -Path `$dataVhd2 -SizeBytes 256GB -Dynamic | Out-Null
  New-VM -Name "$NestedVmName" -MemoryStartupBytes ($NestedVmMemoryStartupGB * 1GB) -Generation 2 -VHDPath `$osVhd -SwitchName "$SwitchName" -Path "$vmRoot" | Out-Null
  Set-VM -Name "$NestedVmName" -ProcessorCount $NestedVmProcessorCount -StaticMemory -AutomaticCheckpointsEnabled `$false
  Set-VMProcessor -VMName "$NestedVmName" -ExposeVirtualizationExtensions `$true
  Get-VMNetworkAdapter -VMName "$NestedVmName" | Set-VMNetworkAdapter -MacAddressSpoofing On
  Add-VMHardDiskDrive -VMName "$NestedVmName" -Path `$dataVhd1 | Out-Null
  Add-VMHardDiskDrive -VMName "$NestedVmName" -Path `$dataVhd2 | Out-Null
}
Unregister-ScheduledTask -TaskName "AzlNestedFinalize" -Confirm:`$false -ErrorAction SilentlyContinue
"@

if ($needsReboot) {
  Write-Host "[3/5] Hyper-V requires a reboot; scheduling post-reboot finalization and restarting..."
  $finalizePath = Join-Path $vmRoot "Finalize-NestedAzureLocal.ps1"
  $configureHyperVScript | Set-Content -Path $finalizePath -Encoding UTF8
  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$finalizePath`""
  $trigger = New-ScheduledTaskTrigger -AtStartup
  $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
  Register-ScheduledTask -TaskName "AzlNestedFinalize" -Action $action -Trigger $trigger -Principal $principal -Force | Out-Null
  Start-Process -FilePath "shutdown.exe" -ArgumentList "/r /t 10 /c `"Completing Hyper-V installation for nested Azure Local`"" -NoNewWindow
} else {
  Write-Host "[3/5]-[5/5] Configuring Hyper-V NAT vSwitch, optional SMB share, and nested VM ($NestedVmName)..."
  Invoke-Expression $configureHyperVScript
}

Write-Host "Bootstrap complete. Attach Azure Stack HCI 23H2+ ISO/VHDX to $NestedVmName, register with Arc (azcmagent), and deploy single-node cluster + Arc Resource Bridge."
