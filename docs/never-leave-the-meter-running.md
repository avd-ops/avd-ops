# Never leave the meter running

A convention for every repo in the family, next to [never delete the last copy](never-delete-the-last-copy.md).
The decision record, with the reasons and sources, is
[avd-second-brain decision 0017](https://github.com/avd-ops/avd-second-brain/blob/main/docs/knowledge/decisions/0017-never-leave-the-meter-running.md).

## The rule

Nothing in the family leaves something billing after a run unless you say so.

Anything that bills by time or use is removed, stopped or put on an automatic shutdown at the end
of a run. To keep something running, you opt in with `-KeepRunning <until>`, giving an expiry or a
reason. The opt-in is recorded with the run. `-Force` never means `-KeepRunning`, and an agent
never opts in for you.

## Three kinds of things that bill

| Kind | Examples | What happens by default |
|---|---|---|
| Run resources | VMs and session hosts, Bastion, NAT Gateway, Premium file shares, appliances such as the Stratusphere Hub (its Marketplace meter too), agents | Removed at teardown, or stopped on a schedule while the run lasts |
| Standing resources | The run store for logs and teardown evidence, the subscription budget | Kept on purpose, with their monthly cost written down |
| Recurring commitments | Microsoft 365 licenses and trials, Marketplace SaaS offers, reservations | Teardown can't remove them. They're recorded when you sign up, with the renewal date and how to cancel |

## What you'll see

- **A list of what still bills** at teardown and in the daily spend check, with the cost per day,
  plus every recurring commitment with its renewal or trial-end date. An opt-in past its expiry
  fails the check.
- **A timer on anything left running**: a daily shutdown, the landing zone's auto shutdown, or an
  end date on a time-boxed appliance.
- **A budget on every sandbox subscription.** The preflight warns when there isn't one. The
  landing zone's budget action stops its hosts.

## Recurring commitments: cancel windows

Teardown never cancels these, so the record says exactly how to.

- **Microsoft 365 for business** (billed in the Microsoft 365 admin center). Turning off recurring
  billing doesn't cancel the subscription. It stays active, and an annual plan paid monthly keeps
  billing, until the end of its term. A cancel with a prorated refund is only possible within 7
  days of the start or renewal on an MCA billing account. A trial becomes paid unless recurring
  billing is off. ([Microsoft Learn](https://learn.microsoft.com/microsoft-365/commerce/subscriptions/cancel-your-subscription))
- **Marketplace SaaS offers** (billed through the Azure subscription). Deleting resource groups
  doesn't cancel them; cancel under Marketplace > SaaS. A full refund is only available within 72
  hours. Turning off auto-renew on a trial doesn't pause it. ([Microsoft Learn](https://learn.microsoft.com/marketplace/saas-subscription-lifecycle-management))

No script in the family buys a license or a Marketplace offer for you.
