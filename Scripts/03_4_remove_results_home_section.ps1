#requires -Version 5.1
# PATCH 03.4
# Removes the Results information section from the Home page.
# The "Resultados" navigation item is preserved for future use.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$HomePagePath = Join-Path $ProjectPath "src\pages\HomePage.jsx"
$ToolsPath = Join-Path $ProjectPath "tools"
$NodePatchPath = Join-Path $ToolsPath "remove-results-section.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 03.4 - REMOVE RESULTS HOME SECTION" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ProjectPath)) {
    throw "Project not found: $ProjectPath"
}

if (-not (Test-Path $HomePagePath)) {
    throw "HomePage.jsx not found: $HomePagePath"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found."
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\remove-results-section-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $HomePagePath (Join-Path $BackupPath "HomePage.jsx") -Force

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

# ---------------------------------------------------------------------------
# 2. CREATE UTF-8 SAFE NODE PATCH
# ---------------------------------------------------------------------------

New-Item -ItemType Directory -Force -Path $ToolsPath | Out-Null

$NodePatch = @'
import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;

const homePagePath = path.join(
  projectPath,
  "src",
  "pages",
  "HomePage.jsx",
);

let source = fs.readFileSync(homePagePath, "utf8");
const original = source;

/*
 * Elimina el import de ResultsSection.
 */
source = source.replace(
  /^import\s+ResultsSection\s+from\s+["'][^"']*ResultsSection[^"']*["'];?\s*\r?\n/gm,
  "",
);

/*
 * Elimina el componente del Home.
 */
source = source.replace(
  /\s*<ResultsSection\s*\/>\s*/g,
  "\n",
);

source = source.replace(
  /\s*<ResultsSection(?:\s+[^>]*)?>\s*<\/ResultsSection>\s*/g,
  "\n",
);

if (source === original) {
  console.log("No ResultsSection reference was found in HomePage.jsx.");
  process.exit(2);
}

fs.writeFileSync(homePagePath, source, "utf8");

console.log("Results section removed from Home.");
console.log("Navigation item 'Resultados' was preserved.");
'@

[System.IO.File]::WriteAllText(
    $NodePatchPath,
    $NodePatch,
    (New-Object System.Text.UTF8Encoding($false))
)

# ---------------------------------------------------------------------------
# 3. APPLY PATCH
# ---------------------------------------------------------------------------

& node $NodePatchPath

if ($LASTEXITCODE -eq 2) {
    Write-Host ""
    Write-Host "No ResultsSection reference was found." -ForegroundColor Yellow
    Write-Host "Backup available at:" -ForegroundColor Yellow
    Write-Host $BackupPath
    exit 2
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "PATCH FAILED" -ForegroundColor Red
    exit $LASTEXITCODE
}

# ---------------------------------------------------------------------------
# 4. BUILD VALIDATION
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
Write-Host " PATCH 03.4 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Removed from Home:" -ForegroundColor Cyan
Write-Host "- Consult and download your results online"
Write-Host "- Current and historical results"
Write-Host "- PDF downloads"
Write-Host "- 24/7 access"
Write-Host ""
Write-Host "Navigation item 'Resultados' remains available." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
