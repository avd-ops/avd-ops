# Personal project, not for production, provided as is; not affiliated with the author's employer or Microsoft.
#requires -Version 7.2

<#
.SYNOPSIS
    Adds the avd-ops start-up script to your PowerShell profile in Azure Cloud Shell.
.DESCRIPTION
    Copies cloudshell-profile.ps1 to ~/.config/avd-ops/ and adds one line to your profile that runs
    the copy, so you run what you read and a later git pull never changes your start-up. Running it
    again keeps your copy and the profile line as they are; -Refresh replaces your copy with the
    template, edits included. It only keeps working across
    sessions when Cloud Shell has a storage account mounted: an ephemeral session forgets the
    profile too. Guide: https://avd-ops.dev/docs/getting-started/shell-options.html
.EXAMPLE
    ./templates/cloud-shell/Install-CloudShellProfile.ps1
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    # Replace your copy with the template, losing any edits to it.
    [switch]$Refresh
)

$marker = '# avd-ops Cloud Shell start-up'
$source = Join-Path $PSScriptRoot 'cloudshell-profile.ps1'
$copy = Join-Path $HOME '.config/avd-ops/cloudshell-profile.ps1'
$profilePath = $PROFILE.CurrentUserAllHosts

if ((-not (Test-Path -LiteralPath $copy)) -or $Refresh) {
    if ($PSCmdlet.ShouldProcess($copy, 'Copy the start-up script')) {
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $copy) | Out-Null
        Copy-Item -LiteralPath $source -Destination $copy -Force
    }
} else {
    Write-Output "Keeping your copy at $copy (pass -Refresh to replace it with the template)."
}

$hasLine = (Test-Path -LiteralPath $profilePath) -and (Select-String -LiteralPath $profilePath -SimpleMatch $marker -Quiet)
if (-not $hasLine -and $PSCmdlet.ShouldProcess($profilePath, 'Add one line that runs the start-up script')) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $profilePath) | Out-Null
    # Start on a new line even when the profile doesn't end with one; $HOME stays unexpanded so no path needs quoting.
    $existing = if (Test-Path -LiteralPath $profilePath) { Get-Content -LiteralPath $profilePath -Raw } else { '' }
    $lead = if ($existing -and -not $existing.EndsWith("`n")) { [Environment]::NewLine } else { '' }
    Add-Content -LiteralPath $profilePath -Value ($lead + '. "$HOME/.config/avd-ops/cloudshell-profile.ps1" ' + $marker)
}

if ($WhatIfPreference) { return }

if (-not (Test-Path -LiteralPath (Join-Path $HOME 'clouddrive'))) {
    Write-Warning 'No ~/clouddrive: this is an ephemeral session, so the profile is gone when it ends. Mount a storage account to keep it.'
}
Write-Output "Start-up script: $copy"
Write-Output "Profile: $profilePath (remove the line ending '$marker' to turn it off)"
Write-Output 'Next: close and reopen Cloud Shell, or run . $PROFILE.CurrentUserAllHosts'
