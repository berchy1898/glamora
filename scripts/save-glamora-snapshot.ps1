[CmdletBinding()]
param(
  [Parameter()]
  [string]$Name = 'pre-change'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$historyRoot = Join-Path $projectRoot '.glamora-history'
$snapshotsRoot = Join-Path $historyRoot 'snapshots'

$safeName = ($Name -replace '[^A-Za-z0-9._-]', '-').Trim('-')
if ([string]::IsNullOrWhiteSpace($safeName)) {
  throw 'El nombre de la copia no es válido.'
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss-fffZ')
$snapshotName = "$timestamp-$safeName"
$snapshotRoot = Join-Path $snapshotsRoot $snapshotName

$excludedDirectories = @(
  '.git', '.glamora-history', '.next', 'node_modules', 'dist', 'build', 'out',
  'coverage', 'playwright-report', 'test-results', '.turbo', '.vercel', '.cache'
)
$excludedFilePattern = '(?i)(^\.env($|\.)|\.tsbuildinfo$|\.log$|\.pem$|\.key$|\.p12$|\.pfx$|\.p8$|\.jks$|^\.npmrc$|^\.netrc$|credentials|secrets?)'

function Get-CompatRelativePath([string]$basePath, [string]$targetPath) {
  $normBase = $basePath.TrimEnd('\', '/') + '\'
  if ($targetPath.StartsWith($normBase, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $targetPath.Substring($normBase.Length)
  }
  return $targetPath
}

$files = Get-ChildItem -LiteralPath $projectRoot -File -Recurse -Force | Where-Object {
  $relativePath = Get-CompatRelativePath $projectRoot $_.FullName
  $segments = $relativePath -split '[\\/]'
  $hasExcludedDirectory = @($segments | Where-Object { $excludedDirectories -contains $_ }).Count -gt 0
  -not $hasExcludedDirectory -and $_.Name -notmatch $excludedFilePattern
}

if (Test-Path -LiteralPath $snapshotRoot) {
  throw "La copia ya existe; no se sobrescribió: $snapshotName"
}

New-Item -ItemType Directory -Path $snapshotRoot -Force:$false | Out-Null
$manifestEntries = [System.Collections.Generic.List[object]]::new()

foreach ($file in $files) {
  $relativePath = Get-CompatRelativePath $projectRoot $file.FullName
  $destination = Join-Path $snapshotRoot $relativePath
  $destinationDirectory = Split-Path -Parent $destination

  if (-not (Test-Path -LiteralPath $destinationDirectory)) {
    New-Item -ItemType Directory -Path $destinationDirectory -Force:$false | Out-Null
  }

  Copy-Item -LiteralPath $file.FullName -Destination $destination
  $snapshotFile = Get-Item -LiteralPath $destination
  $manifestEntries.Add([PSCustomObject]@{
    path = $relativePath.Replace('\', '/')
    sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
    bytes = $snapshotFile.Length
  })
}

$manifest = [PSCustomObject]@{
  name = $snapshotName
  createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  fileCount = $manifestEntries.Count
  files = @($manifestEntries)
}

$manifestPath = Join-Path $snapshotRoot 'manifest.json'
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding utf8

[PSCustomObject]@{
  snapshot = $snapshotName
  path = $snapshotRoot
  files = $manifestEntries.Count
  manifest = 'manifest.json (SHA-256 por archivo)'
} | ConvertTo-Json
