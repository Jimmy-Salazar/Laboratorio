#requires -Version 5.1
# PATCH 02.9
# Use one default image for all branch cards until real photos are available.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceImage = Join-Path $ScriptRoot "branch-default.png"
$TargetImage = Join-Path $ProjectPath "public\images\branch-default.png"
$SiteContentPath = Join-Path $ProjectPath "src\data\siteContent.js"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 02.9 - DEFAULT BRANCH IMAGE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ProjectPath)) {
    throw "Project not found: $ProjectPath"
}

if (-not (Test-Path $SourceImage)) {
    throw "Default branch image not found next to the script."
}

if (-not (Test-Path $SiteContentPath)) {
    throw "siteContent.js not found: $SiteContentPath"
}

New-Item -ItemType Directory -Force -Path (Split-Path $TargetImage) | Out-Null
Copy-Item $SourceImage $TargetImage -Force

Write-Host "Default branch image copied." -ForegroundColor Green

# Read/write explicitly as UTF-8 so existing Spanish text is preserved.
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Content = [System.IO.File]::ReadAllText(
    $SiteContentPath,
    [System.Text.Encoding]::UTF8
)

$OldImages = @(
    "/images/branch-1.png",
    "/images/branch-2.png",
    "/images/branch-3.png",
    "/images/branch-4.png"
)

foreach ($OldImage in $OldImages) {
    $Content = $Content.Replace(
        $OldImage,
        "/images/branch-default.png"
    )
}

[System.IO.File]::WriteAllText(
    $SiteContentPath,
    $Content,
    $Utf8NoBom
)

Write-Host "All branch cards now use branch-default.png." -ForegroundColor Green
Write-Host "Addresses and phones remain unchanged." -ForegroundColor Green

Set-Location $ProjectPath

Write-Host ""
Write-Host "Running production build..." -ForegroundColor Yellow
Write-Host ""

& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " PATCH 02.9 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
