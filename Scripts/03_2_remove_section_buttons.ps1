#requires -Version 5.1
# PATCH 03.2
# Removes "View all specialties" and "View all locations" buttons.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$BranchesPath = Join-Path $ProjectPath "src\components\home\BranchesSection.jsx"
$SpecialtiesPath = Join-Path $ProjectPath "src\components\home\SpecialtiesSection.jsx"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 03.2 - REMOVE SECTION ACTION BUTTONS" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $BranchesPath)) {
    throw "BranchesSection.jsx not found."
}

if (-not (Test-Path $SpecialtiesPath)) {
    throw "SpecialtiesSection.jsx not found."
}

# ---------------------------------------------------------------------------
# BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\remove-section-buttons-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $BranchesPath (Join-Path $BackupPath "BranchesSection.jsx") -Force
Copy-Item $SpecialtiesPath (Join-Path $BackupPath "SpecialtiesSection.jsx") -Force

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

# ---------------------------------------------------------------------------
# UTF-8 SAFE READ/WRITE
# ---------------------------------------------------------------------------

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# ---------------------------------------------------------------------------
# BRANCHES
# ---------------------------------------------------------------------------

$BranchesContent = [System.IO.File]::ReadAllText(
    $BranchesPath,
    [System.Text.Encoding]::UTF8
)

$BranchesContent = $BranchesContent.Replace(
@'
          actionLabel={content.branches.viewAll}
          actionHref="#branches"
'@,
""
)

[System.IO.File]::WriteAllText(
    $BranchesPath,
    $BranchesContent,
    $Utf8NoBom
)

Write-Host "Branches action button removed." -ForegroundColor Green

# ---------------------------------------------------------------------------
# SPECIALTIES
# ---------------------------------------------------------------------------

$SpecialtiesContent = [System.IO.File]::ReadAllText(
    $SpecialtiesPath,
    [System.Text.Encoding]::UTF8
)

$SpecialtiesContent = $SpecialtiesContent.Replace(
@'
          actionLabel={content.specialties.viewAll}
          actionHref="#specialties"
'@,
""
)

[System.IO.File]::WriteAllText(
    $SpecialtiesPath,
    $SpecialtiesContent,
    $Utf8NoBom
)

Write-Host "Specialties action button removed." -ForegroundColor Green

# ---------------------------------------------------------------------------
# BUILD VALIDATION
# ---------------------------------------------------------------------------

Set-Location $ProjectPath

Write-Host ""
Write-Host "Running production build..." -ForegroundColor Yellow
Write-Host ""

& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Backup available at:" -ForegroundColor Yellow
    Write-Host $BackupPath
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " PATCH 03.2 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Removed:" -ForegroundColor Cyan
Write-Host "- View all locations"
Write-Host "- View all specialties"
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
