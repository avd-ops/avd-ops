# Cloud Shell start-up profile

Personal project, not for production, provided as is; not affiliated with the author's employer or Microsoft.

A small PowerShell start-up script for Azure Cloud Shell. Each time Cloud Shell opens it warns you
when the session is ephemeral, installs the PowerShell modules you list for your user if they're
missing, shows which subscription you're in, and reminds you that the session ends after
20 minutes without input.

- `Install-CloudShellProfile.ps1` copies `cloudshell-profile.ps1` to `~/.config/avd-ops/` and adds
  one line to your PowerShell profile that runs the copy. Run it again to refresh the copy.
- `cloudshell-profile.ps1` is the start-up script. Edit `$AvdOpsModules` in your copy to change the
  module list.

It keeps working across sessions only when Cloud Shell has a storage account mounted. How to set
that up, and when to use something other than Cloud Shell:
[Cloud Shell and its alternatives](../../docs/knowledge/getting-started/shell-options.md).
