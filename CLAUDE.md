# CLAUDE.md

avd-ops: the static website for the AVD repos, published from `site/` to https://avd-ops.dev/ by `.github/workflows/pages.yml`. The deployment portal is not here: it stays in avd-landing-zone with the scripts it reads.

## Validate before pushing
```bash
node --test "tests/*.test.mjs"
```

## Rules
- Every page keeps the research-only notice and the invitation to contribute and fork before its first section; every relative link resolves; every command block stands alone in Cloud Shell (avd-landing-zone lesson 0015). `tests/site.test.mjs` checks all of it.
- Liquidware is the only partner named; no Nerdio, Login VSI, Goliath or HCL tooling (Terraform, Packer).
- No tenant, subscription or object IDs, domains other than avd-ops.dev and github.com, emails, secrets, or employer or customer names.
- Personal project, not for production, as is, not affiliated with the author's employer, Liquidware or Microsoft. The README warning and LICENSE stay.
- American English.
