#requires -Version 5.1
# PATCH 04.0 - installs the approved appointment frontend.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$SourcePage = Join-Path $ScriptRoot "AppointmentPage.jsx"
$SourceCss = Join-Path $ScriptRoot "appointment.css"
$TargetPage = Join-Path $ProjectPath "src\pages\AppointmentPage.jsx"
$TargetCss = Join-Path $ProjectPath "src\styles\appointment.css"
$AppPath = Join-Path $ProjectPath "src\App.jsx"
$ToolsPath = Join-Path $ProjectPath "tools"
$RoutePatchPath = Join-Path $ToolsPath "patch-appointment-route.mjs"

if (-not (Test-Path $ProjectPath)) { throw "Project not found: $ProjectPath" }
if (-not (Test-Path $SourcePage)) { throw "AppointmentPage.jsx not found next to the script." }
if (-not (Test-Path $SourceCss)) { throw "appointment.css not found next to the script." }
if (-not (Test-Path $AppPath)) { throw "App.jsx not found: $AppPath" }

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 04.0 - APPOINTMENT FRONTEND" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$BackupPath = Join-Path $ProjectPath "backups\appointment-frontend-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
Copy-Item $AppPath (Join-Path $BackupPath "App.jsx") -Force
if (Test-Path $TargetPage) { Copy-Item $TargetPage (Join-Path $BackupPath "AppointmentPage.jsx") -Force }
if (Test-Path $TargetCss) { Copy-Item $TargetCss (Join-Path $BackupPath "appointment.css") -Force }

New-Item -ItemType Directory -Force -Path (Split-Path $TargetPage) | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $TargetCss) | Out-Null
Copy-Item $SourcePage $TargetPage -Force
Copy-Item $SourceCss $TargetCss -Force

New-Item -ItemType Directory -Force -Path $ToolsPath | Out-Null

$RoutePatch = @'
import fs from "node:fs";
import path from "node:path";

const appPath = String.raw`C:\projects\Laboratorio\client\src\App.jsx`;
let source = fs.readFileSync(appPath, "utf8");
let changed = false;

if (!source.includes("AppointmentPage")) {
  const matches = [...source.matchAll(/^import .*$/gm)];
  if (!matches.length) throw new Error("No imports found in App.jsx");
  const last = matches[matches.length - 1];
  const at = last.index + last[0].length;
  source = source.slice(0, at) + '\nimport AppointmentPage from "./pages/AppointmentPage";' + source.slice(at);
  changed = true;
}

if (!source.includes('path="/agendar"') && !source.includes("path='/agendar'")) {
  if (!source.includes("</Routes>")) throw new Error("Could not find </Routes> in App.jsx");
  source = source.replace(
    "</Routes>",
    '        <Route path="/agendar" element={<AppointmentPage />} />\n      </Routes>',
  );
  changed = true;
}

if (changed) fs.writeFileSync(appPath, source, "utf8");
console.log(changed ? "Appointment route added." : "Appointment route already exists.");
'@

[System.IO.File]::WriteAllText(
    $RoutePatchPath,
    $RoutePatch,
    (New-Object System.Text.UTF8Encoding($false))
)

& node $RoutePatchPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "ROUTE PATCH FAILED" -ForegroundColor Red
    Write-Host "Backup: $BackupPath" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Set-Location $ProjectPath
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Backup: $BackupPath" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "PATCH 04.0 COMPLETED" -ForegroundColor Green
Write-Host "Route: http://localhost:5173/agendar" -ForegroundColor Cyan
Write-Host "This version is frontend-only; it does not save to Supabase yet." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next: npm.cmd run dev" -ForegroundColor Cyan
