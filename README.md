# avd-ops

The website for the AVD repos, published at **<https://avd-ops.dev/>**: one overview page and one page for each public repo (avd-landing-zone, avd-current-state, avd-swarm, avd-second-brain, avd-liquidware) and how they fit together.

> [!WARNING]
> **Personal project. Research and learning only. Not for production. No warranty.**
>
> - This is my own personal project, built on my own time **for research and learning**. It is **not affiliated with, endorsed by or supported by my employer**, Liquidware or Microsoft, and it does not represent their views, products or guidance.
> - **Do not run any of it in production** or against subscriptions and tenants that matter. Test it first in a dedicated lab subscription and tenant.
> - It is provided **"as is", without warranty of any kind**, under the [MIT License](LICENSE). You use it at your own risk.
> - **Contributions and forks are welcome and encouraged.** See [Contributing](#contributing).

## Layout

```text
site/                      # what GitHub Pages serves
├── index.html             # the overview
├── family/<repo>.html     # one page per public repo
└── assets/                # the avd-ops design system: avd-ops.css, fonts/, brand/ (the logo); site.css for this site's layout
docs/design-system.md      # tokens, components, logo, and how other repos vendor assets/
docs/never-delete-the-last-copy.md  # the family convention for teardown, logs and data
tests/site.test.mjs        # notice on every page, links resolve, avd-ops name, standalone Cloud Shell blocks, design system
.github/workflows/         # ci (tests), pages (publishes site/)
```

Family conventions: [never delete the last copy](docs/never-delete-the-last-copy.md), for every teardown, cleanup and agent step that deletes data.

The site is plain HTML with no build step. Every page uses the shared [design system](docs/design-system.md), which the deployment portal vendors too. The deployment portal stays with the code it drives, in [avd-landing-zone](https://github.com/nickprignano/avd-landing-zone) ([portal](https://nickprignano.github.io/avd-landing-zone/portal/)).

## Publishing

`pages.yml` publishes `site/` on every push to `main` that changes it, or when run by hand from the Actions tab. The domain's DNS is on Cloudflare; GitHub Pages hosts the site and issues its HTTPS certificate. One-time setup, in this order:

1. **Verify the domain** (so no other repo can claim it): GitHub, your account's **Settings > Pages > Add a domain**, enter `avd-ops.dev`. Add the TXT record it shows in Cloudflare (**DNS > Records**), then click **Verify**.
2. **Point the apex at GitHub Pages** in Cloudflare: the four A records and four AAAA records from [GitHub's list](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain), name `@`. Optionally a CNAME `www` to `nickprignano.github.io`. Delete any other A, AAAA or CNAME records on `@` and `www` (parking or forwarding records conflict). Set every one of these records to **DNS only** (gray cloud), not Proxied.
3. **Turn on Pages** in this repo: **Settings > Pages > Source: GitHub Actions**, then **Custom domain: `avd-ops.dev`** and **Save** (Actions deployments need no CNAME file). Wait for the DNS check to pass and the certificate to be issued, then tick **Enforce HTTPS**.
4. **Publish**: run the `pages` workflow once from the Actions tab.

`.dev` is HTTPS-only in every browser, so the site shows a certificate error until GitHub has issued its certificate; that can take a while after the DNS check passes. Keep the records **DNS only**: GitHub needs to see its own IPs to issue and renew the certificate. If you later want Cloudflare's proxy, turn it on only after Enforce HTTPS is set, and set Cloudflare's **SSL/TLS** mode to **Full (strict)** (Flexible causes a redirect loop).

## Contributing

Fork it, open an issue or a pull request. Run `node --test "tests/*.test.mjs"` before pushing (CI runs the same). Keep the notice on every page, name no partner but Liquidware, and put no tenant data, secrets or customer names anywhere. Contributions are accepted under the [MIT License](LICENSE).

## License and disclaimer

[MIT](LICENSE). Personal project, not for production, provided as is, not affiliated with the author's employer, Liquidware or Microsoft.
