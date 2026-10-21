@AGENTS.md

# CLAUDE.md

avd-ops: the front door for the AVD repos (decision 0002). It holds the website, published from `site/` to https://avd-ops.dev/ by `.github/workflows/pages.yml`, and the onboarding and user docs for every public AVD repo, as a knowledge base in `docs/knowledge/` (2ndbrain format, an Obsidian vault) that `scripts/site/build-docs.mjs` renders to `site/docs/`. Each repo stays the source of truth for itself; pages here explain and link. The deployment portal is not here: it stays in avd-landing-zone with the scripts it reads.

## Validate before pushing
```bash
npm ci
node scripts/site/build-docs.mjs     # after any change in docs/knowledge/
python3 scripts/kb/build.py && python3 scripts/kb/validate.py && python3 -m unittest discover -s scripts/kb
node --test "tests/*.test.mjs"
```

## Rules
- Every page keeps the research-only notice and the invitation to contribute and fork before its first section; every relative link resolves; every command block stands alone in Cloud Shell (avd-landing-zone lesson 0015). `tests/site.test.mjs` checks all of it.
- `site/docs/` is generated: edit the Markdown in `docs/knowledge/`, never the HTML. The shell around every page (brand bar, side list, notice, footer) comes from `scripts/site/shell.mjs`: edit it there and run `node scripts/site/apply-shell.mjs`, never by hand in a page. Links between pages are relative Markdown links, not `[[wikilinks]]`, so the same files work in the validator, on GitHub, on the site and in Obsidian. Every page links or is linked (the test fails on an orphan).
- `repos.json` is the one list of public AVD repos. A new public repo gets an entry, a page in `docs/knowledge/repos/` and the avd-ops line under its README title. Private repos stay unbranded and off the site.
- The AVD repos never name the projects listed in `repos.json` `banned`; the tests check this repo and `family.yml` checks the others weekly.
- The site names no partner for now: no Liquidware or avd-liquidware (Nick, 2026-10-20; the family-wide rule stays that Liquidware is the only partner), and no Nerdio, Login VSI, Goliath or HCL tooling (Terraform, Packer). `tests/site.test.mjs` checks it.
- No tenant, subscription or object IDs, domains other than avd-ops.dev, github.com and prignano.ai (the owner's credit line in the shell footer, Nick 2026-10-21), emails, secrets, or employer or customer names.
- Personal project, not for production, as is, not affiliated with the author's employer, Liquidware or Microsoft. The README warning and LICENSE stay.
- American English.
