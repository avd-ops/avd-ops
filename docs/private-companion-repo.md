# Your private companion repo

The family's repos are public. What a run produces about *your* tenant is not: run journals,
teardown evidence, exported logs, the second brain's estate vault. That goes into one private
repository that you own, your companion repo. It is separate from every repo in the family, and
from any product.

## What goes in it

- **Run records**: the run journal, the hash manifest, teardown evidence and the logs a run
  exported before cleanup, compressed. This is the durable copy that lets a teardown delete
  the deployment without deleting the last copy ([never delete the last copy](never-delete-the-last-copy.md)).
- **Your second brain's estate vault**, built by avd-second-brain's `vault/avd_second_brain.ps1`,
  and anything else from avd-second-brain that should stay private to you.
- **Large files, within free GitHub limits**: under 50 MiB per file in git, up to 2 GiB per file as
  a release asset. Anything bigger stays in the run store in your subscription.

Never put secrets in it. Public repos and issues only ever get redacted output.

## Create it once

In Cloud Shell, with the GitHub CLI signed in to your account:

```bash
# Azure Cloud Shell (bash): one private companion repo, owned by you.
gh auth status || gh auth login
gh repo create avd-private --private --description "Private run records and estate vault for my AVD sandbox"
gh repo view avd-private --json visibility --jq .visibility   # must print PRIVATE
```

Pick any name. Scripts that write to it read its visibility first and refuse a repo that isn't
private.
