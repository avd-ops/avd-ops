# Personal project, not for production, provided as is; not affiliated with the author's employer, Liquidware or Microsoft.

BeforeAll {
    . (Join-Path $PSScriptRoot '..' 'scripts' 'ops' 'Initialize-AvdPrivateRepo.ps1')
}

Describe 'Initialize-AvdPrivateRepo' {
    It 'refuses a public repository' {
        $mockGh = {
            param([string[]]$Arguments)
            if ($Arguments[0] -eq 'api' -and $Arguments[1] -like 'repos/*' -and $Arguments[3] -eq '.private') {
                return 'false'
            }
            throw "Unexpected gh call: $($Arguments -join ' ')"
        }

        { Assert-GitHubPrivateRepo -RepoSlug 'contoso/avd-private' -GhRunner $mockGh } |
            Should -Throw '*not private*'
    }

    It 'creates a private repository when missing and verifies .private == true' {
        $script:calls = [System.Collections.Generic.List[string]]::new()
        $script:created = $false
        $mockGh = {
            param([string[]]$Arguments)
            $script:calls.Add(($Arguments -join ' '))
            if ($Arguments[0] -eq 'api' -and $Arguments[3] -eq '.private') {
                if (-not $script:created) {
                    throw 'HTTP 404: Not Found'
                }
                return 'true'
            }
            if ($Arguments[0] -eq 'repo' -and $Arguments[1] -eq 'create') {
                $script:calls.Add('CREATED')
                $script:created = $true
                return 'https://github.com/contoso/avd-private'
            }
            throw "Unexpected gh call: $($Arguments -join ' ')"
        }

        $result = Assert-GitHubPrivateRepo -RepoSlug 'contoso/avd-private' -GhRunner $mockGh
        $result | Should -Be 'private'
        ($script:calls -join "`n") | Should -Match 'repo create contoso/avd-private --private'
    }

    It 'scaffolds the unified single-private-repo layout idempotently' {
        $tmp = Join-Path ([IO.Path]::GetTempPath()) ("avd-private-test-" + [guid]::NewGuid().ToString('N'))
        try {
            New-Item -ItemType Directory -Path $tmp -Force | Out-Null
            Initialize-PrivateRepoLayout -TargetPath $tmp

            foreach ($dir in @('runs', 'vault', 'config', 'swarm', (Join-Path '.github' 'workflows'))) {
                Test-Path -LiteralPath (Join-Path $tmp $dir) | Should -BeTrue
                Test-Path -LiteralPath (Join-Path $tmp $dir '.gitkeep') | Should -BeTrue
            }
            Test-Path -LiteralPath (Join-Path $tmp '.gitignore') | Should -BeTrue
            Test-Path -LiteralPath (Join-Path $tmp 'README.md') | Should -BeTrue

            # Custom README should not be overwritten without -ForceWrite
            $readme = Join-Path $tmp 'README.md'
            Set-Content -LiteralPath $readme -Value 'custom' -Encoding utf8NoBOM
            Initialize-PrivateRepoLayout -TargetPath $tmp
            (Get-Content -LiteralPath $readme -Raw).Trim() | Should -Be 'custom'
        }
        finally {
            if (Test-Path -LiteralPath $tmp) {
                Remove-Item -LiteralPath $tmp -Recurse -Force
            }
        }
    }

    It 'skips vault/ when .brain/state.json already exists at the repo root' {
        $tmp = Join-Path ([IO.Path]::GetTempPath()) ("avd-private-rootvault-" + [guid]::NewGuid().ToString('N'))
        try {
            $brainDir = Join-Path $tmp '.brain'
            New-Item -ItemType Directory -Path $brainDir -Force | Out-Null
            Set-Content -LiteralPath (Join-Path $brainDir 'state.json') -Value '{}' -Encoding utf8NoBOM

            Initialize-PrivateRepoLayout -TargetPath $tmp

            Test-Path -LiteralPath (Join-Path $tmp 'vault') | Should -BeFalse
            foreach ($dir in @('runs', 'config', 'swarm', (Join-Path '.github' 'workflows'))) {
                Test-Path -LiteralPath (Join-Path $tmp $dir '.gitkeep') | Should -BeTrue
            }
        }
        finally {
            if (Test-Path -LiteralPath $tmp) {
                Remove-Item -LiteralPath $tmp -Recurse -Force
            }
        }
    }

    It 'makes no filesystem changes under -WhatIf' {
        $tmp = Join-Path ([IO.Path]::GetTempPath()) ("avd-private-whatif-" + [guid]::NewGuid().ToString('N'))
        Initialize-PrivateRepoLayout -TargetPath $tmp -WhatIf
        Test-Path -LiteralPath $tmp | Should -BeFalse
    }
}
