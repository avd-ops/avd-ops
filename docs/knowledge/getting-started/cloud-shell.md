---
title: "Working from Cloud Shell"
summary: "The conventions every AVD repo follows for Azure Cloud Shell: one self-contained block, pinned sources, nothing kept in the shell, one sign-in, redact before sharing, tear down with evidence"
topic: getting-started
status: partial
last_reviewed: 2026-10-21
---

# Working from Cloud Shell

Every AVD repo is written to run from Azure Cloud Shell (PowerShell), including from a tablet. Most
of the rules below came out of real runs that failed, and each one links to the lesson or decision
in the repo that owns it. This page states the conventions. The code stays in the repos.

## One block, pasted into a clean prompt

- **Every command we give is one self-contained block.** It clones the repo or updates it, moves
  into it, signs in if needed, and then runs the step. Nothing depends on a variable, folder or
  sign-in left over from an earlier session, because Cloud Shell sessions are ephemeral and
  disconnect when the tab loses focus
  ([landing zone lesson 0015](https://github.com/avd-ops/avd-landing-zone/blob/master/build/lessons/0015-cloud-shell-ergonomics.md)).
- **No placeholders to fill in.** The deployment portal writes the block with your values already in
  it. A block with `<your-value>` in it gets pasted unchanged sooner or later.
- **Paste into a clean prompt.** Cloud Shell opens PowerShell. Wait for the prompt, and paste once.
  In the browser terminal, the copy shortcut can turn into a cancel, so use the menu or a
  right-click to copy.
- **Each script prints its next command** and a line before anything slow, so a session that drops
  can pick up from where it stood.

## Pin what you run

- A block that clones a repo can pin it to a tag or commit. The portal does this for a published
  copy, so a run can be repeated exactly.
- For a single script fetched with `Invoke-WebRequest` from `raw.githubusercontent.com`, prefer a
  commit SHA in the URL over `main`. Reading the script before you run it is cheaper than
  diagnosing a changed one afterwards.

## Nothing is kept in the shell

- Cloud Shell keeps files only in `~/clouddrive` (and the `$HOME` image), and only when a storage
  account is mounted. An ephemeral session keeps nothing, and every session ends after about
  20 minutes without input
  ([Cloud Shell FAQ](https://learn.microsoft.com/azure/cloud-shell/faq-troubleshooting)).
- So **where a run stands comes from Azure**, not from the shell: deployment history, resource
  groups, tags. Long operations run as ARM deployments, which keep going when the session drops,
  and the scripts say how to check on them.
- **Anything you need to keep goes somewhere durable before the session ends.** That means a
  mounted `~/clouddrive`, a download, or the run store (next section).

## Session state, logs and resuming

The landing zone's
[run recorder](https://github.com/avd-ops/avd-landing-zone/blob/master/build/specs/run-recorder-spec.md)
holds these conventions. It's opt-in, and the default deployment doesn't change.

- **A state line closes every step.** Each script ends with one machine-readable line,
  `<<<AVDLZ-STATE {...} AVDLZ-STATE>>>`. You paste the output into the deployment portal, and the
  portal reads that line to show the next step
  ([decision 0007](https://github.com/avd-ops/avd-landing-zone/blob/master/build/decisions/0007-portal-state-line.md)).
- **"Where did I leave off?" reads Azure.** `Get-AvdRunStatus.ps1` works out the last stage from
  deployment history and the resource groups, and prints a state line, so a reset shell or a second
  device picks up at the right step. While a deployment is still running, the answer is "wait and
  check again", never a second deploy. Anything the script can't place is reported as `unknown`,
  not guessed.
- **One run ID for the whole run.** The portal generates it once (`run-yyyyMMdd-HHmm-xxxx`), and
  every block sets `$env:AVDLZ_RECORD` and `$env:AVDLZ_RUN_ID` again. A command run after a Cloud
  Shell reset still writes to the same journal.
- **A structured journal, not a screen scrape.** When recording is on, each script appends events
  as it runs: step start and end, each check result, API errors with status, code, body and
  correlation ID, and notes you add yourself. Secrets are written as `<set>` or `<unset>`, never as
  values.
- **The run store lives outside the deployment.** It's one storage account per subscription, in
  its own resource group. Journals, transcripts and teardown logs go there, so tearing down a
  landing zone never takes its own evidence with it. Logs are kept by default
  (`-TeardownLogs Keep`).
- **Redact before anything leaves the tenant**, and fail closed. If redaction can't run, nothing is
  uploaded or shared ([Redact before you share](#redact-before-you-share)).

## Sign in once, and check it

- Cloud Shell signs you in to Azure. Microsoft Graph is a separate sign-in. The landing zone signs
  in to Graph once per session with one set of scopes that every later script reuses
  ([`Connect-AvdLandingZone.ps1`](https://github.com/avd-ops/avd-landing-zone/blob/master/docs/reference/scripts-ops-Connect-AvdLandingZone.md),
  [decision 0016](https://github.com/avd-ops/avd-landing-zone/blob/master/build/decisions/0016-graph-operator-app.md)).
- Never hide the output of `Connect-MgGraph`, because the device code goes to that stream. Check a
  sign-in with a real request before trusting it
  ([lesson 0007](https://github.com/avd-ops/avd-landing-zone/blob/master/build/lessons/0007-graph-sign-in.md)).
- Check which tenant and subscription you're in before anything writes. The scripts take a
  subscription ID and switch to it, instead of trusting whatever context the shell had.

## Read first, fix on request

- Checks are read-only by default. Preflight before you deploy, postflight after. A script changes
  something only when you pass `-Fix` and it says what it changes.
- When an Azure or Graph call fails, the scripts print everything it returned: step, HTTP status,
  error code, body and correlation ID
  ([lesson 0012](https://github.com/avd-ops/avd-landing-zone/blob/master/build/lessons/0012-diagnose-first.md)).

## Cloud Shell can't reach private endpoints

Cloud Shell sits outside the landing zone's network, so it can't reach a private Key Vault or an
SMB-only profile share. For those steps, the landing zone offers an opt-in jumpbox reached through
Bastion Developer
([decision 0019](https://github.com/avd-ops/avd-landing-zone/blob/master/build/decisions/0019-jumpbox-bastion-developer.md),
[`Connect-AvdJumpbox.ps1`](https://github.com/avd-ops/avd-landing-zone/blob/master/docs/reference/scripts-ops-Connect-AvdJumpbox.md)).

## Redact before you share

Output pasted into an issue, a chat or a pull request leaves your tenant. The landing zone redacts
it first with the same rules as the deployment portal's issue report:
[`redact.mjs`](https://github.com/avd-ops/avd-landing-zone/blob/master/scripts/ops/redact.mjs).
`--level private` removes secrets only. `--level public` also removes tenant names, IDs, emails and
domains. Never paste a secret anywhere.

## Costs

- **Price before you deploy.** The pre-deployment preflight prices the landing zone from live
  retail prices. Every cost line must match exactly one price meter, or it lists the meters it saw.
  A price is never guessed
  ([decision 0010](https://github.com/avd-ops/avd-landing-zone/blob/master/build/decisions/0010-sizing-and-cost.md),
  [lesson 0025](https://github.com/avd-ops/avd-landing-zone/blob/master/build/lessons/0025-retail-price-lookalike-meters.md)).
- **A run estimate is an upper bound.** Session hosts are priced as running for every hour of the
  run, everything else is prorated by the hour, and 20% is added for what the preflight lists as
  usage-based (Log Analytics, data processed, Defender). The estimate also gives the daily cost if
  the deployment is not torn down.
- **Check caps before deploying.** A run is refused if it's over a per-run cap, if it would push
  the month's actual spend past a monthly cap, or if a line couldn't be priced. Once a few runs of
  the same kind have settled, the check scales the estimate by how far past estimates were off, so
  estimates that run low stop letting runs through.
- **Actual cost comes later.** Cost Management lags up to three days. A run's actual cost is the
  cost of its resource groups from the start day to three days after teardown, and it's
  provisional until then. Charges after that day mean something was left behind.
- **Teardown evidence is a diff.** Before deploying, record every resource and resource group in
  the subscription. After teardown, compare again. Anything new is a leftover, and the run isn't
  done until it's gone or recorded as kept on purpose.
- **Keep a standing budget** on any sandbox subscription, one that teardown doesn't delete. The
  landing zone's preflight warns when a dev or test landing zone has none.

## Leave nothing billing, delete nothing you can't get back

- **Never leave the meter running.** Anything that bills by time is removed, stopped or on a
  schedule at the end of a run, unless you opt in with an expiry
  ([decision 0017](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0017-never-leave-the-meter-running.md)).
- **Never delete the last copy.** Teardown keeps logs and evidence by default, and deleting data
  needs a checked copy elsewhere or an explicit `-DiscardLastCopy`
  ([decision 0016](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0016-never-delete-the-last-copy.md)).
- **Estimate first, then keep teardown evidence:** what was removed, and that nothing is left.
  Running several test runs this way is described in [sandbox batches](../concepts/sandbox-batches.md).

## Where the helpers live

These stay in their repos. avd-landing-zone and avd-current-state are a self-contained pair, so
neither depends on a shared kit.

| Helper | Repo |
|---|---|
| Block builder (clone or update, pin, record) | avd-landing-zone, deployment portal |
| Cloud Shell detection, subscription guard, REST wrappers with full errors | avd-landing-zone `scripts/ops/AvdLandingZone.psm1` |
| One Graph sign-in per session | avd-landing-zone `Connect-AvdLandingZone.ps1` |
| Run recorder, run store and "Where did I leave off?" | avd-landing-zone `scripts/ops/` |
| Cost estimate and preflight pricing | avd-landing-zone preflight (decision 0010) |
| Redaction | avd-landing-zone `scripts/ops/redact.mjs` |
| Read-only collector and validator, output to `~/clouddrive` | [avd-current-state](../repos/avd-current-state.md) |
