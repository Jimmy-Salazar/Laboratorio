#requires -Version 5.1
# PATCH 03.5
# Swaps the Home page order of Specialties and Branches.
# Result: Specialties appears before Branches.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$HomePagePath = Join-Path $ProjectPath "src\pages\HomePage.jsx"
$ToolsPath = Join-Path $ProjectPath "tools"
$NodePatchPath = Join-Path $ToolsPath "swap-home-sections.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 03.5 - SWAP HOME SECTIONS" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $HomePagePath)) {
    throw "HomePage.jsx not found: $HomePagePath"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found."
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\swap-home-sections-$Timestamp"
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

const branchesTag = /<BranchesSection\s*\/>/;
const specialtiesTag = /<SpecialtiesSection\s*\/>/;

const branchesMatch = source.match(branchesTag);
const specialtiesMatch = source.match(specialtiesTag);

if (!branchesMatch || !specialtiesMatch) {
  console.log("BranchesSection or SpecialtiesSection was not found.");
  process.exit(2);
}

const branchesIndex = source.indexOf(branchesMatch[0]);
const specialtiesIndex = source.indexOf(specialtiesMatch[0]);

/*
 * Queremos este orden:
 *
 *   <SpecialtiesSection />
 *   <BranchesSection />
 *
 * Si ya esta asi, no hacemos cambios innecesarios.
 */
if (specialtiesIndex < branchesIndex) {
  console.log("Specialties already appears before Branches.");
  process.exit(0);
}

/*
 * Intercambia solamente las posiciones de ambos componentes.
 * Todo el contenido que exista entre ellos se conserva.
 */
const placeholderA = "__SPECIALTIES_SECTION_PLACEHOLDER__";
const placeholderB = "__BRANCHES_SECTION_PLACEHOLDER__";

source = source.replace(branchesTag, placeholderA);
source = source.replace(specialtiesTag, placeholderB);

source = source.replace(placeholderA, "<SpecialtiesSection />");
source = source.replace(placeholderB, "<BranchesSection />");

fs.writeFileSync(homePagePath, source, "utf8");

console.log("Home section order updated:");
console.log("1. Specialties");
console.log("2. Branches");
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
    Write-Host "Could not find both sections in HomePage.jsx." -ForegroundColor Yellow
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
Write-Host " PATCH 03.5 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "New Home order:" -ForegroundColor Cyan
Write-Host "1. Specialties"
Write-Host "2. Branches"
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
