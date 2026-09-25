#requires -Version 5.1
# PATCH 04.1
# Reuses the global SiteHeader and SiteFooter on the appointment page.
# Also synchronizes the appointment language with the global LanguageContext.
# Navigation anchors are made route-safe so they work from /agendar.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$AppointmentPath = Join-Path $ProjectPath "src\pages\AppointmentPage.jsx"
$HeaderPath = Join-Path $ProjectPath "src\components\layout\SiteHeader.jsx"
$FooterPath = Join-Path $ProjectPath "src\components\layout\SiteFooter.jsx"
$ContextPath = Join-Path $ProjectPath "src\context\LanguageContext.jsx"

$ToolsPath = Join-Path $ProjectPath "tools"
$NodePatchPath = Join-Path $ToolsPath "patch-shared-public-header.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 04.1 - SHARED PUBLIC HEADER" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($RequiredPath in @(
    $AppointmentPath,
    $HeaderPath,
    $FooterPath,
    $ContextPath
)) {
    if (-not (Test-Path $RequiredPath)) {
        throw "Required file not found: $RequiredPath"
    }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found."
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\shared-header-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $AppointmentPath (Join-Path $BackupPath "AppointmentPage.jsx") -Force
Copy-Item $HeaderPath (Join-Path $BackupPath "SiteHeader.jsx") -Force

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

const appointmentPath = path.join(
  projectPath,
  "src",
  "pages",
  "AppointmentPage.jsx",
);

const headerPath = path.join(
  projectPath,
  "src",
  "components",
  "layout",
  "SiteHeader.jsx",
);

function ensureImport(source, statement) {
  if (source.includes(statement)) {
    return source;
  }

  const matches = [...source.matchAll(/^import .*$/gm)];

  if (matches.length === 0) {
    throw new Error("No import statements found.");
  }

  const lastImport = matches[matches.length - 1];
  const insertAt = lastImport.index + lastImport[0].length;

  return (
    source.slice(0, insertAt) +
    "\n" +
    statement +
    source.slice(insertAt)
  );
}

/*
 * --------------------------------------------------------------------------
 * APPOINTMENT PAGE
 * --------------------------------------------------------------------------
 */

let appointment = fs.readFileSync(appointmentPath, "utf8");

/*
 * El header de esta pagina ya no debe mantener su propio idioma.
 * El idioma se toma del contexto global usado tambien por SiteHeader.
 */
appointment = ensureImport(
  appointment,
  'import SiteHeader from "../components/layout/SiteHeader";',
);

appointment = ensureImport(
  appointment,
  'import SiteFooter from "../components/layout/SiteFooter";',
);

appointment = ensureImport(
  appointment,
  'import { useLanguage } from "../context/LanguageContext";',
);

/*
 * El Link solo era necesario para el header local.
 */
appointment = appointment.replace(
  /^import\s+\{\s*Link\s*\}\s+from\s+["']react-router-dom["'];?\s*\r?\n/m,
  "",
);

/*
 * MessageCircle solo era utilizado por el header local.
 * Se elimina de la lista de iconos si esta presente.
 */
appointment = appointment.replace(
  /^(\s*)MessageCircle,\s*\r?\n/m,
  "",
);

/*
 * Elimina el logo/header local de AppointmentPage.
 */
appointment = appointment.replace(
  /\nfunction AppointmentLogo\(\)\s*\{[\s\S]*?\n\}\n\nexport default function AppointmentPage\(\)/,
  "\nexport default function AppointmentPage()",
);

/*
 * Sustituye el estado de idioma local por el contexto global.
 */
appointment = appointment.replace(
  /const\s+\[language,\s*setLanguage\]\s*=\s*useState\(["']es["']\);/,
  "const { language } = useLanguage();",
);

/*
 * Sustituye el header particular por el SiteHeader oficial del proyecto.
 */
const localHeaderPattern =
  /\s*<header\s+className=["']appointment-header["']>[\s\S]*?<\/header>\s*/;

if (localHeaderPattern.test(appointment)) {
  appointment = appointment.replace(
    localHeaderPattern,
    "\n      <SiteHeader />\n\n",
  );
} else if (!appointment.includes("<SiteHeader />")) {
  throw new Error(
    "Appointment local header was not found and SiteHeader is not present.",
  );
}

/*
 * Agrega el mismo footer publico utilizado por el Home.
 */
if (!appointment.includes("<SiteFooter />")) {
  const mainClosingPattern =
    /(\s*<\/main>)(\s*<\/div>\s*\);\s*\})\s*$/;

  if (!mainClosingPattern.test(appointment)) {
    throw new Error(
      "Could not find the final </main> block in AppointmentPage.jsx.",
    );
  }

  appointment = appointment.replace(
    mainClosingPattern,
    "$1\n\n      <SiteFooter />$2\n",
  );
}

fs.writeFileSync(appointmentPath, appointment, "utf8");

console.log("AppointmentPage now uses global SiteHeader.");
console.log("AppointmentPage now uses global language context.");
console.log("AppointmentPage now uses global SiteFooter.");

/*
 * --------------------------------------------------------------------------
 * SITE HEADER
 * --------------------------------------------------------------------------
 * Las anclas del Home deben funcionar tambien cuando el usuario esta en
 * /agendar u otra ruta publica.
 *
 * #specialties  -> /#specialties
 * #branches     -> /#branches
 * etc.
 *
 * Solo se transforman hrefs internos que aun comienzan directamente con #.
 */

let header = fs.readFileSync(headerPath, "utf8");

header = header.replace(
  /href:\s*["']#([A-Za-z0-9_-]+)["']/g,
  'href: "/#$1"',
);

header = header.replace(
  /href=["']#([A-Za-z0-9_-]+)["']/g,
  'href="/#$1"',
);

fs.writeFileSync(headerPath, header, "utf8");

console.log("SiteHeader Home anchors are now route-safe.");
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

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "PATCH FAILED" -ForegroundColor Red
    Write-Host "Backup available at:" -ForegroundColor Yellow
    Write-Host $BackupPath
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
Write-Host " PATCH 04.1 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Appointment page now uses:" -ForegroundColor Cyan
Write-Host "- The same SiteHeader as Home"
Write-Host "- The same ES/EN global language state"
Write-Host "- The same SiteFooter as Home"
Write-Host "- Route-safe Home navigation links"
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
