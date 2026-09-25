#requires -Version 5.1
# PATCH 03.3
# Removes the Promotions item from the main navigation only.
# The Promotions section on the home page remains unchanged.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$SiteContentPath = Join-Path $ProjectPath "src\data\siteContent.js"
$ToolsPath = Join-Path $ProjectPath "tools"
$NodePatchPath = Join-Path $ToolsPath "remove-promotions-nav.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 03.3 - REMOVE PROMOTIONS NAV ITEM" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ProjectPath)) {
    throw "Project not found: $ProjectPath"
}

if (-not (Test-Path $SiteContentPath)) {
    throw "siteContent.js not found: $SiteContentPath"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found."
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\remove-promotions-nav-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $SiteContentPath (Join-Path $BackupPath "siteContent.js") -Force

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

# ---------------------------------------------------------------------------
# 2. CREATE SAFE NODE PATCH
# ---------------------------------------------------------------------------

New-Item -ItemType Directory -Force -Path $ToolsPath | Out-Null

$NodePatch = @'
import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;
const contentPath = path.join(
  projectPath,
  "src",
  "data",
  "siteContent.js",
);

let source = fs.readFileSync(contentPath, "utf8");
const original = source;

/*
 * Elimina solamente objetos de navegacion cuyo destino sea #promotions.
 * No toca el bloque de contenido de promociones ni sus tarjetas.
 */
source = source.replace(
  /\{\s*label:\s*["'][^"']*["']\s*,\s*href:\s*["']#promotions["']\s*,?\s*\}\s*,?/g,
  "",
);

/*
 * Variante por si el objeto tiene href antes que label.
 */
source = source.replace(
  /\{\s*href:\s*["']#promotions["']\s*,\s*label:\s*["'][^"']*["']\s*,?\s*\}\s*,?/g,
  "",
);

/*
 * Limpieza menor de comas dobles accidentales dentro de arrays.
 */
source = source.replace(/,\s*,/g, ",");

if (source === original) {
  console.log(
    "No navigation object with href #promotions was found in siteContent.js.",
  );
  console.log(
    "No file was changed.",
  );
  process.exit(2);
}

fs.writeFileSync(contentPath, source, "utf8");

console.log(
  "Promotions navigation item removed.",
);
console.log(
  "Promotions home section was preserved.",
);
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
    Write-Host "The navigation item was not found in siteContent.js." -ForegroundColor Yellow
    Write-Host "The backup remains available at:" -ForegroundColor Yellow
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
Write-Host " PATCH 03.3 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Removed from navigation:" -ForegroundColor Cyan
Write-Host "- Promotions"
Write-Host ""
Write-Host "Promotions section remains on the home page." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
