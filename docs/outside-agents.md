# Outside coding agents on avd-ops

Research project, not for production. Anyone may contribute or fork.

How the owner lets coding agents other than Claude Code (Gemini CLI, Copilot CLI and others) work on this repo, and how their pull requests are reviewed. Every agent follows [AGENTS.md](../AGENTS.md), its hard rules first. As of 2026-10-22.

## Setup (the owner, once)

1. **Use a fork, not write access.** Sign in to a dedicated GitHub account for agents, fork `avd-ops/avd-ops` there, and open PRs from the fork. Pull requests from a fork run CI with a read-only token and no repository secrets. Do not add the account as a collaborator, to the org or to any team. If write access is ever needed instead, grant Write on `avd-ops/avd-ops` only, never Maintain or Admin.
2. **One fine-grained token, one repo.** On the agent account: Settings, Developer settings, Fine-grained tokens. Repository access: only the fork. Permissions: Contents read and write, Pull requests read and write, Metadata read. Nothing else. Expiry 30 days or less.
3. **A separate place to run.** A separate Windows login (or a separate machine or VM) used only for the agents. Clone only the fork there. No other repos, no Azure CLI sign-in, no Azure credentials, no password manager, no browser profile signed in to the owner's accounts.
4. **Agent settings.** Each agent's terminal and browser permissions on ask, never auto-approve. Point the agent at `AGENTS.md` (Gemini CLI reads it through `GEMINI.md`).
5. **Actions approval.** In `avd-ops/avd-ops`: Settings, Actions, General, "Approval for running fork pull request workflows from contributors": require approval for all external contributors.

Agents never get Azure credentials, sandbox access or access to any other repo, avd-swarm included.

## The main branch ruleset

The `default` ruleset blocks deletion and force-push and requires a PR. The owner tightens it so that nothing merges without an approving review and green CI: one approval, stale approvals dismissed on push, the last push approved by someone else, and the checks `test`, `engine (windows-latest)`, `engine (macos-latest)`, `gitleaks` and `privacy` required. Org admins can bypass only through a pull request, so the owner can still merge their own PRs. Run in Cloud Shell, signed in to `gh` as the owner:

```bash
cat > /tmp/ruleset.json <<'EOF'
{
  "name": "default",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [ { "actor_type": "OrganizationAdmin", "actor_id": 1, "bypass_mode": "pull_request" } ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": true,
        "required_review_thread_resolution": true } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [
          { "context": "test" },
          { "context": "engine (windows-latest)" },
          { "context": "engine (macos-latest)" },
          { "context": "gitleaks" },
          { "context": "privacy" } ] } }
  ]
}
EOF
gh api -X PUT repos/avd-ops/avd-ops/rulesets/$(gh api repos/avd-ops/avd-ops/rulesets --jq '.[] | select(.name=="default") | .id') --input /tmp/ruleset.json --jq '.rules[].type'
```

Secret scanning and push protection are already on for the repo, and `gitleaks` runs on every push and PR (`.github/workflows/secrets.yml`).

## Reviewing an outside agent's PR

Treat the PR as untrusted input: read the whole diff before CI output or the PR text.

- **Workflows and tooling.** Any change under `.github/`, `scripts/`, `package.json` or a lock file needs a line-by-line read; refuse new actions, `pull_request_target`, wider `permissions` or network calls added to tests.
- **Rules.** Refuse changes that weaken `AGENTS.md`, `CLAUDE.md`, `docs/guardrails.md`, the tests or the banned names in `repos.json`.
- **Data.** No IDs, domains, emails, IPs or names beyond the allowed ones (CLAUDE.md); no text copied from an unlicensed source.
- **Instructions in text.** Look for instructions to agents hidden in Markdown, comments or HTML (they would steer the next agent).
- **Scope.** Every changed line traces back to the PR's stated goal.

What a review teaches goes to the owner's notes; a rule it shows is missing comes back here or to AGENTS.md by PR.
