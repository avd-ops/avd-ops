---
title: "Standards and learning"
summary: "How avd-assess holds the shared standards and contracts, and how avd-learn walks through them interactively"
topic: getting-started
status: unverified
last_reviewed: 2026-11-20
---

# Standards and learning

Explore the family's assessment rules, JSON contracts, and guided labs through [avd-assess](../repos/avd-assess.md) and [avd-learn](../repos/avd-learn.md).

<!-- more -->

## 1. Read the shared standards and contracts (`avd-assess`) ($0)

[avd-assess](../repos/avd-assess.md) is the source of truth for assessment methods, cited Microsoft Learn claims, and versioned JSON schemas (`C11`–`C31`) pinned across the family.

<!-- more -->

```powershell
if (-not (Test-Path ~/avd-assess/.git)) { git clone https://github.com/avd-ops/avd-assess.git ~/avd-assess }
Set-Location ~/avd-assess; git checkout -q main; git pull -q --ff-only
Get-ChildItem contracts/
```

## 2. Follow the guided learning path (`avd-learn`) ($0)

[avd-learn](../repos/avd-learn.md) provides a structured learning track over the AVD architecture, assessment standards, and lab repos before you deploy into a sandbox subscription.

<!-- more -->

```powershell
if (-not (Test-Path ~/avd-learn/.git)) { git clone https://github.com/avd-ops/avd-learn.git ~/avd-learn }
Set-Location ~/avd-learn; git checkout -q main; git pull -q --ff-only
Get-ChildItem
```
