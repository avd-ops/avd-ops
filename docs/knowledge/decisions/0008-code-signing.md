---
status: accepted
date: 2026-10-21
decision-makers: [owner]
---

# 0008. Family scripts ship as attested, immutable releases; Authenticode only where Windows enforces it

## Context and Problem Statement

The owner asked how the family handles code signing and whether it should. An audit of the public
repos (2026-10-21) found no signed script, no tag, no release and no attestation; scripts reach
people through `git clone` in Azure Cloud Shell, through templates that embed host scripts at the
deployed commit, and through one runbook URL pinned to a commit. Cloud Shell, macOS and Linux never
check an Authenticode signature, and Windows checks one only for downloaded files, `AllSigned`, and
App Control or AppLocker script rules. The avd-linecheck log bundle, meant for helpdesks to push to
managed Windows PCs, must ship signed (its spec, section 17.5). What should the family sign, with
what, and at what cost?

## Considered Options

- Releases and provenance for every repo ($0), Authenticode through Azure Artifact Signing only for
  artifacts Windows policy will check (the log bundle first)
- Authenticode-sign every PowerShell file in every repo
- Provenance only, and leave Authenticode to each organization (they re-sign)
- A commercial OV certificate, the SignPath Foundation program, or minisign/GPG signatures

## Decision Outcome

Chosen option: "Releases and provenance for every repo, Authenticode only where Windows enforces
it", because it gives every person on every OS a way to check that code is what the family
published, for $0, and spends money only on the one artifact whose readers' policies demand a
publisher signature. Signing every file would help no current operator, since Cloud Shell and
`git clone` ignore signatures, and would break byte-identical pins. Provenance alone would leave
the log bundle unusable under App Control without each helpdesk re-signing it. An OV certificate
needs its key in hardware and a CA relationship, for more money than Artifact Signing; SignPath is neither open source nor Microsoft
and would name another publisher; minisign and GPG add a long-lived secret no OS checks.

- Immutable GitHub releases on every repo with scripts; commands and portals default to the
  latest release tag; artifacts a workflow builds get `actions/attest-build-provenance`.
- Authenticode through Azure Artifact Signing (Public Trust, Basic, $9.99 a month) from a GitHub
  Actions job signed in with OIDC, in an environment that needs the owner's approval, created only
  when the log bundle is ready to ship.
- Signed copies live in release assets only, never in git.

The full audit, the options, the verification commands and the cost: [code signing](https://github.com/avd-ops/avd-ops/blob/main/docs/code-signing.md).

### Consequences

- Good, because `gh release verify` and `gh attestation verify` work from Cloud Shell, Windows,
  macOS and Linux, and offline with a downloaded bundle and trusted root.
- Good, because nothing in the signing path is a stored secret.
- Bad, because commands pinned to a tag get fixes only when a release is cut.
- Bad, because an individual's Artifact Signing certificate carries their validated legal name,
  and the identity validation has to be renewed.
- Bad, because Artifact Signing issues a new leaf certificate daily, so `AllSigned` and Intune's
  signature check (both keyed on the leaf in Trusted Publishers) need per-release work or
  re-signing by the organization; only App Control can pin the durable EKU.

## More Information

Facts behind it, all from Microsoft Learn or GitHub Docs: non-Windows PowerShell's execution policy
is `Unrestricted` and can't be changed, and `Get-AuthenticodeSignature` exists only on Windows;
Artifact Signing certificates are renewed daily and valid 72 hours, so every signature must be
timestamped, and each certificate profile carries a durable EKU that App Control rules can pin to;
Artifact Signing is open to individuals in the USA and Canada only and bills a full month from
creation; immutable releases became generally available on 2025-10-28. Revisit when an
organization asks for signed landing zone scripts, or when the family has an organization that
can be validated instead of an individual.
