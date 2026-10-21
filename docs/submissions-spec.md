# Submissions: one intake for the AVD family

Status: accepted by Nick 2026-10-21 ([decision 0004](knowledge/decisions/0004-submissions-are-github-issue-forms.md)). Step 1 is built in avd-ops: [`submissions/`](../submissions/README.md) holds the routing table, the forms and the link builder. The rest is design.

A submission is anything someone outside sends the family to make it better: **evidence, research,
a research request, feedback (praise, a problem, or a dispute or fact check), a bug report or a
feature request**, plus two private routes: general contact and sponsorship inquiries. Each one has to land in the right repo,
with the right labels, in a shape the maintainer can review. The function is shared by **the three
foundation repos**, avd-landing-zone, avd-current-state and avd-assess (Nick, 2026-10-21): each
vendors the forms and the routing table and links to them from its own pages and portals (section
5.0). The avd-ops.dev surfaces use it too: the **credits and contributors page**, the **standards
and research review UI**, and the **support mailbot** (designed separately, not built). It is kept
here in avd-ops: one routing table, one set of issue forms, and one link builder.

## 1. The decision in one line

**Every submission is a GitHub issue, opened through an issue form in the repo that owns it.**
No server, no database, no new tracker (GitHub Issues stays the tracker), no secret, $0. A person
reads every issue before anything acts on it.

## 2. Prior art and build or adopt

Prior-art check (`scripts/kb/prior_art.py "submission intake issue forms"`): nothing in this KB;
the sibling and GitHub searches failed from the container (403), so the family part rests on reading
the sibling repos directly. Found there: **avd-assess already has one evidence path**
([gaps/evidence-intake.md](https://github.com/avd-ops/avd-assess/blob/main/gaps/evidence-intake.md),
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

| `contact` | General contact: anything that isn't one of the above, or that the sender wants kept private. **Private: never a public issue** (section 5.4). | every page footer, credits page |
| `sponsorship` | An inquiry about sponsoring or funding the work. **Private** (section 5.4). | the sponsorship page, credits page |

A support question is not a type: it arrives by mail, Nick answers it, and if it turns into one of
the six he opens that issue (section 5.3). Credit is not a type either: it is an opt-in on any of
the six public types (section 8).

## 4. The shared pieces (all in avd-ops)

```text
submissions/
  routing.json        the types, every label, and type + area -> repo and form (section 4.2)
  forms/*.yml         the canonical issue forms, vendored byte-identical into each repo
  README.md           how to add a type, an area or a repo
  links.mjs           the link builder (section 4.3), pure, browser and Node
  labels.mjs          prints, or with --apply creates, every label in a repo (the owner runs it)
tests/submissions.test.mjs  routes, forms, labels and the builder (step 1)
scripts/submissions/check-vendored.mjs  each repo's copy matches (later, with the vendoring PRs)
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

`links.mjs` turns `{type, area, target, summary}` into
`https://github.com/<repo>/issues/new?template=<form>&title=<summary>&target=<target>`, from
`routing.json`. That is all it does.

- **Prefill only what the page already knows** (the type, the area, the claim or gap ID, a title
  stub). Never the person's text: that is typed into GitHub's form, so it never sits in a URL,
  browser history or a referrer. Prefilling form fields by their `id` is documented by GitHub; test
  it once on each form before relying on it, and fall back to `template=` alone.
- **Built at build time too.** Every button is a plain `<a href>` written by the site build from
  `routing.json`; the page's script only refines it (for example adding the claim a reviewer selected).
  With scripts off, every link still works.
- **One allowlist.** Only `github.com/<repo>` for repos in `repos.json`. The same function is
  what the mailbot's gate uses to build its repo-and-template link, so the mailbot never invents a
  destination (mailbot spec section 5 step 9).

## 5. How each surface calls it

### 5.0 The three foundation repos

avd-landing-zone, avd-current-state and avd-assess each vendor `routing.json`, `links.mjs` and the
forms their routes name, byte-identical, into `vendor/avd-ops-submissions/` with a `PINS.json`
naming the avd-ops commit, the same way they vendor contracts. Nothing reads avd-ops at run time,
so the landing zone and avd-current-state stay a self-contained pair. Each one then:

- copies its forms into `.github/ISSUE_TEMPLATE/` (bug, feature, feedback, dispute; avd-assess also
  research, research request, finding and baseline evidence);
- links them from its own pages: the deployment portal and the assessment portal get "Report a
  problem", "Send feedback" and "Dispute this" links built with the vendored builder. The landing
  zone's existing portal issue report (decision 0008, redacted in the browser) stays as it is; it
  is the `bug` route with its own redaction, and gains the shared labels;
- adds its two contact links to `config.yml`.

### 5.1 Standards and research review UI

Each claim, gap, check and baseline row gets a small action menu, built from `routing.json` with
the row's ID as `target`:

- **Suggest a source** -> `research` (`target: ref:<source>#<claim>`)
- **Dispute this / fact check** -> `feedback` dispute (`target:` the claim, standard or check ID)
- **Send evidence** -> `evidence`; links the evidence README and the check first
- **Ask for research** on a gap -> `research-request` (`target: gap:<id>`)
- **Report a problem** with the method -> `bug` (avd-assess)

It also shows, per gap, the accepted open research requests, and per claim or standard its **dispute
status** (none, open, accepted, rejected, with a link to the reasons), read at build time
(section 8), so a reader sees what is already asked or disputed before asking again.

### 5.2 Credits and contributors page

- Lists people who opted in to credit (section 8), each with what they contributed and links.
- Shows **open calls for help**: open `research-request` issues in avd-assess and avd-ops that
  carry `accepted`, newest first, each with its gap. Nothing shows before the owner says yes; no
  email step is needed for that (Nick, 2026-10-21). Ours look the same as anyone's: when we want outside research, Nick
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

### 5.3a Research projects page and per-repo lists (Nick, 2026-10-21)

Research gets its own page, **avd-ops.dev/research.html**, and a list in each repo.

- **What a research project is:** an accepted `research-request` issue (ours, labeled
  `call-for-help`, or anyone's) in any repo of `repos.json`. Accepted issues only; a request
  shows nowhere before the owner adds `accepted`.
- **The page** groups projects by repo and gap: the question, its status (open, being researched,
  done with a link to the PR or reference it produced), who is helping (opt-in credit), and an
  "Ask for research" and an "I can help" link from the builder. Built at site build time from the
  family's one issue snapshot, `site/data/issues.json` (the roadmap spec, avd-ops #21), written as
  static HTML with the design system; nothing is fetched in the browser. The roadmap, the credits
  page's calls for help and the review UI's per-gap list read the same snapshot, so they never
  disagree.
- **Each repo** gets a short "Research projects" section in its README (or `docs/` page for
  avd-assess, next to `gaps/`) that links its own filtered issue list
  (`issues?q=is:open+label:research-request+label:accepted`) and the avd-ops page. A link, not a
  copy, so it never goes stale and the landing zone and avd-current-state still read nothing at run
  time.

### 5.4 Private routes: general contact and sponsorship

Contact and sponsorship carry an email address, and sponsorship carries terms, so neither becomes
a public issue and neither has an issue form. `routing.json` gives both a `mailto:` destination,
not a repo: the mailbot's one address (working name `hello@avd-ops.dev`, shared with support; Nick picks
the name) with a fixed subject tag (`[contact]` or `[sponsorship]`) and no body. The link
builder's allowlist gains exactly one non-GitHub entry, that address. That is the whole hand-off, one way:
the site writes nothing, stores nothing and calls no endpoint; the mail goes through the mailbot's
forward-first, draft-only path, and Nick sends every answer.

- **mailto, not a Worker form endpoint.** An HTTP endpoint would be a new public write surface
  (spam, bots, a CAPTCHA to run) and would put a form's text into the Worker outside the mail
  checks the mailbot relies on (SPF, DKIM, DMARC, RBL). Revisit only if mail proves a barrier.
- **The subject is a hint, never trust.** The mailbot classifies from the message as it always
  does, treats all of it as untrusted input, and a subject can't change what the gate allows.
- **Sponsorship:** its own category in the mailbot, which drafts nothing commercial and never
  links an issue form. **Contact:** gets no escalation link from the mailbot; any reply is drafted for Nick only, in
  every phase. If it really is a bug or a research request, Nick opens that issue himself.
  Neither kind of mail goes into a repo, issue or the KB.
- **Shown three ways** (mailbot red team, 2026-10-21): the address as plain text with a copy
  control, the tag to put in the subject, and the mailto link, because many webmail users get
  nothing from a mailto click. `mailContact()` in `links.mjs` returns all three. The href is exactly
  `mailto:hello@avd-ops.dev?subject=%5Bcontact%5D` (or `%5Bsponsorship%5D`): brackets
  percent-encoded per RFC 6068, no `body=`, no userinfo, no second address, and the link text equals
  the address. A test guards all four.
- Until the mailbot exists, both buttons show only the address.

The sponsorship button links the planned funding page, `https://avd-ops.dev/funding.html`, and
waits on the same go as that page. The text beside the sponsorship button reuses the sponsorship page's wording on what funding does and does
not buy (owned by that page, linked, not restated here). It must never imply paid support, an
SLA, priority or roadmap influence, and names no partner, private project or paid plan. A
sponsor appears on the credits page only with their written yes.

## 6. Forms live in each repo, vendored from here

An issue form must live in the repo whose issue it opens. The canonical forms are in
`submissions/forms/`, each repo copies the ones its routing rows need, byte-identical, and
`family.yml`'s weekly check (`check-vendored.mjs`) reports drift as it already does for the brand
line. A repo keeps its own extra forms (handoff, KB forms). Each repo's `config.yml` adds two
`contact_links`: "Not sure where this goes?" (the avd-ops `needs-routing` form) and the docs.
Blank issues stay on.

avd-assess's `baseline-evidence.yml` moves to `submissions/forms/` and is vendored back with only
the shared labels added, so its evidence path stays as written.

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
| avd-ops | `submissions/` (built, step 1); own forms in `.github/ISSUE_TEMPLATE/` (built); later `check-vendored.mjs` in `family.yml` and site pages that read `routing.json` |
| avd-assess | `vendor/avd-ops-submissions/` at a pin; vendored `research.yml`, `research-request.yml`, `finding.yml`, `dispute.yml`, `feedback.yml`, `bug.yml`, `feature.yml`; `baseline-evidence.yml` re-homed; "open research requests" line per gap |
| avd-landing-zone, avd-current-state | `vendor/avd-ops-submissions/` at a pin; portal links (section 5.0); vendored `bug.yml`, `feature.yml`, `feedback.yml`, `dispute.yml`; two contact links |
| mailbot (avd-ops `mailbot/`) | its gate calls the shared builder for the escalation link; a `sponsorship` category that drafts nothing and is never escalated to an issue |

Labels are created by a one-off script the owner runs (writes to repos, so the owner's yes). The
landing zone and avd-current-state stay self-contained: the forms are plain files, and nothing in
them reads avd-ops at run time.

## 12. Decided (Nick, 2026-10-21)

1. The three are the foundation repos; the avd-ops.dev surfaces use the same function.
2. Credit by GitHub username. The credits page also opens with a short shoutout to the
   maintainer and the origin story (owned by the credits page work).
3. Research requests about the standards go to avd-assess, others to avd-ops. No email approval
   step: `accepted` is the approval, and only accepted requests are shown.
4. Build order: forms and routing (step 1, built), the research projects page and per-repo
   lists (section 5.3a), the review UI's menus, the foundation repos'
   vendored copies and portal links, the credits page, the mailbot's link. Labels are created by
   `submissions/labels.mjs --apply`, which the owner runs.
