#requires -Version 5.1
$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\projects\Laboratorio"
$ClientPath = Join-Path $ProjectRoot "client"
$PagePath = Join-Path $ClientPath "src\pages\ResultsPage.jsx"
$CssPath = Join-Path $ClientPath "src\styles\results.css"
$LogoPath = Join-Path $ClientPath "public\brand\dr-milton-chasi-logo.png"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

foreach ($RequiredPath in @($PagePath,$CssPath,$LogoPath)) {
    if (-not (Test-Path $RequiredPath)) {
        throw "Required file not found: $RequiredPath"
    }
}

$BackupPath = Join-Path $ClientPath "backups\patient-portal-logo-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
Copy-Item $PagePath (Join-Path $BackupPath "ResultsPage.jsx") -Force
Copy-Item $CssPath (Join-Path $BackupPath "results.css") -Force

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$page = [System.IO.File]::ReadAllText($PagePath)

$page = $page -replace "(?m)^\s*FlaskConical,\s*\r?\n", ""

$topbarPattern = '<div className="patient-portal-topbar__brand">[\s\S]*?</div>\s*</div>\s*\r?\n\s*<button'
$topbarReplacement = @'
<div className="patient-portal-topbar__brand patient-portal-topbar__brand--logo">
            <img
              className="patient-portal-brand-logo patient-portal-brand-logo--topbar"
              src="/brand/dr-milton-chasi-logo.png"
              alt="Laboratorio Clinico Dr. Milton Chasi"
            />
          </div>

          <button
'@

if ($page -match $topbarPattern) {
    $page = [regex]::Replace($page, $topbarPattern, $topbarReplacement, 1)
} elseif ($page -notmatch 'patient-portal-brand-logo--topbar') {
    throw "Could not find patient portal topbar brand block."
}

$loginPattern = '<div className="patient-login-brand">[\s\S]*?</div>\s*</div>\s*\r?\n\s*<div className="patient-login-heading">'
$loginReplacement = @'
<div className="patient-login-brand patient-login-brand--logo">
          <img
            className="patient-login-brand-logo"
            src="/brand/dr-milton-chasi-logo.png"
            alt="Laboratorio Clinico Dr. Milton Chasi"
          />
        </div>

        <div className="patient-login-heading">
'@

if ($page -match $loginPattern) {
    $page = [regex]::Replace($page, $loginPattern, $loginReplacement, 1)
} elseif ($page -notmatch 'patient-login-brand-logo') {
    throw "Could not find patient login brand block."
}

[System.IO.File]::WriteAllText($PagePath, $page, $Utf8NoBom)

$css = [System.IO.File]::ReadAllText($CssPath)

$marker = "/* OFFICIAL PATIENT PORTAL LOGO 06.36A.1 */"

if ($css -notmatch [regex]::Escape($marker)) {
$css += @'

/* OFFICIAL PATIENT PORTAL LOGO 06.36A.1 */

.patient-login-brand--logo {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 92px;
}

.patient-login-brand-logo {
  display: block;
  width: min(255px, 82%);
  max-height: 92px;
  object-fit: contain;
}

.patient-portal-topbar__brand--logo {
  display: flex;
  align-items: center;
}

.patient-portal-brand-logo {
  display: block;
  object-fit: contain;
}

.patient-portal-brand-logo--topbar {
  width: 205px;
  max-width: 48vw;
  max-height: 56px;
}

@media (max-width: 620px) {
  .patient-login-brand-logo {
    width: min(230px, 88%);
    max-height: 84px;
  }

  .patient-portal-brand-logo--topbar {
    width: 170px;
    max-width: 58vw;
    max-height: 48px;
  }
}
'@
}

[System.IO.File]::WriteAllText($CssPath, $css, $Utf8NoBom)

Set-Location $ClientPath
& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Backup: $BackupPath" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "PATCH COMPLETED" -ForegroundColor Green
Write-Host "Official logo installed in patient login and portal topbar." -ForegroundColor Cyan
Write-Host "Backup: $BackupPath"
