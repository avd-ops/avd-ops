# Code signing and release provenance for family scripts

A convention for every repo in the family, next to [run anywhere](run-anywhere.md),
[never delete the last copy](never-delete-the-last-copy.md) and
[never leave the meter running](never-leave-the-meter-running.md). The decision record is
[avd-ops decision 0007](knowledge/decisions/0007-code-signing.md). Status: **proposed**
2026-10-21. Nothing here is built, bought or switched on until the owner says so (section 8).

## 1. Short answer

- **Today nothing in the family is signed, tagged or attested** (section 2). That is mostly fine,
  because almost every script runs in Azure Cloud Shell or from a `git clone`, and neither checks
  a signature.
- **Do first, for $0: immutable GitHub releases with attestations, and commands pinned to a
  release tag.** That answers the question most people actually have ("is this the code the
  family published, at the version I think?") on every OS, Cloud Shell included.
- **Add Authenticode only where Windows enforces it**, which today means one artifact: the
  avd-linecheck log bundle script, which its spec already says ships only signed. Use Azure
  Artifact Signing from a GitHub Actions job with OIDC (no secret), about $9.99 a month, started
  when that script is ready to ship and not before.
- **Do not sign the landing zone's scripts in place.** No one who runs them today gains from it,
  and signing every file in git would break byte-identical pins and line-ending handling
  (section 6).

## 2. What we do now (audit, 2026-10-21)

Read from the repos, not assumed:

| Path a script takes | Where | What protects it now |
| --- | --- | --- |
| Cloud Shell block: `git clone` or `git pull` of the default branch | Every operator doc and both portals | HTTPS to github.com. No pin: a block run twice can run different code |
| Portal block with a ref: `git fetch --tags; git checkout <ref>` | avd-landing-zone portal (`portal-core.js`) | A pin, when the operator gives one. No repo has a tag yet |
| Host scripts embedded in the template (`loadTextContent`) into Run Commands and image builder steps | avd-landing-zone `bicep/modules/sessionHosts.bicep`, `jumpbox.bicep`, `bicep/images/build.bicep` | The commit that was deployed. Nothing is fetched at run time |
| Automation runbook fetched by URL from `raw.githubusercontent.com` | avd-landing-zone `bicep/main.bicep` `autoShutdownRunbookUri` | `deploy.sh` pins it to the deployed commit SHA when GitHub has that commit; otherwise it falls back to the default branch, and the parameter files' default still names the repo's pre-move owner (a redirect) |
| `iwr ... \| iex` one-liners | None found in any public repo | Nothing to change. The portal tests already refuse `irm`/`iex` in generated commands. Files fetched with `Invoke-WebRequest`, `Invoke-RestMethod` or `curl.exe` carry no Mark of the Web, so `RemoteSigned` would never check them anyway |
| Release assets, tags, attestations | None in avd-landing-zone, avd-current-state, avd-swarm, avd-ops | avd-swarm's v1 review (gap G6) and the brain's operations spec already ask for attested releases |
| Authenticode signatures | No `.ps1`, `.psm1` or `.psd1` in any public repo carries one | |

About 100 PowerShell files would be in scope across the public repos (landing zone 52,
liquidware tier 18, brain 12, current state 8, swarm 7, not counting tests).

## 3. What signing would add, and for whom

Two different promises are often both called "signing":

- **Authenticode** says "a certificate authority checked who the publisher is, and this file has
  not changed since they signed it". Windows checks it, and only Windows.
- **Provenance** (GitHub artifact attestations, Sigstore, SLSA) says "this exact file was built by
  this workflow, from this commit, of this repository". Anyone can check it with `gh`, on any OS.

| Where the script runs | Does anything check a signature? | What helps |
| --- | --- | --- |
| Azure Cloud Shell (PowerShell or Bash prompt) | No. Cloud Shell is Linux; on non-Windows PowerShell the execution policy is `Unrestricted` and can't be changed, and `Get-AuthenticodeSignature` does not exist | A release tag and `gh release verify` (GitHub CLI is preinstalled in Cloud Shell) |
| macOS or Linux, `pwsh` or `bash` | No, same as above | Same |
| Windows, PowerShell 7 or 5.1, default `RemoteSigned`, from `git clone` | No. Git does not add the Mark of the Web, so local files run | Same |
| Windows, `RemoteSigned`, file downloaded in a browser (a zip or a `.ps1`) | Yes. The download carries the Mark of the Web, so an unsigned script is blocked until signed or unblocked | Authenticode |
| Windows, `AllSigned` set by Group Policy | Yes, every script, and the publisher must be trusted: an interactive prompt, or the signing certificate in Trusted Publishers. Both key on the leaf certificate, and Artifact Signing issues a new one every day, so each release is a new publisher to PowerShell | Authenticode plus the release's certificate pushed to Trusted Publishers, or the organization re-signs |
| Windows with App Control for Business (WDAC) or AppLocker script enforcement | Yes. An unsigned script runs in Constrained Language Mode or not at all; a signed one runs in Full Language Mode only if the policy allows that signer or that hash | Authenticode, plus the organization adding a rule (section 5) |
| Intune platform script with "Enforce script signature check" | Yes, the signer must be in Trusted Publishers (same leaf-certificate problem as `AllSigned`; nobody can answer a prompt in system context). Platform scripts must stay under 200 KB | The organization re-signs, or pushes that release's certificate |
| Run Command, image builder step, Automation runbook | No. Azure runs the content it was given | The pinned commit or tag the template was built from |

Execution policy is not a security boundary (Microsoft says so); App Control is. So Authenticode
pays off where an organization's own policy demands it: a helpdesk pushing the linecheck log
bundle to managed PCs is the one case the family has today. Operators of the landing zone work in
Cloud Shell and gain nothing from it.

## 4. Options

Family rules applied: open source or Microsoft platform only, keyless where possible, no secret
in any repo, and the owner pays for anything that bills.

| Option | Kind | Keyless from Actions | Cost | Verdict |
| --- | --- | --- | --- | --- |
| **GitHub immutable releases** (tag locked to a commit, assets can't change, release attestation) | Provenance | Yes, nothing to manage | $0 | **Adopt now** |
| **GitHub artifact attestations** (`actions/attest-build-provenance`, Sigstore public-good instance for public repos, SLSA build provenance) | Provenance | Yes, the workflow's OIDC token | $0 for public repos | **Adopt now**, for files a workflow builds (the assembled log bundle script) |
| **Azure Artifact Signing** (formerly Trusted Signing; Microsoft-managed keys in an HSM, certificates renewed daily and valid 72 hours, a durable per-profile EKU) | Authenticode, publicly trusted | Yes: `azure/login` with a federated credential, then Microsoft's signing action or `ArtifactSigning` module on a Windows runner | Basic $9.99 a month (5,000 signatures; billed for the full month, not prorated) | **Adopt for the linecheck log bundle only**, when it ships, on the owner's go |
| Sigstore `cosign sign-blob` on its own | Provenance | Yes | $0 | Not needed: the attestation above is the same Sigstore service with GitHub's identity built in. Reference only |
| SignPath Foundation (free for OSI-licensed projects) | Authenticode | Yes | $0 | Prior art only: a third-party service that is neither open source nor Microsoft, and the publisher on every signature would be the foundation, not the family |
| Organization validation (OV) certificate from a commercial CA | Authenticode | Possible: since 2023 the key must live in hardware, and a cloud HSM (Key Vault Premium or Managed HSM) reached with OIDC qualifies | About $150 to $300 a year, plus the HSM and a CA relationship | Reject: more money and more moving parts than Artifact Signing for the same result |
| minisign or GPG signatures | Detached signature | No: a long-lived private key is a secret to guard and rotate | $0 | Reject: no OS checks it, and it adds a secret |
| Self-signed certificate | Authenticode, untrusted | n/a | $0 | Reject for publishing. Still the right tool **for an organization that re-signs** our script with its own enterprise CA (section 5) |

## 5. Recommendation

### 5.1 Every repo with scripts: releases and pins ($0)

1. Turn on **immutable releases** for the repo **before the first tag** (a repository setting the
   owner flips; the org can set it for all its repos). Releases made earlier stay mutable.
2. Add a free **tag ruleset** on `refs/tags/v*` (no update, no delete), because a tag without a
   release is not protected by immutability.
3. Cut releases as tags (`vMAJOR.MINOR.PATCH`). An immutable release locks its tag to a commit and
   gets a release attestation over its assets. Which fields `gh release verify` reports (assets
   and digests for sure; the commit is to be confirmed on the first release) gets written here
   after the first real run.
4. Command blocks and portals take the **latest release tag by default**, with the default branch
   as an explicit "newest, unreleased" choice. The landing zone's portal already accepts a ref.
5. A person can check a release on any OS, including Cloud Shell. Draft, to be finalized on the
   first real release (`v0.1.0` is a placeholder; `gh` needs one `gh auth login` per Cloud Shell
   session):

```bash
gh auth status >/dev/null 2>&1 || gh auth login; gh release verify v0.1.0 -R avd-ops/avd-landing-zone && { [ -d ~/avd-landing-zone ] || git clone https://github.com/avd-ops/avd-landing-zone.git ~/avd-landing-zone; } && cd ~/avd-landing-zone && git remote set-url origin https://github.com/avd-ops/avd-landing-zone.git && git fetch -q --tags origin && git checkout -q v0.1.0 && git rev-parse 'v0.1.0^{commit}'
```

   The release is verified before the checkout, an existing folder is pointed back at the right
   remote, and nothing hides a failed step. The printed commit is the one the release page shows.

6. The landing zone's runbook URL pins to the release tag, or to a commit SHA, never to the
   default branch: `AVD_RUNBOOK_URI` becomes required, and `deploy.sh` fails when the deployed
   commit is not on the remote instead of falling back to the default branch.

No Authenticode for these repos until someone shows an `AllSigned` or App Control environment
that runs operator scripts locally. If that day comes, the signed copies go **into a release
asset** (a zip), never back into git.

### 5.2 avd-linecheck log bundle: signed and attested

When the collector exists (its spec, section 17, makes signing a prerequisite):

1. A release workflow on a Windows runner assembles the one `.ps1` from the tested module,
   signs it with **Artifact Signing** (Public Trust, timestamped with Microsoft's timestamp
   service, because the certificate itself expires after 72 hours), and attests the signed file
   with `actions/attest-build-provenance`.
2. The workflow signs into Azure with **OIDC**: a federated credential whose subject is exactly
   `repo:avd-ops/avd-linecheck:environment:release`, an environment limited to `v*` tags, and one
   role (Artifact Signing Certificate Profile Signer) on one certificate profile. Workflow
   permissions: `id-token: write`, `attestations: write`, `contents: read`. No secret anywhere.
   With one maintainer, the environment's required reviewer is the person who pushed the tag, so
   the approval is a self-check; the subject, tag and role scoping are what bind. The first dry
   run uses a Public Trust Test profile (not publicly trusted, no identity validation) to prove
   `.ps1` signing with `files-folder-filter: ps1` on `windows-2025`.
3. The release is immutable. The README gives three ways for a helpdesk to trust it, in order:
   - **re-sign with their own code-signing certificate** after checking ours, which is what many
     organizations already do for any script they deploy, and the only option that also works
     for `AllSigned` and Intune's signature check without per-release work;
   - an **App Control signer rule on the profile's durable EKU** (survives the daily certificate
     renewals; a new profile means a new EKU and a new rule). App Control only: AppLocker rules
     have no EKU condition. For scripts the signing root must be in the device's trusted root
     store; where automatic root updates are off, deploy the Microsoft Identity Verification
     root first;
   - a **hash rule** for that one release.
4. Checks a person can run:

```powershell
pwsh -NoLogo -Command 'Get-AuthenticodeSignature ./Get-AvdLogBundle.ps1 | Format-List Status, StatusMessage, SignerCertificate, TimeStamperCertificate'
```

```bash
gh attestation verify ./Get-AvdLogBundle.ps1 -R avd-ops/avd-linecheck
```

### 5.3 What a person can verify offline

| Check | Offline? |
| --- | --- |
| Authenticode on Windows | The chain and timestamp, yes. Revocation needs the network or a cached list |
| Artifact attestation | Yes, after fetching two files while online: `gh attestation download <file> -R <repo>` and `gh attestation trusted-root > trusted_root.jsonl`, then `gh attestation verify <file> -R <repo> --bundle <bundle> --custom-trusted-root trusted_root.jsonl`. The trusted root is good until Sigstore rotates keys, a few times a year, and a revoked key is unknown offline until the root is fetched again |
| A SHA-256 hash | Yes, but a hash published on the same site as the file proves nothing if that site is compromised; it is a convenience, not evidence |

## 6. Things that break if done carelessly

- **Signing changes the file.** The signature block is appended to the script, so a signed copy
  never matches a pinned SHA-256 or a byte-identical vendored copy. Sign release assets only.
- **Line endings.** Authenticode covers the exact bytes. A Windows checkout with
  `core.autocrlf` turns a signed LF file into an invalid CRLF one. Another reason to sign only
  release assets.
- **No timestamp, no signature after three days.** Artifact Signing certificates last 72 hours;
  an untimestamped signature stops validating when the certificate expires.
- **Modules and Constrained Language Mode.** A signed script that imports an unsigned module
  crosses a trust boundary and the import is refused under App Control; the log bundle ships as
  one file for this reason.
- **The publisher name is a legal name.** For an individual, Artifact Signing takes the legal name
  and address from the Azure billing account (type Individual) and puts the validated name in
  every certificate; a custom name is not allowed. The subject may also carry city and state; check
  the profile's subject before signing anything public. Free, trial and sponsored subscriptions
  are refused. Identity validation must be renewed (Microsoft quotes 1 to 20 business days for the
  review), and if it lapses, signing stops.
- **Signing does not fix SmartScreen at once.** A new publisher builds reputation over weeks; EV
  certificates no longer skip that.
- **The Windows root list.** Microsoft says Artifact Signing's code-signing CAs are leaving the
  cross-vendor CA database and the Trusted Root Program but stay on the Windows platform trust
  list. Windows is the only place the signature is checked, so this does not change the plan, but
  a locked-down device that never updates its root list needs the root deployed (section 5.2).

## 7. Cost

| Item | Monthly | When |
| --- | --- | --- |
| Immutable releases, attestations, Actions on public repos (Windows runner included) | $0 | Now |
| Artifact Signing, Basic | $9.99 (the family would use well under 100 of the 5,000 signatures) | Only when the log bundle is ready to ship |
| Anything else (OV certificate, HSM, Premium tier at $99.99) | Not planned | |

The Artifact Signing account would live in the owner's own subscription and bills for a whole
month from the day it is created. Delete the account when nothing is being signed; existing
signatures stay valid.

## 8. What needs the owner's go

1. Turn on immutable releases (avd-landing-zone and avd-linecheck first, or the whole avd-ops
   org) and cut the first landing zone release.
2. Make release tags the default in command blocks and portals.
3. Create the Artifact Signing account, run individual identity validation, and accept the
   validated legal name as the visible publisher, at $9.99 a month, when the log bundle is ready.
4. Add the federated credential and the `release` environment in avd-linecheck.

## 9. Open questions

1. Is the owner comfortable with their legal name (and possibly city and state) as the
   publisher on signed files, or should signing wait until there is an organization to validate
   instead?
2. Release tags by default, or keep the default branch as the default and offer tags as an
   option? Tags are safer; the default branch gets fixes to people sooner.
3. Immutable releases per repo or for the whole avd-ops org at once?
4. Should the landing zone publish a signed zip for `AllSigned` environments now, or only when
   someone asks? (Recommended: when someone asks.)
5. Is the helpdesk path right as ordered (re-sign first, App Control EKU rule second, hash
   third)? It is the honest answer for `AllSigned` and Intune, but it means our signature mostly
   serves App Control and browser downloads.

Answered while writing: artifact attestations on GitHub Free, Pro and Team plans exist only for
public repositories (private ones need GitHub Enterprise Cloud), so private repos get immutable
releases and tag rulesets only.

## 10. Review

Red-teamed with Fable before this version. Fixed from it: `gh release verify`'s output is not
assumed; the verify block no longer hides a failed clone and verifies before checkout; daily leaf
certificates break `AllSigned` and Intune trust per release, so re-signing comes first;
AppLocker has no EKU rule and scripts need the root in the device store; an OV key can be
keyless through a cloud HSM; tag rulesets and environment scoping added; the private-plan fact
answered; the certificate's address fields flagged.

## 11. Sources

Microsoft Learn: Artifact Signing overview, certificate management (short-lived certificates,
durable EKU, timestamping, trust list note), trust models, signing integrations, FAQ (pricing,
billing, eligibility: individuals in the USA and Canada); code-signing options for Windows app
developers; SmartScreen reputation; App Control script enforcement; Intune platform scripts; `about_Execution_Policies`, `Set-ExecutionPolicy` (non-Windows
is `Unrestricted`), `Get-AuthenticodeSignature` (Windows only), `about_Language_Modes`; Azure
Cloud Shell features (GitHub CLI preinstalled). GitHub Docs: artifact attestations, verifying
attestations offline, immutable releases (generally available 2025-10-28). Family: avd-linecheck
`docs/spec.md` sections 17.5 and Q11; avd-landing-zone `scripts/deploy/deploy.sh`,
`bicep/main.bicep`, `site/portal/portal-core.js`; avd-swarm `docs/v1-review.md` (G6);
avd-second-brain `docs/operations-spec.md` (releases carry attestations).
