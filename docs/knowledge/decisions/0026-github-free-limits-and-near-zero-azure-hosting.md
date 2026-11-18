---
status: proposed
date: 2026-11-17
decision-makers: [owner]
---

# 0026. Call out GitHub Free private-repo limits and allow near-zero Azure page hosting

Default to public GitHub Pages and status-quo workflows, document GitHub Free private-repo limits, and offer near-\$0 Azure hosting for private pages.

## Context and Problem Statement

Running `avd-ops` from a single private repository on a free personal GitHub account hits hard platform limits that are easy to miss until a deployment or approval gate fails.

<!-- more -->

GitHub Free covers public repositories generously (unlimited standard Actions minutes, GitHub Pages, and Environment required reviewers), but imposes strict limits on **private** repositories: 2,000 Actions minutes/month, 500 MB of artifact/package storage, no GitHub Pages, and no Environment deployment protection rules (required reviewers or wait timers). How should `avd-ops` document these GitHub Free limits and support private web pages when GitHub Pro, Team, or Enterprise is not available?

## Considered Options

Three options were weighed:

- **Default to GitHub Pages / GitHub status quo, call out Free limits, and add an optional near-\$0 Azure hosting path for private pages:** Keep public GitHub Pages as the zero-cost default, document the GitHub Free private-repo limits (including the lack of Environment required reviewers and private Pages), and allow adopters to deploy private web pages/portals to near-\$0 Azure services (Azure Static Web Apps Free, Azure Storage static websites, or scale-to-zero Azure Container Apps).
- **Require GitHub Pro+ for every private adopter:** Simplifies hosting and approval gates, but breaks the objective of staying within a free GitHub account.
- **Move all project hosting and CI off GitHub onto Azure:** Avoids GitHub tier limits entirely, but adds standing Azure complexity and abandons the zero-cost GitHub Pages default for public docs and demos.

## Decision Outcome

Chosen option: "Default to GitHub Pages / GitHub status quo, call out Free limits, and add an optional near-\$0 Azure hosting path for private pages".

<!-- more -->

Why: Most `avd-ops` docs and demos (`avd-ops.dev`, `avd-ops.app`, and public repo portals) work at \$0 on public GitHub Pages, while an adopter running from a single private repo on GitHub Free needs clear warnings about what stops working in private repos—and a near-\$0 Azure fallback when they need private web pages without paying for GitHub Pro+.

### 1. GitHub Free limits on private repositories (called out)

Adopters running a single private repository on a **GitHub Free** personal account hit four limits compared to public repos or GitHub Pro+:

| Feature | GitHub Free (private repo) | Impact on `avd-ops` | Mitigation / Status Quo |
|---|---|---|---|
| **Actions minutes** | 2,000 min/month | Scheduled runbooks and CI share one monthly pool | Keep scheduled checks short (`ubuntu-latest`), offload heavy work to Azure or Cloud Shell |
| **Artifact & package storage** | 500 MB | Large evidence bundles or logs can exhaust storage | Keep Git files < 50 MiB, release assets < 2 GiB, and store large run artifacts in the Azure subscription run store |
| **Environment required reviewers** | Not available (requires Pro/Team/Enterprise) | `environment: approve` / `dev` / `prod` jobs will **not** pause for human approval | Use interactive Cloud Shell scripts (status quo in `avd-landing-zone`) for human-in-the-loop writes, or upgrade to GitHub Pro+ for workflow approval gates |
| **GitHub Pages** | Not available (requires Pro/Team/Enterprise) | `pages.yml` cannot publish portals/docs from a private repo | Default to public `avd-ops.dev` / `avd-ops.app`, or deploy private pages to near-\$0 Azure hosting (§2) |

### 2. Web page hosting options

- **Default (status quo):** Public GitHub Pages (`pages.yml`) for public documentation and public sample-data portals (`avd-ops.dev`, `avd-ops.app`), costing \$0/month on GitHub Free.
- **Optional near-\$0 Azure hosting (when private pages are needed without GitHub Pro+):**
  - **Static / unauthenticated pages:** **Azure Static Web Apps (Free plan)** (\$0/month, 100 GB bandwidth, 0.5 GB storage, OIDC deploy) or **Azure Storage Static Website** (`$web` blob container, pennies/month for storage and egress).
  - **Authenticated private portals (Entra ID sign-in):** **Azure Container Apps (Consumption plan)** with built-in Entra authentication ("Easy Auth"), scaling to zero within the monthly free grant (near-\$0/month idle, avoiding Static Web Apps Standard's \$9/month fee).

### Consequences

- Good, because public docs and portals stay on GitHub Pages at \$0/month with no extra Azure resources.
- Good, because adopters on GitHub Free are warned upfront that `environment:` approval gates and GitHub Pages do not work on private repos without GitHub Pro+.
- Good, because adopters who need private web pages can deploy them into their single Azure tenant at near-\$0/month without upgrading GitHub.
- Bad, because automated GitHub Actions write-approval gates (`approve.yml`, `deploy.yml`) still require either GitHub Pro+ or running interactively from Azure Cloud Shell until an alternative non-Environment approval mechanism exists.

## More Information

Related companion-repo limits and topology decisions.

<!-- more -->

- Private companion repo limits and setup: [Your private companion repo](../../private-companion-repo.md).
- Public site vs. demo hub split: [decision 0018](0018-split-project-site-and-public-demo-domains.md).
- Lab topology and \$0/mo idle cost guardrails: [decision 0019](0019-multi-subscription-multi-tenant-lab-topology.md).
