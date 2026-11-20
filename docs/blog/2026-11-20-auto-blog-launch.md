---
title: "Launching the avd-ops auto-blog"
date: "2026-11-20"
summary: "Daily digests of releases, merged pull requests, accepted findings and decision records across the avd-ops repositories, drafted as pull requests for review."
repos: ["avd-ops"]
tags: ["announcement", "automation"]
---

We added an automated daily blog at **avd-ops.dev/blog/** to track major updates, features, fixes, and findings across the public **avd-ops** repositories.

## How it works

1. **Daily collection**: A scheduled GitHub Actions workflow (`blog-digest.yml`) queries the public repositories listed in `repos.json` for releases, non-bot merged pull requests, closed accepted issues, and new decision records from the previous UTC day.
2. **PR-drafted review**: When notable activity is found, `scripts/site/draft-blog.mjs` writes a Markdown digest under `docs/blog/` and `scripts/site/build-blog.mjs` renders `site/blog/` and the Atom feed (`site/blog/feed.xml`). The workflow opens a pull request so every post goes through CI checks and human review before publishing.
3. **Manual deep dives**: Standalone Markdown posts in `docs/blog/` render alongside the automated daily digests, so engineering findings and architecture notes live in one feed.
