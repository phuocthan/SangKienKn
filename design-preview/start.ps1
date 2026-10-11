[CmdletBinding()]
param([ValidateSet('Start','Status','Stop')][string]$Action = 'Start')
$ErrorActionPreference = 'Stop'
$previewRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$previewRuntime = Join-Path $previewRoot '.local'
$previewStatePath = Join-Path $previewRuntime 'garden-preview-state.json'
$previewConfig = Join-Path $PSScriptRoot 'vite.config.mjs'
$previewVite = Join-Path $previewRoot 'node_modules/vite/bin/vite.js'
$previewProcess = $null
if (Test-Path -LiteralPath $previewStatePath) {
  $previewState = Get-Content -LiteralPath $previewStatePath -Raw | ConvertFrom-Json
  if ($previewState.ProjectRoot -ne $previewRoot) { throw 'Preview state belongs to another project.' }
  $previewCandidate = Get-Process -Id $previewState.ProcessId -ErrorAction SilentlyContinue
  if ($previewCandidate -and $previewCandidate.StartTime.ToUniversalTime().ToString('o') -eq $previewState.StartTimeUtc) {
    $previewInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($previewState.ProcessId)"
    if ($previewInfo.ExecutablePath -ne $previewState.NodePath -or -not $previewInfo.CommandLine.Contains($previewConfig)) { throw 'Saved PID is not this design preview.' }
    $previewProcess = $previewCandidate
  }
}
if ($Action -eq 'Stop') {
  if ($previewProcess) { Stop-Process -Id $previewProcess.Id }
  Write-Output 'Design preview stopped; application and data unchanged.'
  exit
}
if ($Action -eq 'Status') {
  if ($previewProcess) { Write-Output "Design preview running: http://localhost:5180 (PID $($previewProcess.Id))" }
  else { Write-Output 'Design preview is stopped.' }
  exit
}
if ($previewProcess) { Write-Output 'Design preview already running: http://localhost:5180'; exit }
New-Item -ItemType Directory -Path $previewRuntime -Force | Out-Null
$previewNode = (Get-Command node -CommandType Application | Select-Object -First 1).Source
$previewArgs = @(('"' + $previewVite + '"'), '--config', ('"' + $previewConfig + '"'))
$previewStarted = Start-Process -FilePath $previewNode -ArgumentList $previewArgs -WorkingDirectory $previewRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $previewRuntime 'garden-preview.log') -RedirectStandardError (Join-Path $previewRuntime 'garden-preview-error.log') -PassThru
$previewReady = $false
for ($previewAttempt = 0; $previewAttempt -lt 40; $previewAttempt++) {
  Start-Sleep -Milliseconds 300
  $previewStarted.Refresh()
  if ($previewStarted.HasExited) { throw 'Preview failed to start; check .local/garden-preview-error.log. Other processes were not stopped.' }
  try {
    $previewResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:5180' -UseBasicParsing -TimeoutSec 2
    if ($previewResponse.StatusCode -eq 200 -and $previewResponse.Content.Contains('/studio.jsx')) { $previewReady = $true; break }
  } catch {}
}
if (-not $previewReady) { Stop-Process -Id $previewStarted.Id; throw 'Preview readiness timed out.' }
@{ProjectRoot=$previewRoot;ProcessId=$previewStarted.Id;StartTimeUtc=$previewStarted.StartTime.ToUniversalTime().ToString('o');NodePath=$previewNode;Url='http://localhost:5180';Design='Warm garden';Data='Static illustration only'} | ConvertTo-Json | Set-Content -LiteralPath $previewStatePath -Encoding utf8
Write-Output 'Design preview ready: http://localhost:5180'
Write-Output 'Interactive design only; no API, database, deployment or application changes.'
