// Writes site/assets/diagrams/*.{svg,mmd,drawio}: exportable network, traffic, logical control-plane
// and Bicep deployment DAG diagrams linked from site/architecture.html.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
//
//   node scripts/site/build-diagrams.mjs           # write the diagram files
//   node scripts/site/build-diagrams.mjs --check   # fail if any file is out of date (CI)
import { mkdirSync, readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const OUT_DIR = join(root, 'site/assets/diagrams');

const STYLE_BLOCK = `<style>
  svg{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#475569}
  .d-box{fill:#ffffff;stroke:#94a3b8;stroke-width:1.2}
  .d-top{fill:#eff6ff;stroke:#2563eb;stroke-width:1.2}
  .d-ext{fill:#f8fafc;stroke:#94a3b8;stroke-width:1.2;stroke-dasharray:5 4}
  .d-good{fill:#ecfdf5;stroke:#059669;stroke-width:1.2}
  .d-caution{fill:#fffbeb;stroke:#d97706;stroke-width:1.2}
  .d-info{fill:#f0f9ff;stroke:#0284c7;stroke-width:1.2}
  .d-zone{fill:#f1f5f9;stroke:#cbd5e1;stroke-width:1.2}
  .d-ground{fill:#f1f5f9;stroke:#94a3b8;stroke-width:1.2}
  .d-pair{fill:none;stroke:#2563eb;stroke-width:1.2;stroke-dasharray:2 4}
  .d-edge{fill:none;stroke:#475569;stroke-width:1.4}
  .d-opt{fill:none;stroke:#475569;stroke-width:1.4;stroke-dasharray:5 4}
  .d-head{fill:#475569}
  .d-name{fill:#0f172a;font:700 14px system-ui,-apple-system,sans-serif}
  .d-sub{fill:#475569;font:12px system-ui,-apple-system,sans-serif}
  .d-lbl{fill:#0f172a;font:600 11.5px ui-monospace,SFMono-Regular,Consolas,monospace}
  .d-band{fill:#2563eb;font:600 11px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.08em}
  .d-gname{fill:#0f172a;font:700 14px system-ui,-apple-system,sans-serif}
  .d-gsub{fill:#475569;font:12px system-ui,-apple-system,sans-serif}
  .d-mask{fill:#ffffff}
</style>`;

export const INLINE_SVGS = {
  'avd-logical-control-planes': `<svg viewBox="0 0 1120 760" role="img" aria-label="Logical architecture and contract flows across the AVD repos and the five control planes.">
<defs><marker id="ah-logical" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="d-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>
<text class="d-band" x="330" y="38">ON TOP: DESKTOP DEVOPS INTELLIGENCE &amp; GATED AUTOMATION (OPTIONAL)</text>
<text class="d-band" x="20" y="294">FOUNDATION: METHOD, COLLECTION &amp; ORCHESTRATION</text>
<text class="d-band" x="870" y="294" text-anchor="end">SELF-CONTAINED PAIR</text>
<rect class="d-pair" x="318" y="302" width="554" height="118" rx="12"/>
<text class="d-band" x="20" y="476">FIVE CONTROL PLANES (DECISION 0009 · PINNED MANIFEST HANDOFFS)</text>

<rect class="d-ext" x="20" y="54" width="220" height="90" rx="8"/>
<text class="d-name" x="130" y="88" text-anchor="middle">Microsoft sources</text>
<text class="d-sub" x="130" y="108" text-anchor="middle">Learn, WARA,</text>
<text class="d-sub" x="130" y="124" text-anchor="middle">AVD review checklist</text>

<rect class="d-top" x="330" y="54" width="220" height="90" rx="8"/>
<text class="d-name" x="440" y="86" text-anchor="middle">avd-second-brain</text>
<text class="d-sub" x="440" y="106" text-anchor="middle">makes it smart</text>
<text class="d-sub" x="440" y="122" text-anchor="middle">C18 lifecycle · zero write creds</text>

<rect class="d-top" x="640" y="54" width="220" height="90" rx="8"/>
<text class="d-name" x="750" y="86" text-anchor="middle">avd-swarm</text>
<text class="d-sub" x="750" y="106" text-anchor="middle">automates it</text>
<text class="d-sub" x="750" y="122" text-anchor="middle">gate, kill switch, avd-buddy</text>

<rect class="d-ext" x="940" y="54" width="160" height="90" rx="8"/>
<text class="d-name" x="1020" y="88" text-anchor="middle">Azure SRE Agent</text>
<text class="d-sub" x="1020" y="108" text-anchor="middle">optional add-on</text>

<rect class="d-box" x="20" y="318" width="220" height="90" rx="8"/>
<text class="d-name" x="130" y="350" text-anchor="middle">avd-assess</text>
<text class="d-sub" x="130" y="370" text-anchor="middle">what it should be</text>
<text class="d-sub" x="130" y="386" text-anchor="middle">method · C19 intake · C20 rules</text>

<rect class="d-box" x="330" y="318" width="220" height="90" rx="8"/>
<text class="d-name" x="440" y="350" text-anchor="middle">avd-current-state</text>
<text class="d-sub" x="440" y="370" text-anchor="middle">what it is</text>
<text class="d-sub" x="440" y="386" text-anchor="middle">read-only collector &amp; validator</text>

<rect class="d-box" x="640" y="318" width="220" height="90" rx="8"/>
<text class="d-name" x="750" y="350" text-anchor="middle">avd-landing-zone</text>
<text class="d-sub" x="750" y="370" text-anchor="middle">how we build it</text>
<text class="d-sub" x="750" y="386" text-anchor="middle">portal-guided Cloud Shell</text>

<rect class="d-info" x="940" y="318" width="160" height="90" rx="8"/>
<text class="d-name" x="1020" y="350" text-anchor="middle">avd-linecheck</text>
<text class="d-sub" x="1020" y="370" text-anchor="middle">browser RTT probe</text>
<text class="d-sub" x="1020" y="386" text-anchor="middle">client reachability</text>

<rect class="d-good" x="20" y="492" width="196" height="76" rx="8"/>
<text class="d-name" x="118" y="522" text-anchor="middle">1. avd-entra</text>
<text class="d-sub" x="118" y="542" text-anchor="middle">groups, CA, Kerberos</text>
<text class="d-sub" x="118" y="556" text-anchor="middle">entra-manifest.json</text>

<rect class="d-good" x="236" y="492" width="196" height="76" rx="8"/>
<text class="d-name" x="334" y="522" text-anchor="middle">2. avd-intune</text>
<text class="d-sub" x="334" y="542" text-anchor="middle">settings catalog, compliance</text>
<text class="d-sub" x="334" y="556" text-anchor="middle">intune-manifest.json</text>

<rect class="d-good" x="452" y="492" width="196" height="76" rx="8"/>
<text class="d-name" x="550" y="522" text-anchor="middle">3. avd-m365</text>
<text class="d-sub" x="550" y="542" text-anchor="middle">Apps, OneDrive, licensing</text>
<text class="d-sub" x="550" y="556" text-anchor="middle">m365-manifest.json</text>

<rect class="d-good" x="668" y="492" width="196" height="76" rx="8"/>
<text class="d-name" x="766" y="522" text-anchor="middle">4. avd-azure</text>
<text class="d-sub" x="766" y="542" text-anchor="middle">VNet, PEs, Files, pools, hosts</text>
<text class="d-sub" x="766" y="556" text-anchor="middle">azure-outputs.json</text>

<rect class="d-good" x="884" y="492" width="216" height="76" rx="8"/>
<text class="d-name" x="992" y="522" text-anchor="middle">5. avd-power-platform</text>
<text class="d-sub" x="992" y="542" text-anchor="middle">approval flows, connectors</text>
<text class="d-sub" x="992" y="556" text-anchor="middle">power-platform-manifest.json</text>

<rect class="d-ground" x="20" y="646" width="1080" height="84" rx="8"/>
<text class="d-gname" x="560" y="680" text-anchor="middle">Your Azure subscription, Microsoft Entra tenant, Intune, Microsoft 365 and Power Platform</text>
<text class="d-gsub" x="560" y="702" text-anchor="middle">the AVD estate: host pools, session hosts, FSLogix storage, Private Link network, identities and device policies</text>

<path class="d-edge" d="M130,144 V316" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="138" y="236">linked, pinned</text>
<path class="d-edge" d="M240,363 H328" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="284" y="355" text-anchor="middle">C20 rules</text>
<path class="d-edge" d="M210,318 L380,146" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="288" y="218" text-anchor="end">C19 intake</text>
<path class="d-edge" d="M440,318 V146" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="432" y="226" text-anchor="end">C11 facts</text>
<text class="d-lbl" x="432" y="242" text-anchor="end">C21 report</text>
<path class="d-edge" d="M690,318 L522,146" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="592" y="254" text-anchor="end">C17 run record</text>
<path class="d-edge" d="M548,144 L714,316" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="646" y="220">C14 target state</text>
<path class="d-edge" d="M550,86 H638" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="594" y="78" text-anchor="middle">C9 plans</text>
<path class="d-edge" d="M640,118 H552" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="594" y="136" text-anchor="middle">C10 outcomes</text>
<path class="d-opt" d="M860,86 H938"/>
<path class="d-opt" d="M940,363 H862" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="901" y="355" text-anchor="middle">RTT</text>
<path class="d-edge" d="M750,408 V490" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="758" y="452">orchestrates</text>
<path class="d-edge" d="M440,644 V410" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="432" y="612" text-anchor="end">reads all 5 planes</text>
<path class="d-edge" d="M766,568 V644" marker-end="url(#ah-logical)"/>
<text class="d-lbl" x="774" y="612">deploys</text>
<path class="d-edge" d="M860,130 H910 V644" marker-end="url(#ah-logical)"/>
<rect class="d-mask" x="880" y="582" width="60" height="34" rx="3"/>
<text class="d-lbl" x="910" y="596" text-anchor="middle">approved</text>
<text class="d-lbl" x="910" y="610" text-anchor="middle">plans</text>
</svg>`,

  'avd-network-topology': `<svg viewBox="0 0 1120 620" role="img" aria-label="Azure landing zone network, subnet, Private Link, and resource group topology.">
<defs><marker id="ah-net" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="d-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>
<rect class="d-ext" x="16" y="16" width="1088" height="588" rx="12"/>
<text class="d-band" x="34" y="42">DEDICATED AVD SUBSCRIPTION · POLICY · DEFENDER FOR CLOUD · BUDGET · ACTIVITY LOG TO LAW</text>

<rect class="d-zone" x="34" y="58" width="660" height="526" rx="10"/>
<text class="d-name" x="52" y="84">rg-&lt;prefix&gt;-&lt;env&gt;-network · vnet-&lt;prefix&gt;-&lt;env&gt; (10.100.0.0/22)</text>
<text class="d-sub" x="52" y="102">Default outbound access disabled · NSG on every subnet · Bastion Developer (opt-in)</text>

<rect class="d-top" x="52" y="120" width="420" height="156" rx="8"/>
<text class="d-name" x="68" y="144">snet-session-hosts (10.100.0.0/23 · 512 IPs)</text>
<text class="d-sub" x="68" y="162">NSG: deny inbound · allow 445 to PE subnet · 443 to AzureCloud/Internet</text>
<rect class="d-box" x="68" y="178" width="120" height="80" rx="6"/>
<text class="d-name" x="128" y="204" text-anchor="middle">Session Host 1</text>
<text class="d-sub" x="128" y="222" text-anchor="middle">Zone 1 · Trusted</text>
<text class="d-sub" x="128" y="238" text-anchor="middle">AMA · Entra Join</text>
<rect class="d-box" x="202" y="178" width="120" height="80" rx="6"/>
<text class="d-name" x="262" y="204" text-anchor="middle">Session Host 2</text>
<text class="d-sub" x="262" y="222" text-anchor="middle">Zone 2 · Trusted</text>
<text class="d-sub" x="262" y="238" text-anchor="middle">FSLogix · AVD</text>
<rect class="d-box" x="336" y="178" width="120" height="80" rx="6"/>
<text class="d-name" x="396" y="204" text-anchor="middle">Session Host N</text>
<text class="d-sub" x="396" y="222" text-anchor="middle">Zone 3 · Trusted</text>
<text class="d-sub" x="396" y="238" text-anchor="middle">Zero Public IP</text>

<rect class="d-caution" x="488" y="120" width="188" height="156" rx="8"/>
<text class="d-name" x="582" y="148" text-anchor="middle">Egress Path</text>
<text class="d-sub" x="582" y="170" text-anchor="middle">Standalone: NAT Gateway</text>
<text class="d-sub" x="582" y="188" text-anchor="middle">(dedicated public IP)</text>
<text class="d-sub" x="582" y="214" text-anchor="middle">Hub-peered: UDR 0.0.0.0/0</text>
<text class="d-sub" x="582" y="232" text-anchor="middle">to Hub Firewall</text>

<rect class="d-good" x="52" y="296" width="624" height="142" rx="8"/>
<text class="d-name" x="68" y="320">snet-private-endpoints (10.100.2.0/27 · 32 IPs)</text>
<text class="d-sub" x="68" y="338">Private Endpoint network policies enabled · NSG enforces 445 from hosts and 443 from VNet</text>
<rect class="d-box" x="68" y="352" width="186" height="68" rx="6"/>
<text class="d-name" x="161" y="378" text-anchor="middle">PE: Storage (file)</text>
<text class="d-sub" x="161" y="396" text-anchor="middle">SMB 445 · FSLogix share</text>
<text class="d-sub" x="161" y="412" text-anchor="middle">privatelink.file.core...</text>
<rect class="d-box" x="271" y="352" width="186" height="68" rx="6"/>
<text class="d-name" x="364" y="378" text-anchor="middle">PE: Key Vault (vault)</text>
<text class="d-sub" x="364" y="396" text-anchor="middle">HTTPS 443 · break-glass</text>
<text class="d-sub" x="364" y="412" text-anchor="middle">privatelink.vaultcore...</text>
<rect class="d-box" x="474" y="352" width="186" height="68" rx="6"/>
<text class="d-name" x="567" y="378" text-anchor="middle">PE: AVD (connection/feed)</text>
<text class="d-sub" x="567" y="396" text-anchor="middle">HTTPS 443 · host &amp; client PL</text>
<text class="d-sub" x="567" y="412" text-anchor="middle">privatelink.wvd.microsoft.com</text>

<rect class="d-ext" x="52" y="456" width="624" height="110" rx="8"/>
<text class="d-name" x="68" y="482">snet-jumpbox (10.100.2.32/28 · Opt-in) &amp; Private DNS Zones</text>
<text class="d-sub" x="68" y="502">Operator jumpbox (Ubuntu B2als_v2 / Windows Server 2025 B2as_v2) · daily auto-stop · no public IP</text>
<text class="d-sub" x="68" y="522">Private DNS zones (new or existing hub): privatelink.file.core.windows.net · privatelink.vaultcore.azure.net</text>
<text class="d-sub" x="68" y="540">privatelink.wvd.microsoft.com · privatelink-global.wvd.microsoft.com</text>

<rect class="d-top" x="726" y="58" width="360" height="156" rx="10"/>
<text class="d-name" x="744" y="84">rg-&lt;prefix&gt;-&lt;env&gt;-avd &amp; rg-hosts</text>
<text class="d-sub" x="744" y="106">Host pools (Pooled / Personal · Private Link)</text>
<text class="d-sub" x="744" y="126">Desktop &amp; RemoteApp application groups</text>
<text class="d-sub" x="744" y="146">Workspaces · Autoscale scaling plans</text>
<text class="d-sub" x="744" y="166">Scheduled agent updates (Sat 02:00 local)</text>
<text class="d-sub" x="744" y="186">Encryption at Host · Trusted Launch · Zones 1-3</text>

<rect class="d-good" x="726" y="234" width="360" height="162" rx="10"/>
<text class="d-name" x="744" y="260">rg-&lt;prefix&gt;-&lt;env&gt;-storage</text>
<text class="d-sub" x="744" y="282">Premium FileStorage (ZRS) · share "profiles"</text>
<text class="d-sub" x="744" y="302">Microsoft Entra Kerberos authentication</text>
<text class="d-sub" x="744" y="322">Shared key access disabled · public access off</text>
<text class="d-sub" x="744" y="342">Recovery Services vault · daily share backup</text>
<text class="d-sub" x="744" y="362">SMB Contributor / Elevated RBAC at share scope</text>

<rect class="d-caution" x="726" y="416" width="360" height="168" rx="10"/>
<text class="d-name" x="744" y="442">rg-&lt;prefix&gt;-&lt;env&gt;-management</text>
<text class="d-sub" x="744" y="464">Log Analytics workspace · AVD Insights DCR</text>
<text class="d-sub" x="744" y="484">Action group · capacity, health &amp; cost alerts</text>
<text class="d-sub" x="744" y="504">Key Vault (Private Link · RBAC authorization)</text>
<text class="d-sub" x="744" y="524">Break-glass local admin secret</text>
<text class="d-sub" x="744" y="544">Automation account · daily shutdown runbook</text>

<path class="d-edge" d="M472,198 H486" marker-end="url(#ah-net)"/>
<path class="d-edge" d="M161,276 V350" marker-end="url(#ah-net)"/>
<text class="d-lbl" x="169" y="314">SMB 445</text>
<path class="d-edge" d="M396,276 L567,350" marker-end="url(#ah-net)"/>
<text class="d-lbl" x="496" y="314">HTTPS 443</text>
<path class="d-opt" d="M660,378 L724,140" marker-end="url(#ah-net)"/>
<path class="d-opt" d="M660,388 L724,315" marker-end="url(#ah-net)"/>
<path class="d-opt" d="M457,410 L724,500" marker-end="url(#ah-net)"/>
</svg>`,

  'avd-traffic-flows': `<svg viewBox="0 0 1120 480" role="img" aria-label="End-to-end session, Reverse Connect, RDP Shortpath, Entra Kerberos SMB and telemetry traffic flows.">
<defs><marker id="ah-tf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="d-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>
<rect class="d-top" x="20" y="40" width="200" height="124" rx="8"/>
<text class="d-name" x="120" y="74" text-anchor="middle">End-User Device</text>
<text class="d-sub" x="120" y="96" text-anchor="middle">Windows App / Web Client</text>
<text class="d-sub" x="120" y="116" text-anchor="middle">avd-linecheck browser probe</text>
<text class="d-sub" x="120" y="136" text-anchor="middle">Office, branch or home</text>

<rect class="d-box" x="20" y="280" width="200" height="140" rx="8"/>
<text class="d-name" x="120" y="314" text-anchor="middle">Entra ID &amp; Intune</text>
<text class="d-sub" x="120" y="336" text-anchor="middle">Conditional Access &amp; MFA</text>
<text class="d-sub" x="120" y="356" text-anchor="middle">Entra Kerberos TGT</text>
<text class="d-sub" x="120" y="376" text-anchor="middle">Intune compliance &amp; policy</text>
<text class="d-sub" x="120" y="396" text-anchor="middle">M365 Apps licensing</text>

<rect class="d-info" x="340" y="40" width="220" height="124" rx="8"/>
<text class="d-name" x="450" y="74" text-anchor="middle">AVD Control Plane</text>
<text class="d-sub" x="450" y="96" text-anchor="middle">Workspace feed &amp; gateway</text>
<text class="d-sub" x="450" y="116" text-anchor="middle">Connection broker</text>
<text class="d-sub" x="450" y="136" text-anchor="middle">Azure Front Door edge</text>

<rect class="d-caution" x="340" y="280" width="220" height="140" rx="8"/>
<text class="d-name" x="450" y="314" text-anchor="middle">NAT GW / Hub Firewall</text>
<text class="d-sub" x="450" y="336" text-anchor="middle">Outbound HTTPS 443</text>
<text class="d-sub" x="450" y="356" text-anchor="middle">UDP 3478 STUN / TURN</text>
<text class="d-sub" x="450" y="376" text-anchor="middle">Required AVD &amp; M365 FQDNs</text>
<text class="d-sub" x="450" y="396" text-anchor="middle">Zero inbound ports open</text>

<rect class="d-top" x="680" y="40" width="420" height="164" rx="8"/>
<text class="d-name" x="890" y="72" text-anchor="middle">Session Host VM (snet-session-hosts · 10.100.0.0/23)</text>
<text class="d-sub" x="890" y="96" text-anchor="middle">No public IP · NSG blocks inbound internet</text>
<text class="d-sub" x="890" y="116" text-anchor="middle">RDAgentBootLoader &amp; Remote Desktop stack</text>
<text class="d-sub" x="890" y="136" text-anchor="middle">FSLogix Apps agent · Entra ID joined</text>
<text class="d-sub" x="890" y="156" text-anchor="middle">Azure Monitor Windows Agent (AMA) → DCR</text>
<text class="d-sub" x="890" y="176" text-anchor="middle">Trusted Launch · Encryption at Host</text>

<rect class="d-good" x="680" y="280" width="420" height="140" rx="8"/>
<text class="d-name" x="890" y="312" text-anchor="middle">Private Endpoints (snet-private-endpoints · 10.100.2.0/27)</text>
<text class="d-sub" x="890" y="336" text-anchor="middle">Storage PE (file): SMB 445 → Premium FileStorage ZRS</text>
<text class="d-sub" x="890" y="356" text-anchor="middle">Host Pool PE (connection): HTTPS 443 → privatelink.wvd</text>
<text class="d-sub" x="890" y="376" text-anchor="middle">Workspace PE (feed/global): optional private feed discovery</text>
<text class="d-sub" x="890" y="396" text-anchor="middle">Key Vault PE (vault): HTTPS 443 → break-glass secret</text>

<path class="d-edge" d="M120,164 V278" marker-end="url(#ah-tf)"/>
<text class="d-lbl" x="128" y="226">1. OIDC + MFA</text>
<path class="d-edge" d="M220,102 H338" marker-end="url(#ah-tf)"/>
<text class="d-lbl" x="279" y="92" text-anchor="middle">2. Feed &amp; TLS 443</text>
<path class="d-edge" d="M680,102 H562" marker-end="url(#ah-tf)"/>
<text class="d-lbl" x="621" y="92" text-anchor="middle">3. Reverse Connect</text>
<text class="d-lbl" x="621" y="120" text-anchor="middle">(outbound only)</text>
<path class="d-edge" d="M890,204 V278" marker-end="url(#ah-tf)"/>
<text class="d-lbl" x="898" y="246">4. SMB 445 (FSLogix) + WVD PE 443</text>
<path class="d-edge" d="M680,176 L562,296" marker-end="url(#ah-tf)"/>
<text class="d-lbl" x="598" y="226" text-anchor="end">5. Egress 443 / UDP 3478</text>
<path class="d-edge" d="M340,350 H222" marker-end="url(#ah-tf)"/>
<text class="d-lbl" x="281" y="340" text-anchor="middle">6. Kerberos / MDM</text>
</svg>`,

  'avd-bicep-dag': `<svg viewBox="0 0 1120 340" role="img" aria-label="Bicep subscription deployment dependency graph.">
<defs><marker id="ah-dag" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="d-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>
<text class="d-band" x="105" y="34" text-anchor="middle">STAGE 1: TELEMETRY</text>
<rect class="d-caution" x="25" y="66" width="160" height="72" rx="8"/>
<text class="d-name" x="105" y="96" text-anchor="middle">monitoring</text>
<text class="d-sub" x="105" y="116" text-anchor="middle">LAW · DCR · alerts</text>

<rect class="d-box" x="25" y="196" width="160" height="72" rx="8"/>
<text class="d-name" x="105" y="226" text-anchor="middle">governance</text>
<text class="d-sub" x="105" y="246" text-anchor="middle">Policy · Defender · budget</text>

<text class="d-band" x="315" y="34" text-anchor="middle">STAGE 2: VNET</text>
<rect class="d-top" x="235" y="66" width="160" height="72" rx="8"/>
<text class="d-name" x="315" y="96" text-anchor="middle">network</text>
<text class="d-sub" x="315" y="116" text-anchor="middle">VNet · NSGs · NAT GW</text>

<text class="d-band" x="525" y="34" text-anchor="middle">STAGE 3: DNS</text>
<rect class="d-good" x="445" y="66" width="160" height="72" rx="8"/>
<text class="d-name" x="525" y="96" text-anchor="middle">privateDns</text>
<text class="d-sub" x="525" y="116" text-anchor="middle">file · vaultcore · wvd</text>

<text class="d-band" x="745" y="34" text-anchor="middle">STAGE 4: PARALLEL SERVICES</text>
<rect class="d-caution" x="665" y="50" width="160" height="64" rx="8"/>
<text class="d-name" x="745" y="78" text-anchor="middle">keyVault</text>
<text class="d-sub" x="745" y="96" text-anchor="middle">Vault · PE · RBAC</text>

<rect class="d-good" x="665" y="132" width="160" height="64" rx="8"/>
<text class="d-name" x="745" y="160" text-anchor="middle">storage (+backup)</text>
<text class="d-sub" x="745" y="178" text-anchor="middle">Premium Files · PE · RSV</text>

<rect class="d-top" x="665" y="214" width="160" height="64" rx="8"/>
<text class="d-name" x="745" y="242" text-anchor="middle">controlPlane</text>
<text class="d-sub" x="745" y="260" text-anchor="middle">Pools · AppGroups · PEs</text>

<text class="d-band" x="985" y="34" text-anchor="middle">STAGE 5: COMPUTE &amp; AGENT</text>
<rect class="d-top" x="880" y="94" width="215" height="140" rx="8"/>
<text class="d-name" x="987" y="124" text-anchor="middle">sessionHosts (×N)</text>
<text class="d-sub" x="987" y="148" text-anchor="middle">1. VMs (Zones 1-3, Trusted)</text>
<text class="d-sub" x="987" y="168" text-anchor="middle">2. AADLogin + AMA extensions</text>
<text class="d-sub" x="987" y="188" text-anchor="middle">3. RunCmd: Configure-FSLogix</text>
<text class="d-sub" x="987" y="208" text-anchor="middle">4. RunCmd: Register-AvdAgent</text>

<path class="d-edge" d="M105,138 V194" marker-end="url(#ah-dag)"/>
<path class="d-edge" d="M185,102 H233" marker-end="url(#ah-dag)"/>
<path class="d-edge" d="M395,102 H443" marker-end="url(#ah-dag)"/>
<path class="d-edge" d="M605,90 L663,82" marker-end="url(#ah-dag)"/>
<path class="d-edge" d="M605,102 L663,164" marker-end="url(#ah-dag)"/>
<path class="d-edge" d="M605,114 L663,246" marker-end="url(#ah-dag)"/>
<path class="d-edge" d="M825,82 L878,136" marker-end="url(#ah-dag)"/>
<path class="d-edge" d="M825,164 H878" marker-end="url(#ah-dag)"/>
<path class="d-edge" d="M825,246 L878,192" marker-end="url(#ah-dag)"/>
</svg>`
};

function wrapStandaloneSvg(inlineSvg) {
  return inlineSvg.replace(/^<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/\n<defs>/, `\n${STYLE_BLOCK}\n<defs>`) + '\n';
}

const MERMAID_FILES = {
  'avd-logical-control-planes': `flowchart TB
  subgraph Top["Desktop DevOps Intelligence & Gated Automation (Optional)"]
    Brain["avd-second-brain\\nKB, C18 Lifecycle, C9 Plans\\n(Zero Write Credentials)"]
    Swarm["avd-swarm\\nHuman-Approved Execution,\\nKill Switch, avd-buddy"]
    SRE["Azure SRE Agent\\n(Optional Add-on)"]
  end

  subgraph Foundation["Foundation: Method, Collection & Orchestration"]
    Sources["Microsoft Sources\\nLearn, WARA, AVD Checklist"]
    Assess["avd-assess\\nMethod, C19 Intake, C20 Rules"]
    CS["avd-current-state\\nRead-Only Collector & Validator\\nC11 Facts, C21 Report"]
    LZ["avd-landing-zone\\nPortal-Guided Cloud Shell\\nBicep Orchestrator"]
    LC["avd-linecheck\\nBrowser Client RTT Probe"]
  end

  subgraph Planes["Five Control Planes (Decision 0009)"]
    CP1["1. avd-entra\\nentra-manifest.json"]
    CP2["2. avd-intune\\nintune-manifest.json"]
    CP3["3. avd-m365\\nm365-manifest.json"]
    CP4["4. avd-azure\\nazure-outputs.json"]
    CP5["5. avd-power-platform\\npower-platform-manifest.json"]
  end

  Estate[("Target Estate: Azure Subscription, Entra ID, Intune, M365 & Power Platform")]

  Sources -->|pinned guidance| Assess
  Assess -->|C20 rules| CS
  Assess -->|C19 intake| Brain
  CS -->|C11 facts & C21 report| Brain
  Brain -->|C14 target state| LZ
  LZ -->|C17 run record| Brain
  Brain -->|C9 plans| Swarm
  Swarm -->|C10 outcomes| Brain
  Swarm -.-> SRE
  LC -.->|client RTT| LZ
  LZ --> CP1 & CP2 & CP3 & CP4 & CP5
  CP1 & CP2 & CP3 & CP4 & CP5 -->|deploys| Estate
  CS -->|reads only| Estate
  Swarm -->|approved plans only| Estate
`,

  'avd-network-topology': `flowchart LR
  subgraph Sub["Subscription: Dedicated AVD Landing Zone (Policy, Defender, Budget, Activity Log -> LAW)"]
    subgraph RGNet["rg-<prefix>-<env>-network · vnet-<prefix>-<env> (10.100.0.0/22)"]
      subgraph SnetHosts["snet-session-hosts (10.100.0.0/23 · NSG: Deny Inbound)"]
        SH1["Session Host 1 (Zone 1)"]
        SH2["Session Host 2 (Zone 2)"]
        SHN["Session Host N (Zone 3)"]
      end
      Egress["NAT Gateway (Standalone)\\nor UDR 0.0.0.0/0 -> Hub FW"]
      subgraph SnetPE["snet-private-endpoints (10.100.2.0/27 · Network Policies Enabled)"]
        PEFile["PE: Storage (file)\\nSMB 445"]
        PEVault["PE: Key Vault (vault)\\nHTTPS 443"]
        PEWvd["PE: AVD (connection/feed)\\nHTTPS 443"]
      end
      subgraph SnetJump["snet-jumpbox (10.100.2.32/28 · Opt-in) & Private DNS Zones"]
        Jump["Operator Jumpbox + Bastion Developer"]
        DNS["privatelink.file.core.windows.net\\nprivatelink.vaultcore.azure.net\\nprivatelink.wvd.microsoft.com"]
      end
    end

    subgraph RGAvd["rg-<prefix>-<env>-avd & rg-hosts"]
      Pool["Host Pools (Pooled / Personal)\\nApp Groups · Workspaces · Scaling Plan"]
    end

    subgraph RGStorage["rg-<prefix>-<env>-storage"]
      Files["Premium FileStorage (ZRS)\\nShare: profiles · Entra Kerberos\\nDaily RSV Backup"]
    end

    subgraph RGMgmt["rg-<prefix>-<env>-management"]
      LAW["Log Analytics + AVD Insights DCR\\nAction Group & Alerts"]
      KV["Key Vault (Private Link · RBAC)\\nBreak-Glass Secret"]
    end
  end

  SnetHosts -->|Outbound 443| Egress
  SnetHosts -->|SMB 445| PEFile
  SnetHosts -->|HTTPS 443| PEWvd
  PEFile -.->|Private Link| Files
  PEVault -.->|Private Link| KV
  PEWvd -.->|Private Link| Pool
`,

  'avd-traffic-flows': `flowchart LR
  User["End-User Device\\nWindows App / Web Client\\n+ avd-linecheck probe"]
  Entra["Microsoft Entra ID & Intune\\nConditional Access, MFA,\\nEntra Kerberos TGT, MDM"]
  Gateway["AVD Control Plane\\nWorkspace Feed, Gateway\\n& Connection Broker"]
  Egress["NAT Gateway (Standalone)\\nor Hub Firewall (Peered)\\nOutbound 443 & UDP 3478"]
  Host["Session Host VM\\nsnet-session-hosts (10.100.0.0/23)\\nNo Public IP · Reverse Connect"]
  PEs["Private Endpoints\\nsnet-private-endpoints (10.100.2.0/27)\\nStorage (445), WVD (443), Key Vault (443)"]

  User -->|1. OIDC + MFA| Entra
  User -->|2. Feed & TLS 443| Gateway
  Host -->|3. Reverse Connect TLS 443| Gateway
  Host -->|4. SMB 445 FSLogix + WVD PE 443| PEs
  Host -->|5. Outbound 443 / UDP 3478| Egress
  Egress -->|6. Kerberos TGT / Intune MDM| Entra
`,

  'avd-bicep-dag': `flowchart LR
  Mon["monitoring\\nLAW + AVD Insights DCR + Alerts"]
  Gov["governance\\nPolicy, Defender, Budget"]
  Net["network\\nVNet, Subnets, NSGs, NAT GW"]
  DNS["privateDns\\nfile, vaultcore, wvd zones"]
  KV["keyVault\\nVault + PE + RBAC"]
  Stg["storage (+backup)\\nPremium Files + PE + RSV"]
  CP["controlPlane\\nHost Pools, App Groups, Workspaces, PEs"]
  Hosts["sessionHosts (xN)\\n1. VMs (Trusted Launch, Zones 1-3)\\n2. AADLogin + AMA Extensions\\n3. RunCmd: Configure-FSLogix\\n4. RunCmd: Register-AvdAgent"]

  Mon --> Gov
  Mon --> Net
  Net --> DNS
  DNS --> KV
  DNS --> Stg
  DNS --> CP
  KV --> Hosts
  Stg --> Hosts
  CP --> Hosts
`
};

function buildDrawioXml(name, cells, edges) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const nodeXml = cells.map((c) =>
    `        <mxCell id="${esc(c.id)}" value="${esc(c.label)}" style="${esc(c.style || 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;')}" vertex="1" parent="1"><mxGeometry x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" as="geometry"/></mxCell>`
  ).join('\n');
  const edgeXml = edges.map((e, idx) =>
    `        <mxCell id="e${idx + 1}" value="${esc(e.label || '')}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="${esc(e.from)}" target="${esc(e.to)}"><mxGeometry relative="1" as="geometry"/></mxCell>`
  ).join('\n');
  return `<mxfile host="avd-ops.dev" version="1.0">
  <diagram id="${esc(name)}" name="${esc(name)}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
${nodeXml}
${edgeXml}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;
}

const DRAWIO_FILES = {
  'avd-logical-control-planes': buildDrawioXml(
    'AVD Logical Control Planes',
    [
      { id: 'sources', label: 'Microsoft Sources\n(Learn, WARA, Checklist)', x: 40, y: 40, w: 200, h: 70, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;dashed=1;' },
      { id: 'brain', label: 'avd-second-brain\n(KB, C18 Lifecycle, C9 Plans)', x: 320, y: 40, w: 220, h: 70, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;' },
      { id: 'swarm', label: 'avd-swarm\n(Human Gate, Kill Switch, avd-buddy)', x: 620, y: 40, w: 220, h: 70, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;' },
      { id: 'assess', label: 'avd-assess\n(Method, C19 Intake, C20 Rules)', x: 40, y: 200, w: 200, h: 70 },
      { id: 'cs', label: 'avd-current-state\n(Collector & Validator, C11, C21)', x: 320, y: 200, w: 220, h: 70 },
      { id: 'lz', label: 'avd-landing-zone\n(Portal & Bicep Orchestrator)', x: 620, y: 200, w: 220, h: 70 },
      { id: 'lc', label: 'avd-linecheck\n(Browser RTT Probe)', x: 900, y: 200, w: 180, h: 70 },
      { id: 'cp1', label: '1. avd-entra\n(entra-manifest.json)', x: 40, y: 350, w: 180, h: 65, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'cp2', label: '2. avd-intune\n(intune-manifest.json)', x: 250, y: 350, w: 180, h: 65, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'cp3', label: '3. avd-m365\n(m365-manifest.json)', x: 460, y: 350, w: 180, h: 65, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'cp4', label: '4. avd-azure\n(azure-outputs.json)', x: 670, y: 350, w: 180, h: 65, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'cp5', label: '5. avd-power-platform\n(power-platform-manifest.json)', x: 880, y: 350, w: 200, h: 65, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'estate', label: 'Target Estate: Azure Subscription, Entra ID, Intune, Microsoft 365 & Power Platform', x: 40, y: 490, w: 1040, h: 60, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;' }
    ],
    [
      { from: 'sources', to: 'assess', label: 'pinned' },
      { from: 'assess', to: 'cs', label: 'C20 rules' },
      { from: 'assess', to: 'brain', label: 'C19 intake' },
      { from: 'cs', to: 'brain', label: 'C11 / C21' },
      { from: 'brain', to: 'lz', label: 'C14 target' },
      { from: 'lz', to: 'brain', label: 'C17 run' },
      { from: 'brain', to: 'swarm', label: 'C9 plans' },
      { from: 'swarm', to: 'brain', label: 'C10 outcomes' },
      { from: 'lz', to: 'cp1', label: 'orchestrates' },
      { from: 'lz', to: 'cp2', label: 'orchestrates' },
      { from: 'lz', to: 'cp3', label: 'orchestrates' },
      { from: 'lz', to: 'cp4', label: 'orchestrates' },
      { from: 'lz', to: 'cp5', label: 'orchestrates' },
      { from: 'cp4', to: 'estate', label: 'deploys' },
      { from: 'cs', to: 'estate', label: 'reads only' },
      { from: 'swarm', to: 'estate', label: 'approved plans' }
    ]
  ),

  'avd-network-topology': buildDrawioXml(
    'AVD Landing Zone Network Topology',
    [
      { id: 'hosts', label: 'snet-session-hosts (10.100.0.0/23)\nSession Hosts xN (Zones 1-3, Trusted Launch, No Public IP)\nNSG: Deny Inbound, Allow 445 -> PE Subnet', x: 40, y: 60, w: 380, h: 120 },
      { id: 'egress', label: 'Egress Path\nStandalone: NAT Gateway\nHub-Peered: UDR 0.0.0.0/0 -> Hub FW', x: 460, y: 60, w: 220, h: 120, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;' },
      { id: 'pe_file', label: 'PE: Storage (file)\n10.100.2.0/27 · SMB 445\nprivatelink.file.core.windows.net', x: 40, y: 230, w: 200, h: 90, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'pe_vault', label: 'PE: Key Vault (vault)\n10.100.2.0/27 · HTTPS 443\nprivatelink.vaultcore.azure.net', x: 260, y: 230, w: 200, h: 90, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'pe_wvd', label: 'PE: AVD (connection/feed)\n10.100.2.0/27 · HTTPS 443\nprivatelink.wvd.microsoft.com', x: 480, y: 230, w: 200, h: 90, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'jump', label: 'snet-jumpbox (10.100.2.32/28 · Opt-in)\nOperator Jumpbox + Bastion Developer + Private DNS Zones', x: 40, y: 360, w: 640, h: 80, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;dashed=1;' },
      { id: 'rg_avd', label: 'rg-<prefix>-<env>-avd\nHost Pools, App Groups, Workspaces, Scaling Plans', x: 740, y: 60, w: 320, h: 110 },
      { id: 'rg_stg', label: 'rg-<prefix>-<env>-storage\nPremium FileStorage (ZRS), Entra Kerberos, Daily RSV Backup', x: 740, y: 200, w: 320, h: 110, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'rg_mgmt', label: 'rg-<prefix>-<env>-management\nLog Analytics, AVD Insights DCR, Alerts, Key Vault (RBAC)', x: 740, y: 340, w: 320, h: 110, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;' }
    ],
    [
      { from: 'hosts', to: 'egress', label: 'Outbound 443' },
      { from: 'hosts', to: 'pe_file', label: 'SMB 445' },
      { from: 'hosts', to: 'pe_wvd', label: 'HTTPS 443' },
      { from: 'pe_file', to: 'rg_stg', label: 'Private Link' },
      { from: 'pe_vault', to: 'rg_mgmt', label: 'Private Link' },
      { from: 'pe_wvd', to: 'rg_avd', label: 'Private Link' }
    ]
  ),

  'avd-traffic-flows': buildDrawioXml(
    'AVD End-to-End Traffic Flows',
    [
      { id: 'user', label: 'End-User Device\nWindows App / Web Client + avd-linecheck', x: 40, y: 60, w: 220, h: 100 },
      { id: 'entra', label: 'Microsoft Entra ID & Intune\nConditional Access, MFA, Kerberos TGT, MDM', x: 40, y: 240, w: 220, h: 110 },
      { id: 'gw', label: 'AVD Control Plane\nWorkspace Feed, Gateway & Broker', x: 360, y: 60, w: 240, h: 100 },
      { id: 'egress', label: 'NAT Gateway / Hub Firewall\nOutbound 443 & UDP 3478 STUN/TURN', x: 360, y: 240, w: 240, h: 110, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;' },
      { id: 'host', label: 'Session Host VM (10.100.0.0/23)\nRDAgent, FSLogix, AMA (No Public IP)', x: 700, y: 60, w: 340, h: 110 },
      { id: 'pes', label: 'Private Endpoints (10.100.2.0/27)\nStorage PE (SMB 445), WVD PE (443), Key Vault PE (443)', x: 700, y: 240, w: 340, h: 110, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' }
    ],
    [
      { from: 'user', to: 'entra', label: '1. OIDC + MFA' },
      { from: 'user', to: 'gw', label: '2. Feed & TLS 443' },
      { from: 'host', to: 'gw', label: '3. Reverse Connect' },
      { from: 'host', to: 'pes', label: '4. SMB 445 + WVD PE 443' },
      { from: 'host', to: 'egress', label: '5. Outbound 443 / UDP 3478' },
      { from: 'egress', to: 'entra', label: '6. Kerberos / MDM' }
    ]
  ),

  'avd-bicep-dag': buildDrawioXml(
    'AVD Bicep Deployment DAG',
    [
      { id: 'mon', label: 'monitoring\n(LAW + AVD Insights DCR + Alerts)', x: 40, y: 80, w: 170, h: 70, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;' },
      { id: 'gov', label: 'governance\n(Policy, Defender, Budget)', x: 40, y: 200, w: 170, h: 70 },
      { id: 'net', label: 'network\n(VNet, Subnets, NSGs, NAT GW)', x: 260, y: 80, w: 170, h: 70 },
      { id: 'dns', label: 'privateDns\n(file, vaultcore, wvd zones)', x: 480, y: 80, w: 170, h: 70, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'kv', label: 'keyVault\n(Vault + PE + RBAC)', x: 700, y: 40, w: 170, h: 65, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;' },
      { id: 'stg', label: 'storage (+backup)\n(Premium Files + PE + RSV)', x: 700, y: 130, w: 170, h: 65, style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;' },
      { id: 'cp', label: 'controlPlane\n(Pools, AppGroups, Workspaces, PEs)', x: 700, y: 220, w: 170, h: 65 },
      { id: 'hosts', label: 'sessionHosts (xN)\n1. VMs (Zones 1-3, Trusted Launch)\n2. AADLogin + AMA\n3. Configure-FSLogix\n4. Register-AvdAgent', x: 920, y: 95, w: 210, h: 130 }
    ],
    [
      { from: 'mon', to: 'gov', label: '' },
      { from: 'mon', to: 'net', label: '' },
      { from: 'net', to: 'dns', label: '' },
      { from: 'dns', to: 'kv', label: '' },
      { from: 'dns', to: 'stg', label: '' },
      { from: 'dns', to: 'cp', label: '' },
      { from: 'kv', to: 'hosts', label: '' },
      { from: 'stg', to: 'hosts', label: '' },
      { from: 'cp', to: 'hosts', label: '' }
    ]
  )
};

export function expectedFiles() {
  const out = {};
  for (const [id, svg] of Object.entries(INLINE_SVGS)) {
    out[`${id}.svg`] = wrapStandaloneSvg(svg);
    out[`${id}.mmd`] = MERMAID_FILES[id];
    out[`${id}.drawio`] = DRAWIO_FILES[id];
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  mkdirSync(OUT_DIR, { recursive: true });
  const files = expectedFiles();
  if (process.argv.includes('--check')) {
    for (const [name, content] of Object.entries(files)) {
      const p = join(OUT_DIR, name);
      if (!existsSync(p) || readFileSync(p, 'utf8') !== content) {
        console.error(`site/assets/diagrams/${name} is out of date; run node scripts/site/build-diagrams.mjs`);
        process.exit(1);
      }
    }
    console.log('all 12 architecture diagram deliverables are up to date');
  } else {
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(OUT_DIR, name), content);
    }
    console.log(`wrote ${Object.keys(files).length} diagram deliverables to site/assets/diagrams/`);
  }
}
