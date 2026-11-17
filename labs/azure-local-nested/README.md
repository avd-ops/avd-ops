# Nested Azure Local 23H2+ Lab (Disposable Sandbox)

> **Community research project — use at your own risk.** Not for production, provided "as is", without warranty, and not affiliated with, endorsed by, or supported by the author's employer or Microsoft.

Self-contained Terraform (HCL) prerequisite stack that provisions a **disposable, single-node nested Azure Local 23H2+ sandbox** on an Azure-hosted nested-virtualization VM in `centralus`. It produces the exact Bring-Your-Own (BYO) outputs required by `avd-azure` (`hostPlacement = "azure-local"`, `avd-sandbox` item 30) and `avd-hcl` (`host_placement = "azure-local"`, `avd-sandbox` item 31) without duplicating their session-host modules.

## VM SKU and Cost Requirements

Nested Azure Local 23H2+ (Hyper-V + Azure Stack HCI OS + Arc Resource Bridge + 1–2 AVD session hosts) requires a nested-virtualization-capable Azure VM SKU with **at least 16 vCPUs and 128 GiB RAM** (`256 GiB` recommended):

| SKU | vCPUs | Memory | Approximate Hourly Rate (centralus PAYG) | Fit |
|---|---|---|---|---|
| `Standard_E16ds_v5` | 16 | 128 GiB | ~$1.01/hr | Minimum (tight for Arc Resource Bridge + 1 session host) |
| `Standard_E32ds_v5` **(default)** | 32 | 256 GiB | ~$2.02/hr | Recommended for single-node 23H2+ + 1–2 AVD session hosts |
| `Standard_E64ds_v5` | 64 | 512 GiB | ~$4.03/hr | Multi-session or multi-node nested testing |

Additional meters while deployed:
- **OS + Data Disks:** 1 × 256 GiB + 2 × 512 GiB `Premium_LRS` (~$0.22/hr combined).
- **NAT Gateway + Standard Public IP:** ~$0.05/hr.
- **Total standing estimate (default `Standard_E32ds_v5`):** **~$2.30/hr** while running; **~$0.27/hr** when the host VM is deallocated by auto-shutdown.

> [!CAUTION]
> **No spend without explicit `go batch` approval.** Never `terraform apply` this stack in a shared or personal sandbox without a written cost estimate and explicit `go batch` approval. Always run `terraform destroy` immediately after `avd-sandbox` items 30–31 complete.

## Spend and Meter Guards

1. **Auto-shutdown schedule (`enable_auto_shutdown = true`):** Provisions `azurerm_dev_test_global_vm_shutdown_schedule` on the host VM (default `2000` `Central Standard Time`) so compute billing stops automatically if left running.
2. **TTL tagging (`ttl_hours = 8`, max `72`):** Stamps `ttl_hours`, `expires_at`, and `auto_teardown = "true"` on the resource group and every child resource.
3. **Zero-leftover teardown:** `purge_soft_delete_on_destroy = true`, `prevent_deletion_if_contains_resources = false`, and single-resource-group isolation ensure `terraform destroy` removes 100% of resources.
4. **No open RDP:** Inbound RDP is denied by default (`allowed_rdp_cidr = ""`); use Azure Bastion, Run Command, or Serial Console.

## Two-Stage Usage

### Stage 1: Provision Host VM, Spend Guards, and Nested Hyper-V Shell

```bash
cd labs/azure-local-nested
terraform init -input=false
terraform apply -var="location=centralus" -var="prefix=azl23h2" -var="run_bootstrap=true"
```

Attach the Azure Stack HCI 23H2+ ISO/VHDX to the `azl-node01` nested VM, complete OS installation, register with Azure Arc (`azcmagent`), and deploy the single-node Azure Local cluster + Arc Resource Bridge (`<prefix>-cl`).

### Stage 2: Provision Arc Logical Network & Gallery Image and Export BYO Inputs

```bash
terraform apply -var="location=centralus" -var="prefix=azl23h2" -var="create_arc_vm_prereqs=true"
eval "$(terraform output -raw env_exports)"
```

This sets the four environment variables consumed by `avd-sandbox` items 30 (`avd-azure`) and 31 (`avd-hcl`):

| Terraform Output | Environment Variable | Purpose |
|---|---|---|
| `custom_location_id` | `AZL_CUSTOM_LOCATION_ID` | Arc Custom Location ID |
| `azure_local_logical_network_id` | `AZL_LOGICAL_NET_ID` | Arc Logical Network ID (`192.168.100.0/24`) |
| `azure_local_image_id` | `AZL_IMAGE_ID` | Azure Local Gallery Image ID (`win11-24h2-avd` default) |
| `local_smb_profile_path` | `AZL_SMB_PATH` | Optional local SMB UNC path (`\\192.168.100.1\profiles`) |

### Teardown

```bash
terraform destroy -auto-approve -var="location=centralus" -var="prefix=azl23h2" -var="create_arc_vm_prereqs=true"
```

## Offline Verification

```bash
terraform fmt -check -recursive
terraform init -backend=false -input=false
terraform validate
terraform test
```
