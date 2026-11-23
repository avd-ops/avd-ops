---
title: "Keep your files in Cloud Shell"
summary: "Mount a storage account so Cloud Shell keeps your home folder, and add a start-up profile that checks the session and reinstalls missing modules"
topic: getting-started
status: partial
last_reviewed: 2026-11-23
sources:
  - https://learn.microsoft.com/azure/cloud-shell/get-started/new-storage
  - https://learn.microsoft.com/azure/cloud-shell/persisting-shell-storage
---

# Keep your files in Cloud Shell

Mount a storage account once, and Cloud Shell brings back your home folder every session. A
start-up profile then tells you what kind of session you're in.

<!-- more -->

This is the first of the [options](shell-options.md) and the one every AVD repo is tested for. It
costs about $0.30 a month for the file share and works from a tablet. It keeps files, not sessions:
the 20-minute idle timeout still applies.

## 1. Mount a storage account (about $0.30 a month)

In Cloud Shell's first-run screen, pick "Mount storage account" instead of "No storage account
required".

<!-- more -->

- **First time:** open Cloud Shell, choose PowerShell, then **Mount storage account**, pick your
  lab subscription and let Cloud Shell create the storage account, or choose an existing one
  ([new storage](https://learn.microsoft.com/azure/cloud-shell/get-started/new-storage)).
- **Already ephemeral:** select **Settings**, then **Reset User Settings**, and you get the
  first-run screen again. Resetting closes the current session.
- **Cost:** standard Azure Files at $0.06 per GB-month (East US 2 retail on 2026-11-23), so a
  5 GiB share is about $0.30 a month plus small transaction charges.
- **Keep it private.** The share holds your `$HOME` image, which can hold tokens and keys. Use a
  storage account of your own, and remember that anyone with enough rights on its subscription can
  read it
  ([securing storage access](https://learn.microsoft.com/azure/cloud-shell/persisting-shell-storage#securing-storage-access)).
- **Don't delete it by accident.** Deleting the resource group, storage account or file share
  deletes your `$HOME` image too, and it can't be undone.

## 2. Add the start-up profile ($0)

One block adds a short script to your PowerShell profile. Each time Cloud Shell opens, it checks the
session, installs missing modules and shows your subscription.

<!-- more -->

The script warns you when there's no `~/clouddrive` (an ephemeral session that keeps nothing),
installs the PowerShell modules you list for your user if they're missing (Pester and
PSScriptAnalyzer to start with), shows which subscription you're in, and reminds you about the
timeout. The installer copies it to `~/.config/avd-ops/`, so you run what you read; edit that copy to
change the module list. Source:
[templates/cloud-shell](https://github.com/avd-ops/avd-ops/tree/main/templates/cloud-shell).

```powershell
if (-not (Test-Path ~/avd-ops/.git)) { git clone https://github.com/avd-ops/avd-ops.git ~/avd-ops }
Set-Location ~/avd-ops; git checkout -q main; git pull -q --ff-only
./templates/cloud-shell/Install-CloudShellProfile.ps1
```

The profile hasn't been run in a real Cloud Shell session yet. If it misbehaves, open an issue in
avd-ops with what it printed, after removing your subscription name.

## 3. Check it, or turn it off

Close Cloud Shell and open it again. You should see the avd-ops lines before your prompt.

<!-- more -->

- **Expected:** a line naming your subscription and the 20-minute reminder. A yellow warning means
  the session is ephemeral and step 1 didn't take.
- **Turn it off:** open `$PROFILE.CurrentUserAllHosts` with `code` and delete the line that ends
  with `# avd-ops Cloud Shell start-up`.

## 4. When a session drops anyway

Open Cloud Shell again and paste the same block. Where the run stands comes from Azure, not the
shell.

<!-- more -->

- Your files and modules are back, but environment variables, the folder you were in and your
  Microsoft Graph sign-in aren't. Every block in these docs sets what it needs again.
- A deployment that was running keeps running. The landing zone's "Where did I leave off?" check
  reads Azure and tells you the next step ([working from Cloud Shell](cloud-shell.md)).
- If drops keep costing you work, the next option is [GitHub Codespaces](shell-codespaces.md).
