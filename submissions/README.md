# Submissions

The one intake for outside submissions to the AVD repos: evidence, research, research requests,
feedback and disputes, bug reports and feature requests, plus two private routes (general contact
and sponsorship) that go by mail to the mailbot and never become a public issue. The design and
the reasons are in [docs/submissions-spec.md](../docs/submissions-spec.md) and decision
[0004](../docs/knowledge/decisions/0004-submissions-are-github-issue-forms.md).

| File | What it is |
|---|---|
| [routing.json](routing.json) | The types, every label, and type + area -> repo and form. Repos are keys in [repos.json](../repos.json). |
| [forms/](forms/) | The canonical issue forms. A repo copies the ones its routes name into `.github/ISSUE_TEMPLATE/`, byte-identical. |
| [links.mjs](links.mjs) | The link builder: `submissionUrl(routing, repos, {type, area, target, title})`. Only IDs and a short title stub go in a link, never what a person writes. |
| [labels.mjs](labels.mjs) | Prints, or with `--apply` creates, the labels in one repo. |

Tests: `node --test "tests/*.test.mjs"` (`tests/submissions.test.mjs`).

## Add a route, a type or a form

- **A route:** one line in `routes`. The test fails if its repo isn't in repos.json or its form doesn't exist.
- **A type:** an entry in `types`, a route, and its `type:` label in `labels`.
- **A form:** a file in `forms/`. It opens with the public warning, carries `submission`, `needs-triage`
  and a `type:` label, has a required public-safe checkbox, and asks for no contact details. Then
  copy it into each repo that routes to it.

## Create the labels (owner only)

Run in Cloud Shell, once per repo that receives submissions:

```bash
cd ~ && (git -C avd-ops pull || git clone https://github.com/avd-ops/avd-ops.git) && cd ~/avd-ops
gh auth status || gh auth login
for r in avd-ops/avd-ops avd-ops/avd-assess avd-ops/avd-landing-zone avd-ops/avd-current-state; do node submissions/labels.mjs "$r" --apply; done
```

Triage: a submission opens with `needs-triage`. Nothing acts on it, and no page shows it, until the
owner adds `accepted`. Disputes carry exactly one of `dispute:open`, `dispute:accepted`, `dispute:rejected`.
