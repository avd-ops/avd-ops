---
title: "Run the AVD repos in GitHub Codespaces"
summary: "Set up a GitHub codespace with PowerShell 7, Azure CLI and Bicep for the AVD repos, kept at $0 inside the free monthly allowance"
topic: getting-started
status: partial
last_reviewed: 2026-11-23
sources:
  - https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
  - https://docs.github.com/en/codespaces/setting-your-user-preferences/setting-your-timeout-period-for-github-codespaces
  - https://docs.github.com/en/codespaces/setting-your-user-preferences/configuring-automatic-deletion-of-your-codespaces
  - https://docs.github.com/en/codespaces/about-codespaces/understanding-the-codespace-lifecycle
---

# Run the AVD repos in GitHub Codespaces

A codespace is a Linux machine GitHub runs for you, with an editor in the browser. It keeps your
files between sessions and keeps running for up to 4 hours after you go quiet.

<!-- more -->

This is the second of the [options](shell-options.md). A personal GitHub account gets 120 core-hours
(60 hours on the 2-core machine) and 15 GB-month of storage a month at no cost, and without a
payment method on file GitHub blocks use at that quota instead of billing you
([Codespaces billing](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces),
checked 2026-11-23).

## 1. Put the setup in a repo you own ($0)

Copy the avd-ops dev container into your own fork or private companion repo. A codespace is always
created on a repo, and it reads its setup from that repo.

<!-- more -->

- **What it installs:** PowerShell 7 as the default terminal, Azure CLI with Bicep, GitHub CLI,
  and the Az sign-in, Graph sign-in, Pester and PSScriptAnalyzer modules, on a 2-core machine.
  Source: [templates/codespaces](https://github.com/avd-ops/avd-ops/tree/main/templates/codespaces).
- **Where:** copy its `.devcontainer` folder to the root of a repo in your personal account, such as
  your fork of avd-landing-zone or your
  [private companion repo](https://github.com/avd-ops/avd-ops/blob/main/docs/private-companion-repo.md).
- **Why your own account:** the free allowance belongs to personal accounts. Organization plans
  don't include one, so a codespace on an organization's repo can bill that organization or you.

## 2. Keep it at $0 ($0)

Leave no payment method on file, or set a $0 Codespaces budget. Then pick an idle timeout and how
long stopped codespaces are kept.

<!-- more -->

- **Spending:** with no payment method, use stops at the free quota. With one, set a Codespaces
  budget in your billing settings
  ([budgets](https://docs.github.com/en/billing/how-tos/set-up-budgets)).
- **Idle timeout:** in your Codespaces settings, from 5 to 240 minutes; the default is 30. A
  codespace also stops after 12 hours whatever you set
  ([timeout](https://docs.github.com/en/codespaces/setting-your-user-preferences/setting-your-timeout-period-for-github-codespaces)).
- **Retention:** stopped codespaces are deleted after 30 days by default; you can choose 0 to
  30 days
  ([automatic deletion](https://docs.github.com/en/codespaces/setting-your-user-preferences/configuring-automatic-deletion-of-your-codespaces)).
  A stopped codespace bills storage only.

## 3. Create the codespace and sign in ($0 inside the allowance)

Open your repo on GitHub, select **Code**, then **Codespaces**, then **Create codespace**. The
first build takes a few minutes.

<!-- more -->

- **Clone the AVD repos into `/workspaces`.** Files there survive a rebuild; anything else outside
  `/workspaces` doesn't. For example,
  `git clone https://github.com/avd-ops/avd-landing-zone.git /workspaces/avd-landing-zone`.
- **Sign in with a device code:** `Connect-AzAccount -UseDeviceAuthentication` for the PowerShell
  scripts and `az login --use-device-code` for the CLI. Unlike Cloud Shell, a codespace isn't signed
  in to Azure for you.
- **Missing module?** If a script asks for one, add it to the `modules` list in
  `.devcontainer/devcontainer.json` and rebuild the container.
- **Never commit a token.** Keep secrets out of the repo; use
  [Codespaces secrets](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces)
  if a step needs one.

## 4. Work, stop, delete

Closing the tab doesn't stop the codespace; the idle timeout does. Stop it when you're done, and
delete it when you won't come back.

<!-- more -->

- **Long runs:** set the idle timeout longer than the run, up to 4 hours. Anything longer belongs in
  Azure or GitHub Actions ([long jobs](shell-options.md#long-jobs-dont-belong-in-any-shell)).
- **What stops loses:** running processes and what's on screen. Your files, and your terminal
  history, are there when you start it again
  ([lifecycle](https://docs.github.com/en/codespaces/about-codespaces/understanding-the-codespace-lifecycle)).
- **Stop and delete** from your list of codespaces on GitHub. Deleting ends storage billing.
- **On an iPad:** codespaces open in a browser, but we haven't tested one on an iPad yet.
