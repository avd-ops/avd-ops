# avd-ops.app Worker (`app-router`)

Routes `https://avd-ops.app/` as the unified public demo hub on static Contoso sample data (zero auth, zero backend, zero Azure spend), while `https://avd-ops.dev/` remains the project site and documentation.

## Routes

| Path | Upstream |
|---|---|
| `/` | Static demo hub (`src/hub.mjs`) |
| `/assets/*` | `https://avd-ops.dev/assets/*` |
| `/deploy/*` | `https://avd-ops.github.io/avd-landing-zone/portal/*` |
| `/assess/*` | `https://avd-ops.github.io/avd-current-state/portal/*` |
| `/migrate/*` | `https://avd-ops.github.io/avd-migrate/portal/*` |
| `/status/*` | `https://avd-ops.github.io/avd-current-state/status/*` |
| `/benchmark/*` | `https://avd-ops.github.io/avd-benchmark/portal/*` |
| `/linecheck/*` | `https://avd-ops.github.io/avd-linecheck/*` |
| `/assistant/*` | `https://avd-ops.github.io/avd-swarm/*` |

## Test and deploy

Run unit tests locally with Node:

```bash
node --test workers/app-router/test/router.test.mjs
```

Deploy to Cloudflare Workers (only when the owner runs it):

```bash
npx wrangler deploy --config workers/app-router/wrangler.jsonc
```
