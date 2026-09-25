#requires -Version 5.1
# PATCH 05.1
# Changes the browser tab/page title to LaboratorioDrChasi.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$IndexPath = Join-Path $ProjectPath "index.html"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 05.1 - PAGE TITLE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $IndexPath)) {
    throw "index.html not found: $IndexPath"
}

$BackupPath = Join-Path $ProjectPath "backups\page-title-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
Copy-Item $IndexPath (Join-Path $BackupPath "index.html") -Force

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Content = [System.IO.File]::ReadAllText(
    $IndexPath,
    [System.Text.Encoding]::UTF8
)

if ($Content -match '<title>.*?</title>') {
    $Content = [regex]::Replace(
        $Content,
        '<title>.*?</title>',
        '<title>LaboratorioDrChasi</title>',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
}
else {
    if ($Content -match '</head>') {
        $Content = $Content -replace '</head>', "  <title>LaboratorioDrChasi</title>`r`n</head>"
    }
    else {
        throw "Could not locate </head> in index.html"
    }
}

[System.IO.File]::WriteAllText(
    $IndexPath,
    $Content,
    $Utf8NoBom
)

Write-Host "Browser title updated to LaboratorioDrChasi." -ForegroundColor Green
Write-Host ""

Set-Location $ProjectPath

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
Write-Host " PATCH 05.1 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "New page title:" -ForegroundColor Cyan
Write-Host "LaboratorioDrChasi"
Write-Host ""
Write-Host "If the old title still appears, refresh with Ctrl+F5." -ForegroundColor Yellow
