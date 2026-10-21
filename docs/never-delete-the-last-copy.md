# Never delete the last copy

A convention for every repo in the family: avd-landing-zone, avd-current-state, avd-swarm,
avd-second-brain and avd-liquidware. The decision record, with the reasons, is
[avd-second-brain decision 0016](https://github.com/nickprignano/avd-second-brain/blob/main/docs/knowledge/decisions/0016-never-delete-the-last-copy.md).

## The rule

Nothing in the family deletes the last copy of something without asking you.

Before a script, workflow or agent deletes data, it checks that another durable copy exists and
matches. If there is no such copy, it stops and tells you what to copy, unless you say, explicitly,
that you want the last copy gone. Data means logs, diagnostics, evidence, reports, ledgers, backups,
assessment data, configuration and packages someone built, and user data such as profiles.

## What that means when you tear something down

- **Teardown removes the things a redeploy recreates**: VMs, networks, endpoints, role
  assignments, templates. That is how a sandbox ends with nothing billing.
- **Logs and teardown evidence go to one place, the run store.** Every log a run produces and the
  proof that its teardown finished go into one run folder, outside the deployment's resource
  groups. A teardown can't touch it unless you opt in.
- **One preference decides what happens to those logs: `-TeardownLogs Keep|Ask|Delete`.** The
  default is `Keep`. `Delete` works only after a checked copy exists, and anything with no copy
  asks you to type a confirmation.
- **Data that lives inside a deployment needs `-DiscardLastCopy`.** Profiles and their backups,
  the Stratusphere Hub's assessment data, the Liquidware tier's configuration and packages. Without
  the switch, the teardown stops before it deletes anything. `-Force` skips questions; it never
  means `-DiscardLastCopy`.
- **Agents never opt in for you.** An avd-swarm plan that would discard a last copy says so, and
  the person approving the plan approves that.
- **Old data moves to a cheaper storage tier instead of being deleted**, and soft delete stays on.

## What counts as a copy

A copy counts when it is durable, outside what is being deleted, and checked against a list of
file hashes before anything is deleted.

| Counts | Doesn't count |
|---|---|
| Your [private companion repo](private-companion-repo.md), a separate private repo you own: files under 50 MiB in git, files up to 2 GiB as release assets, with the hash list in git | A public repository or issue (they only ever get redacted output) |
| The run store, outside the resource groups being deleted | Anything inside what is being deleted |
| An archive downloaded to your own machine, with its hashes | Cloud Shell's disk, GitHub Actions artifacts (they expire), soft delete on its own |

Files too big for free GitHub features stay where they are, in the run store. The free tooling
never splits them. You decide at teardown whether to delete them, and the default is keep.
