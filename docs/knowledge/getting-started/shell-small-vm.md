---
title: "A small Linux VM as your shell"
summary: "Stand up a B2ats v2 Linux VM with no public IP, reached through Bastion Developer and shut down nightly, for long runs and private network access"
topic: getting-started
status: partial
last_reviewed: 2026-11-23
sources:
  - https://learn.microsoft.com/azure/virtual-machines/linux/quick-create-portal
  - https://learn.microsoft.com/azure/bastion/quickstart-host-portal
  - https://learn.microsoft.com/azure/bastion/bastion-sku-comparison
  - https://learn.microsoft.com/cloud-computing/finops/best-practices/compute#virtual-machines
---

# A small Linux VM as your shell

A VM keeps running whatever you start, for as long as it's on. Give it no public IP, reach it
through free Bastion Developer, and let it shut itself down every night.

<!-- more -->

This is the third of the [options](shell-options.md), and the only one that bills Azure by the hour.
Use it when you need to reach private endpoints or run something for hours. If you already run the
landing zone, its opt-in jumpbox is this same pattern inside your landing zone's network
([landing zone decision 0019](https://github.com/avd-ops/avd-landing-zone/blob/master/build/decisions/0019-jumpbox-bastion-developer.md)).

## What it costs

About $0.0094 an hour while it runs, plus about $2.40 a month for its disk, whether it runs or not.

<!-- more -->

- **Compute:** Standard_B2ats_v2 Linux, $0.0094 an hour (East US 2 retail on 2026-11-23). Forty
  hours a month is about $0.38; left on all month it's about $6.86.
- **Disk:** a 32 GiB Standard SSD (E4) is $2.40 a month. It bills while the VM is stopped, until you
  delete it.
- **Free account:** B2ats v2 is one of the sizes free for 750 hours a month in the first 12 months
  of an Azure free account
  ([free services](https://learn.microsoft.com/azure/cost-management-billing/manage/create-free-services)).
- **Bastion Developer and no public IP:** $0
  ([Bastion SKUs](https://learn.microsoft.com/azure/bastion/bastion-sku-comparison)). A public IP
  would add a monthly charge and an open door.

## 1. Create the VM (about $0.0094 an hour while on)

Create it in the portal in a region that offers Bastion Developer, with no public IP and
auto-shutdown on.

<!-- more -->

Follow Microsoft's
[Linux VM quickstart](https://learn.microsoft.com/azure/virtual-machines/linux/quick-create-portal)
in a new resource group of its own, and change these settings:

- **Region:** one that
  [supports Bastion Developer](https://learn.microsoft.com/azure/bastion/bastion-sku-comparison#regional-availability).
- **Image and size:** Ubuntu Server 24.04 LTS, `Standard_B2ats_v2`.
- **Sign-in:** SSH public key.
- **Disks:** Standard SSD.
- **Networking:** public IP **None**, public inbound ports **None**.
- **Management:** turn on **Auto-shutdown** at a time you're always done by, in your time zone.

## 2. Connect through Bastion Developer ($0)

In the portal, open the VM, select **Connect**, then **Bastion**. The connection opens in the
browser over HTTPS.

<!-- more -->

- Bastion Developer deploys itself the first time you connect and supports one connection at a time
  ([Bastion quickstart](https://learn.microsoft.com/azure/bastion/quickstart-host-portal)).
- It needs no public IP on the VM and no client software. We haven't tested it from an iPad yet.

## 3. Install the tools and sign in ($0)

Install PowerShell 7 and the Azure CLI, then sign in with a device code. Start long work inside
`tmux` so you can come back to it.

<!-- more -->

- **Tools:** [PowerShell on Ubuntu](https://learn.microsoft.com/powershell/scripting/install/install-ubuntu)
  and the [Azure CLI on Linux](https://learn.microsoft.com/cli/azure/install-azure-cli-linux). Git
  and `tmux` come with Ubuntu Server.
- **Sign in:** `az login --use-device-code`, and `Connect-AzAccount -UseDeviceAuthentication` in
  PowerShell. Don't give the VM's managed identity any role unless something must run unattended.
- **Keep work running:** start a session with `tmux`, run the step, and leave. After you reconnect,
  `tmux attach` brings it back, as long as the VM stayed on.
- **Patching is yours.** Unlike Cloud Shell and Codespaces, nobody updates this machine for you.

## 4. Leave nothing billing

Auto-shutdown deallocates the VM every night. Stop it from the portal when you're done, and delete
the resource group when you won't need it again.

<!-- more -->

- **Stop from Azure, not from inside the VM.** A VM shut down from its own operating system shows
  "Stopped" and still bills compute; only "Stopped (deallocated)" doesn't
  ([deallocate VMs](https://learn.microsoft.com/cloud-computing/finops/best-practices/compute#virtual-machines)).
- **Keep a budget** on the subscription, as for any lab
  ([working from Cloud Shell](cloud-shell.md#costs)).
- **When you're finished,** copy off anything you want to keep, then delete the resource group. That
  removes the disk, the last thing billing.
