# Project board sync: pure functions. docs/board.md.
# Nothing here calls GitHub; Sync-ProjectBoard.ps1 passes in the pages it read.

Set-StrictMode -Version Latest

# The Sandbox field mirrors the queue:* labels (docs/queue/spec.md). When an issue carries more
# than one, the later state in this list wins. ready is last because the batch builder takes any
# issue labeled queue:ready as ready, even with an old state label still on it.
$script:SandboxStates = @('passed', 'failed', 'batched', 'held', 'ready')

function Get-BoardRepoList {
  <# Repos to sync from a list file: one owner/name per line; blank lines and # comments ignored. #>
  param([AllowEmptyString()][string[]] $Line)
  @($Line | ForEach-Object { ($_ -replace '#.*$', '').Trim() } | Where-Object { $_ -match '^[\w.-]+/[\w.-]+$' } | Select-Object -Unique)
}

function Get-BoardSandboxState {
  <# The Sandbox value for an item's labels: the latest queue:* state, or $null when it has none. #>
  param([AllowEmptyCollection()][string[]] $Label)
  $states = @($Label | Where-Object { $_ -like 'queue:*' } | ForEach-Object { $_.Substring(6) } | Where-Object { $_ -in $script:SandboxStates })
  if (-not $states) { return $null }
  $script:SandboxStates | Where-Object { $_ -in $states } | Select-Object -Last 1
}

function ConvertFrom-BoardRepoPage {
  <#
    Open issues or pull requests from one page of the repository query, as
    { id, repo, number, labels }. ARM-style omission applies: GitHub can leave out labels.
  #>
  param([Parameter(Mandatory)] $Connection, [Parameter(Mandatory)][string] $Repo)
  foreach ($n in @($Connection.nodes | Where-Object { $_ })) {
    $labels = @(if ($n.PSObject.Properties['labels'] -and $n.labels) { $n.labels.nodes | Where-Object { $_ } | ForEach-Object { $_.name } })
    [pscustomobject]@{ id = $n.id; repo = $Repo; number = $n.number; labels = $labels }
  }
}

function ConvertFrom-BoardProjectPage {
  <#
    Items from one page of the project query, as { itemId, contentId, sandbox }. Draft issues and
    items whose content was deleted or can't be seen have no content id and are skipped.
  #>
  param([Parameter(Mandatory)] $Connection)
  foreach ($n in @($Connection.nodes | Where-Object { $_ })) {
    if (-not ($n.PSObject.Properties['content'] -and $n.content -and $n.content.PSObject.Properties['id'])) { continue }
    $sandbox = if ($n.PSObject.Properties['sandbox'] -and $n.sandbox -and $n.sandbox.PSObject.Properties['name']) { $n.sandbox.name } else { $null }
    [pscustomobject]@{ itemId = $n.id; contentId = $n.content.id; sandbox = $sandbox }
  }
}

function Get-BoardOwnerProject {
  <#
    The project from a repositoryOwner response, for a user or an organization; $null when the
    owner or the project is missing (GraphQL returns null with a NOT_FOUND error beside it).
  #>
  param($Data)
  if (-not ($Data -and $Data.PSObject.Properties['repositoryOwner'] -and $Data.repositoryOwner)) { return $null }
  $o = $Data.repositoryOwner
  if ($o.PSObject.Properties['projectV2'] -and $o.projectV2) { $o.projectV2 } else { $null }
}

function Get-BoardSandboxField {
  <# The Sandbox single-select field and its options (name -> id), or $null when the project has none. #>
  param([AllowEmptyCollection()] $Field, [string] $Name = 'Sandbox')
  $f = @($Field | Where-Object { $_ -and $_.PSObject.Properties['options'] -and $_.name -eq $Name }) | Select-Object -First 1
  if (-not $f) { return $null }
  $options = @{}
  foreach ($o in @($f.options)) { $options[$o.name] = $o.id }
  [pscustomobject]@{ id = $f.id; options = $options; missing = @($script:SandboxStates | Where-Object { -not $options.ContainsKey($_) }) }
}

function Get-BoardPlan {
  <#
    What the sync does: add every open item the project doesn't hold yet, and set Sandbox where
    an item's queue:* label differs from the field. It never removes an item or clears a field:
    closed items stay for the built-in "Item closed" workflow, and Nick's own edits stay.
    Returns { add = [{ contentId, repo, number, sandbox }], set = [{ itemId, repo, number, sandbox }] }.
  #>
  param([AllowEmptyCollection()] $RepoItem, [AllowEmptyCollection()] $ProjectItem, $SandboxField)
  $held = @{}
  foreach ($p in @($ProjectItem | Where-Object { $_ })) { $held[$p.contentId] = $p }
  $add = [System.Collections.Generic.List[object]]::new()
  $set = [System.Collections.Generic.List[object]]::new()
  foreach ($r in @($RepoItem | Where-Object { $_ })) {
    $state = Get-BoardSandboxState -Label $r.labels
    if ($state -and -not ($SandboxField -and $SandboxField.options.ContainsKey($state))) { $state = $null }
    if (-not $held.ContainsKey($r.id)) {
      $add.Add([pscustomobject]@{ contentId = $r.id; repo = $r.repo; number = $r.number; sandbox = $state })
      $held[$r.id] = $null
    }
    elseif ($state -and $held[$r.id] -and $held[$r.id].sandbox -ne $state) {
      $set.Add([pscustomobject]@{ itemId = $held[$r.id].itemId; repo = $r.repo; number = $r.number; sandbox = $state })
    }
  }
  [pscustomobject]@{ add = $add.ToArray(); set = $set.ToArray() }
}

Export-ModuleMember -Function Get-BoardRepoList, Get-BoardOwnerProject, Get-BoardSandboxState, ConvertFrom-BoardRepoPage, ConvertFrom-BoardProjectPage, Get-BoardSandboxField, Get-BoardPlan
