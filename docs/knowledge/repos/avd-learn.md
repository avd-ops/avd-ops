---
title: "avd-learn"
summary: "Ground-up AVD foundations dataset, CLI and installable PWA mapped to AZ-104 and AZ-140"
topic: repos
status: verified
last_reviewed: 2026-11-18
---

# avd-learn

A zero-spend study dataset, CLI and installable phone web app that teaches Azure Virtual Desktop from the ground up for AZ-104 and AZ-140.

<!-- more -->

Published as an offline-capable PWA at [avd-ops.github.io/avd-learn/site/](https://avd-ops.github.io/avd-learn/site/), it pairs progressive concept cards, flashcards, sample exam questions and synthetic redacted `C11` diagnostics with hands-on labs built on the `avd-ops` repos.

The repo is the source of truth: [avd-ops/avd-learn](https://github.com/avd-ops/avd-learn). This page says where it fits.

## What it does

It turns pinned methodology and operational rules into an interactive curriculum with zero tenant data or live Azure credentials.

<!-- more -->

- Organizes study tracks from core Azure foundations (`AZ-104`) through all five AVD control planes, FSLogix, scaling and Desktop DevOps (`AZ-140`).
- Provides both a zero-dependency Node.js CLI (`learn.mjs`) and an installable offline PWA (`site/`) covering Study, Flashcards, Sample Exam, Hands-On Labs and `C11` Diagnose modes.
- Exposes a versioned dataset contract (`dataset/index.json`) so external assistants can consume tracks, concepts, scenarios and labs at a pinned commit.

## How it fits

Dependencies point down: it reads pinned commits of [avd-assess](avd-assess.md) and [avd-second-brain](avd-second-brain.md) and never writes to Azure.

<!-- more -->

- Every concept card and scenario cites pinned paths in [avd-assess](avd-assess.md) and [avd-second-brain](avd-second-brain.md) (`pins.json`).
- Its hands-on labs guide learners through [avd-linecheck](avd-linecheck.md), [avd-current-state](avd-current-state.md), [avd-migrate](avd-migrate.md) and [avd-landing-zone](avd-landing-zone.md), with gap-check prompts to feed friction back into those repos.

## Read more in the repo

The repo has the full detail. Start here:

<!-- more -->

- [Live study PWA](https://avd-ops.github.io/avd-learn/site/)
- [README and quick start](https://github.com/avd-ops/avd-learn/blob/main/README.md)
- [Assistant integration contract](https://github.com/avd-ops/avd-learn/blob/main/docs/assistant-integration.md)
