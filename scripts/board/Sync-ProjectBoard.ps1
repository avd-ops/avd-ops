<#
  .SYNOPSIS
    Adds every open issue and pull request from the public family repos to the avd-ops org project,
    and mirrors the queue:* labels into its Sandbox field.
  .DESCRIPTION
    Works around the one auto-add workflow GitHub Free allows. It only adds items and sets
    Sandbox; it never removes an item, clears a field or touches a repo. The project is a view:
    GitHub Issues stays the tracker and the sandbox queue stays driven from chat. docs/board.md.

    Runs every 3 hours from .github/workflows/board-sync.yml with a GitHub App token, or by hand from
    Cloud Shell with Nick's own gh sign-in (gh auth refresh -s project), which stores nothing.
    The project can belong to a user or an organization.
  .EXAMPLE
    pwsh ./scripts/board/Sync-ProjectBoard.ps1 -ProjectNumber 1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [string] $Owner = $(if ($env:BOARD_OWNER) { $env:BOARD_OWNER } else { 'avd-ops' }),
  [int] $ProjectNumber = $(if ($env:BOARD_PROJECT_NUMBER) { [int]$env:BOARD_PROJECT_NUMBER } else { 0 }),
  [string] $ReposPath = (Join-Path $PSScriptRoot 'repos.txt')
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'Board.psm1') -Force
if ($ProjectNumber -lt 1) { throw 'No project number. Pass -ProjectNumber or set the BOARD_PROJECT_NUMBER repository variable (the number in the project URL).' }

function Invoke-BoardGraphql([string] $Query, [hashtable] $Variable = @{}) {
  $a = @('api', 'graphql', '-f', "query=$Query")
  foreach ($k in $Variable.Keys) {
    if ($null -eq $Variable[$k]) { continue }
    $a += if ($Variable[$k] -is [int]) { @('-F', "$k=$($Variable[$k])") } else { @('-f', "$k=$($Variable[$k])") }
  }
  # stderr apart from stdout: gh prints notices there (a new release) that are not JSON.
  $err = New-TemporaryFile
  try {
    $out = & gh @a 2>$err.FullName
    $code = $LASTEXITCODE
    $stderr = (Get-Content -Raw $err.FullName) -replace '\s+', ' '
  }
  finally { Remove-Item $err.FullName -ErrorAction SilentlyContinue }
  $r = try { ($out -join "`n") | ConvertFrom-Json -Depth 30 } catch { $null }
  $data = if ($r -and $r.PSObject.Properties['data']) { $r.data } else { $null }
  $errors = if ($r -and $r.PSObject.Properties['errors']) { $r.errors | ConvertTo-Json -Depth 10 -Compress } else { '' }
  # gh exits non-zero on any GraphQL error, even beside data. Partial data (an item the app can't
  # see, a project that isn't there) is returned with a warning; the caller decides what's missing.
  if (-not $data) { throw "gh api graphql failed (exit $code): $stderr $errors $($out -join ' ')" }
  if ($errors) { Write-Warning "GraphQL returned errors beside data: $errors" }
  $data
}

# Pages through one connection; ends on an error (thrown) or a page with no next cursor.
function Get-BoardPage([string] $Query, [hashtable] $Variable, [scriptblock] $Select, [int] $MaxPage = 50) {
  $cursor = $null
  for ($page = 1; $page -le $MaxPage; $page++) {
    $v = $Variable.Clone(); $v.cursor = $cursor
    $c = & $Select (Invoke-BoardGraphql $Query $v)
    if (-not $c) { return }
    $c
    if (-not $c.pageInfo.hasNextPage -or -not $c.pageInfo.endCursor) { return }
    $cursor = $c.pageInfo.endCursor
  }
  throw "Stopped after $MaxPage pages; the connection did not end."
}

$repoQuery = @'
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    issues(states: OPEN, first: 100, after: $cursor) { pageInfo { hasNextPage endCursor } nodes { id number labels(first: 30) { nodes { name } } } }
  }
}
'@
$prQuery = $repoQuery -replace 'issues\(states: OPEN', 'pullRequests(states: OPEN'
$projectQuery = @'
query($owner: String!, $number: Int!) {
  repositoryOwner(login: $owner) {
    ... on User { projectV2(number: $number) { ...head } }
    ... on Organization { projectV2(number: $number) { ...head } }
  }
}
fragment head on ProjectV2 { id title fields(first: 50) { nodes { ... on ProjectV2SingleSelectField { id name options { id name } } } } }
'@
$itemQuery = @'
query($owner: String!, $number: Int!, $cursor: String) {
  repositoryOwner(login: $owner) {
    ... on User { projectV2(number: $number) { ...items } }
    ... on Organization { projectV2(number: $number) { ...items } }
  }
}
fragment items on ProjectV2 {
  items(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id content { ... on Issue { id } ... on PullRequest { id } } sandbox: fieldValueByName(name: "Sandbox") { ... on ProjectV2ItemFieldSingleSelectValue { name } } }
  }
}
'@

# ---- Read ----
Write-Host "Reading project $Owner/$ProjectNumber..."
$d = Invoke-BoardGraphql $projectQuery @{ owner = $Owner; number = $ProjectNumber }
$project = Get-BoardOwnerProject -Data $d
if (-not $project) { throw "Project $ProjectNumber not found for $Owner, or the token can't read it (it needs Projects access)." }
# Items are never removed by the sync, so the project grows: allow 20,000 before stopping.
$projectItems = @(Get-BoardPage $itemQuery @{ owner = $Owner; number = $ProjectNumber } { param($d) (Get-BoardOwnerProject -Data $d).items } -MaxPage 200 |
  ForEach-Object { ConvertFrom-BoardProjectPage -Connection $_ })
$sandbox = Get-BoardSandboxField -Field $project.fields.nodes
if (-not $sandbox) { Write-Warning 'The project has no Sandbox single-select field; adding items only (docs/board.md).' }
elseif ($sandbox.missing) { Write-Warning "Sandbox field has no option for: $($sandbox.missing -join ', '). Those states are left unset." }
Write-Host "  '$($project.title)' holds $($projectItems.Count) items."

$repos = Get-BoardRepoList -Line (Get-Content -LiteralPath $ReposPath)
$failed = [System.Collections.Generic.List[string]]::new()
$repoItems = foreach ($repo in $repos) {
  $o, $n = $repo -split '/', 2
  Write-Host "Reading open issues and pull requests in $repo..."
  try {
    foreach ($q in @($repoQuery, $prQuery)) {
      Get-BoardPage $q @{ owner = $o; name = $n } {
        param($d)
        if (-not $d.repository) { throw "Repository $repo not found, or the token can't read it." }
        if ($d.repository.PSObject.Properties['issues']) { $d.repository.issues } else { $d.repository.pullRequests }
      } | ForEach-Object { ConvertFrom-BoardRepoPage -Connection $_ -Repo $repo }
    }
  }
  catch { Write-Warning "$repo skipped: $($_.Exception.Message)"; $failed.Add($repo) }
}

# ---- Write ----
$plan = Get-BoardPlan -RepoItem $repoItems -ProjectItem $projectItems -SandboxField $sandbox
Write-Host "Plan: add $($plan.add.Count) items, set Sandbox on $($plan.set.Count)."
$setQuery = 'mutation($p: ID!, $i: ID!, $f: ID!, $o: String!) { updateProjectV2ItemFieldValue(input: { projectId: $p, itemId: $i, fieldId: $f, value: { singleSelectOptionId: $o } }) { projectV2Item { id } } }'
# One failed write is reported and the rest still run; the run fails at the end naming it.
$writeFailed = [System.Collections.Generic.List[string]]::new()
foreach ($a in $plan.add) {
  if (-not $PSCmdlet.ShouldProcess("$($a.repo)#$($a.number)", 'Add to project')) { continue }
  Write-Host "  Adding $($a.repo)#$($a.number)$(if ($a.sandbox) { " (Sandbox $($a.sandbox))" })"
  try {
    $d = Invoke-BoardGraphql 'mutation($p: ID!, $c: ID!) { addProjectV2ItemById(input: { projectId: $p, contentId: $c }) { item { id } } }' @{ p = $project.id; c = $a.contentId }
    if ($a.sandbox) { $null = Invoke-BoardGraphql $setQuery @{ p = $project.id; i = $d.addProjectV2ItemById.item.id; f = $sandbox.id; o = $sandbox.options[$a.sandbox] } }
  }
  catch { Write-Warning "$($a.repo)#$($a.number): $($_.Exception.Message)"; $writeFailed.Add("$($a.repo)#$($a.number)") }
}
foreach ($s in $plan.set) {
  if (-not $PSCmdlet.ShouldProcess("$($s.repo)#$($s.number)", "Set Sandbox to $($s.sandbox)")) { continue }
  Write-Host "  Setting Sandbox on $($s.repo)#$($s.number) to $($s.sandbox)"
  try { $null = Invoke-BoardGraphql $setQuery @{ p = $project.id; i = $s.itemId; f = $sandbox.id; o = $sandbox.options[$s.sandbox] } }
  catch { Write-Warning "$($s.repo)#$($s.number): $($_.Exception.Message)"; $writeFailed.Add("$($s.repo)#$($s.number)") }
}
$problems = @()
if ($failed.Count) { $problems += "could not read $($failed -join ', ')" }
if ($writeFailed.Count) { $problems += "could not write $($writeFailed -join ', ')" }
if ($problems) { throw "Board sync incomplete: $($problems -join '; '). Everything else is synced." }
Write-Host 'Board is in sync.'
