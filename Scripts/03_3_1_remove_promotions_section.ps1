#requires -Version 5.1
# PATCH 03.3.1
# Removes the Promotions section from Home and removes its navigation item.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$HomePagePath = Join-Path $ProjectPath "src\pages\HomePage.jsx"
$SiteHeaderPath = Join-Path $ProjectPath "src\components\layout\SiteHeader.jsx"
$SiteContentPath = Join-Path $ProjectPath "src\data\siteContent.js"
$ToolsPath = Join-Path $ProjectPath "tools"
$NodePatchPath = Join-Path $ToolsPath "remove-promotions-section.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 03.3.1 - REMOVE PROMOTIONS SECTION" -ForegroundColor Cyan
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

$BackupPath = Join-Path $ProjectPath "backups\remove-promotions-section-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $HomePagePath (Join-Path $BackupPath "HomePage.jsx") -Force

if (Test-Path $SiteHeaderPath) {
    Copy-Item $SiteHeaderPath (Join-Path $BackupPath "SiteHeader.jsx") -Force
}

if (Test-Path $SiteContentPath) {
    Copy-Item $SiteContentPath (Join-Path $BackupPath "siteContent.js") -Force
}

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

# ---------------------------------------------------------------------------
# 2. CREATE NODE PATCH
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

const siteHeaderPath = path.join(
  projectPath,
  "src",
  "components",
  "layout",
  "SiteHeader.jsx",
);

const siteContentPath = path.join(
  projectPath,
  "src",
  "data",
  "siteContent.js",
);

function updateFile(filePath, transform, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`${label}: file not found, skipped.`);
    return false;
  }

  const original = fs.readFileSync(filePath, "utf8");
  const updated = transform(original);

  if (updated === original) {
    console.log(`${label}: no matching content found.`);
    return false;
  }

  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`${label}: updated.`);
  return true;
}

let changed = false;

/*
 * HOME
 * -------------------------------------------------------------------------
 * Removes the import and JSX render of PromotionsSection.
 */
changed =
  updateFile(
    homePagePath,
    (source) => {
      let output = source;

      output = output.replace(
        /^import\s+PromotionsSection\s+from\s+["'][^"']*PromotionsSection[^"']*["'];?\s*\r?\n/gm,
        "",
      );

      output = output.replace(
        /\s*<PromotionsSection\s*\/>\s*/g,
        "\n",
      );

      output = output.replace(
        /\s*<PromotionsSection(?:\s+[^>]*)?>\s*<\/PromotionsSection>\s*/g,
        "\n",
      );

      return output;
    },
    "Home promotions section",
  ) || changed;

/*
 * HEADER
 * -------------------------------------------------------------------------
 * Removes hardcoded links pointing to #promotions.
 */
changed =
  updateFile(
    siteHeaderPath,
    (source) => {
      let output = source;

      output = output.replace(
        /\s*<a\b[^>]*href=["']#promotions["'][^>]*>[\s\S]*?<\/a>\s*/gi,
        "\n",
      );

      output = output.replace(
        /\s*<NavLink\b[^>]*to=["']#promotions["'][^>]*>[\s\S]*?<\/NavLink>\s*/gi,
        "\n",
      );

      output = output.replace(
        /\s*<Link\b[^>]*to=["']#promotions["'][^>]*>[\s\S]*?<\/Link>\s*/gi,
        "\n",
      );

      return output;
    },
    "Header promotions link",
  ) || changed;

/*
 * CONTENT DATA
 * -------------------------------------------------------------------------
 * Removes navigation objects whose href is #promotions.
 * It intentionally leaves the promotions data block in place; it is harmless
 * and can be reused later if promotions are enabled again.
 */
changed =
  updateFile(
    siteContentPath,
    (source) => {
      let output = source;

      output = output.replace(
        /\{\s*label:\s*["'][^"']*["']\s*,\s*href:\s*["']#promotions["']\s*,?\s*\}\s*,?/g,
        "",
      );

      output = output.replace(
        /\{\s*href:\s*["']#promotions["']\s*,\s*label:\s*["'][^"']*["']\s*,?\s*\}\s*,?/g,
        "",
      );

      output = output.replace(/,\s*,/g, ",");

      return output;
    },
    "Navigation data",
  ) || changed;

if (!changed) {
  console.log("");
  console.log("WARNING: no promotions references were changed.");
  console.log("The project may use a different component structure.");
  process.exit(2);
}

console.log("");
console.log("Promotions section removed from Home.");
console.log("Promotions navigation link removed where found.");
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
    Write-Host "No matching promotions section was found." -ForegroundColor Yellow
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
Write-Host " PATCH 03.3.1 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Removed:" -ForegroundColor Cyan
Write-Host "- Promotions section from Home"
Write-Host "- Promotions navigation link where found"
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
