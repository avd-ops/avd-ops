# Submissions: one intake for the AVD family

Status: design, 2026-10-21. Nothing is built. Proposed as [decision 0004](knowledge/decisions/0004-submissions-are-github-issue-forms.md).

A submission is anything someone outside sends the family to make it better: **evidence, research,
a research request, feedback (praise, a problem, or a dispute or fact check), a bug report or a
feature request**. Each one has to land in the right repo,
with the right labels, in a shape the maintainer can review. Three surfaces send them: the
**credits and contributors page** and the **standards and research review UI** on avd-ops.dev, and
the **support mailbot** (designed separately, not built). They share one function, kept here in avd-ops:
one list of types, one routing table, one set of issue forms, and one link builder.

## 1. The decision in one line

**Every submission is a GitHub issue, opened through an issue form in the repo that owns it.**
No server, no database, no new tracker (GitHub Issues stays the tracker), no secret, $0. A person
reads every issue before anything acts on it.

## 2. Prior art and build or adopt

Prior-art check (`scripts/kb/prior_art.py "submission intake issue forms"`): nothing in this KB;
the sibling and GitHub searches failed from the container (403), so the family part rests on reading
the sibling repos directly. Found there: **avd-assess already has one evidence path**
([gaps/evidence-intake.md](https://github.com/nickprignano/avd-assess/blob/main/gaps/evidence-intake.md),
its "Baseline evidence" issue form and `scripts/check_evidence.py`), and avd-ops, avd-second-brain
and 2ndbrain share three KB issue forms (`kb-feedback`, `kb-known-error`, `kb-source`). This spec
generalizes those; it replaces neither.

| Candidate | License | What it does | Verdict |
|---|---|---|---|
| GitHub issue forms (YAML in `.github/ISSUE_TEMPLATE/`) | GitHub feature | Typed fields, required checkboxes, labels, prefill from URL query parameters | **Adopt.** It is already the tracker, needs no server, signs people in for us, and the family already uses it. |
| Org `.github` repo default templates | GitHub feature | One template set for every repo in the org | Not enough alone: a repo with its own `ISSUE_TEMPLATE/` folder ignores the defaults, and every repo but avd-current-state has one. We vendor instead (section 6). |
| Staticman | MIT | Form POST to a hosted bot that opens a PR | Needs a running server and a GitHub token with write access: a secret and an attack surface for a job issue forms do. |
| Probot-style form-to-PR apps | various, some experimental | Same shape as Staticman | Same objection. |
| Hosted form services (Formspree, Netlify Forms and similar) | Closed | Form endpoint, inbox, spam filter | Closed and keep the submitter's data elsewhere: prior art only. |
| GitHub Discussions, giscus | MIT (giscus) | Threads on a page | Good for conversation, wrong for intake: no required fields, no consent checkboxes, no routing. Can link to it later for questions. |

Parity checklist taken from the rejected tools: required fields, a spam barrier, moderation before
publication, one-click from the page, and a confirmation the person can see. Issue forms give the
first, sign-in gives the second, section 7 gives the third, and the link builder the last two.

## 3. Types

| Type | What it is | Typical source |
|---|---|---|
| `evidence` | Measured results or real-run findings that agree, disagree with or extend a claim or baseline. Aggregates only. | review UI, mailbot |
| `research` | A new source or a new claim from a source, with a pinned link. | review UI, mailbot |
| `research-request` | A question we should research or a gap in the standards someone wants filled. Goes both ways: anyone can ask us, and we post our own calls for help the same way. | review UI, credits page, mailbot |
| `feedback` | Positive or negative feedback on a page, a standard or a tool, or a **dispute**: a fact check of a claim, a standard, a source or a page (section 9a). | review UI, any page, mailbot |
| `bug` | Something in a repo does the wrong thing. | any page, mailbot |
| `feature` | Something a repo should do. | any page, mailbot |

A support question is not a type: it arrives by mail, Nick answers it, and if it turns into one of
the six he opens that issue (section 5.3). Credit is not a type either: it is an opt-in on any of
the six (section 8).

## 4. The shared pieces (all in avd-ops)

```text
submissions/
  types.json          the six types, their labels and the form each uses
  routing.json        type + area -> repo, form and labels (section 4.2)
  forms/*.yml         the canonical issue forms, vendored byte-identical into each repo
  README.md           how to add a type, an area or a repo
site/assets/submit.js the link builder (section 4.3); the pages work without it
scripts/submissions/  check-routing.mjs (routing only names repos in repos.json, every form exists)
                      check-vendored.mjs (each repo's copy matches; run by family.yml weekly)
tests/submissions.test.mjs
```

### 4.1 Submission schema

The same fields whatever the surface, so every form, the link builder and the mailbot agree.
`submissions/schema.json` (`avd-ops-submission/v1`) describes the issue a form produces:

| Field | Required | Notes |
|---|---|---|
| `type` | yes | one of section 3; fixed by the form, not chosen by the person |
| `kind` | `feedback` only | `praise`, `problem` or `dispute` |
| `area` | yes | a key in `routing.json` (for example `assess.baselines`, `landing-zone`, `site`) |
| `target` | no | the page, claim, gap or check it is about: a path, `ref:<source>#<claim>`, `gap:<id>` or a check ID. Never a URL outside the allowlist. |
| `summary` | yes | the title, short |
| `details` | yes | the body text, in the person's words |
| `pin` | `research`; `feedback` disputes when they cite a source | a commit SHA, a Learn page's `git_commit_id` and `updated_at`, or an archived copy's URL and the date read |
| `evidence_file` | `evidence` only | the file that passed `check_evidence.py` |
| `consent` | yes | checkboxes: public-safe (always), owner consent (`evidence` from an estate), MIT license (`evidence`, `research`) |
| `credit` | no | checkbox: "credit me by my GitHub username on the contributors page" |

There is no field for an email, a phone number, a company, a tenant, a host or a user name. The
person is their GitHub account; the forms never ask for contact details.

### 4.2 Routing table

`routing.json` names repos by their key in [repos.json](../repos.json), so the org move and any
rename change one file. Labels: every submission gets `submission`, `type:<type>` and
`needs-triage`; the area adds its own.

| Type | Area | Repo | Form | Extra labels |
|---|---|---|---|---|
| `evidence` | baselines, sizing, any measured metric | avd-assess | `baseline-evidence.yml` (exists) | `evidence` |
| `evidence` | a real-run finding (not a metric) | avd-assess | `finding.yml` | `observation` |
| `research` | a source, claim or reference | avd-assess | `research.yml` | `research` |
| `research` | a gold standard or a check's claim | avd-assess | `research.yml` | `research`, `gold-standards` |
| `feedback` (dispute) | a claim, standard, baseline, gold standard or check | avd-assess | `dispute.yml` | `dispute`, `dispute:open` |
| `feedback` (dispute) | a page on avd-ops.dev or a KB page | the page's repo | `dispute.yml` | `dispute`, `dispute:open` |
| `feedback` (praise, problem) | any page or repo | the page's repo, else avd-ops | `feedback.yml` | `feedback` |
| `research-request` | the standards, a gap | avd-assess | `research-request.yml` | `research-request`, `gap:<id>` when given |
| `research-request` | anything else | avd-ops | `research-request.yml` | `research-request` |
| `bug`, `feature` | deployment, the deployment portal | avd-landing-zone | `bug.yml` / `feature.yml` | |
| `bug`, `feature` | collection, validation, the assessment portal | avd-current-state | `bug.yml` / `feature.yml` | |
| `bug`, `feature` | the method, checks, contracts | avd-assess | `bug.yml` / `feature.yml` | |
| `bug`, `feature` | agents, governance | avd-swarm | `bug.yml` / `feature.yml` | |
| `bug`, `feature` | knowledge, the brain's contracts | avd-second-brain | `bug.yml` / `feature.yml` | |
| `bug`, `feature` | avd-ops.dev, the docs, the design system | avd-ops | `bug.yml` / `feature.yml` | `site` |
| `bug` | a KB page is wrong or out of date | the KB's repo | `kb-feedback.yml` (exists) | `kb-feedback` |
| unsure | "I don't know where this goes" | avd-ops | `bug.yml` / `feature.yml` | `needs-routing` |

A wrong repo is cheap: the maintainer transfers the issue (GitHub keeps its history), and the
`needs-routing` row means a person never has to know the family to submit.

`gap:<id>` labels are created only for gaps that have an open request, so the label list stays
short. Each gap file in avd-assess gets one line: "Open research requests:" linking
`issues?q=is:open+label:research-request+label:gap:<id>`.

### 4.3 The link builder

`submit.js` turns `{type, area, target, summary}` into
`https://github.com/<repo>/issues/new?template=<form>&title=<summary>&target=<target>`, from
`routing.json`. That is all it does.

- **Prefill only what the page already knows** (the type, the area, the claim or gap ID, a title
  stub). Never the person's text: that is typed into GitHub's form, so it never sits in a URL,
  browser history or a referrer. Prefilling form fields by their `id` is documented by GitHub; test
  it once on each form before relying on it, and fall back to `template=` alone.
- **Built at build time too.** Every button is a plain `<a href>` written by the site build from
  `routing.json`; `submit.js` only refines it (for example adding the claim a reviewer selected).
  With scripts off, every link still works.
- **One allowlist.** Only `github.com/<repo>` for repos in `repos.json`. The same function is
  what the mailbot's gate uses to build its repo-and-template link, so the mailbot never invents a
  destination (mailbot spec section 5 step 9).

## 5. How each surface calls it

### 5.1 Standards and research review UI

Each claim, gap, check and baseline row gets a small action menu, built from `routing.json` with
the row's ID as `target`:

- **Suggest a source** -> `research` (`target: ref:<source>#<claim>`)
- **Dispute this / fact check** -> `feedback` dispute (`target:` the claim, standard or check ID)
- **Send evidence** -> `evidence`; links the evidence README and the check first
- **Ask for research** on a gap -> `research-request` (`target: gap:<id>`)
- **Report a problem** with the method -> `bug` (avd-assess)

It also shows, per gap, the open research requests, and per claim or standard its **dispute
status** (none, open, accepted, rejected, with a link to the reasons), read at build time
(section 8), so a reader sees what is already asked or disputed before asking again.

### 5.2 Credits and contributors page

- Lists people who opted in to credit (section 8), each with what they contributed and links.
- Shows **open calls for help**: open `research-request` issues in avd-assess and avd-ops, newest
  first, each with its gap. Ours look the same as anyone's: when we want outside research, Nick
  opens a `research-request` with the `call-for-help` label, and it shows first.
- **Thanks for corrections:** people whose dispute was accepted are listed first, with the claim
  they corrected (credit opt-in still applies).
- One "Contribute" block with the six types, each a link from the builder.

### 5.3 Support mailbot

Mail stays mail. The mailbot never opens an issue itself, and never puts the sender's words in a
URL (its red team, finding 6). In the notification to Nick, its gate picks a type and area from
the category, builds the link with the same builder (repo and form only), and Nick decides whether
to open it and what goes in. If a sender wants credit, Nick asks them to submit on GitHub
themselves; a mailed contribution is credited only with their written yes, by the name they give.
This is the path for anyone without a GitHub account.

## 6. Forms live in each repo, vendored from here

An issue form must live in the repo whose issue it opens. The canonical forms are in
`submissions/forms/`, each repo copies the ones its routing rows need, byte-identical, and
`family.yml`'s weekly check (`check-vendored.mjs`) reports drift as it already does for the brand
line. A repo keeps its own extra forms (handoff, KB forms). Each repo's `config.yml` adds two
`contact_links`: "Not sure where this goes?" (the avd-ops `needs-routing` form) and the docs.
Blank issues stay on.

avd-assess's `baseline-evidence.yml` moves to `submissions/forms/` unchanged and is vendored back,
so its evidence path stays exactly as written.

## 7. Untrusted input: spam, abuse and prompt injection

Every issue body is untrusted text, written by anyone with a GitHub account.

- **Spam barrier:** GitHub sign-in, GitHub's own spam and abuse filters, and the owner's
  interaction limits and blocking as the backstop. No form of ours accepts anonymous posts.
- **Nothing acts on a submission until a person says so.** `needs-triage` is removed and
  `accepted` added by the owner, by hand, the same rule as `handoff` (avd-second-brain decision
  0014). No agent, curator or workflow treats a submission as a task, a directive or a handoff, and
  the handoff lister ignores `submission` issues.
- **Agents read submissions as data.** The brain's curator and any Claude session may summarize or
  draft from an accepted issue, quoted inside an untrusted block, with no tools that write; a
  model never decides a verdict (avd-assess rule). A submission can propose a source; only a
  reviewed PR adds it to `references/`.
- **Workflows:** a `submission-check` workflow on `issues: [opened, edited]` with
  `permissions: issues: write, contents: read` may only add labels and one comment. It reads the
  body from the event payload file, never interpolates `${{ github.event.issue.* }}` into a
  `run:` line (script injection), runs no code from the issue, and uses no `pull_request_target`.
- **Links:** the check flags links outside an allowlist (learn.microsoft.com, github.com,
  avd-ops.dev, and the hosts already in `sources.toml`) for the reviewer; it never fetches them.

## 8. Privacy

- **Issues are public.** Every form opens with the warning the KB forms use, and a required
  public-safe checkbox. Nothing from a private repo, the paid-feature register or any private
  roadmap goes into a form, a label, a call for help or this spec.
- **Leak check after submit:** `submission-check` runs the same leak patterns as `validate.py`
  (GUIDs not in the public list, emails, IPs, domains, secret shapes) and, on a hit, labels
  `needs-redaction` and comments asking the author to edit. The owner can delete the revision from
  the issue's edit history or delete the issue; the check names that step.
- **Before submit:** the evidence form only takes a file that passed `check_evidence.py`, so the
  format has no place for a name. The review UI's "Send evidence" links that check and the
  redaction guide first. Real-estate evidence needs the owner's consent and banded sizes, as
  avd-assess already says.
- **Credit is opt-in.** The credits page lists a person only if their issue or PR carries the
  credit checkbox (or they are a merged-PR author, which is already public), and only by GitHub
  username. It is built at site build time from the public API with the Pages workflow's
  read-only token; nothing is stored beyond the generated page. Someone who wants off is removed
  on request, no questions.
- **No personal data stored by us.** The forms ask for none; the only copy of what someone writes
  is their GitHub issue.

## 9. Research submissions get the pinned-source treatment

`research.yml` asks for what a reference file needs, so the maintainer's PR is mechanical:

1. **The readable URL** and **a pin**: a commit SHA for GitHub sources; for a Learn page, its
   `git_commit_id` and `updated_at`; otherwise an archived copy's URL and the date read. A form
   without a pin is labeled `needs-pin`, not rejected.
2. **The claim in your own words**, one line, and its anchor. The form says plainly: don't paste
   the source's text (avd-assess stores claims, never content).
3. **The license** of the source, if known.
4. **Kind:** published, prior (the source calls it an estimate) or guidance, and for a correction,
   the existing claim ID.

The maintainer writes `references/<id>.yaml`, citing the issue.

## 9a. Disputes and fact checks

A dispute says something we publish is wrong. `dispute.yml` asks for exactly what a reviewer needs
to decide:

1. **What is claimed:** the claim, standard, check or page ID (prefilled from the page).
2. **Where:** the link, prefilled.
3. **What you say is correct**, in your words.
4. **Your evidence:** a pinned source (section 9 rules), a checked evidence file, or a public
   link to a run or lesson. A dispute with none stays open as `needs-evidence`; it is not closed.
5. Public-safe and license checkboxes, and the credit opt-in.

**Status is tracked visibly** with exactly one of three labels, changed only by the owner:

| Label | Means | What follows |
|---|---|---|
| `dispute:open` | received, not decided | the review UI shows "disputed" on the claim, with the link |
| `dispute:accepted` | we were wrong, or the claim needs narrowing | a PR fixes the claim, page or check and links the issue; for a source we cite, an observation with verdict `disagrees` and an upstream entry so it can be offered back to the source; the credits page thanks the person |
| `dispute:rejected` | we keep the claim | closed with a comment giving the reason and the evidence it rests on; the review UI keeps showing "disputed, kept" with that link |

A model may draft a summary of a dispute for the owner; it never decides the verdict (avd-assess
rule). A rejected dispute can be reopened with new evidence.

Positive and negative feedback (`feedback.yml`, kind `praise` or `problem`) needs no verdict: it
is read, labeled, and closed when answered or turned into a bug or feature. Counts per page show
which docs work and which need a rewrite, the same way the mailbot's category counts do.


## 10. Accessibility and UI

- The action menus, contribute block and calls-for-help list are built with the avd-ops design
  system (`avd-ops.css`, tokens only, `.cta`, `.chip`, `.card`, `.tbl`) inside the direction B shell
  (brand bar and switcher), and go through the frontend design skill when built.
- Real links and buttons, a visible focus ring (`--focus`), keyboard-reachable menus
  (`details`/`summary`, no hover-only), labels that say where they go ("Suggest a source on GitHub"),
  no color-only state, WCAG 2.1 AA contrast in both themes, and the opens-on-GitHub fact said in
  text, not just an icon.
- GitHub's form is GitHub's: our forms keep labels short, put the warning first, and use
  descriptions for help, so they read well with a screen reader.

## 11. What changes where (when built)

| Repo | Change |
|---|---|
| avd-ops | `submissions/`, `submit.js`, checks and tests; forms for avd-ops; `family.yml` runs the vendored check; site pages read `routing.json` |
| avd-assess | vendored `research.yml`, `research-request.yml`, `finding.yml`, `dispute.yml`, `feedback.yml`, `bug.yml`, `feature.yml`; `baseline-evidence.yml` re-homed; "open research requests" line per gap |
| avd-landing-zone, avd-current-state, avd-swarm, avd-second-brain | vendored `bug.yml`, `feature.yml`, `feedback.yml`, `dispute.yml`; two contact links |
| mailbot (avd-ops `mailbot/`) | its gate calls the shared builder for the escalation link |

Labels are created by a one-off script the owner runs (writes to repos, so the owner's yes). The
landing zone and avd-current-state stay self-contained: the forms are plain files, and nothing in
them reads avd-ops at run time.

## 12. Open questions for Nick

1. Is this the right "three"? Read here as the credits page, the review UI and the mailbot.
2. Credit: GitHub username only (recommended), or also a display name a person types?
3. Do research requests from outside go to avd-assess even when they are not about the standards
   (recommended: avd-ops for those, as the table has it)?
4. Build order: forms and routing first (smallest, useful alone), then the review UI's menus, then
   credits, then the mailbot link.
