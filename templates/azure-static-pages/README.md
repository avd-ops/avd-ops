# Near-\$0 Azure static-page hosting starter

Personal project, not for production, provided as is; not affiliated with the author's employer or Microsoft.

Use this starter when you run from a **single private GitHub repo (`avd-private`)** on **GitHub Free** (no GitHub Pro+) and need private static web pages ([decision 0026](../../docs/knowledge/decisions/0026-github-free-limits-and-near-zero-azure-hosting.md)). Public docs and demos stay on GitHub Pages by default.

## What is included

- `main.bicep`: Deploys **Azure Static Web Apps (Free tier, \$0/month)** with 100 GB bandwidth and 0.5 GB storage.
- `deploy-pages-swa.yml`: GitHub Actions workflow template using **Azure OIDC** (`azure/login`) to deploy `site/` without storing a long-lived deployment secret in GitHub.

> For portals that require **Entra ID sign-in**, use **Azure Container Apps (Consumption)** with built-in Entra auth ("Easy Auth"), which scales to zero inside the monthly free grant (avoiding Static Web Apps Standard's \$9/month fee).

## Deploy from Azure Cloud Shell

```bash
az group create --name rg-avd-ops-pages --location centralus
az deployment group create --resource-group rg-avd-ops-pages --template-file templates/azure-static-pages/main.bicep
```
