[CmdletBinding()]
param(
  [ValidateSet('Deploy', 'Build', 'Status', 'Stop')]
  [string]$Action = 'Deploy',
  [ValidateRange(1, 65535)][int]$Port = 3001,
  [string]$DatabasePath = '.local/greenedu.sqlite',
  [switch]$Demo,
  [switch]$QuickLogin,
  [switch]$NoQuickLogin,
  [switch]$Pull,
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeDir = Join-Path $projectRoot '.local'
$statePath = Join-Path $runtimeDir 'deploy-state.json'
$serverPath = Join-Path $projectRoot 'server/index.ts'
$distPath = Join-Path $projectRoot 'dist'
$originalLocation = Get-Location
$deploymentLock = $null
$newProcess = $null
$oldDistPath = $null
$stagePath = $null
$savedEnvironment = @{}

function Invoke-Checked([string]$Program, [string[]]$Arguments) {
  & $Program @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $Program $($Arguments -join ' ')" }
}

function Assert-ProjectPath([string]$Path) {
  $absolutePath = [IO.Path]::GetFullPath($Path)
  if (-not $absolutePath.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Path is outside this project: $absolutePath"
  }
  return $absolutePath
}

function Get-State {
  if (-not (Test-Path -LiteralPath $statePath)) { return $null }
  $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
  if ($state.ProjectRoot -ne $projectRoot) { throw 'Deployment state belongs to another project.' }
  return $state
}

function Get-ManagedProcess($State) {
  if (-not $State) { return $null }
  $managed = Get-Process -Id $State.ProcessId -ErrorAction SilentlyContinue
  if (-not $managed) { return $null }
  if ($managed.StartTime.ToUniversalTime().ToString('o') -ne $State.StartTimeUtc) { return $null }
  $info = Get-CimInstance Win32_Process -Filter "ProcessId = $($State.ProcessId)"
  if ($info.ExecutablePath -ne $State.NodePath -or -not $info.CommandLine.Contains($serverPath)) {
    throw 'The saved PID does not belong to this GreenEdu server. It will not be stopped.'
  }
  return $managed
}

function Stop-Managed($Managed) {
  if (-not $Managed -or $Managed.HasExited) { return }
  Stop-Children $Managed.Id
  Stop-Process -Id $Managed.Id
  if (-not $Managed.WaitForExit(10000)) { throw 'Timed out stopping the managed server.' }
}

function Stop-Children([int]$ParentId) {
  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ParentId"
  foreach ($child in $children) {
    Stop-Children $child.ProcessId
    Stop-Process -Id $child.ProcessId -ErrorAction SilentlyContinue
  }
}

function Test-Port([int]$Number) {
  $client = New-Object Net.Sockets.TcpClient
  try {
    $connect = $client.BeginConnect('127.0.0.1', $Number, $null, $null)
    if (-not $connect.AsyncWaitHandle.WaitOne(500)) { return $false }
    $client.EndConnect($connect)
    return $true
  } catch { return $false } finally { $client.Dispose() }
}

try {
  Set-Location -LiteralPath $projectRoot
  New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
  try {
    $deploymentLock = [IO.File]::Open((Join-Path $runtimeDir 'deploy.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
  } catch { throw 'Another deploy/status/stop command is running. Try again when it finishes.' }

  $state = Get-State
  if ($QuickLogin -and $NoQuickLogin) { throw 'Choose either -QuickLogin or -NoQuickLogin.' }
  $managed = Get-ManagedProcess $state
  if ($Action -eq 'Status') {
    if ($managed) {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:$($state.Port)/api/health" -TimeoutSec 5
      if (-not $health.ok) { throw 'The server is running but its health check failed.' }
      Write-Host "GreenEdu running: http://localhost:$($state.Port) (PID $($managed.Id))"
      Write-Host "Database: $($state.DatabasePath)"
      Write-Host "Demo: $($health.demo)"
      Write-Host "Local quick login: $($health.quickLogin)"
    } else { Write-Host 'GreenEdu is stopped (no managed server).' }
    return
  }
  if ($Action -eq 'Stop') {
    Stop-Managed $managed
    if (Test-Path -LiteralPath $statePath) { Remove-Item -LiteralPath $statePath }
    Write-Host 'GreenEdu stopped.'
    return
  }

  $nodePath = (Get-Command node -ErrorAction Stop).Source
  $npmPath = (Get-Command npm.cmd -ErrorAction Stop).Source
  Invoke-Checked $nodePath @('scripts/check-node.mjs')
  if ($Pull) {
    if (git status --porcelain) { throw 'Commit or save your Git changes before using -Pull.' }
    Invoke-Checked 'git' @('pull', '--ff-only')
  }
  if ($Action -eq 'Deploy' -and $state) {
    if (-not $PSBoundParameters.ContainsKey('Port')) { $Port = [int]$state.Port }
    if (-not $PSBoundParameters.ContainsKey('DatabasePath')) { $DatabasePath = $state.DatabasePath }
    if (-not $PSBoundParameters.ContainsKey('Demo')) { $Demo = [bool]$state.Demo }
    if (-not $PSBoundParameters.ContainsKey('QuickLogin')) { $QuickLogin = [bool]$state.QuickLogin }
  }
  if ($NoQuickLogin) { $QuickLogin = $false }
  $databaseAbsolute = if ([IO.Path]::IsPathRooted($DatabasePath)) {
    [IO.Path]::GetFullPath($DatabasePath)
  } else { [IO.Path]::GetFullPath((Join-Path $projectRoot $DatabasePath)) }
  if ($Action -eq 'Deploy' -and (Test-Port $Port) -and (-not $managed -or $state.Port -ne $Port)) {
    throw "Port $Port is occupied by another server. Stop that server yourself or choose -Port."
  }

  $hasher = [Security.Cryptography.SHA256]::Create()
  try {
    $lockHash = [BitConverter]::ToString($hasher.ComputeHash([IO.File]::ReadAllBytes((Join-Path $projectRoot 'package-lock.json')))).Replace('-', '')
  } finally { $hasher.Dispose() }
  $dependencyHash = $lockHash + ':' + (& $nodePath --version)
  $dependencyStamp = Join-Path $runtimeDir 'deploy-dependencies.txt'
  $previousHash = if (Test-Path -LiteralPath $dependencyStamp) { (Get-Content -LiteralPath $dependencyStamp -Raw).Trim() } else { '' }
  & $nodePath 'scripts/check-dependencies.mjs'
  $dependenciesValid = $LASTEXITCODE -eq 0
  if (-not $SkipInstall -and (-not $dependenciesValid -or ($previousHash -and $previousHash -ne $dependencyHash))) {
    Write-Host 'Installing locked dependencies in a separate staging directory...'
    $dependencyStage = Assert-ProjectPath (Join-Path $runtimeDir ('dependencies-' + [guid]::NewGuid().ToString('N')))
    New-Item -ItemType Directory -Path $dependencyStage | Out-Null
    Copy-Item -LiteralPath (Join-Path $projectRoot 'package.json') -Destination $dependencyStage
    Copy-Item -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Destination $dependencyStage
    Invoke-Checked $npmPath @('ci', '--prefix', $dependencyStage, '--prefer-offline', '--no-audit', '--no-fund')
    $modulesPath = Assert-ProjectPath (Join-Path $projectRoot 'node_modules')
    if (Test-Path -LiteralPath $modulesPath) {
      $previousModules = Assert-ProjectPath (Join-Path $runtimeDir ('previous-dependencies-' + [guid]::NewGuid().ToString('N')))
      Move-Item -LiteralPath $modulesPath -Destination $previousModules
    }
    try {
      Move-Item -LiteralPath (Assert-ProjectPath (Join-Path $dependencyStage 'node_modules')) -Destination $modulesPath
    } catch {
      if ($previousModules -and -not (Test-Path -LiteralPath $modulesPath)) {
        Move-Item -LiteralPath (Assert-ProjectPath $previousModules) -Destination $modulesPath
      }
      throw
    }
    Invoke-Checked $nodePath @('scripts/check-dependencies.mjs')
    Set-Content -LiteralPath $dependencyStamp -Value $dependencyHash -Encoding UTF8
  } elseif (-not $SkipInstall -and $dependenciesValid) {
    Set-Content -LiteralPath $dependencyStamp -Value $dependencyHash -Encoding UTF8
  }
  if (-not (Test-Path -LiteralPath 'node_modules/typescript/bin/tsc')) { throw 'Dependencies are missing. Run without -SkipInstall.' }
  $releaseId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
  $stagePath = Assert-ProjectPath (Join-Path $runtimeDir "build-$releaseId")
  Write-Host 'Checking TypeScript and building a new release...'
  Invoke-Checked $nodePath @('node_modules/typescript/bin/tsc', '--noEmit')
  Invoke-Checked $nodePath @('node_modules/vite/bin/vite.js', 'build', '--outDir', $stagePath)
  if (-not (Test-Path -LiteralPath (Join-Path $stagePath 'index.html'))) { throw 'Build has no index.html.' }

  if ($Action -eq 'Deploy' -and (Test-Path -LiteralPath $databaseAbsolute)) {
    $backupPath = Join-Path $runtimeDir "backups/database-$releaseId.sqlite"
    Write-Host 'Backing up SQLite (including committed WAL data)...'
    Invoke-Checked $nodePath @('scripts/backup-database.mjs', $databaseAbsolute, $backupPath)
  }
  if ($Action -eq 'Deploy') { Stop-Managed $managed }
  if (Test-Path -LiteralPath $distPath) {
    $oldDistPath = Assert-ProjectPath (Join-Path $runtimeDir "previous-dist-$releaseId")
    Move-Item -LiteralPath (Assert-ProjectPath $distPath) -Destination $oldDistPath
  }
  Move-Item -LiteralPath (Assert-ProjectPath $stagePath) -Destination (Assert-ProjectPath $distPath)
  $stagePath = $null
  if ($Action -eq 'Build') {
    Write-Host 'Build ready in dist. No server was started or stopped.'
    return
  }

  foreach ($name in @('PORT', 'DATABASE_PATH', 'SEED_DEMO', 'NODE_ENV', 'LOCAL_QUICK_LOGIN')) {
    $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
  }
  $env:PORT = [string]$Port
  $env:DATABASE_PATH = $databaseAbsolute
  $env:SEED_DEMO = if ($Demo) { '1' } else { '0' }
  $env:LOCAL_QUICK_LOGIN = if ($QuickLogin) { '1' } else { '0' }
  $env:NODE_ENV = 'development'
  $stdoutPath = Join-Path $runtimeDir 'deploy.log'
  $stderrPath = Join-Path $runtimeDir 'deploy-error.log'
  $newProcess = Start-Process -FilePath $nodePath -ArgumentList @('--import', 'tsx', ('"' + $serverPath + '"')) -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru
  $newState = [ordered]@{
    ProjectRoot = $projectRoot; ProcessId = $newProcess.Id
    StartTimeUtc = $newProcess.StartTime.ToUniversalTime().ToString('o')
    NodePath = $nodePath; Port = $Port; DatabasePath = $databaseAbsolute
    Demo = [bool]$Demo; QuickLogin = [bool]$QuickLogin; DeployedAt = (Get-Date).ToString('o')
  }
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    if ($newProcess.HasExited) { break }
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 1
      if ($health.ok -and $health.demo -eq [bool]$Demo -and $health.quickLogin -eq [bool]$QuickLogin -and -not $newProcess.HasExited) { $ready = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 250
  }
  if (-not $ready) { throw "Server did not become healthy. Inspect $stderrPath" }
  $newState | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
  $newProcess = $null
  Write-Host "GreenEdu deployed: http://localhost:$Port"
  Write-Host "Logs: $stdoutPath and $stderrPath"
} catch {
  if ($newProcess -and -not $newProcess.HasExited) { Stop-Process -Id $newProcess.Id -ErrorAction SilentlyContinue }
  if ($oldDistPath -and (Test-Path -LiteralPath $oldDistPath)) {
    if (Test-Path -LiteralPath $distPath) {
      $failedDist = Assert-ProjectPath (Join-Path $runtimeDir ('failed-dist-' + [guid]::NewGuid().ToString('N')))
      Move-Item -LiteralPath (Assert-ProjectPath $distPath) -Destination $failedDist
    }
    Move-Item -LiteralPath (Assert-ProjectPath $oldDistPath) -Destination (Assert-ProjectPath $distPath)
  }
  Write-Error $_
  exit 1
} finally {
  foreach ($name in $savedEnvironment.Keys) { [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], 'Process') }
  if ($deploymentLock) { $deploymentLock.Dispose() }
  Set-Location -LiteralPath $originalLocation
}
