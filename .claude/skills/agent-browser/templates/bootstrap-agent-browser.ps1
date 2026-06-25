param(
    [string]$SessionName,
    [string]$SessionPrefix = "mits11-",
    [string]$VerifyUrl = "https://example.com",
    [int]$MaxAttempts = 40,
    [switch]$SkipVerify
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AgentBrowserPort
{
    param([Parameter(Mandatory = $true)][string]$Name)
    $hash = 0
    foreach ($c in $Name.ToCharArray())
    {
        $hash = (($hash -shl 5) - $hash + [int][char]$c)
        $hash = [int]$hash
    }
    return 49152 + ([math]::Abs($hash) % 16383)
}

function Get-ExcludedTcpRanges
{
    $ranges = @()
    try
    {
        $lines = netsh interface ipv4 show excludedportrange protocol=tcp 2>$null
        foreach ($line in $lines)
        {
            if ($line -match "^\s*(\d+)\s+(\d+)\s*(\*?)\s*$")
            {
                $ranges += [pscustomobject]@{
                    Start = [int]$matches[1]
                    End   = [int]$matches[2]
                }
            }
        }
    } catch
    {
        # If this fails, we still have active bind checks below.
    }
    return $ranges
}

function Test-PortExcluded
{
    param(
        [int]$Port,
        [array]$Ranges
    )
    foreach ($r in $Ranges)
    {
        if ($Port -ge $r.Start -and $Port -le $r.End)
        {
            return $true
        }
    }
    return $false
}

function Test-AgentBrowserSession
{
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Url
    )
    & agent-browser --session $Name open $Url | Out-Null
    if ($LASTEXITCODE -ne 0)
    {
        return $false
    }
    & agent-browser --session $Name get title | Out-Null
    $ok = ($LASTEXITCODE -eq 0)
    & agent-browser --session $Name close | Out-Null
    return $ok
}

try
{
    $nodeCmd = Get-Command node -ErrorAction Stop
    $agentCmd = Get-Command agent-browser -ErrorAction Stop
} catch
{
    throw "Missing required command. Ensure both 'node' and 'agent-browser' are available in PATH."
}

$nodeDir = Split-Path $nodeCmd.Source -Parent
$agentWrapperDir = Split-Path $agentCmd.Source -Parent

# Keep fnm Node shim first and push Bun later so we avoid the broken Bun shim resolution.
$bunDir = Join-Path $HOME ".bun\bin"
$parts = $env:Path -split ";" | Where-Object { $_ -and $_.Trim() }
$env:Path = (
    @($nodeDir) +
    ($parts | Where-Object { $_ -ne $nodeDir -and $_ -ne $bunDir }) +
    @($bunDir)
) -join ";"

$agentHome = Join-Path $nodeDir "node_modules\agent-browser"
if (-not (Test-Path $agentHome))
{
    $agentHomeFromWrapper = Join-Path $agentWrapperDir "node_modules\agent-browser"
    if (Test-Path $agentHomeFromWrapper)
    {
        $agentHome = $agentHomeFromWrapper
    } else
    {
        throw "Cannot resolve AGENT_BROWSER_HOME. Tried '$agentHome' and '$agentHomeFromWrapper'."
    }
}

$env:AGENT_BROWSER_HOME = $agentHome

$excluded = Get-ExcludedTcpRanges

if ($SessionName)
{
    $candidates = @($SessionName)
} else
{
    $candidates = @(1..$MaxAttempts | ForEach-Object { "$SessionPrefix$_" })
}

$selected = $null
$selectedPort = $null

foreach ($name in $candidates)
{
    $port = Get-AgentBrowserPort -Name $name
    if (Test-PortExcluded -Port $port -Ranges $excluded)
    {
        continue
    }
    Write-Host "Testing session '$name' on port $port..."
    if ($SkipVerify -or (Test-AgentBrowserSession -Name $name -Url $VerifyUrl))
    {
        $selected = $name
        $selectedPort = $port
        break
    }
}

if (-not $selected)
{
    throw "No working session found. Increase -MaxAttempts or provide -SessionName explicitly."
}

$env:AGENT_BROWSER_SESSION = $selected

Write-Host "agent-browser bootstrap complete."
Write-Host "AGENT_BROWSER_HOME=$env:AGENT_BROWSER_HOME"
Write-Host "AGENT_BROWSER_SESSION=$env:AGENT_BROWSER_SESSION (port $selectedPort)"
Write-Host "Resolved agent-browser: $((Get-Command agent-browser).Source)"
Write-Host "Usage: agent-browser --session $env:AGENT_BROWSER_SESSION open https://example.com"
Write-Host "Tip: dot-source to keep env in current shell:"
Write-Host "  . .\bootstrap-agent-browser.ps1"
