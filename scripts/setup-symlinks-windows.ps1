# Converts git-tracked symlinks (checked out as text files on Windows with
# core.symlinks=false) to proper NTFS junctions for directory targets.
# Run this once after cloning on Windows without Developer Mode.

$repoRoot = git -C $PSScriptRoot rev-parse --show-toplevel
$repoRoot = $repoRoot -replace '/', '\'

$symlinks = git -C $repoRoot ls-files --stage |
  Where-Object { $_ -match '^120000' } |
  ForEach-Object { ($_ -split '\s+')[3] }

$converted = 0
$skipped = 0

foreach ($rel in $symlinks) {
  $absPath = Join-Path $repoRoot ($rel -replace '/', '\')

  # Already a real symlink or junction — skip
  $item = Get-Item $absPath -Force -ErrorAction SilentlyContinue
  if ($item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    $skipped++
    continue
  }

  # Must be a plain text file (the fake symlink)
  if (-not (Test-Path $absPath -PathType Leaf)) {
    $skipped++
    continue
  }

  $target = (Get-Content $absPath -Raw).Trim()
  $parentDir = Split-Path $absPath -Parent
  $absTarget = [IO.Path]::GetFullPath((Join-Path $parentDir ($target -replace '/', '\')))

  if (-not (Test-Path $absTarget -PathType Container)) {
    Write-Warning "Skipping $rel — target is not a directory: $absTarget"
    $skipped++
    continue
  }

  Remove-Item $absPath -Force
  New-Item -ItemType Junction -Path $absPath -Target $absTarget | Out-Null
  Write-Host "Junction: $rel -> $absTarget"
  $converted++
}

Write-Host ("" + [char]10 + "Done. $converted junction(s) created, $skipped skipped.")
