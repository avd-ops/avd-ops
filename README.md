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
└── family/<repo>.html     # one page per public repo
tests/site.test.mjs        # notice on every page, links resolve, avd-ops name, standalone Cloud Shell blocks
.github/workflows/         # ci (tests), pages (publishes site/)
```

The site is plain HTML with no build step. The deployment portal stays with the code it drives, in [avd-landing-zone](https://github.com/nickprignano/avd-landing-zone) ([portal](https://nickprignano.github.io/avd-landing-zone/portal/)).

## Publishing

`pages.yml` publishes `site/` on every push to `main` that changes it. One-time settings: **Settings > Pages > Source: GitHub Actions**, then **Custom domain: avd-ops.dev** with **Enforce HTTPS** (Actions deployments need no CNAME file). DNS for the apex points at GitHub Pages' A and AAAA records ([GitHub's list](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain)); verify the domain under your GitHub account's Pages settings so no other repo can claim it.

## Contributing

Fork it, open an issue or a pull request. Run `node --test "tests/*.test.mjs"` before pushing (CI runs the same). Keep the notice on every page, name no partner but Liquidware, and put no tenant data, secrets or customer names anywhere. Contributions are accepted under the [MIT License](LICENSE).

## License and disclaimer

[MIT](LICENSE). Personal project, not for production, provided as is, not affiliated with the author's employer, Liquidware or Microsoft.
