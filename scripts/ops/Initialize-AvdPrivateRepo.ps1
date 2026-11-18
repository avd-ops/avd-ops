# Personal project, not for production, provided as is; not affiliated with the author's employer, Liquidware or Microsoft.
#requires -Version 7.2

<#
.SYNOPSIS
Creates or verifies your single private companion repository (avd-private) and scaffolds its layout.

.DESCRIPTION
Implements the single-private-repo layout from docs/private-companion-repo.md:
  runs/               Run journals, hash manifests, teardown evidence, compressed logs
  vault/              avd-second-brain estate vault
  config/             Tenant-specific *.bicepparam, *.tfvars, and Intune policy-as-code exports
  swarm/              avd-swarm governance config and runbooks
  .github/workflows/  Private workflows (approve.yml, runbooks.yml, deploy-pages-swa.yml)

Refuses to proceed if the target GitHub repository is not private.
Supports -WhatIf and -SkipGitHub (for offline local scaffolding or testing).
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter()]
    [ValidatePattern('^[a-zA-Z0-9._-]+$')]
    [string]$RepoName = 'avd-private',

    [Parameter()]
    [ValidatePattern('^[a-zA-Z0-9-]*$')]
    [string]$Owner = '',

    [Parameter()]
    [string]$Path = '',

    [Parameter()]
    [string]$SecondBrainPath = '',

    [Parameter()]
    [switch]$SkipGitHub,

    [Parameter()]
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-PrivateRepoGh {
    param([string[]]$Arguments)
    $output = & gh @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        $text = ($output | Out-String).Trim()
        throw "gh $($Arguments -join ' ') failed (exit $LASTEXITCODE): $text"
    }
    return ($output | Out-String).Trim()
}

function Assert-GitHubPrivateRepo {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)][string]$RepoSlug,
        [Parameter(Mandatory)][scriptblock]$GhRunner
    )

    $exists = $true
    try {
        $visibility = & $GhRunner @('api', "repos/$RepoSlug", '--jq', '.private')
    }
    catch {
        $exists = $false
        $visibility = ''
    }

    if (-not $exists) {
        if ($PSCmdlet.ShouldProcess($RepoSlug, 'Create private GitHub repository')) {
            $null = & $GhRunner @(
                'repo', 'create', $RepoSlug, '--private',
                '--description', 'Private run records, estate vault, config, and workflows for my AVD sandbox'
            )
            $visibility = & $GhRunner @('api', "repos/$RepoSlug", '--jq', '.private')
        }
        else {
            return 'whatif-created'
        }
    }

    if ($visibility -ne 'true') {
        throw "Refusing to use '$RepoSlug': repository is not private (.private='$visibility')."
    }
    return 'private'
}

function Initialize-PrivateRepoLayout {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)][string]$TargetPath,
        [switch]$ForceWrite
    )

    $folders = @(
        'runs',
        'vault',
        'config',
        'swarm',
        (Join-Path '.github' 'workflows')
    )

    foreach ($rel in $folders) {
        $dir = Join-Path $TargetPath $rel
        if (-not (Test-Path -LiteralPath $dir)) {
            if ($PSCmdlet.ShouldProcess($dir, 'Create directory')) {
                $null = New-Item -ItemType Directory -Path $dir -Force
            }
        }
        $keep = Join-Path $dir '.gitkeep'
        if (-not (Test-Path -LiteralPath $keep)) {
            if ($PSCmdlet.ShouldProcess($keep, 'Create .gitkeep')) {
                Set-Content -LiteralPath $keep -Value '' -Encoding utf8NoBOM -NoNewline
            }
        }
    }

    $gitignorePath = Join-Path $TargetPath '.gitignore'
    if ($ForceWrite -or -not (Test-Path -LiteralPath $gitignorePath)) {
        $gitignoreContent = @(
            '# Secrets, keys, and local state (never commit)'
            '*.key'
            '.brain/facts.key'
            '*.tfvars'
            '*.tfstate'
            '*.tfstate.*'
            '.env'
            '.env.*'
            '*.pfx'
            '*.pem'
            ''
        ) -join "`n"
        if ($PSCmdlet.ShouldProcess($gitignorePath, 'Write .gitignore')) {
            Set-Content -LiteralPath $gitignorePath -Value $gitignoreContent -Encoding utf8NoBOM -NoNewline
        }
    }

    $readmePath = Join-Path $TargetPath 'README.md'
    if ($ForceWrite -or -not (Test-Path -LiteralPath $readmePath)) {
        $readmeContent = @(
            '# Private AVD Companion Repository'
            ''
            'Personal project, not for production, provided as is; not affiliated with the author''s employer, Liquidware or Microsoft.'
            ''
            'This private repository holds tenant-specific state for `avd-ops`:'
            ''
            '- `runs/` — run journals, hash manifests, teardown evidence, and compressed logs'
            '- `vault/` — `avd-second-brain` estate vault'
            '- `config/` — tenant-specific `*.bicepparam`, `*.tfvars`, and Intune policy-as-code exports'
            '- `swarm/` — `avd-swarm` governance config and runbooks'
            '- `.github/workflows/` — private workflows (`approve.yml`, `runbooks.yml`, `deploy-pages-swa.yml`)'
            ''
            'Never commit secrets, keys, or credentials.'
            ''
        ) -join "`n"
        if ($PSCmdlet.ShouldProcess($readmePath, 'Write README.md')) {
            Set-Content -LiteralPath $readmePath -Value $readmeContent -Encoding utf8NoBOM -NoNewline
        }
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    if (-not $Path) {
        $Path = Join-Path $HOME $RepoName
    }

    $repoSlug = $RepoName
    if (-not $SkipGitHub) {
        $null = Invoke-PrivateRepoGh @('auth', 'status')
        if (-not $Owner) {
            $Owner = Invoke-PrivateRepoGh @('api', 'user', '--jq', '.login')
        }
        $repoSlug = "$Owner/$RepoName"
        $null = Assert-GitHubPrivateRepo -RepoSlug $repoSlug -GhRunner ${function:Invoke-PrivateRepoGh}

        if (-not (Test-Path -LiteralPath (Join-Path $Path '.git'))) {
            if ($PSCmdlet.ShouldProcess($Path, "Clone $repoSlug")) {
                $null = Invoke-PrivateRepoGh @('repo', 'clone', $repoSlug, $Path)
            }
        }
    }
    elseif (-not (Test-Path -LiteralPath (Join-Path $Path '.git'))) {
        if ($PSCmdlet.ShouldProcess($Path, 'Initialize local git repository')) {
            if (-not (Test-Path -LiteralPath $Path)) {
                $null = New-Item -ItemType Directory -Path $Path -Force
            }
            & git -C $Path init | Out-Null
        }
    }

    Initialize-PrivateRepoLayout -TargetPath $Path -ForceWrite:$Force

    if ($SecondBrainPath) {
        $vaultScript = Join-Path $SecondBrainPath 'vault' 'avd_second_brain.ps1'
        if (-not (Test-Path -LiteralPath $vaultScript)) {
            throw "Second brain script not found at '$vaultScript'."
        }
        $vaultTarget = Join-Path $Path 'vault'
        if ($PSCmdlet.ShouldProcess($vaultTarget, 'Initialize avd-second-brain estate vault')) {
            & $vaultScript -BrainPath $vaultTarget -Init
        }
    }

    Write-Output "Private companion repo ready at: $Path"
    Write-Output "Next: git -C `"$Path`" add -A && git -C `"$Path`" commit -m `"Initialize avd-private layout`" && git -C `"$Path`" push"
}
