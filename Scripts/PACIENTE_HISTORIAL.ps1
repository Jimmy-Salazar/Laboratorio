#requires -Version 5.1
$ErrorActionPreference = "Stop"

$ClientPath = "C:\projects\Laboratorio\client"
$PagePath = Join-Path $ClientPath "src\pages\ResultsPage.jsx"
$CssPath = Join-Path $ClientPath "src\styles\results.css"
$ToolsPath = Join-Path $ClientPath "tools"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupPath = Join-Path $ClientPath "backups\patient-name-history-$Timestamp"
$PatchPath = Join-Path $ToolsPath "patch-patient-name-history.mjs"

foreach ($p in @($PagePath,$CssPath,(Join-Path $ClientPath "package.json"))) {
    if (-not (Test-Path $p)) { throw "Required file not found: $p" }
}

New-Item -ItemType Directory -Force -Path $BackupPath,$ToolsPath | Out-Null
Copy-Item $PagePath (Join-Path $BackupPath "ResultsPage.jsx") -Force
Copy-Item $CssPath (Join-Path $BackupPath "results.css") -Force

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$Patch = @'
import fs from "node:fs";

const pagePath = String.raw`C:\projects\Laboratorio\client\src\pages\ResultsPage.jsx`;
const cssPath = String.raw`C:\projects\Laboratorio\client\src\styles\results.css`;

let s = fs.readFileSync(pagePath, "utf8");

s = s.replace(
  /\n\s*const processingCount = useMemo\([\s\S]*?\n\s*\);\n/,
  "\n",
);

if (!s.includes('const patientName = "Nombre del paciente";')) {
  const marker = '  const [portalOpen, setPortalOpen] =\n    useState(false);';
  if (!s.includes(marker)) throw new Error("portalOpen marker not found");
  s = s.replace(
    marker,
    `${marker}

  // Frontend placeholder. Supabase will provide the real name later.
  const patientName = "Nombre del paciente";`,
  );
}

const userCard = /<div className="patient-portal-user-card">[\s\S]*?<\/div>\s*<\/div>/m;
if (userCard.test(s)) {
  s = s.replace(
    userCard,
    `<div className="patient-portal-user-card">
              <span>
                <UserRound size={24} />
              </span>
              <div>
                <small>Paciente</small>
                <strong>{patientName}</strong>
                <span className="patient-portal-user-id">
                  C.I. {identification}
                </span>
              </div>
            </div>`,
  );
}

s = s.replace(
  /<article>\s*<span className="is-blue">\s*<FileText size=\{22\} \/>\s*<\/span>\s*<div>\s*<small>En proceso<\/small>\s*<strong>\s*\{processingCount\}\s*<\/strong>\s*<\/div>\s*<\/article>/m,
  `<article>
              <span className="is-blue">
                <CalendarDays size={22} />
              </span>
              <div>
                <small>Historial</small>
                <strong>{previewResults.length}</strong>
              </div>
            </article>`,
);

if (!s.includes("<small>Historial</small>")) {
  throw new Error("Historial card was not installed");
}

fs.writeFileSync(pagePath, s, "utf8");

let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes("/* PATIENT NAME + HISTORY */")) {
  css += `

/* PATIENT NAME + HISTORY */
.patient-portal-user-id {
  display: block;
  margin-top: 4px;
  color: #71879a;
  font-size: 0.84rem;
  font-weight: 750;
}
`;
}
fs.writeFileSync(cssPath, css, "utf8");
console.log("Patient name, cedula and Historial card updated.");
'@

[System.IO.File]::WriteAllText($PatchPath,$Patch,$Utf8NoBom)

& node $PatchPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "PATCH FAILED" -ForegroundColor Red
    Write-Host "Backup: $BackupPath"
    exit $LASTEXITCODE
}

Set-Location $ClientPath
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Backup: $BackupPath"
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "PATCH COMPLETED" -ForegroundColor Green
Write-Host "- Patient name shown"
Write-Host "- Full cedula shown"
Write-Host "- En proceso card replaced by Historial"
Write-Host "- Frontend only"
