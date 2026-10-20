# avd-ops

The front door for the AVD repos, published at **<https://avd-ops.dev/>**: the overview, one page for each public repo (avd-landing-zone, avd-current-state, avd-assess, avd-swarm, avd-second-brain), and the onboarding and user docs for all of them. Each repo stays the source of truth for itself; avd-ops explains how they fit together and links to them ([decision 0002](docs/knowledge/decisions/0002-avd-ops-is-the-front-door.md)).

> [!WARNING]
> **Personal project. Research and learning only. Not for production. No warranty.**
>
> - This is my own personal project, built on my own time **for research and learning**. It is **not affiliated with, endorsed by or supported by my employer**, Liquidware or Microsoft, and it does not represent their views, products or guidance.
> - **Do not run any of it in production** or against subscriptions and tenants that matter. Test it first in a dedicated lab subscription and tenant.
> - It is provided **"as is", without warranty of any kind**, under the [MIT License](LICENSE). You use it at your own risk.
> - **Contributions and forks are welcome and encouraged.** See [Contributing](#contributing).

## Layout

```text
docs/knowledge/            # the docs: a knowledge base in the 2ndbrain format, and an Obsidian vault
site/                      # what GitHub Pages serves
├── index.html             # the overview
├── family/<repo>.html     # one page per public repo
├── docs/                  # generated from docs/knowledge/: start here, concepts, repos, roadmap, decisions, graph
└── assets/                # the avd-ops design system: avd-ops.css, fonts/, brand/ (the logo); site.css and graph.js for this site
docs/family-roles.md       # the family convention: the foundation's three questions, the layer on top, and which way they depend
docs/build-or-adopt.md     # the family convention: adopt an outside tool only if it's the best and open source, else build
docs/design-system.md      # tokens, components, logo, and how other repos vendor assets/
repos.json                 # the public AVD repos avd-ops fronts, read by the tests and the family check
scripts/site/build-docs.mjs  # docs/knowledge/ -> site/docs/, with backlinks and graph.json
scripts/family-check.mjs   # every repo carries the avd-ops line and names no banned project
scripts/kb/                # knowledge base tooling from the 2ndbrain template (Apache-2.0, see its NOTICE)
tests/site.test.mjs        # notice on every page, links resolve, avd-ops name, Cloud Shell blocks, design system, docs, banned names
.github/workflows/         # ci (tests), pages (publishes site/), family (weekly), kb-* (knowledge base)
```

The overview and repo pages are plain HTML. The docs are Markdown in `docs/knowledge/`: after editing one, run `npm ci` once, then `node scripts/site/build-docs.mjs` and `python3 scripts/kb/build.py`, and commit what they write. Every page uses the shared [design system](docs/design-system.md), which the deployment portal vendors too. The deployment portal stays with the code it drives, in [avd-landing-zone](https://github.com/nickprignano/avd-landing-zone) ([portal](https://nickprignano.github.io/avd-landing-zone/portal/)).

## Docs and the graph

The docs use the same knowledge base format as the other AVD repos, from the [2ndbrain](https://github.com/nickprignano/2ndbrain) template: front matter checked by `scripts/kb/validate.py`, decision records in MADR, and ordinary relative Markdown links. Open `docs/knowledge/` in Obsidian and its graph view shows the pages and their links (keep **Settings > Files and links > Use [[Wikilinks]]** off so new links stay Markdown). The site draws the same graph at [avd-ops.dev/docs/graph.html](https://avd-ops.dev/docs/graph.html) and lists backlinks on every page.

A page here explains and links; a detail belongs in the repo that owns it. Every public AVD repo carries this line under its README title, and the weekly `family` workflow checks it:

> Part of [avd-ops](https://avd-ops.dev/), the open toolkit for Azure Virtual Desktop.

Which repo answers which question, and why the foundation never depends on the layer built on top of it: [three questions, three repos](docs/family-roles.md). When to use an outside tool instead of building one: [build or adopt](docs/build-or-adopt.md).

## Publishing

`pages.yml` publishes `site/` on every push to `main` that changes it, or when run by hand from the Actions tab. The domain's DNS is on Cloudflare; GitHub Pages hosts the site and issues its HTTPS certificate. One-time setup, in this order:

1. **Verify the domain** (so no other repo can claim it): GitHub, your account's **Settings > Pages > Add a domain**, enter `avd-ops.dev`. Add the TXT record it shows in Cloudflare (**DNS > Records**), then click **Verify**.
2. **Point the apex at GitHub Pages** in Cloudflare: the four A records and four AAAA records from [GitHub's list](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain), name `@`. Optionally a CNAME `www` to `nickprignano.github.io`. Delete any other A, AAAA or CNAME records on `@` and `www` (parking or forwarding records conflict). Set every one of these records to **DNS only** (gray cloud), not Proxied.
3. **Turn on Pages** in this repo: **Settings > Pages > Source: GitHub Actions**, then **Custom domain: `avd-ops.dev`** and **Save** (Actions deployments need no CNAME file). Wait for the DNS check to pass and the certificate to be issued, then tick **Enforce HTTPS**.
4. **Publish**: run the `pages` workflow once from the Actions tab.

`.dev` is HTTPS-only in every browser, so the site shows a certificate error until GitHub has issued its certificate; that can take a while after the DNS check passes. Keep the records **DNS only**: GitHub needs to see its own IPs to issue and renew the certificate. If you later want Cloudflare's proxy, turn it on only after Enforce HTTPS is set, and set Cloudflare's **SSL/TLS** mode to **Full (strict)** (Flexible causes a redirect loop).

## Contributing

Fork it, open an issue or a pull request. Run `npm ci`, `node --test "tests/*.test.mjs"` and the knowledge base checks in [AGENTS.md](AGENTS.md) before pushing (CI runs the same). Keep the notice on every page, name no partner product on the site, and put no tenant data, secrets or customer names anywhere. Contributions are accepted under the [MIT License](LICENSE).

## License and disclaimer

[MIT](LICENSE). Personal project, not for production, provided as is, not affiliated with the author's employer, Liquidware or Microsoft.
