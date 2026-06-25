# Ralph Wiggum - Long-running AI agent loop
# Usage: .\ralph.ps1 <prd_directory> [--tool codex|amp|claude] [max_iterations] [--verbose]
# Example: .\ralph.ps1 docs\ralph\my-feature --tool codex 20 --verbose

$ErrorActionPreference = 'Stop'

# Parse arguments
$PrdDir = ''
$Tool = 'codex'
$CodeXFlags = if ($env:CODEX_FLAGS) { $env:CODEX_FLAGS } else { '--yolo' }
$CodeXFlagArgs = $CodeXFlags -split '\s+'
$MaxIterations = 10
$VerboseOutput = $false

for ($i = 0; $i -lt $args.Count; $i++) {
    $arg = [string]$args[$i]
    if ($arg -eq '--tool') {
        if ($i + 1 -lt $args.Count) {
            $Tool = [string]$args[$i + 1]
            $i++
        }
        continue
    }
    if ($arg -like '--tool=*') {
        $Tool = $arg.Substring(7)
        continue
    }
    if ($arg -eq '--verbose') {
        $VerboseOutput = $true
        continue
    }
    if ([string]::IsNullOrWhiteSpace($PrdDir)) {
        $PrdDir = $arg
        continue
    }
    if ($arg -match '^[0-9]+$') {
        $MaxIterations = [int]$arg
        continue
    }
}

# Validate PRD directory is provided
if ([string]::IsNullOrWhiteSpace($PrdDir)) {
    Write-Error "Error: PRD directory is required."
    Write-Host "Usage: $($MyInvocation.MyCommand.Name) <prd_directory> [--tool codex|amp|claude] [max_iterations] [--verbose]"
    Write-Host "Example: $($MyInvocation.MyCommand.Name) docs/ralph/my-feature --tool codex 20 --verbose"
    exit 1
}

# Validate tool choice
if ($Tool -ne 'codex' -and $Tool -ne 'amp' -and $Tool -ne 'claude') {
    Write-Error "Error: Invalid tool '$Tool'. Must be 'codex', 'amp', or 'claude'."
    exit 1
}

# Resolve paths relative to current working directory
$Cwd = (Get-Location).Path
if ([System.IO.Path]::IsPathRooted($PrdDir)) {
    $PrdDirAbsolute = $PrdDir
} else {
    $PrdDirAbsolute = Join-Path $Cwd $PrdDir
}
if (-not (Test-Path -Path $PrdDirAbsolute -PathType Container)) {
    Write-Error "Error: PRD directory does not exist: $PrdDirAbsolute"
    exit 1
}
$PrdDirAbsolute = (Resolve-Path $PrdDirAbsolute).Path

$PrdFile = Join-Path $PrdDirAbsolute 'prd.json'
$ProgressFile = Join-Path $PrdDirAbsolute 'progress.txt'
$ArchiveDir = Join-Path $PrdDirAbsolute 'archive'
$LastBranchFile = Join-Path $PrdDirAbsolute '.last-branch'
$PromptFile = Join-Path $Cwd '.agents/skills/ralph/PROMPT.md'

# Validate prompt file exists
if (-not (Test-Path -Path $PromptFile -PathType Leaf)) {
    Write-Error "Error: Prompt file not found: $PromptFile"
    Write-Host "Expected at: .agents/skills/ralph/PROMPT.md"
    exit 1
}

function Get-BranchNameFromPrd([string]$PrdPath) {
    try {
        if (Test-Path $PrdPath) {
            $json = Get-Content -Raw $PrdPath | ConvertFrom-Json
            if ($null -ne $json -and -not [string]::IsNullOrWhiteSpace($json.branchName)) {
                return [string]$json.branchName
            }
        }
    } catch {
        return ''
    }
    return ''
}

function Test-AllStoriesPassed([string]$PrdPath) {
    try {
        if (Test-Path $PrdPath) {
            $json = Get-Content -Raw $PrdPath | ConvertFrom-Json
            if ($null -ne $json -and $null -ne $json.userStories) {
                foreach ($story in $json.userStories) {
                    if ($null -eq $story -or $story.passes -ne $true) {
                        return $false
                    }
                }
                return $true
            }
        }
    } catch {
        return $false
    }
    return $false
}

function Get-LastNonEmptyLine([string[]]$Lines) {
    for ($idx = $Lines.Length - 1; $idx -ge 0; $idx--) {
        $line = [string]$Lines[$idx]
        if (-not [string]::IsNullOrWhiteSpace($line)) {
            return $line.Trim()
        }
    }
    return ''
}

# Archive previous run if branch changed
if ((Test-Path $PrdFile) -and (Test-Path $LastBranchFile)) {
    $currentBranch = Get-BranchNameFromPrd $PrdFile
    $lastBranch = (Get-Content -Raw $LastBranchFile -ErrorAction SilentlyContinue).Trim()

    if (-not [string]::IsNullOrWhiteSpace($currentBranch) -and -not [string]::IsNullOrWhiteSpace($lastBranch) -and $currentBranch -ne $lastBranch) {
        $date = Get-Date -Format 'yyyy-MM-dd'
        $folderName = ($lastBranch -replace '^ralph/', '').Trim()
        $archiveFolder = Join-Path $ArchiveDir ("{0}-{1}" -f $date, $folderName)

        Write-Host "Archiving previous run: $lastBranch"
        New-Item -ItemType Directory -Force -Path $archiveFolder | Out-Null
        if (Test-Path $PrdFile) { Copy-Item $PrdFile -Destination $archiveFolder -Force }
        if (Test-Path $ProgressFile) { Copy-Item $ProgressFile -Destination $archiveFolder -Force }
        Write-Host "   Archived to: $archiveFolder"

        # Reset progress file for new run
        @(
            '# Ralph Progress Log'
            ("Started: {0}" -f (Get-Date))
            '---'
        ) | Set-Content -Path $ProgressFile
    }
}

# Track current branch
if (Test-Path $PrdFile) {
    $currentBranch = Get-BranchNameFromPrd $PrdFile
    if (-not [string]::IsNullOrWhiteSpace($currentBranch)) {
        $currentBranch | Set-Content -Path $LastBranchFile
    }
}

# Initialize progress file if it doesn't exist
if (-not (Test-Path $ProgressFile)) {
    @(
        '# Ralph Progress Log'
        ("Started: {0}" -f (Get-Date))
        '---'
    ) | Set-Content -Path $ProgressFile
}

Write-Host "Starting Ralph - Tool: $Tool - Max iterations: $MaxIterations"
Write-Host "PRD Directory: $PrdDirAbsolute"
Write-Host "Prompt File: $PromptFile"
Write-Host ''

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host ''
    Write-Host '==============================================================='
    Write-Host ("  Ralph Iteration {0} of {1} ({2})" -f $i, $MaxIterations, $Tool)
    Write-Host '==============================================================='

    $output = @()
    try {
        $promptWithContext = @(
            '# Ralph Context for This Run'
            ''
            '**File Paths for this iteration:**'
            ("- PRD File: {0}" -f $PrdFile)
            ("- Progress Log: {0}" -f $ProgressFile)
            ("- Working Directory: {0}" -f $Cwd)
            ''
            '---'
            ''
            (Get-Content -Raw $PromptFile)
        ) -join [Environment]::NewLine

        if ($Tool -eq 'codex') {
            if ($VerboseOutput) {
                & codex exec @CodeXFlagArgs $promptWithContext 2>&1 | Tee-Object -Variable output | Out-Host
            } else {
                & codex exec @CodeXFlagArgs $promptWithContext 2>&1 | Tee-Object -Variable output | Out-Null
            }
        } elseif ($Tool -eq 'amp') {
            if ($VerboseOutput) {
                $promptWithContext | & amp --dangerously-allow-all 2>&1 | Tee-Object -Variable output | Out-Host
            } else {
                $promptWithContext | & amp --dangerously-allow-all 2>&1 | Tee-Object -Variable output | Out-Null
            }
        } else {
            if ($VerboseOutput) {
                $promptWithContext | & claude --dangerously-skip-permissions --print 2>&1 | Tee-Object -Variable output | Out-Host
            } else {
                $promptWithContext | & claude --dangerously-skip-permissions --print 2>&1 | Tee-Object -Variable output | Out-Null
            }
        }
    } catch {
        # Ignore tool failures; continue loop
    }

    # Completion logic: PRD pass status is source of truth.
    $allPassed = Test-AllStoriesPassed $PrdFile
    $lastLine = Get-LastNonEmptyLine $output
    if ($lastLine -eq '<promise>COMPLETE</promise>' -and -not $allPassed) {
        Write-Warning 'Agent claimed COMPLETE but prd.json still has failing stories. Ignoring completion signal.'
    }
    if ($allPassed) {
        Write-Host ''
        Write-Host 'Ralph completed all tasks!'
        Write-Host ("Completed at iteration {0} of {1}" -f $i, $MaxIterations)
        exit 0
    }

    Write-Host ("Iteration {0} complete. Continuing..." -f $i)
    Start-Sleep -Seconds 2
}

Write-Host ''
Write-Host ("Ralph reached max iterations ({0}) without completing all tasks." -f $MaxIterations)
Write-Host ("Check {0} for status." -f $ProgressFile)
exit 1
