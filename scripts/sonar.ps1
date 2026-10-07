param([ValidateSet('Install','Scan')][string]$Mode = 'Scan')
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$tool = Join-Path (Get-Location) '.local/tools/sonar'
if ($Mode -eq 'Install') {
    dotnet tool install dotnet-sonarscanner --version 11.3.0 --tool-path $tool
    if ($LASTEXITCODE -ne 0) { throw 'SonarScanner installation failed.' }
    exit
}
if (!$env:SONAR_TOKEN) { throw 'Set SONAR_TOKEN to a local project analysis token; do not commit it.' }
$server = if ($env:SONAR_HOST_URL) { $env:SONAR_HOST_URL } else { 'http://localhost:9000' }
$uri = [Uri]$server
if (!$uri.IsLoopback) { throw 'This classroom script accepts only a local SonarQube server.' }
$destination = if ($env:ASSURANCE_ARTIFACTS) { $env:ASSURANCE_ARTIFACTS } else { '.local/sonar-evidence' }
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$scanner = Join-Path $tool 'dotnet-sonarscanner'
if ($IsWindows) { $scanner += '.exe' }
function Invoke-Scanner([string[]]$Arguments, [switch]$AllowFailure) {
    # The scanner requires a token argument. Never print arguments; redact scanner output.
    $lines = & $scanner @Arguments 2>&1
    $code = $LASTEXITCODE
    $lines | ForEach-Object { "$($_)".Replace($env:SONAR_TOKEN, '[REDACTED]') } | Tee-Object -FilePath (Join-Path $destination 'scanner.log') -Append
    if ($code -ne 0 -and !$AllowFailure) { throw "SonarScanner exited $code; retain evidence and investigate." }
}
Invoke-Scanner -Arguments @('begin', '/k:nsu-student-lab', "/d:sonar.host.url=$server", "/d:sonar.token=$env:SONAR_TOKEN", "/d:sonar.projectBaseDir=$((Get-Location).Path)", '/d:sonar.scanner.scanAll=true', '/d:sonar.exclusions=**/node_modules/**,**/.local/**,**/wwwroot/**,security/fixtures/**', '/d:sonar.qualitygate.wait=true', '/d:sonar.qualitygate.timeout=120')
dotnet build StudentLab.slnx --no-incremental
if ($LASTEXITCODE -ne 0) { throw 'Analysis build failed.' }
Invoke-Scanner -AllowFailure -Arguments @('end', "/d:sonar.token=$env:SONAR_TOKEN")
$taskFile = Get-ChildItem '.sonarqube' -Filter 'report-task.txt' -Recurse | Select-Object -First 1
if (!$taskFile) { throw 'No scanner task receipt; cannot bind evidence to an analysis.' }
$receipt = Get-Content $taskFile.FullName -Raw | ConvertFrom-StringData
$headers = @{ Authorization = "Bearer $env:SONAR_TOKEN" }
function Read-Sonar([string]$Path) { Invoke-RestMethod "$server/$Path" -Headers $headers }
$task = Read-Sonar "api/ce/task?id=$($receipt.ceTaskId)"
if ($task.task.status -ne 'SUCCESS' -or !$task.task.analysisId) { throw 'Server analysis is not complete.' }
$gate = Read-Sonar "api/qualitygates/project_status?analysisId=$($task.task.analysisId)"
$issues = Read-Sonar 'api/issues/search?componentKeys=nsu-student-lab&ps=100'
$metrics = Read-Sonar 'api/measures/component?component=nsu-student-lab&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc'
$latest = Read-Sonar 'api/project_analyses/search?project=nsu-student-lab&ps=1'
if ($latest.analyses[0].key -ne $task.task.analysisId) { throw 'Concurrent analysis detected; metrics cannot be attributed to this run.' }
@{ created = [DateTime]::UtcNow.ToString('o'); analysisId = $task.task.analysisId; server = $server; qualityGate = $gate; issues = $issues; measures = $metrics; limits = @('Issues limited to first 100; inspect total.', 'Missing coverage is not zero or proof of tested code.', 'Scanner build changes analysis settings; independent verification remains required.') } | ConvertTo-Json -Depth 30 | Set-Content (Join-Path $destination 'sonar.json')
if ($gate.projectStatus.status -ne 'OK') { throw 'SonarQube quality gate did not pass; evidence retained.' }
