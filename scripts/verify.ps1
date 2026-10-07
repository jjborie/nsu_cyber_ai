# Requires PowerShell 7. Starts and stops only its own temporary API process.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$projectPath = Join-Path $projectRoot 'src/StudentLab'
# npm.cmd avoids PowerShell execution-policy issues on Windows.
$npmCommand = if ($IsWindows) { 'npm.cmd' } else { 'npm' }
Push-Location $projectRoot
try {
    & $npmCommand run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed. Run npm ci first.' }
    & $npmCommand test
    if ($LASTEXITCODE -ne 0) { throw 'Frontend unit tests failed.' }
} finally { Pop-Location }
dotnet build (Join-Path $projectRoot 'StudentLab.slnx')
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
dotnet test (Join-Path $projectRoot 'tests/StudentLab.Tests') --no-build
if ($LASTEXITCODE -ne 0) { throw 'Backend unit tests failed.' }

$startInfo = [System.Diagnostics.ProcessStartInfo]::new('dotnet')
$startInfo.WorkingDirectory = $projectPath
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.ArgumentList.Add('bin/Debug/net10.0/StudentLab.dll')
$startInfo.ArgumentList.Add('--urls')
$startInfo.ArgumentList.Add('http://127.0.0.1:0')
$startInfo.Environment['ASPNETCORE_ENVIRONMENT'] = 'Production'
$server = [System.Diagnostics.Process]::new()
$server.StartInfo = $startInfo
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(5)
$checks = 0

function Assert-True($condition, $message) {
    if (-not $condition) { throw $message }
    $script:checks++
}
function Send-Request($method, $path, $body = $null) {
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($method), "$script:baseUrl$path")
    if ($null -ne $body) {
        $request.Content = [System.Net.Http.StringContent]::new(($body | ConvertTo-Json -Compress), [System.Text.Encoding]::UTF8, 'application/json')
    }
    try {
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        try {
            return @{ Status = [int]$response.StatusCode; Body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult(); Location = $response.Headers.Location }
        } finally { $response.Dispose() }
    } finally { $request.Dispose() }
}

try {
    [void]$server.Start()
    $errorOutput = $server.StandardError.ReadToEndAsync()
    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    while (-not $baseUrl) {
        $lineTask = $server.StandardOutput.ReadLineAsync()
        $remaining = [Math]::Max(1, [int]($deadline - [DateTime]::UtcNow).TotalMilliseconds)
        if (-not $lineTask.Wait($remaining)) { throw 'Server startup timed out.' }
        $line = $lineTask.Result
        if ($null -eq $line) { throw "Server exited during startup: $($errorOutput.GetAwaiter().GetResult())" }
        if ($line -match 'Now listening on: (http://127\.0\.0\.1:\d+)') { $script:baseUrl = $Matches[1] }
        if ([DateTime]::UtcNow -ge $deadline) { throw 'Server startup timed out.' }
    }
    # Drain logs asynchronously so a full output buffer cannot block requests.
    $outputDrain = $server.StandardOutput.ReadToEndAsync()
    Assert-True ((Send-Request GET '/api/health').Status -eq 200) 'Health endpoint failed.'
    $page = Send-Request GET '/'
    Assert-True ($page.Status -eq 200 -and $page.Body.Contains('Student Lab Board')) 'SPA is missing.'
    $assetPaths = [regex]::Matches($page.Body, '(?:src|href)="(/assets/[^" ]+)"')
    Assert-True ($assetPaths.Count -ge 2) 'Expected Vite-built JavaScript and CSS references.'
    foreach ($asset in $assetPaths) {
        $assetPath = $asset.Groups[1].Value
        $assetResponse = Send-Request GET $assetPath
        Assert-True ($assetResponse.Status -eq 200 -and -not $assetResponse.Body.Contains('<!doctype html>')) "Missing built asset: $assetPath"
    }
    $items = (Send-Request GET '/api/experiments').Body | ConvertFrom-Json
    Assert-True ($items.Count -eq 3) 'Expected three seeded experiments.'
    $created = Send-Request POST '/api/experiments' @{ title = '  HTTP check  ' }
    Assert-True ($created.Status -eq 201) 'Create failed.'
    $item = $created.Body | ConvertFrom-Json
    Assert-True ($item.title -eq 'HTTP check' -and -not $item.isComplete) 'Create contract failed.'
    Assert-True ($created.Location.ToString() -eq "/api/experiments/$($item.id)") 'Location header failed.'
    $path = "/api/experiments/$($item.id)"
    Assert-True ((Send-Request GET $path).Status -eq 200) 'Read failed.'
    $updated = Send-Request PUT $path @{ isComplete = $true }
    Assert-True ($updated.Status -eq 200 -and ($updated.Body | ConvertFrom-Json).isComplete) 'Complete failed.'
    Assert-True ((Send-Request PUT $path @{}).Status -eq 400) 'Missing completion flag accepted.'
    foreach ($title in @('', '   ', ('x' * 101))) {
        Assert-True ((Send-Request POST '/api/experiments' @{ title = $title }).Status -eq 400) 'Invalid title accepted.'
    }
    Assert-True ((Send-Request POST '/api/experiments' @{}).Status -eq 400) 'Missing title accepted.'
    Assert-True ((Send-Request DELETE $path).Status -eq 204) 'Delete failed.'
    Assert-True ((Send-Request GET $path).Status -eq 404) 'Deleted resource still readable.'
    Assert-True ((Send-Request DELETE $path).Status -eq 404) 'Missing delete must return 404.'
    Assert-True ((Send-Request PUT $path @{ isComplete = $false }).Status -eq 404) 'Missing update must return 404.'
    $unknown = Send-Request GET '/api/unknown'
    Assert-True ($unknown.Status -eq 404 -and -not $unknown.Body.Contains('<html')) 'Unknown API route returned SPA.'
    Write-Host "PASS: $checks HTTP checks."
} finally {
    $client.Dispose()
    if ($server.Id -and -not $server.HasExited) { $server.Kill($true); $server.WaitForExit() }
    $server.Dispose()
}
