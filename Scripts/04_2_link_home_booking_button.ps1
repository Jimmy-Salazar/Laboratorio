#requires -Version 5.1
# PATCH 04.2
# Links the Home "Agendar un estudio" button to /agendar.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$HeroPath = Join-Path $ProjectPath "src\components\home\HeroSection.jsx"
$ToolsPath = Join-Path $ProjectPath "tools"
$NodePatchPath = Join-Path $ToolsPath "link-home-booking-button.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 04.2 - LINK HOME BOOKING BUTTON" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $HeroPath)) {
    throw "HeroSection.jsx not found: $HeroPath"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found."
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\home-booking-link-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $HeroPath (Join-Path $BackupPath "HeroSection.jsx") -Force

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

const heroPath = path.join(
  projectPath,
  "src",
  "components",
  "home",
  "HeroSection.jsx",
);

let source = fs.readFileSync(heroPath, "utf8");
const original = source;

/*
 * El boton secundario del Hero es "Agendar un estudio".
 * Antes apuntaba a #branches. Ahora debe abrir /agendar.
 *
 * Link ya esta importado en HeroSection porque tambien se usa
 * para el boton de resultados.
 */

const exactOldBlock = `<a className="button button--secondary" href="#branches">
              <CalendarDays size={17} aria-hidden="true" />
              {content.hero.secondaryAction}
            </a>`;

const exactNewBlock = `<Link
              className="button button--secondary"
              to="/agendar"
            >
              <CalendarDays size={17} aria-hidden="true" />
              {content.hero.secondaryAction}
            </Link>`;

if (source.includes(exactOldBlock)) {
  source = source.replace(
    exactOldBlock,
    exactNewBlock,
  );
} else {
  /*
   * Fallback por si el formato del archivo cambio ligeramente.
   * Solo modifica el boton que contiene content.hero.secondaryAction.
   */
  const flexiblePattern =
    /<a\b([^>]*className=["'][^"']*button--secondary[^"']*["'][^>]*)href=["'][^"']*["']([^>]*)>\s*<CalendarDays([^>]*)\/>\s*\{content\.hero\.secondaryAction\}\s*<\/a>/m;

  if (flexiblePattern.test(source)) {
    source = source.replace(
      flexiblePattern,
      `<Link
              className="button button--secondary"
              to="/agendar"
            >
              <CalendarDays size={17} aria-hidden="true" />
              {content.hero.secondaryAction}
            </Link>`,
    );
  }
}

if (source === original) {
  /*
   * Si ya estaba enlazado, lo tratamos como correcto.
   */
  if (
    source.includes('to="/agendar"') &&
    source.includes("content.hero.secondaryAction")
  ) {
    console.log("Home booking button is already linked to /agendar.");
    process.exit(0);
  }

  console.log(
    "Could not locate the Home booking button in HeroSection.jsx.",
  );
  process.exit(2);
}

fs.writeFileSync(heroPath, source, "utf8");

console.log("Home booking button linked to /agendar.");
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
    Write-Host "Booking button was not found." -ForegroundColor Yellow
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
Write-Host " PATCH 04.2 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Home button:" -ForegroundColor Cyan
Write-Host "Agendar un estudio -> /agendar"
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
