#requires -Version 5.1
# PATCH 04.3B
# Shows the shared SiteFooter on /agendar while preserving the no-page-scroll
# desktop layout created by patch 04.3A.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$PagePath = Join-Path $ProjectPath "src\pages\AppointmentPage.jsx"
$CssPath = Join-Path $ProjectPath "src\styles\appointment.css"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 04.3B - SHOW APPOINTMENT FOOTER" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($RequiredPath in @($PagePath, $CssPath)) {
    if (-not (Test-Path $RequiredPath)) {
        throw "Required file not found: $RequiredPath"
    }
}

$PageContent = [System.IO.File]::ReadAllText(
    $PagePath,
    [System.Text.Encoding]::UTF8
)

if (-not $PageContent.Contains("<SiteFooter />")) {
    throw "AppointmentPage.jsx does not contain <SiteFooter />. Apply patch 04.1 first."
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\appointment-footer-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $CssPath (Join-Path $BackupPath "appointment.css") -Force

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

# ---------------------------------------------------------------------------
# 2. APPEND FOOTER OVERRIDES
# ---------------------------------------------------------------------------

$CssContent = [System.IO.File]::ReadAllText(
    $CssPath,
    [System.Text.Encoding]::UTF8
)

$Marker = "PATCH 04.3B - APPOINTMENT FOOTER VISIBLE"

if (-not $CssContent.Contains($Marker)) {

$Patch = @'

/* ==========================================================================
   PATCH 04.3B - APPOINTMENT FOOTER VISIBLE
   --------------------------------------------------------------------------
   Restores the shared SiteFooter on /agendar.
   On desktop it uses the same footer content with tighter spacing so the
   appointment screen can continue fitting inside the viewport.
   ========================================================================== */

@media (min-width: 941px) {

  /*
   * Patch 04.3A hid the footer to save vertical space.
   * This rule intentionally overrides it.
   */
  .appointment-page > footer,
  .appointment-page .site-footer {
    display: block !important;
    flex: 0 0 auto;
  }

  /*
   * Keep the same global footer, only compact its vertical footprint
   * inside the appointment page.
   */
  .appointment-page .site-footer__grid {
    gap: 24px;
    padding-top: 9px;
    padding-bottom: 7px;
  }

  .appointment-page .brand--footer svg {
    width: 27px;
    height: 27px;
  }

  .appointment-page .brand--footer .brand__text strong {
    font-size: 0.95rem;
  }

  .appointment-page .brand--footer .brand__text small {
    font-size: 0.52rem;
  }

  .appointment-page .site-footer h3 {
    margin-bottom: 5px;
    font-size: 0.68rem;
  }

  .appointment-page .footer-list {
    gap: 4px;
  }

  .appointment-page .footer-list li,
  .appointment-page .footer-links a {
    font-size: 0.58rem;
  }

  .appointment-page .footer-list svg {
    width: 13px;
    height: 13px;
  }

  .appointment-page .footer-links {
    gap: 4px 10px;
  }

  .appointment-page .social-links {
    gap: 6px;
  }

  .appointment-page .social-links a {
    width: 23px;
    height: 23px;
  }

  .appointment-page .social-links svg {
    width: 14px;
    height: 14px;
  }

  .appointment-page .footer-slogan {
    margin-top: 7px;
    font-size: 0.92rem;
  }

  .appointment-page .site-footer__bottom {
    min-height: 26px;
    font-size: 0.52rem;
  }

  /*
   * Recover enough vertical space for the footer without changing
   * the approved structure of the appointment screen.
   */
  .appointment-hero__inner {
    min-height: 102px;
  }

  .appointment-hero h1 {
    font-size: clamp(30px, 2.7vw, 42px);
  }

  .appointment-hero p {
    margin-top: 6px;
    font-size: 14px;
  }

  .appointment-progress {
    padding-top: 7px;
    padding-bottom: 8px;
  }

  .appointment-workspace {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .appointment-form-card {
    padding-top: 14px;
    padding-bottom: 14px;
  }

  .appointment-card-heading {
    margin-bottom: 10px;
  }

  .appointment-form-footer {
    margin-top: 10px;
  }
}

/*
 * Extra compression for shorter desktop screens.
 */
@media (min-width: 941px) and (max-height: 800px) {

  .appointment-page .site-footer__grid {
    padding-top: 6px;
    padding-bottom: 5px;
  }

  .appointment-page .footer-slogan {
    display: none;
  }

  .appointment-page .site-footer__bottom {
    min-height: 22px;
  }

  .appointment-hero__inner {
    min-height: 78px;
  }

  .appointment-hero h1 {
    font-size: 31px;
  }

  .appointment-hero p {
    margin-top: 3px;
    font-size: 12px;
  }

  .appointment-hero__tube {
    width: 62px;
    height: 62px;
  }

  .appointment-hero__tube svg {
    width: 38px;
    height: 38px;
  }

  .appointment-progress {
    padding-top: 4px;
    padding-bottom: 5px;
  }

  .appointment-progress__top {
    min-height: 32px;
  }

  .appointment-progress__number {
    width: 28px;
    height: 28px;
    flex-basis: 28px;
  }

  .appointment-progress__icon {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
  }

  .appointment-progress__line {
    left: 76px;
    top: 15px;
  }

  .appointment-progress__step strong {
    font-size: 12px;
  }

  .appointment-workspace {
    padding-top: 5px;
    padding-bottom: 5px;
  }

  .appointment-form-card {
    padding: 11px 16px;
  }

  .appointment-card-heading__icon {
    width: 44px;
    height: 44px;
    flex-basis: 44px;
  }

  .appointment-card-heading h2 {
    font-size: 20px;
  }

  .appointment-study-option {
    min-height: 54px;
  }
}

/*
 * Tablet/mobile continue using the normal full footer and natural page scroll.
 */
@media (max-width: 940px) {

  .appointment-page > footer,
  .appointment-page .site-footer {
    display: block !important;
  }
}

'@

    [System.IO.File]::AppendAllText(
        $CssPath,
        $Patch,
        (New-Object System.Text.UTF8Encoding($false))
    )

    Write-Host "Appointment footer enabled." -ForegroundColor Green
}
else {
    Write-Host "Footer patch already exists in appointment.css." -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# 3. BUILD VALIDATION
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
Write-Host " PATCH 04.3B COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "The shared footer is now visible on /agendar." -ForegroundColor Cyan
Write-Host "Desktop layout remains compact to avoid page scrolling." -ForegroundColor Cyan
Write-Host "Mobile/tablet keep normal scrolling." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
