# Portal engine: one engine for every family portal

Status: proposed, design only (Nick, 2026-10-21: "we should have a shared portal engine if possible too not build 3 standalone portals"). Nothing here is built, and no portal changes until Nick approves this spec. Red-teamed (section 14).

The family has two portals and a third on the way: the avd-landing-zone deployment portal (`site/portal/`), the avd-current-state assessment portal (`site/portal/`) and the avd-linecheck end-user page ([its spec](https://github.com/avd-ops/avd-linecheck/blob/main/docs/spec.md), sections 4 to 8 and 18). This spec says what they should share, where the shared code lives, how it reaches each repo, and how the two working portals move onto it without a regression.

## 1. The decision in one line

**One engine, three thin portals, built in two phases.** The engine is a set of small, plain JavaScript files in avd-ops with its own manifest and its own `pe-v<version>` tag, vendored into each portal repo with a lock file and a hash test, the way the design system is. Phase 1 holds the logic both portals already duplicate (Run in, quoting, state lines) plus the landing zone's bands and probe, which linecheck's page is built on, so they have their second user as soon as it exists (section 5). Phase 2 (page widgets, step model, storage, redaction) waits until linecheck's page exists, so every module has two real users before it moves. Each portal keeps its own steps, commands, checks, packs and words. Nothing is fetched at run time or in CI, so avd-landing-zone and avd-current-state still work with no other repo.

The reading chosen: "not three standalone portals" means three portals built from one engine and one look, not one website with three modes. Section 3.3 says why one site was not chosen.

## 2. What the portals share today

Read at avd-landing-zone `785ef36`, avd-current-state `1e31fca` and avd-linecheck `ab7a0df` (2026-10-21).

| Piece | Deployment portal (LZ) | Assessment portal (CS) | Linecheck (spec) | Today |
|---|---|---|---|---|
| Tokens, fonts, shell | design system at `ds-v2.1.0` | design system at `ds-v2.2.0` | the same (spec 18.8) | **Shared** (decision 0005) |
| Portal components (`avd-ops-portal.css`) | **not loaded**: the page keeps its own 250-line `<style>`, its own `ol.steps` (`data-phase-start`) and a sliding `#track` of slides | loaded | planned | Shared by CS only |
| Engine file shape | `portal-core.js`, 1,108 lines, UMD (`window.PortalCore`, `module.exports`), ES5 | `assess-core.js`, 406 lines, UMD (`window.AssessCore`), uses `globalThis` (ES2020) | `engine.js`, `verdict.js`, `export.js` (spec 12.4) | Same pattern, written twice |
| Run in | `PLATFORMS`, `validRunIn`, `platformKey`, `scriptsIn`, `support`, `forRunIn`: PowerShell in stretches, `$env:` and `Remove-Item Env:` lines to `export` and `unset`, the clone line to bash, `bash ./` lines re-quoted, Az PowerShell and az CLI sign-in added on a local machine | the same names except `platformKey` (inlined in `support`); `forRunIn` leaves PowerShell as is everywhere (the block's preamble signs in) and wraps the whole block in one `pwsh` for Bash | none | **Copied, then diverged.** Same `avd-ops-runin` storage key; each `PLATFORMS` inlined and kept equal to its repo's `platforms.json` by a test |
| State lines | `<<<AVDLZ-STATE ...>>>`, drops `[\r\n]+`, keeps unparsable lines as `{ parseError, raw }` with `raw` cut at 200 characters (decision 0007) | `<<<AVDCS-STATE ...>>>`, drops `\r?\n`, skips unparsable lines and any line not `v: 1` with a known stage and status | none (paste-a-result is JSON, spec 8.4) | One parser, two markers, two error policies |
| Quoting and blocks | `psQuote` (doubles quotes), `bashQuote`, `preamble` | `psQuote` (also refuses control characters), `preamble`, `fileCommand` (internal; here-string guard) | none | Copied, CS's stricter |
| Paste redaction and issue report | `report.js` (decision 0008), tied to LZ's state lines, subscription lines and resource naming | none | a pattern list "for the day free text reaches a shared artifact" (spec 8.3) | LZ only |
| Latency and reachability | `timeOnce`, `measure` in `portal-page.js` (browser only, not tested in Node); `rateLatency`, `classifyReachability` in the engine (decisions 0003, 0014) | none | the core of the page (spec 4.1, 5, 6.2) | LZ only; linecheck starts from it |
| Page state | `localStorage` keys `avdlz.portal.*`, with migrations of older values | one object under `avdcs-portal-v1` | theme and last pack only (spec 8.1) | Two shapes |
| Copy, element helper, downloads | `copy()`, `el()`; `innerHTML` for step and table markup | `copy` with `selectText`, `el()`, `blobLink` | share panel (spec 5) | Copied |
| Content Security Policy | meta policy: `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `connect-src https:` | **none** (its test forbids `style="` but the page has a `<style>` block) | strict, `connect-src` generated from the pack (spec 8.2) | Uneven |

The code both portals really share today is about 480 lines (Run in about 110, quoting and preamble about 10, state lines about 8, bands about 35, probe about 20, `report.js` 291). Everything else in this spec is either new or one portal's code.

What each portal owns and never shares: the deployment portal's steps, commands, `decide()` and `analyze()`, sizing and cost; the assessment portal's stages, discovery questions, `intake.json` (contract C19) and the review; linecheck's packs, verdict sentences, export, download sufficiency, UDP hint and guided steps.

## 3. Prior art and build or adopt

Prior-art check: `scripts/kb/prior_art.py "shared portal engine browser javascript"` found nothing in this KB; the sibling and GitHub searches return 403 from the container. Read directly instead (2026-10-21). The job, measured against what the portals need ([build or adopt](build-or-adopt.md)): plain files on GitHub Pages or any static host; no build step; a strict CSP with no `unsafe-eval` and no inline script; the logic testable in Node with no browser; no request to any other site; nothing a fork has to install.

### 3.1 Frameworks and tools

| Candidate | License (from the project's page) | Fit for this job | Verdict |
|---|---|---|---|
| [Alpine.js](https://alpinejs.dev/) | MIT | The standard build turns attribute strings into functions, which needs `unsafe-eval`. The [CSP build](https://alpinejs.dev/advanced/csp) drops that but limits expressions to property and method lookups by key | Not adopted: the strict CSP is a family rule, and the CSP build is a smaller language than plain JavaScript |
| petite-vue | MIT | Compiles templates from the DOM at run time; Vue's runtime compiler needs `unsafe-eval` (to confirm at a pin if it is ever reconsidered) | Not adopted, same reason |
| Preact with htm | MIT | No build and no `eval`. Two more vendored files, and every page's DOM code rewritten as components | Not adopted: the rewrite is the regression risk this spec avoids, for little gain on pages this small. The option if a portal grows into an app |
| Lit | BSD-3-Clause | Web components. Shadow DOM keeps the vendored design system's styles out unless each component adopts them | Not adopted |
| A bundler (esbuild, Vite, Rollup) | MIT | Would let the engine be written as modules and shipped as one script | Not adopted: a build step in every portal repo and every fork, against "a fork can host `site/` by copying it" (linecheck spec 12.4) |

### 3.2 Why plain classic scripts

- **One shape for browser and Node.** Both portals are UMD classic scripts: the page loads them with `<script src>`, the Node tests with `require`. Keeping that shape means the existing test suites keep working as they are, and `script-src 'self'` covers them.
- **No build.** What is in the repo is what runs, so a reviewer reads the diff of the code operators run as subscription Owner.
- **Language floor:** what the pages already use, ES2020 (`globalThis`, `Promise.prototype.finally`), checked by a parse test in avd-ops.
- **Parity checklist** from what we did not adopt: declarative rendering into existing markup (Alpine), small components with explicit inputs (Preact), one bundle per release (bundlers). Phase 2's widgets answer the first two with plain functions; the manifest answers the third.

### 3.3 One site with three modes

Not chosen. The deployment portal's trust root is its repo and ref (decision 0017: a published copy's `portal-config.js` names the repo, and its commands run a pinned ref), and a fork serves its own; a shared site would mix that with the assessment portal's and the end-user page's, whose audience must never see deployment commands. The three CSPs differ on purpose (linecheck's `connect-src` is its pack). And avd-landing-zone with avd-current-state must stay a self-contained pair. The shell's switcher already makes them feel like one product.

## 4. Where it lives and how it travels

- **Home: avd-ops, `site/assets/engine/`,** beside the design system, which already holds the family's shared UI and its release flow (decisions 0005, 0007). Both portals take their copy from there, which ends the one-way copying from the landing zone to avd-current-state. avd-linecheck's spec says the engine starts in linecheck and the landing zone vendors it from there (its 6.2, 11 and Q8); it lives in avd-ops instead, so the deployment engine never pins an end-user tool's release. **Decided: avd-ops** (Nick, 2026-10-21: "avd-ops makes sense"); linecheck's spec is updated to match in its own repo (6.2 and 11).
- **Its own release train.** `site/assets/engine/MANIFEST.json` lists each engine file with its SHA-256, a `network` flag (true for `probe.js` only) and the modules it needs (`core.js` for all). Releases are tagged `pe-v<version>`. One train with the design system was considered and dropped: one manifest forces every consumer to carry every file (the design-system tests check every file in the lock), so the assessment portal would vendor a network-capable `probe.js` it never loads, and a CSS patch would bump the engine's version.
- **Take only what you use.** A portal copies the files it needs (with `core.js`) and records them in `site/assets/engine.lock.json`: `{ tag, commit, files: { name: sha256 } }`. Its engine test checks each listed file matches, that every module a listed file needs is listed too, and that no unlisted engine file is present. The assessment portal takes the pure files only.
- **The commit is the pin, the tag is a label.** A test cannot check a tag offline, so the lock's `commit` is what pins the copy, and the bump PR's diff is what a reviewer reads. avd-ops gets a test that any change to a released file's hash comes with a version bump, so one version never means two contents.
- **Self-contained.** No runtime request, no fetch in CI, no package, no submodule. avd-landing-zone and avd-current-state each run, test and publish with no other repo, as today.
- **Versions.** A changed signature or output is a major version, new functions a minor, a fix that changes no consumer golden (section 9) a patch. A portal can stay on an older release.
- **What it costs.** A fix to Run in is one landing-zone PR today; after the move it is an avd-ops PR, Nick's tag, then one bump PR per portal, whose goldens show the change. A fork that edits a vendored engine file fails its lock test, by design: it forks avd-ops for the engine, or deletes the lock and owns its copy.

## 5. Engine and content

| The engine (avd-ops) | Each portal (its own repo) |
|---|---|
| Run in primitives and the whole-block Bash wrapper | Its commands, written for Cloud Shell PowerShell; its `platforms.json`; the landing zone's stretch splitting and `$env:` translation |
| Finding and parsing state lines, given a marker | Its marker, schema and what a state means (`decide()`, `summarizeCollect()`) |
| Quoting, validated arguments, the self-contained block preamble | Which repo and ref (`portal-config.js` and the page's settings) and the pattern each value must match |
| The probe: timing, median, jitter, stalls, deadlines, concurrency and phases | The hosts, sample counts, regions and when to run |
| Bands and worst-of verdicts, given a threshold table with claim IDs | The thresholds and the sentences |
| Phase 2: widgets, step model, storage, generic redaction | Its steps, keys, patterns and every word on the page |

**Code moves into the engine only when two portals use it.** Run in, quoting and state lines qualify now (both portals). The probe and bands qualify with linecheck as the second user; they go into phase 1 because linecheck's v0 builds on them and the landing zone's copy is where they come from. Redaction, widgets, the step model and storage wait for phase 2. Download sufficiency, the UDP hint, the vantage check and the pack schema stay in linecheck until a second portal needs them.

## 6. Modules

Each file is UMD: in the browser it adds one member to `window.AvdOpsEngine`; in Node it is `require`d and itself `require`s `./core.js`. No file needs another except `core.js`, so the load order is `core.js` first, then the rest in any order; a test loads each file alone after `core.js`, in Node and in a browser. Every file carries the family notice and its version on its first lines, as the vendored design system files do.

### 6.1 Phase 1: pure logic

| File | API (sketch) | Taken from |
|---|---|---|
| `core.js` | `VERSION`, `check(value, pattern, name)` (throws with the name; the one place a value is accepted) | new |
| `blocks.js` | `psQuote` (CS's: refuses control characters), `bashQuote`, `arg(name, value, pattern)` (a quoted PowerShell argument, or a throw), `hereString(name, json)` (refuses a line that would close it, or non-ASCII), `preamble({ repoUrl, dir, ref })` | both engines |
| `runin.js` | `PLACES`, `validRunIn(r)`, `platformKey(r)`, `scriptsIn(cmd, pattern)`, `support(cmd, runIn, platforms)`, `pwshFile(lines)` (the quoted heredoc into a temp `.ps1` and `pwsh -NoLogo -File`, refusing a line `AVD_PS`), `signInLines(where, shell, { azPowerShell, azCli })`, and `forRunIn(cmd, runIn)` with the assessment portal's whole-block behavior | both engines; the landing zone's stretch and `$env:` logic stays in `portal-core.js`, built on `pwshFile` and `signInLines` |
| `statelines.js` | `extract(text, marker, { newlines })`: every block between `<<<MARKER` and `MARKER>>>`, with line breaks dropped by the portal's own rule (`[\r\n]+` for the landing zone, `\r?\n` for the assessment portal, so neither golden moves), as `{ value }` or `{ parseError, raw }` with `raw` cut at 200 characters (part of the contract); the portal applies its own schema and error policy | both engines |
| `bands.js` | `band(value, table)` where the table ends with `otherwise` and every row carries a claim (linecheck spec 7), treating `null`, `undefined` and `NaN` as no answer; `worst(states, order)`; `classifyHosts(results, hosts)` (missing means not tested; fail closed) | `rateLatency`, `classifyReachability`; linecheck 6.2 |
| `probe.js` (the only `network` file) | `timeOnce(host, opts)`, `measure(host, opts)` returning `{ samples, median, jitter, stalls, slow }`, `run(phases, { deadlineMs })` where a phase is `{ targets, concurrency, deadlineMs }` and phases run one after another (linecheck 5 needs jitter and the target region measured with nothing else running). Defaults reproduce the landing zone's `measure` exactly: warm-up then 5 `GET` samples one after another, 4-second timeout, and any rejected request (warm-up or sample) makes the host "no answer" with no median, no deadline. Linecheck's stall counting (keep going past a timed-out sample) is an option, off by default. Fetch options are fixed: `mode: 'no-cors'`, `cache: 'no-store'`, `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `redirect` left at its default. `fetch`, `performance.now`, timers, `Date.now` and `Math.random` (the cache-buster) are injected, so Node tests run it on a scripted network | `portal-page.js`; linecheck 4.1, 5 |

### 6.2 Phase 2: the page, after linecheck v0 exists

`dom.js` (`el` with text only, copy with fallback, blob downloads), `widgets.js` (`.term`, the Run in row, `ol.steps`, `.stepnav`, outcomes, a progress element in a polite live region), `steps.js` (current, reached, locked, phase), `store.js` (a namespace whose keys never change and whose reads accept every older shape the portal migrates today) and a generic `redact.js` (`maskSecrets`, `fence`, `issueUrl`, and `redact(text, { patterns })` with the `<kind-n>` placeholder format frozen by a golden, because the landing zone's `commandInText` and decision 0008's analysis-after-redaction test read it; the landing zone keeps its own patterns). These are new code with no golden to protect them, so they are written against linecheck's page and the assessment portal, and the landing zone takes them only after its page loads `avd-ops-portal.css` (section 9, PR 7).

### 6.3 Data

Data reaches the engine as arguments, never by a fetch. A portal keeps data it takes from another repo the way it does today: inlined in its own script with a test that it equals the JSON copy (`PLATFORMS` and `platforms.json`), and contract data through `contracts/PINS.json` in the landing zone. The endpoint list from avd-assess's map bundle (the Portable avd-assess map work) arrives the same way.

## 7. Linecheck's measurement engine

The probe's method is the landing zone's (decision 0003), and linecheck's spec extends it: `HEAD`, 8 samples, jitter as the median of consecutive differences, stalls, slow samples, per-step and whole-run deadlines (spec 4.1, 5). All of that is options on `probe.js` whose defaults are the landing zone's behavior, pinned by golden 3. The bands (spec 6.2) are tables for `bands.js`. Whether the landing zone's region step takes linecheck's 150 to 200 ms band (linecheck Q8) is Nick's choice (Q4 here): the move keeps `rateLatency`'s bands as they are.

What stays in linecheck: download sufficiency and loaded latency, the UDP hint, the vantage check, the pack schema and validator, `verdict.js`, `export.js`, paste-a-result rendering and the guided step pages. The endpoint hosts are data; where the list lives is the Endpoint map work in avd-assess (linecheck Q6).

## 8. Security

- **Pasted values never reach a command unchecked.** The deployment portal's commands run as subscription Owner, and the state line is pasted, so a crafted paste is untrusted input (decision 0007). Today `validSettings` checks the context's settings (red team PH-4), but several values read from a state line's other fields go into commands without a pattern check. Before any code moves, a landing-zone PR (PR 0 below) checks every value it reads from a paste against a pattern before it reaches `cmd`, and adds crafted-paste fixtures that must produce no command. The engine then makes it structural: commands take values only through `arg()` and `check()`, and `psQuote` refuses control characters.
- **Goldens protect behavior, not safety.** A byte-equal golden would also freeze a hole, which is why PR 0 comes first.
- **No network but the probe.** A test in avd-ops reads every engine file, comments removed, and fails on `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `RTCPeerConnection`, `navigator.sendBeacon`, `import(` or an `http` or `https` URL outside `probe.js`. `probe.js` builds URLs only from the hosts it is given, always `https://`, and refuses an IP literal, `localhost` or a private name (linecheck spec 4.6). A consumer's lock proves its copy is byte for byte the scanned file. The landing zone's no-network checks, which cover its own scripts, are extended to `site/assets/engine/` with `probe.js` allowed.
- **No eval and no HTML from data.** The same test fails on `eval`, `new Function`, string timers, `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write`.
- **CSP.** Engine files are `script-src 'self'` classic scripts, no inline script or style. `connectSrc(hosts)` in `probe.js` returns the exact `connect-src` list for a set of targets, so a portal can test its policy against its data (linecheck 8.2). The CSP follow-ups (Q5) have prerequisites that come first: the design-system convention moves page styles from a `<style>` block to a page stylesheet (design-system.md and both portals' design-system tests change first), the landing zone drops its `style="..."` attributes and its `innerHTML` bar width, and its region list becomes data so `connectSrc` can list its 38 regional hosts and two reachability hosts.
- **Supply chain.** The engine is a copy reviewed in each bump PR and pinned by commit and hash; the tag is Nick's. Releases can carry the free GitHub artifact attestation (decision 0008).
- **No secrets, no tenant data.** The engine holds none; fixtures are synthetic or the already-redacted real outputs the landing zone tests use.

## 9. Moving the two portals without regressions

**Golden tests first, in each portal, on its current code:**

1. **Command goldens.** Every exported command builder (`commands.*` in the landing zone; `collectCommand`, `analyzeCommand`, `intakeCommand`, `reviewCommand` in the assessment portal, which cover the internal `fileCommand`), for a fixed set of synthetic configs, through `forRunIn` in all five Run in choices (Cloud Shell PowerShell and Bash, Windows, macOS PowerShell and Bash), plus one case per landing-zone rewrite rule (stretches, `$env:`, `Remove-Item Env:`, `bash ./` quoting, local sign-in for Az PowerShell and for the az CLI, the clone line).
2. **Analysis goldens.** Every existing paste fixture through `analyze()` and `latestStates()`, plus state lines with a lone `\r`, a wrapped line, an unparsable line and the crafted pastes of PR 0.
3. **Probe goldens.** The landing zone's latency and reachability runs on a scripted network (all reached, one blocked, warm-up rejected, warm-up fine but one timed sample rejected, all timed out) with the clock and the cache-buster injected: the exact URLs, fetch options, call order and results.
4. **Band goldens.** `rateLatency` and `classifyReachability` at 0, every boundary and a value either side of it (99.999, 100, 100.001, 150, 150.001), large values, `null`, `undefined` and `NaN`, and each reachability combination.
5. **DOM snapshots** (phase 2 only): serialized `#steps`, `.term` and the Run in row for each state, in the existing Playwright job (the landing zone's `portal.browser.test.mjs` runs in its own CI job; the assessment portal gets one). Not pixel screenshots, which drift between browser versions.

**Then one pull request per step, each with no golden diff and the existing tests unchanged:**

| Order | Pull request | What moves | Guard |
|---|---|---|---|
| 0 | avd-landing-zone: validate pasted values | pattern checks on every pasted value used in a command; crafted-paste fixtures | new tests; existing goldens unchanged for valid pastes |
| 1 | avd-ops: engine 1.0 (`pe-v1.0.0`) | the phase 1 modules, unit tests, the scan, the manifest; nothing in any portal | avd-ops tests on Linux, Windows and macOS |
| 2 | avd-current-state: vendor and delegate | copy the pure files, `engine.lock.json`, script tags; `assess-core.js` keeps every export and delegates Run in, quoting and state lines | goldens 1 and 2 byte-equal |
| 3 | avd-landing-zone: vendor only | copy the files, the lock and the `<script>` tags; nothing calls them yet | page loads; existing tests |
| 4 | avd-landing-zone: delegate | `portal-core.js` uses `blocks`, `runin` primitives, `statelines`, `bands`; `window.PortalCore` keeps its API, so `portal-page.js` and the tests are unchanged | goldens 1, 2 and 4 byte-equal |
| 5 | avd-landing-zone: probe | `portal-page.js` uses `probe.js` | golden 3 |
| 6 | avd-linecheck v0 | built on the engine, after Nick's go on its spec | its own tests |
| 7 | phase 2, after 6 | avd-ops engine 2.0 with the page modules; the landing zone first adopts `avd-ops-portal.css` (its own PR, markup only), then the widgets one portal at a time | golden 5; decision 0005 |

Splitting PR 3 from PR 4 keeps decision 0005's rule that markup and logic never change in the same PR. The assessment portal goes first because it is smaller and its Run in behavior is the simplest. Linecheck is not first only because it waits on Nick's go for v0. The state-line contracts (`AVDLZ-STATE`, `AVDCS-STATE`) and the scripts never change (decision 0007); each `PLATFORMS` equality test stays; a golden that changes stops the PR until the change is understood and wanted; each step is one revert away from the code before it.

## 10. Accessibility and the design system (phase 2)

The widgets render the design system's portal components, so changes to those components land in the design system first: `.outcome.o-fail`, and `.o-blocked` styled as a warning, not a failure, because linecheck shows `blocked` as "a warning, not a stop" (its 6.2 and L8); each with its word and an icon, never color alone. The Run in row keeps its current contract (`div[role=group]` with `aria-labelledby`).

Target WCAG 2.1 AA. The progress element announces each step's name in a polite live region; Copy announces "Copied"; controls meet the shell's 44 px touch size on touch screens. Two are behavior changes for the landing zone, made in its own PR and its own choice: moving focus to a step's heading on a step change (the assessment portal does; the landing zone doesn't), and turning off the sliding track's smooth scroll when `prefers-reduced-motion` is set (it is a script `scrollTo`, so `matchMedia`, not CSS). The brand's required lines stay in the shell, not the engine.

## 11. Release and tags

After the avd-ops PR merges, Nick tags its merge commit from Cloud Shell (Claude sessions cannot push tags). The block below is the template; the PR that ships a release puts it in its description with `SHA` and the tag already filled in, so the paste needs no editing:

```bash
SHA=0000000000000000000000000000000000000000; TAG=pe-v1.0.0; D=$HOME/avd-ops-tag; gh auth status >/dev/null 2>&1 || gh auth login; [ -d "$D" ] && rm -rf "$D"; git clone -q https://github.com/avd-ops/avd-ops.git "$D" && git -C "$D" checkout -q "$SHA" && echo "tagging $TAG on $SHA" && gh release create "$TAG" --repo avd-ops/avd-ops --target "$SHA" --title "$TAG" --notes "See docs/portal-engine-spec.md"
```

The same block, with `TAG` and `SHA` changed, makes the design-system tags still waiting, on the commits the portals' lock files recorded: ds-v2.1.0 on `753f62b` (the landing zone's lock) and ds-v2.2.0 on `78af4f2` (the assessment portal's), each as the full commit hash from the lock file, not on today's `main`. ds-v2.0.1 on `d106eed` is in no lock file and is only for the record.

## 12. Tests in avd-ops

`node --test "tests/*.test.mjs"` gains `tests/engine.test.mjs`: each module's unit cases, the scripted-network probe cases, the scan of section 8, a parse check at the ES2020 floor, ASCII only, the notice and version line in each file, `VERSION` equal to the engine manifest, every file in the manifest, each file loading alone after `core.js`, and the hash-change-needs-a-version-bump check. The run-anywhere convention (decision 0006) runs it on Windows and macOS too. The goldens live in the consumers.

## 13. Cost

$0. No cloud resources, no accounts, no paid tools. Probe requests go only to Microsoft's public endpoints, as today.

## 14. Red team

Reviewed by a separate model pass (Fable, 2026-10-21) against the code at the commits in section 2; 22 findings, all folded in:

- **Pasted values in commands** (high): several values from a pasted state line reach the deployment portal's commands without a pattern check, and byte-equal goldens would freeze that. Now PR 0, and the engine's `arg()` and `check()` (section 8).
- **The landing zone doesn't load the portal components** (high): it keeps its own styles, step rail and sliding track, so a shared widget layer would be a markup migration. Widgets moved to phase 2, after the landing zone adopts `avd-ops-portal.css` in its own PR (6.2, 9).
- **One manifest can't version two things** (high): partial copies were impossible and the assessment portal would carry `probe.js`. Now the engine's own manifest, tag and lock with partial takes (4).
- **Tags and pins** (high): lock files name tags that don't exist yet, and tagging `main` later would point at the wrong commit. The commit is the pin, tags go on recorded commits, and a test ties hash changes to a version bump (4, 11).
- **Over-claimed sharing** (medium): sizes and the "today" table corrected; `file://` dropped as a reason, since no family document requires it and the browser test serves over HTTP; the claim that both portals use a generated data wrapper was wrong, they inline the JSON (2, 3.2, 6.3).
- **Merging diverged code** (medium): Run in's landing-zone rewrite rules stay in the landing zone on shared primitives; state lines keep each portal's newline rule and error policy; redaction waits for phase 2 with only generic parts and a frozen placeholder format (6).
- **Golden gaps** (medium): `fileCommand` isn't exported, float boundaries and `NaN`, the cache-buster and clock, the fetch options, and DOM snapshots instead of screenshots (9).
- **CSP follow-ups have prerequisites** (medium): page styles out of `<style>`, inline style attributes, the region list as data (8).
- **Decision 0005 and accessibility** (medium): vendoring split from delegating; focus and reduced-motion changes named as landing-zone choices; `.o-blocked` styled as a warning (9, 10).
- **Smaller ones** (low): language floor, load order and Node `require`s, storage keys never change, probe defaults and serial phases, the linecheck spec conflict made blocking, the tag block's target and guard.

The code review of this PR (Claude code-review skill) caught ten more, also fixed: the landing zone's `measure` gives no answer on any rejected sample, not only the warm-up (golden 3 gained that case); the state-line newline rule stays per portal so no golden moves; `portal-config.js` names the repo, not a ref; bands and probe are one portal's code, not duplicated; the tag block was not a self-contained paste; `platformKey` is not in the assessment portal; a stray `report.js` source in phase 1; a wrong red-team citation; a line count.


## 15. Open questions for Nick

1. **Release train.** The engine on its own `pe-v` tag with its own manifest and lock (recommended, so each portal takes only what it runs), or inside the design system's `ds-v` release.
2. **Home.** Answered 2026-10-21: avd-ops (section 4).
3. **Order.** PR 0, then the assessment portal, the landing zone, linecheck v0 and phase 2 (recommended), or linecheck first once its v0 has your go.
4. **Region bands.** Keep the landing zone's region step on its own bands (recommended until linecheck's spike S1), or take linecheck's four bands when it moves.
5. **CSP follow-ups.** After the moves and their prerequisites, a meta policy for the assessment portal and a narrower one for the landing zone (recommended), or leave them as they are.

## 16. Sources

- avd-landing-zone decisions 0003 (region by latency), 0007 (state line), 0008 (issue reports), 0014 (verify access), 0017 (portal hosting); its `site/portal/` at `785ef36`.
- avd-current-state `site/portal/` and `docs/assessment-portal-spec.md` at `1e31fca`.
- avd-linecheck `docs/spec.md` at `ab7a0df`, sections 4 to 8, 11, 12.4, 15 and 18.
- avd-ops decisions 0005 (one app shell), 0006 (run anywhere), 0007 (starters), 0008 (code signing); [design-system.md](design-system.md); [build-or-adopt.md](build-or-adopt.md).
- Alpine.js, [CSP build](https://alpinejs.dev/advanced/csp), read 2026-10-21. Other licenses are from the projects' pages, not their license files; nothing is adopted, so none was read at a pin.
