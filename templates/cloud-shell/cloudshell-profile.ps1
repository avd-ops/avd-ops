# Personal project, not for production, provided as is; not affiliated with the author's employer or Microsoft.
#
# avd-ops Cloud Shell start-up. Install-CloudShellProfile.ps1 copies this file to
# ~/.config/avd-ops/cloudshell-profile.ps1 and your PowerShell profile runs that copy each time
# Cloud Shell opens. Edit the copy to change what it does; delete the avd-ops line in $PROFILE to
# turn it off. Guide: https://avd-ops.dev/docs/getting-started/shell-options.html

# Runs in its own scope, so none of its variables are left in your session.
& {
    # The PowerShell modules your work needs beyond what Cloud Shell ships. Installed for your user only.
    $AvdOpsModules = @('Pester', 'PSScriptAnalyzer')

    # Cloud Shell sets ACC_LOCATION. Anywhere else, do nothing.
    if (-not $env:ACC_LOCATION) { return }

    if (-not (Test-Path -LiteralPath (Join-Path $HOME 'clouddrive'))) {
        Write-Host 'avd-ops: no ~/clouddrive, so this looks like an ephemeral session. Nothing saved here survives it.' -ForegroundColor Yellow
    }

    $missing = @($AvdOpsModules | Where-Object { -not (Get-Module -ListAvailable -Name $_) })
    if ($missing.Count -gt 0) {
        Write-Host "avd-ops: installing $($missing -join ', ') for your user. With storage mounted this happens once."
        try {
            Install-Module -Name $missing -Scope CurrentUser -Repository PSGallery -Force -ErrorAction Stop
        } catch {
            Write-Host "avd-ops: module install failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    $ctx = if (Get-Command Get-AzContext -ErrorAction SilentlyContinue) { Get-AzContext -ErrorAction SilentlyContinue }
    if ($ctx) { Write-Host "avd-ops: Azure subscription '$($ctx.Subscription.Name)'. Check it before anything writes." }
    else { Write-Host 'avd-ops: no Azure subscription selected yet. Check it with Get-AzContext before anything writes.' }
    Write-Host 'avd-ops: this session ends after 20 minutes without input. Long runs belong in Azure, not in this shell.'
}
