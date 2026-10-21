---
status: accepted
date: 2026-10-21
decision-makers: [owner]
---

# 0004. Every outside submission is a GitHub issue form in the repo that owns it

## Context and Problem Statement

Three surfaces will ask outsiders to send things in: the credits and contributors page, the
standards and research review UI, and the support mailbot. What they send (evidence, research,
research requests, feedback and disputes, bug reports, feature requests) has to reach the right
repo in a reviewable shape, without a server, a secret or personal data held by us. How should
submissions get in?

## Considered Options

- GitHub issue forms in each owning repo, vendored from one canonical set in avd-ops, with one
  routing table and a link builder the three surfaces share
- A form endpoint (Staticman or a small Worker) that opens issues or pull requests with a bot token
- A hosted form or helpdesk service

## Decision Outcome

Chosen option: "GitHub issue forms", because GitHub Issues is already the tracker, the forms need
no server and no token, GitHub sign-in is the spam barrier, and the family already uses issue forms
for its KB and for avd-assess evidence. The design is [docs/submissions-spec.md](../../submissions-spec.md).

### Consequences

- Good, because it costs nothing, holds no personal data beyond the person's own issue, and a
  person reads every submission before anything acts on it (`accepted` is applied by hand).
- Good, because one routing table names repos from `repos.json`, so moves and renames change one file.
- Bad, because a submitter needs a GitHub account; the mailbot is the path for anyone without one,
  and Nick opens the issue.
- Bad, because forms are vendored into each repo and can drift; `family.yml` checks them weekly.

## More Information

A repo with its own `.github/ISSUE_TEMPLATE/` ignores an org `.github` repo's defaults, and every
family repo but avd-current-state has one, so defaults alone can't share the forms. Never put the
submitter's text in a prefilled issue URL: it would sit in browser history and referrers (mailbot
red team finding 6). Revisit if outside submissions outgrow manual triage.

Accepted by Nick on 2026-10-21, with: the function is shared by the three foundation repos
(avd-landing-zone, avd-current-state, avd-assess), credit by GitHub username, no email approval
step (`accepted` is the approval, and only accepted research requests are shown). GitHub's form
`labels:` apply only labels that already exist, so the labels are created first with
`submissions/labels.mjs`.

The private routes are shown as the plain address with a copy control as well as a mailto link:
many webmail users get nothing from a mailto click. The mailto is exactly
`mailto:<address>?subject=%5B<tag>%5D` (RFC 6068), with nothing else in it.
