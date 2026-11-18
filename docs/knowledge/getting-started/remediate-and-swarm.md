---
title: "Stand up avd-remediate and avd-swarm in a lab"
summary: "Launch the avd-remediate local troubleshooting portal against an estate vault, and run the spend-guarded avd-swarm S1a spike in a dedicated lab"
topic: getting-started
status: unverified
last_reviewed: 2026-11-18
---

# Stand up avd-remediate and avd-swarm in a lab

Run `avd-remediate` locally at `$0` for guided diagnosis and human-approved fix plans, and try `avd-swarm`'s spend-guarded S1a spike in a throwaway lab subscription.

<!-- more -->

Both tools are research projects; never run them against a production tenant. For `avd-swarm`, the write path only runs from a private adopter repo ([avd-swarm README](https://github.com/avd-ops/avd-swarm#readme)).

## 1. Launch `avd-remediate` against your estate vault ($0)

Start the local portal server pointed at your private estate vault to correlate `C11` facts, `C21` assessments, and `C24` remediation plans.

<!-- more -->

In Azure Cloud Shell, use **Web preview** on port `8787` after starting the server. You can also open `site/portal/index.html` directly as a static portal with no backend.

```powershell
if (-not (Test-Path ~/avd-remediate/.git)) { git clone https://github.com/avd-ops/avd-remediate.git ~/avd-remediate }
Set-Location ~/avd-remediate; git checkout -q main; git pull -q --ff-only
node ./scripts/server.mjs --vault ~/avd-private/vault --port 8787
```

## 2. Export a human-approved remediation plan ($0)

Inside the `avd-remediate` portal, correlate read-only probes with your vault context and choose one of three human-gated outputs:

<!-- more -->

- **Path A:** Copyable PowerShell or Bash fix block with preflight, rollback, and verification output.
- **Path B:** Plane-routed `C24` (`avd-remediation-plan/v1`) parameter patches for `avd-landing-zone`.
- **Path C:** An `avd-swarm` plan handoff package for GitHub Environment approval.

## 3. Run the `avd-swarm` S1a spike in a lab (spend-guarded)

Test `avd-swarm`'s read-only agent spike in a dedicated lab subscription; `Invoke-Spike.ps1` prices the run first and refuses to deploy if it exceeds the run or monthly cap.

<!-- more -->

Read the [S1a spike runbook](https://github.com/avd-ops/avd-swarm/blob/main/spikes/s1a/README.md) for prerequisites and teardown verification before running.

```powershell
if (-not (Test-Path ~/avd-swarm/.git)) { git clone https://github.com/avd-ops/avd-swarm.git ~/avd-swarm }
Set-Location ~/avd-swarm; git checkout -q main; git pull -q --ff-only
& ~/avd-swarm/spikes/s1a/Invoke-Spike.ps1 -Provider Anthropic
```

## 4. Enable scheduled diagnostic runbooks in a private repo

Adopters run `avd-swarm`'s read-only diagnostic runbooks (`runbooks/<agent>/<name>.md`) from a private fork or companion repo using the workflow template.

<!-- more -->

Copy `templates/workflows/runbooks.yml` into your private repo, configure the read-only runner identity and kill switch, and verify runbooks locally before any scheduled run ([avd-swarm runbooks](https://github.com/avd-ops/avd-swarm/blob/main/runbooks/README.md)).
