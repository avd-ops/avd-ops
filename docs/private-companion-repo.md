# Your private companion repo

The family's repos are public. Everything specific to *your* single Azure tenant—run journals,
teardown evidence, exported logs, your second brain's estate vault, private IaC parameters, and
`avd-swarm` workflows—belongs in **one private repository** that you own (`avd-private`). You do
not need separate private repos or private forks for each tool in the family.

## One private repo layout

Keep all tenant-specific state in one private repository under separate folders:

- **`runs/`**: the run journal, hash manifest, teardown evidence, and compressed logs exported
  before cleanup ([never delete the last copy](never-delete-the-last-copy.md)).
- **`vault/`**: your second brain's estate vault, built by `avd-second-brain`'s
  `vault/avd_second_brain.ps1` (`environments/`, `decisions/`, `runbooks/`, `facts/`, `.brain/`).
- **`config/`**: tenant-specific `*.bicepparam`, `*.tfvars`, and Intune policy-as-code exports.
- **`swarm/` & `.github/workflows/`**: `avd-swarm` governance config, runbooks, and private
  workflows (`approve.yml`, `runbooks.yml`) synced from a release tag.

Never put secrets in it. Public repos and issues only ever get redacted output.

## Free GitHub account limits

This repo is designed to stay within **GitHub Free** limits, with two platform boundaries called
out up front:

- **File sizes:** keep files under 50 MiB in Git and up to 2 GiB as release assets. Anything
  larger stays in the run store in your Azure subscription.
- **Actions minutes & storage:** GitHub Free gives **2,000 Actions minutes/month** and **500 MB**
  of artifact/package storage across private repos. Keep scheduled checks short and offload heavy
  runs to Azure Cloud Shell or scale-to-zero Azure services.
- **No Environment required reviewers on Free private repos:** Deployment protection rules
  (required reviewers, wait timers) on private repos require **GitHub Pro, Team, or Enterprise**.
  On GitHub Free, `environment:` jobs in `approve.yml` or `deploy.yml` will not pause for human
  approval—use interactive Cloud Shell scripts for human-in-the-loop writes, or upgrade to Pro+.
- **No GitHub Pages on Free private repos:** Private GitHub Pages sites also require GitHub Pro+.
  Default to the public `avd-ops.dev` / `avd-ops.app` sites, or deploy private web pages to near-\$0
  Azure hosting (Azure Static Web Apps Free, Azure Storage `$web`, or Container Apps Consumption
  with built-in Entra auth) per
  [decision 0026](knowledge/decisions/0026-github-free-limits-and-near-zero-azure-hosting.md).

## Create it once

Run the bootstrap script from Azure Cloud Shell (or PowerShell 7+ locally) with the GitHub CLI
signed in to your account. It creates `avd-private` (or verifies an existing repo is private) and
scaffolds `runs/`, `vault/`, `config/`, `swarm/`, `.github/workflows/`, `.gitignore`, and
`README.md`:

```powershell
if (-not (Test-Path ~/avd-ops/.git)) { git clone https://github.com/avd-ops/avd-ops.git ~/avd-ops }
Set-Location ~/avd-ops; git checkout -q main; git pull -q --ff-only
gh auth status || gh auth login
./scripts/ops/Initialize-AvdPrivateRepo.ps1 -RepoName avd-private -WhatIf
./scripts/ops/Initialize-AvdPrivateRepo.ps1 -RepoName avd-private
```

Pick any name. Scripts that write to it read its visibility first and refuse a repo that isn't
private.
