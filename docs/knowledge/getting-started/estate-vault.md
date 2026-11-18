---
title: "Stand up and use an estate vault"
summary: "Create a private companion repo, initialize an adopter estate vault with avd-second-brain, ingest avd-current-state packages, and harvest generalized findings"
topic: getting-started
status: unverified
last_reviewed: 2026-11-18
---

# Stand up and use an estate vault

Keep unredacted environment history, validation snapshots, and runbooks in your own private companion repo while keeping public repos strictly free of tenant data.

<!-- more -->

This walkthrough connects [avd-current-state](../repos/avd-current-state.md) and [avd-second-brain](../repos/avd-second-brain.md) using self-contained Azure Cloud Shell (PowerShell) blocks ([working from Cloud Shell](cloud-shell.md)).

## 1. Create a private companion repo ($0)

Create one private GitHub repository that you own to hold your estate vault and unredacted run records.

<!-- more -->

Follow [your private companion repo](https://github.com/avd-ops/avd-ops/blob/main/docs/private-companion-repo.md) to create `avd-private` once with `gh repo create --private`. Never store secrets in it, and never push vault files to a public repo.

## 2. Initialize the estate vault ($0)

Clone `avd-second-brain` and initialize your private vault directory with `-Init`, which seeds the folder layout and copies any shared runbooks from `knowledge/runbooks/`.

<!-- more -->

Existing files in your vault are never overwritten by `-Init`.

```powershell
if (-not (Test-Path ~/avd-second-brain/.git)) { git clone https://github.com/avd-ops/avd-second-brain.git ~/avd-second-brain }
Set-Location ~/avd-second-brain; git checkout -q main; git pull -q --ff-only
./vault/avd_second_brain.ps1 -BrainPath ~/avd-private/vault -Init
```

## 3. Ingest `avd-current-state` evidence ($0)

Feed collector or validator evidence packages into the vault so findings link automatically to matching runbooks via `resolves-checks`.

<!-- more -->

Run `avd-current-state` first, then pass its output folder or ZIP archive to `-PackagePath`.

```powershell
if (-not (Test-Path ~/avd-second-brain/.git)) { git clone https://github.com/avd-ops/avd-second-brain.git ~/avd-second-brain }
Set-Location ~/avd-second-brain; git checkout -q main; git pull -q --ff-only
./vault/avd_second_brain.ps1 -BrainPath ~/avd-private/vault -PackagePath ~/avd-current-state/output
```

## 4. Search knowledge and propose generalized harvests ($0)

Query the shared knowledge base alongside your private vault, and inspect what can be generalized back to `avd-second-brain` without leaking tenant data.

<!-- more -->

`Get-VaultHarvest.ps1` writes nothing and flags lines that look like tenant-specific data so a person can strip them before opening a PR.

```powershell
if (-not (Test-Path ~/avd-second-brain/.git)) { git clone https://github.com/avd-ops/avd-second-brain.git ~/avd-second-brain }
Set-Location ~/avd-second-brain; git checkout -q main; git pull -q --ff-only
./scripts/Find-BrainKnowledge.ps1 -Query "registration token" -VaultPath ~/avd-private/vault
./scripts/Get-VaultHarvest.ps1 -VaultPath ~/avd-private/vault
```
