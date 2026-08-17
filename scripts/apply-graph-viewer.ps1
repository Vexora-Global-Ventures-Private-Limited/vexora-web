# Re-apply premium graph viewer shell after `graphify update`
# Usage: .\scripts\apply-graph-viewer.ps1

$root = Split-Path $PSScriptRoot -Parent
$targets = @(
  "$root\graphify-out",
  "$root\src\graphify-out"
)

foreach ($dir in $targets) {
  if (-not (Test-Path $dir)) { continue }
  $shell = Join-Path $root "graphify-out\graph.viewer.shell.html"
  if (Test-Path $shell) {
    Copy-Item -Force $shell (Join-Path $dir "graph.html")
    Write-Host "Applied viewer shell -> $dir\graph.html"
  }
  $assets = Join-Path $root "graphify-out\assets"
  if (Test-Path $assets) {
    $dest = Join-Path $dir "assets"
    if ((Resolve-Path $assets).Path -ne (Resolve-Path $dest -ErrorAction SilentlyContinue).Path) {
      Copy-Item -Recurse -Force $assets $dest
      Write-Host "Synced assets -> $dest"
    }
  }
}

Write-Host "Done. Open graphify-out/graph.html in a local server."
