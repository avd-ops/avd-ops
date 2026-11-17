<#
.SYNOPSIS
  Prepares a nested-virtualization Azure Windows Server 2022 host VM for a
  single-node Azure Local 23H2+ disposable sandbox cluster.

.DESCRIPTION
  Enables Hyper-V, initializes an attached data disk on a free drive letter (F-Z)
  for nested VM storage, creates an internal NAT vSwitch (azl-nested-switch),
  optionally creates a local SMB share for FSLogix profile testing, creates the
  nested Azure Local VM (azl-node01) with ExposeVirtualizationExtensions enabled,
  and optionally stages OS media (VHDX/ISO) + unattended Arc registration.
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
  [int]$NestedVmProcessorCount = 16,
  [string]$HciOsImageUrl = "",
  [string]$NestedNodeIp = "192.168.100.10",
  [string]$NestedAdminPassword = "",
  [string]$ArcSpAppId = "",
  [string]$ArcSpSecret = "",
  [string]$ArcTenantId = "",
  [string]$ArcSubscriptionId = "",
  [string]$ResourceGroupName = "",
  [string]$Location = "centralus"
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

`$osVhd = Join-Path "$vmRoot" "$NestedVmName-os.vhdx"
if (-not (Get-VM -Name "$NestedVmName" -ErrorAction SilentlyContinue)) {
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

if ("$HciOsImageUrl" -ne "") {
  `$ProgressPreference = "SilentlyContinue"
  `$isIso = ("$HciOsImageUrl" -match '\.iso(\?|$)')
  if (`$isIso) {
    `$isoPath = Join-Path "$vmRoot" "$NestedVmName-install.iso"
    Invoke-WebRequest -Uri "$HciOsImageUrl" -OutFile `$isoPath -UseBasicParsing
    `$dvd = Add-VMDvdDrive -VMName "$NestedVmName" -Path `$isoPath -Passthru
    Set-VMFirmware -VMName "$NestedVmName" -FirstBootDevice `$dvd
  } else {
    `$downloadedVhdx = Join-Path "$vmRoot" "$NestedVmName-downloaded.vhdx"
    Invoke-WebRequest -Uri "$HciOsImageUrl" -OutFile `$downloadedVhdx -UseBasicParsing
    Stop-VM -Name "$NestedVmName" -TurnOff -Force -ErrorAction SilentlyContinue
    Move-Item -Path `$downloadedVhdx -Destination `$osVhd -Force
    if ((Get-VHD -Path `$osVhd).Size -lt 128GB) {
      Resize-VHD -Path `$osVhd -SizeBytes 128GB
    }
    if ("$NestedAdminPassword" -ne "") {
      `$mounted = Mount-VHD -Path `$osVhd -Passthru
      `$osVol = Get-Disk -Number `$mounted.Number | Get-Partition | Get-Volume | Where-Object { `$_.DriveLetter -and `$_.Size -gt 10GB } | Select-Object -First 1
      if (`$osVol) {
        `$pantherDir = Join-Path "`$(`$osVol.DriveLetter):" "Windows\Panther"
        New-Item -ItemType Directory -Path `$pantherDir -Force | Out-Null
        `$escapedPass = [System.Security.SecurityElement]::Escape("$NestedAdminPassword")
        `$unattend = '<?xml version="1.0" encoding="utf-8"?><unattend xmlns="urn:schemas-microsoft-com:unattend"><settings pass="specialize"><component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS"><ComputerName>__NODE_NAME__</ComputerName></component></settings><settings pass="oobeSystem"><component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS"><OOBE><HideEULAPage>true</HideEULAPage><HideWirelessSetupInOOBE>true</HideWirelessSetupInOOBE><NetworkLocation>Work</NetworkLocation><ProtectYourPC>3</ProtectYourPC></OOBE><UserAccounts><AdministratorPassword><Value>__ADMIN_PASS__</Value><PlainText>true</PlainText></AdministratorPassword></UserAccounts><FirstLogonCommands><SynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State"><Order>1</Order><CommandLine>powershell.exe -NoProfile -Command "Get-NetAdapter | Where-Object Status -eq Up | New-NetIPAddress -IPAddress __NODE_IP__ -PrefixLength 24 -DefaultGateway __GW_IP__; Get-NetAdapter | Where-Object Status -eq Up | Set-DnsClientServerAddress -ServerAddresses 168.63.129.16; Enable-PSRemoting -Force"</CommandLine></SynchronousCommand></FirstLogonCommands></component></settings></unattend>'
        `$unattend = `$unattend.Replace('__NODE_NAME__', "$NestedVmName").Replace('__ADMIN_PASS__', `$escapedPass).Replace('__NODE_IP__', "$NestedNodeIp").Replace('__GW_IP__', "$NatGatewayIp")
        `$unattend | Set-Content -Path (Join-Path `$pantherDir "Unattend.xml") -Encoding UTF8
      }
      Dismount-VHD -Path `$osVhd
    }
  }

  Start-VM -Name "$NestedVmName"
  if ("$ArcSpAppId" -ne "" -and "$ArcSpSecret" -ne "" -and "$NestedAdminPassword" -ne "") {
    `$secPass = ConvertTo-SecureString "$NestedAdminPassword" -AsPlainText -Force
    `$cred = New-Object System.Management.Automation.PSCredential("Administrator", `$secPass)
    `$deadline = (Get-Date).AddMinutes(15)
    `$ready = `$false
    while ((Get-Date) -lt `$deadline) {
      try {
        `$ping = Invoke-Command -VMName "$NestedVmName" -Credential `$cred -ScriptBlock { "OK" } -ErrorAction Stop
        if (`$ping -eq "OK") { `$ready = `$true; break }
      } catch {
        Start-Sleep -Seconds 20
      }
    }
    if (-not `$ready) {
      throw "Timed out waiting for PowerShell Direct on $NestedVmName."
    }
    Invoke-Command -VMName "$NestedVmName" -Credential `$cred -ArgumentList "$ArcSpAppId", "$ArcSpSecret", "$ArcTenantId", "$ArcSubscriptionId", "$ResourceGroupName", "$Location", "$NestedVmName" -ScriptBlock {
      param(`$spId, `$spSecret, `$tenantId, `$subId, `$rg, `$loc, `$nodeName)
      `$ErrorActionPreference = "Stop"
      if (-not (Get-Command azcmagent -ErrorAction SilentlyContinue)) {
        `$msi = Join-Path `$env:TEMP "AzureConnectedMachineAgent.msi"
        Invoke-WebRequest -Uri "https://aka.ms/AzureConnectedMachineAgent" -OutFile `$msi -UseBasicParsing
        Start-Process msiexec.exe -ArgumentList "/i `"`$msi`" /qn /l*v `"`$env:TEMP\azcmagent-install.log`"" -Wait
      }
      & azcmagent connect --service-principal-id `$spId --service-principal-secret `$spSecret --tenant-id `$tenantId --subscription-id `$subId --resource-group `$rg --location `$loc --resource-name `$nodeName
    }
  }
}

Unregister-ScheduledTask -TaskName "AzlNestedFinalize" -Confirm:`$false -ErrorAction SilentlyContinue
Remove-Item -Path `$PSCommandPath -Force -ErrorAction SilentlyContinue
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

Write-Host "Bootstrap complete. Attach Azure Stack HCI 23H2+ ISO/VHDX to $NestedVmName (or pass hci_os_image_url for hands-off provisioning)."
