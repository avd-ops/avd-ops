# Roadmap: one public page for every AVD repo

Status: proposed, design only (Nick, 2026-10-21: "sorta like a roadmap, which avd-ops should have too that spans all of the repos"). Nothing here is built. Mockup: the preview linked from the PR.

A public roadmap at **avd-ops.dev/roadmap.html** that spans every repo in [repos.json](../repos.json): what is being worked on now, what is next, what is being explored, what was done recently, and what is parked. No dates. Each item is one public GitHub issue or pull request in the repo that owns it, and the page is built from data, never hand-written HTML. It sits beside the research projects page ([submissions spec](submissions-spec.md) section 5.3a) and shares its data, shell and routing.

## 1. The decision in one line

**A roadmap item is a public issue in a family repo that Nick has labeled `roadmap` and `accepted`.** Its status is a `status:*` label. One curated file in avd-ops, `roadmap.json`, adds themes, ordering, short summaries in our own words and the few items that span repos. The site build reads both and writes static HTML. GitHub Issues stays the tracker; the org Project board stays an internal view and never feeds the page.

## 2. Prior art and build or adopt

Prior-art check (`scripts/kb/prior_art.py "public roadmap"`): nothing in this KB; the sibling and GitHub searches fail from the container (403). Read directly instead:

| Project | How its roadmap works | What we take |
|---|---|---|
| [GitHub public roadmap](https://github.com/github/roadmap) (CC-BY-4.0) | One issue per item, labels for phase and area, a project board with columns by expected quarter plus an "Exploratory" column. "exploring" and "in design" come before a date. A shipped item gets a `shipped` label, is closed and links its changelog post. Issues are locked; feedback goes elsewhere. The README says it is not a promise and dates change. | Issues plus labels as the source; an exploring state; done closes the issue and links what shipped; feedback goes through a separate path (our submissions). We drop the quarters: dates are the part they warn about. |
| [Kubernetes enhancements](https://github.com/kubernetes/enhancements) (Apache-2.0) | One tracking issue per enhancement, the owning group as a `sig/*` label, the stage as `stage/alpha|beta|stable`, a board per release. | One tracking issue per item in the repo that owns it; maturity said separately from progress (their alpha, beta, stable is our proven, pre-beta, design, section 6). |
| [Rust project goals](https://goals.rust-lang.org/) ([RFC 3614](https://github.com/rust-lang/rfcs/pull/3614)) | Goals are proposed, then accepted for a period; each has a tracking issue; the site is a book built from the goals repo. | Nothing shows until it is accepted; the page is generated from a repo, not edited on a website. |
| [Backstage roadmap](https://backstage.io/docs/overview/roadmap/) | A hand-written Markdown page of a few initiatives, refreshed every six months, says it is not a complete list. Its own update date has already gone stale. | Say plainly the page is not a complete list. Hand-written pages go stale, so ours is built from data. |
| A public GitHub Projects board | A GitHub feature: board and table views of issues, free. | Not the public page: it can't carry the notice, the design system or the proven and pre-beta marks, it shows whatever is on the board rather than only accepted items, and our board holds working fields. Kept as the internal view (section 8). |
| Hosted roadmap and feedback tools (Canny, Productboard, public Trello boards) | Closed, hosted. | Prior art only (build-or-adopt rule: closed tools are never adopted). |

**Verdict: adopt GitHub issues and labels** (the tracker the family already uses, $0, no server, no secret) **and build a small generator** like `scripts/site/build-credits.mjs`, because no open source tool takes issues from several repos and writes pages in our shell. Parity checklist taken from the prior art: one tracking issue per item; a status vocabulary that starts before commitment; done links what shipped; a separate feedback path; a statement that the page is direction, not a promise, and not a complete list.

## 3. What appears, and the hard rules

- **Only what Nick approved.** An issue appears only when it carries `roadmap` and `accepted` and both were added by an approver listed in `roadmap.json` (today `nickprignano`). The build checks who added each label through the issue's events, so a label added by anyone else, a bot or a Claude session included, does nothing. Claude sessions never add `accepted` or `roadmap`.
- **Only public repos in repos.json.** The build reads only repos listed there and drops any issue whose repository is private. A private repo can't reach the page even if it were listed by mistake.
- **Public text only.** The page shows the issue's title, its labels, its repo, and a summary from `roadmap.json` written in our own words. It never renders an issue body or comment. Nothing about a private repo, a possible paid side, a parked idea that was never public, or any partner the site does not name goes on the page; the existing site tests (partner names, repos.json `banned`) run on it, and the build fails on any of those terms in a title or summary.
- **Edits after approval pull the item.** Issue titles are written by whoever opened the issue. If the title changes after Nick's last `accepted`, the item drops off and the build log names it, until Nick removes and re-adds `accepted`.
- **No dates.** No quarters, target releases or "coming soon". The only dates shown are facts: when an item last changed and when a done item closed.
- **The page says what it is**, under the notice: "Direction, not a promise. No dates. Anything here can move, pause or stop. This is not a complete list of the work; each repo's issues are."

## 4. Status vocabulary

One `status:*` label per item. The columns come from the status, so an item can never be in a column its status contradicts.

| Label | Shown as | Column | Means |
|---|---|---|---|
| `status:exploring` | Exploring | Later | Being looked at: the question, the prior art, whether it belongs in the family. No decision to build. The default when an approved item has no status label. |
| `status:planned` | Planned | Next | Decided: it will be built, and how is designed or being designed. Not started. |
| `status:in-progress` | In progress | Now | Someone is working on it: an open PR or a branch is linked. |
| `status:done` | Done | Recently done | Shipped. Set by closing the issue as completed; the build reads the close, the label is optional. Links the PR or release that did it. |
| `status:parked` | Parked | Parked (folded) | Was on the public roadmap and is paused, with a one-line reason in `roadmap.json`. Parked items come only from items that were public; nothing private feeds this list. |

An issue closed as "not planned" leaves the page; its history stays on the issue. Done items show for 120 days, then fold into a link to the repo's closed `roadmap` issues. Each status pill carries its word and a shape, never color alone.

## 5. Data

### 5.1 Issues, shared with the other generated pages

One script, `scripts/site/fetch-issues.mjs`, reads the public issues API once for every repo in repos.json and writes **`site/data/issues.json`**: number, repo, title, state, close reason, labels, who added each label and when, last title change, closing PR. It is read by every page that shows issues: the roadmap, the research projects page (submissions spec 5.3a), the standards library's dispute and research-request lists, and the credits page's calls for help. One fetch, one snapshot, so the four pages never disagree. The library thread's proposed public-issue part of `site/data/library.json` moves here or reads from here (section 9).

It runs in `pages.yml` before the upload, with the workflow's read-only `GITHUB_TOKEN` (public repos only, `contents: read`, `issues: read`), on push and once a day on a schedule. Nothing is fetched in the browser. If the fetch fails the deploy uses the committed snapshot, and the page says "as of" its date. Tests run against a fixture that omits empty fields the way GitHub's API does.

### 5.2 `roadmap.json` (curated, in avd-ops)

```json
{
  "$schema": "avd-ops-roadmap/v1",
  "approvers": ["nickprignano"],
  "themes": [
    {"id": "front-door", "title": "Front door", "summary": "One place to start, learn and contribute"}
  ],
  "items": [
    {"issue": "https://github.com/avd-ops/avd-ops/issues/<n>", "theme": "front-door", "order": 1,
     "summary": "One line in our own words, shown instead of nothing"},
    {"issue": "https://github.com/avd-ops/avd-landing-zone/issues/<n>", "proven_by": "https://github.com/avd-ops/avd-landing-zone/blob/master/build/lessons/<lesson>.md"}
  ],
  "parked": [
    {"issue": "https://github.com/avd-ops/<repo>/issues/<n>", "reason": "One line on why it is paused"}
  ]
}
```

- Every entry points at an issue or PR in a repo of repos.json; a test checks the URL's owner and repo. A curated entry never adds an item by itself: the issue still needs Nick's labels, so there is one approval path, not two.
- An item that spans repos is one tracking issue in avd-ops that links the issues in each repo (Kubernetes' umbrella issue), not one roadmap item per repo.
- `proven_by` links public evidence of a real run (a lesson, a run record, a KB page). Without it a done item reads "Built, not yet proven in a real run".

### 5.3 Repo maturity in repos.json

Each repo in repos.json gains `maturity`, the one place the site, the roadmap and the KB read it from (section 6). The repo pages' existing status pills ("Built", "Design and spike") stay as each repo's own wording.

## 6. Proven, pre-beta and design

The page opens with a strip of the six repos, each with its maturity, because the most important thing a reader needs is which parts have been run for real.

| Maturity | Means | Repos today |
|---|---|---|
| **Proven** | Deployed and torn down end to end in real runs, with run and teardown evidence and lessons in public, and CI guards from what those runs taught. | avd-landing-zone |
| **Pre-beta** | Built and tested offline, partly run for real; expect breaking changes. | avd-current-state, avd-assess, avd-second-brain, avd-ops |
| **Design** | Specified, spikes only; not ready to run. | avd-swarm |

A repo moves up only by Nick's decision, recorded in the repo's decisions with the runs that justify it. Every item card shows its repo's maturity mark, so an "in progress" item in a design-stage repo can't read as nearly ready.
## 7. How items arrive: submissions, research and graduation

```text
anyone                       Nick                          roadmap page
feature request   --->  triage in the owning repo  --->  + roadmap + accepted + status:*
(submissions form)       (transfer, needs-routing)        shows in Later / Next / Now
research request  --->  research projects page    --->  done research can open a feature issue
                         (accepted research-request)       "from research #n", which Nick labels
our own idea      --->  Nick opens the issue      --->  same labels
```

- **Feature requests** come through the shared submission forms ([submissions spec](submissions-spec.md), `type:feature`, routed by `routing.json`). They graduate only when Nick adds `roadmap` and `accepted`. The card then says "From a community request" and credits the requester by GitHub username only if they ticked the credit box.
- **Research requests** stay on the research projects page; a question is not a roadmap item. When research produces work to build, Nick opens (or a session drafts for him) a linked feature issue, and that issue graduates the usual way. One issue lives on one page.
- **Bugs** are not roadmap items unless one is large enough that Nick labels it.
- The page ends with "Suggest a feature" and "Ask for research", links from the shared link builder (`submissions/links.mjs`), and a link to the research projects page.

## 8. The org Project board

The avd-ops organization's GitHub Project board is an internal working view of all open work in the public repos. Its sync can mirror the `status:*` labels into a board field, one way, labels to board. The page never reads the board, because:

- the board shows every open issue, not only approved ones, and carries working fields that are not meant for a public page;
- reading an organization project needs a token with project scope; the page needs only public issues and the default read-only token;
- the labels live on the issue, so the roadmap, the repo's own issue list and the board agree without a second source of truth.

## 9. Shared with the other avd-ops pages

| Shared piece | Owner | Roadmap uses |
|---|---|---|
| Direction B app shell (`avd-ops-shell.css`, `theme.js`, the shell markers `apply-shell.mjs` fills) | Modern UI work, design system 2.0 | The page is a shell page; the side list's "Roadmap" link moves from `docs/roadmap.html` to `roadmap.html`. |
| `site/data/issues.json` and `fetch-issues.mjs` | This spec proposes it; research page, library and credits read it | The one issue snapshot (section 5.1). |
| `submissions/routing.json` and `links.mjs` | Submissions | "Suggest a feature" and "Ask for research" links, credit opt-in. |
| Card and status components | Design system | New pill classes for the five statuses and three maturity marks, built on existing tokens (`--info`, the `--s-*` pairs, `--good`, `--caution`, `--muted`); no new colors. |
| `credits.json`, `library.json` | Credits, standards library | Not read. A done item's requester credit comes from the same opt-in the credits page lists. |

**Generator:** `scripts/site/build-roadmap.mjs` reads `repos.json`, `roadmap.json` and `site/data/issues.json`, and writes `site/roadmap.html` and `site/data/roadmap.json` (the resolved items, for any later reader). `--check` runs in `tests/site.test.mjs` like the credits page.

**The KB roadmap page** (`docs/knowledge/roadmap/README.md`) keeps "Next for these docs" and links the new page. Its per-repo "Today" table is replaced by the maturity strip, read from repos.json, so the two can't drift.

**Each repo** may add one README line, "Roadmap: avd-ops.dev/roadmap.html#<repo>", and its own filtered list (`issues?q=is:open+label:roadmap`). A link, not a copy, so avd-landing-zone and avd-current-state still read nothing from avd-ops at run time.

## 10. The page

Built with the avd-ops design system inside the direction B shell, through the frontend design skill when built.

- **Top:** the one-line notice, the title, the "direction, not a promise" line, the maturity strip, and a repo filter (all, or one repo) that is a row of links to `#<repo>` anchors, refined by script; without script everything shows.
- **Now, Next, Later:** three columns on a wide screen; on a phone, stacked sections with a jump row. Within a column, items group by theme, then curated order, then last change.
- **Card:** the title linking to the issue ("Issue #41 on GitHub"), the repo, the repo's maturity mark, the status pill with its word, the summary, "updated 3 Oct", and "From a community request" when it is one.
- **Below:** "Recently done" (closed in the last 120 days, with what shipped and the proven-or-not line) and "Parked" folded in a `details`.
- **End:** Suggest a feature, Ask for research, and the research projects page.
- Real links, a visible focus ring, no hover-only content, no color-only state, WCAG 2.1 AA contrast in both themes, 44px targets.

## 11. What changes where (when built)

| Repo | Change |
|---|---|
| avd-ops | `roadmap.json`; `scripts/site/fetch-issues.mjs`, `build-roadmap.mjs`; `site/roadmap.html`, `site/data/issues.json`, `site/data/roadmap.json`; `pages.yml` gains the fetch step, `issues: read` and a daily schedule; `repos.json` gains `maturity`; tests (approver check, title-edit pull, private-repo drop, banned terms, link owners, `--check`); the KB roadmap page links the new page; pill classes in the design system. |
| every public repo | The labels `roadmap`, `accepted` (exists for submissions), `status:exploring`, `status:planned`, `status:in-progress`, `status:done`, `status:parked`, each described in `submissions/routing.json`'s `labels` map (the submissions test checks every label is described there) so `labels.mjs --apply` creates them (Nick runs it). That entry lands with the build PR, after the submissions PR that adds `routing.json` has merged, so the two don't touch the same file now. Optionally the README line. |
| org Project board sync | Optional: mirror `status:*` into the board's Status field, one way. |

## 12. Questions for Nick

1. **Labels:** `roadmap` plus `accepted` (recommended, the same approval word as submissions), or `roadmap` alone as the approval?
2. **Maturity:** are avd-current-state, avd-assess, avd-second-brain and avd-ops all pre-beta, and avd-swarm design?
3. **Seed items:** which open issues should be on the page first? Recommended: a short first list Nick picks from each repo's open issues, plus umbrella issues in avd-ops for the front door work (research page, standards library, credits, submissions).
4. **Done window:** 120 days, or until the next release of the repo?
