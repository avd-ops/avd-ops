---
title: "Cloud Shell and its alternatives"
summary: "What Azure Cloud Shell keeps and loses, and the near-free options (Codespaces, a small VM, your own PC) with costs, persistence, setup and security compared"
topic: getting-started
status: partial
last_reviewed: 2026-11-23
sources:
  - https://learn.microsoft.com/azure/cloud-shell/faq-troubleshooting
  - https://learn.microsoft.com/azure/cloud-shell/persisting-shell-storage
  - https://learn.microsoft.com/azure/cloud-shell/features
  - https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
  - https://docs.github.com/en/codespaces/about-codespaces/understanding-the-codespace-lifecycle
  - https://learn.microsoft.com/azure/bastion/bastion-sku-comparison
---

# Cloud Shell and its alternatives

Cloud Shell keeps your files if you mount storage, but it never keeps a session alive. For most work
that's enough. When it isn't, use GitHub Codespaces first, then a small VM.

<!-- more -->

Every AVD repo runs from Azure Cloud Shell, so this is where most people hit its limits: a tab that
loses focus, a 20-minute idle timeout, or tools that seem to vanish. This page says what Cloud
Shell really keeps, compares the near-free alternatives, and links a how-to for each one we
recommend. Prices and limits were checked against the official pages on 2026-11-23 and change over
time, so follow the links before you rely on a number.

## What Cloud Shell keeps and what it loses

With a storage account mounted, everything in your home folder comes back. The session itself, and
anything running in it, never does.

<!-- more -->

- **Kept, with storage mounted:** your whole `$HOME`, saved as a disk image on your Azure file
  share, plus `~/clouddrive`, which is the share itself. That includes repos you cloned, PowerShell
  modules installed for your user, Python and Node packages, your profile and your shell history
  ([persist files in Cloud Shell](https://learn.microsoft.com/azure/cloud-shell/persisting-shell-storage)).
- **Lost every time:** the machine, anything outside `$HOME`, running commands, environment
  variables, your Microsoft Graph sign-in and the folder you were in. You can't install anything that
  needs root, so there's nothing outside `$HOME` worth keeping
  ([features](https://learn.microsoft.com/azure/cloud-shell/features)).
- **The timeout:** a session ends after 20 minutes without interactive input, and long
  non-interactive work is ended without warning. Cloud Shell is meant for interactive use, and
  Microsoft says excessive use can get your access blocked, so don't try to keep it alive
  artificially ([FAQ](https://learn.microsoft.com/azure/cloud-shell/faq-troubleshooting)).
- **`tmux` doesn't help.** It's installed, but it lives on the machine that gets recycled.
- **Ephemeral sessions keep nothing.** If you chose "No storage account required", even `$HOME`
  is deleted when the session ends.

The AVD repos are built for this: every block is self-contained, long operations run as Azure
deployments that keep going when your shell drops, and the scripts read where a run stands from
Azure ([working from Cloud Shell](cloud-shell.md)).

## Compare the options

Cloud Shell costs cents, Codespaces is free for about 60 hours a month, a small VM is a few
dollars a month, and your own PC is free.

<!-- more -->

| Option | Cost | What persists | Setup | Security burden | From an iPad |
|---|---|---|---|---|---|
| Cloud Shell with storage | Free machine; the 5 GiB file share is about $0.30 a month | `$HOME` and `~/clouddrive`; no running session | Minutes | Low: Microsoft patches it; lock down the storage account | Yes |
| GitHub Codespaces | $0 inside 120 core-hours (60 hours on 2 cores) and 15 GB-month a month on a personal account; then $0.18 an hour and $0.07 per GB-month | Files while stopped (deleted after 30 days stopped); running work until the idle timeout, up to 4 hours | 15 minutes | Low to medium: GitHub runs it; you keep tokens out of the repo | In a browser; not yet tested on an iPad |
| Small Azure VM | About $0.0094 an hour (B2ats v2 Linux) plus about $2.40 a month for its disk | Everything, including running work, until you stop it | 30 minutes | High: you patch it and guard access | Through the portal with Bastion Developer; not yet tested on an iPad |
| Your own PC or Mac | $0 | Everything | 15 minutes | Your device's | No |

Prices are US retail in East US 2 and GitHub's list price on 2026-11-23
([Codespaces billing](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces),
[Bastion SKUs](https://learn.microsoft.com/azure/bastion/bastion-sku-comparison)). The VM's compute
is free for 750 hours a month in the first 12 months of an Azure free account
([free services](https://learn.microsoft.com/azure/cost-management-billing/manage/create-free-services)).

## What we recommend

Start with Cloud Shell and storage. Move to Codespaces when you need a session that outlives a
dropped tab. Use a VM only for private network access or work that runs for hours.

<!-- more -->

1. **Cloud Shell with storage mounted, plus the start-up profile.** It's what every repo is tested
   for, it costs cents, and it works from a tablet.
   [Set it up](shell-cloud-shell-storage.md).
2. **GitHub Codespaces on a repo you own,** when you want a real editor or a session that survives
   a dropped tab for up to 4 hours. Without a payment method on file, GitHub blocks use at the free
   quota, so it stays at $0. [Set it up](shell-codespaces.md).
3. **A small Linux VM with no public IP,** reached through Bastion Developer and shut down every
   night, when you need to reach private endpoints or run something for hours. It's the only option
   here that bills Azure while it runs. [Set it up](shell-small-vm.md).
4. **Your own PC or Mac,** when you're at a keyboard anyway. Install PowerShell 7 and the Azure CLI;
   every script runs on Windows, macOS and Linux
   ([decision 0006](../decisions/0006-run-anywhere.md)).

## Long jobs don't belong in any shell

Whichever shell you use, work that takes longer than a coffee runs in Azure or GitHub, not in your
terminal.

<!-- more -->

- **Deployments keep going without you.** The landing zone deploys through Azure Resource Manager,
  so a dropped shell doesn't stop it. Paste the next block when you're back, and the scripts work
  out where the run stands from Azure.
- **Scheduled and unattended work runs in GitHub Actions or an Azure Automation runbook,** never in
  an interactive shell. Public repos get standard Actions minutes free; private repos on GitHub
  Free share 2,000 minutes a month
  ([decision 0026](../decisions/0026-github-free-limits-and-near-zero-azure-hosting.md)).
- **Paid test runs follow [sandbox batches](../concepts/sandbox-batches.md):** a price first, then
  teardown with evidence, whatever shell starts them.
