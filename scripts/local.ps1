[CmdletBinding()]
param([ValidateSet('Start', 'Status', 'Stop')][string]$Action = 'Start')
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeDir = Join-Path $projectRoot '.local'
$statePath = Join-Path $runtimeDir 'frontend-state.json'
$vitePath = Join-Path $projectRoot 'node_modules/vite/bin/vite.js'
$frontendProcess = $null
if (Test-Path -LiteralPath $statePath) {
  $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
  if ($state.ProjectRoot -ne $projectRoot) { throw 'Frontend state belongs to another project.' }
  $candidate = Get-Process -Id $state.ProcessId -ErrorAction SilentlyContinue
  if ($candidate -and $candidate.StartTime.ToUniversalTime().ToString('o') -eq $state.StartTimeUtc) {
    $info = Get-CimInstance Win32_Process -Filter "ProcessId = $($state.ProcessId)"
    if ($info.ExecutablePath -ne $state.NodePath -or -not $info.CommandLine.Contains($vitePath)) { throw 'Saved PID is not this frontend. It will not be stopped.' }
    $frontendProcess = $candidate
  }
}
if ($Action -eq 'Stop') {
  if ($frontendProcess) { Stop-Process -Id $frontendProcess.Id }
  Write-Output 'Local frontend stopped; Railway is unchanged.'
  exit
}
if ($Action -eq 'Status') {
  if ($frontendProcess) { Write-Output "Frontend running: http://localhost:5173 (PID $($frontendProcess.Id)); API: https://greenedu.up.railway.app" }
  else { Write-Output 'Local frontend is stopped.' }
  exit
}
if ($frontendProcess) { Write-Output 'Frontend already running: http://localhost:5173'; exit }
Push-Location -LiteralPath $projectRoot
try {
  & node scripts/check-node.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Node version check failed.' }
  New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
  $nodePath = (Get-Command node -CommandType Application | Select-Object -First 1).Source
  $viteArgument = '"' + $vitePath + '"'
  $started = Start-Process -FilePath $nodePath -ArgumentList @($viteArgument, '--mode', 'railway', '--host', '127.0.0.1') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'frontend.log') -RedirectStandardError (Join-Path $runtimeDir 'frontend-error.log') -PassThru
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 300
    $started.Refresh()
    if ($started.HasExited) { throw 'Frontend failed to start; inspect .local/frontend-error.log (port 5173 may be occupied).' }
    try {
      $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/@vite/client' -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
  }
  if (-not $ready) { Stop-Process -Id $started.Id; throw 'Frontend readiness timed out.' }
  @{ ProjectRoot=$projectRoot; ProcessId=$started.Id; StartTimeUtc=$started.StartTime.ToUniversalTime().ToString('o'); NodePath=$nodePath; ApiTarget='https://greenedu.up.railway.app'; Url='http://localhost:5173' } | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
  Write-Output 'Frontend ready: http://localhost:5173; API/database: Railway. Changes reload automatically.'
} finally { Pop-Location }
