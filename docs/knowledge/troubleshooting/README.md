---
title: "Known errors"
summary: "Errors hit in this project: symptom, cause, fix and source"
topic: troubleshooting
status: partial
last_reviewed: 2026-10-18
---

# Known errors

Errors we've hit, what caused them and what fixed them. The table is generated from
[known-errors.yaml](known-errors.yaml); fixes marked *(unverified)* haven't been confirmed yet.

<!-- BEGIN GENERATED: known-errors (edit the YAML, then run scripts/kb/build.py) -->
| Symptom | Cause | Fix | Source |
|---|---|---|---|
| deploy.sh: line N: ${JUMPBOX_OS,,}: bad substitution (or mapfile: command not found) | macOS ships Bash 3.2; avd-landing-zone's deploy.sh uses Bash 4 features (lowercase expansion, mapfile). | Run it from Azure Cloud Shell, or install a newer bash (Homebrew) and run it with that bash instead of /bin/bash. *(unverified)* | [0006-run-anywhere.md](../decisions/0006-run-anywhere.md) |
| $'\r': command not found | A Windows checkout with core.autocrlf turned a .sh file's line endings into CRLF. | Add `*.sh text eol=lf` to .gitattributes, or re-clone with `git config core.autocrlf input`. *(unverified)* | [0006-run-anywhere.md](../decisions/0006-run-anywhere.md) |
| az ... --ids fails with a resource ID that starts with C:/Program Files/Git/subscriptions/... | Git Bash (MSYS) converts arguments that start with / into Windows paths. | Set MSYS_NO_PATHCONV=1 before running the script, or run it from Cloud Shell. *(unverified)* | [0006-run-anywhere.md](../decisions/0006-run-anywhere.md) |
| assess/method.json does not match its hash in assess/PINS.json. Re-copy it from avd-assess at the pinned commit. | A Windows checkout with Git's default core.autocrlf (or `* text=auto`) wrote a vendored JSON file with CRLF, so its SHA-256 no longer matched the pin. Seen on a Windows CI runner. | Mark every hashed vendored file `-text` in .gitattributes (avd-current-state `assess/*.json`, `contracts/*.json`; avd-landing-zone `contracts/...`), then re-clone or `git rm --cached -r . && git reset --hard`. | [link](https://github.com/avd-ops/avd-current-state/pull/36) |
| Not a time: '2030-01-01T00:00Z' (deploy.sh --jumpbox-keep-running on macOS) | macOS ships BSD date, which has no -d; GNU `date -d` works on Linux, Cloud Shell and Git Bash only. Homebrew bash does not change this. Seen on a macOS CI runner. | Fall back to `date -j -u -f '%Y-%m-%dT%H:%MZ' "$value" +%s` when `date -d` fails (avd-landing-zone | [link](https://github.com/avd-ops/avd-landing-zone/pull/105) |
| A test that runs a script in a child pwsh with PSModulePath set to fake modules signs in for real (InteractiveBrowserCredential ... must be executed on the main thread on macOS) | pwsh puts the user and shared module folders back in front of PSModulePath at startup, so an Az install there (macOS runners keep one) wins over the fakes. | Set $env:PSModulePath inside the child (`pwsh -Command "`$env:PSModulePath = '<fakes>'; & '<script>' ..."`) instead of only in the parent. | [link](https://github.com/avd-ops/avd-current-state/pull/36) |
| GET /repos/{owner}/{repo}/pulls/{n} returns mergeable: null and mergeable_state: unknown for a pull request that is ready | GitHub works out mergeability in the background after a push or a base-branch change; the first read only starts that job. Unauthenticated callers also share 60 requests an hour per network, so polling in a loop runs out quickly (HTTP 403, x-ratelimit-remaining 0). | Treat unknown as still checking, never as ready, and read again a minute later. Cache results, skip pull requests already merged or closed, and read x-ratelimit-remaining and x-ratelimit-reset (exposed to browsers) before the next batch, as site/assets/checklist-core.js does. The rules in force on a branch (`/rules/branches/{branch}`) and private vulnerability reporting (`/private-vulnerability-reporting`) are readable without signing in on a public repo. | [link](https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request) |
| The menu (pages) button shows in the avd-ops brand bar on a wide screen, where the side list is already visible. | `.shell .menu{display:none}` lost to `.shell header.bar .iconbtn{display:grid}`, which is more specific (two classes and two elements against two classes). Design system 2.2.0 and earlier. | Scope the hide and the show to the same selector depth as the button style: `.shell header.bar .menu` (design system 2.3.0). A copy pinned at 2.2.0 or earlier can add that rule to its own stylesheet. | [0005-one-app-shell-for-every-page.md](../decisions/0005-one-app-shell-for-every-page.md) |
| TypeError: Cannot read properties of undefined (reading 'AvdOpsEngine') when a test requires a portal engine file | The repo's package.json says `type: module`, so Node loads every .js file under it as an ES module: `module` is undefined and `this` is undefined at the top level, and the UMD wrapper falls through to the browser branch. | Put a package.json with `"type": "commonjs"` beside the classic scripts (avd-ops `site/assets/engine/package.json`); a portal that vendors the engine into an ESM repo copies it too. | [link](https://github.com/avd-ops/avd-ops/blob/main/docs/portal-engine-spec.md) |
<!-- END GENERATED: known-errors -->

## Adding an entry

Add an entry to [known-errors.yaml](known-errors.yaml) with the exact error text as the symptom,
the versions it was seen on in `applies_to`, and a `source` (a KB page or an https link). Or open a
**Known error** issue, and a maintainer turns it into a pull request.
