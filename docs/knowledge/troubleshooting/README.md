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
<!-- END GENERATED: known-errors -->

## Adding an entry

Add an entry to [known-errors.yaml](known-errors.yaml) with the exact error text as the symptom,
the versions it was seen on in `applies_to`, and a `source` (a KB page or an https link). Or open a
**Known error** issue, and a maintainer turns it into a pull request.
