#requires -Version 5.1
# PATCH 04.3A
# Keeps the approved multi-step appointment page, but compresses it so
# each step fits in one desktop viewport without vertical page scrolling.
# Mobile/tablet keep normal scrolling for usability.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$CssPath = Join-Path $ProjectPath "src\styles\appointment.css"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 04.3A - FIT APPOINTMENT IN VIEWPORT" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $CssPath)) {
    throw "appointment.css not found: $CssPath"
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\appointment-fit-viewport-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $CssPath (Join-Path $BackupPath "appointment.css") -Force

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

# ---------------------------------------------------------------------------
# 2. APPEND DESKTOP VIEWPORT OVERRIDES
# ---------------------------------------------------------------------------

$CssContent = [System.IO.File]::ReadAllText(
    $CssPath,
    [System.Text.Encoding]::UTF8
)

$Marker = "PATCH 04.3A - APPOINTMENT DESKTOP NO PAGE SCROLL"

if (-not $CssContent.Contains($Marker)) {

$Patch = @'

/* ==========================================================================
   PATCH 04.3A - APPOINTMENT DESKTOP NO PAGE SCROLL
   --------------------------------------------------------------------------
   Mantiene el flujo aprobado por pasos.
   En escritorio ajusta alturas y espacios para que el paso actual completo
   se vea dentro de la ventana, sin tener que bajar con scroll.
   En tablet y movil se conserva el scroll normal por accesibilidad.
   ========================================================================== */

@media (min-width: 941px) {

  .appointment-page {
    height: 100vh;
    overflow: hidden;

    display: flex;
    flex-direction: column;
  }

  .appointment-page > main {
    flex: 1 1 auto;
    min-height: 0;

    display: flex;
    flex-direction: column;

    overflow: hidden;
  }

  /*
   * Hero mas compacto sin cambiar el diseno visual.
   */
  .appointment-hero {
    flex: 0 0 auto;
  }

  .appointment-hero__inner {
    min-height: 118px;
  }

  .appointment-hero h1 {
    font-size: clamp(32px, 3vw, 46px);
  }

  .appointment-hero p {
    max-width: 720px;
    margin-top: 9px;

    font-size: 15px;
    line-height: 1.35;
  }

  .appointment-hero__tube {
    width: 82px;
    height: 82px;
    border-radius: 23px;
  }

  .appointment-hero__tube svg {
    width: 48px;
    height: 48px;
  }

  /*
   * Barra de pasos compacta.
   */
  .appointment-progress-wrap {
    flex: 0 0 auto;
  }

  .appointment-progress {
    padding: 10px 0 11px;
    gap: 16px;
  }

  .appointment-progress__top {
    min-height: 38px;
  }

  .appointment-progress__number {
    width: 32px;
    height: 32px;
    flex-basis: 32px;

    font-size: 14px;
  }

  .appointment-progress__icon {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
  }

  .appointment-progress__icon svg {
    width: 19px;
    height: 19px;
  }

  .appointment-progress__line {
    left: 88px;
    top: 18px;
  }

  .appointment-progress__step strong,
  .appointment-progress__step small {
    margin-left: 43px;
  }

  .appointment-progress__step strong {
    margin-top: 0;
    font-size: 13px;
    line-height: 1.2;
  }

  .appointment-progress__step small {
    margin-top: 1px;
    font-size: 11px;
    line-height: 1.2;
  }

  /*
   * Area principal: usa solamente el alto disponible restante.
   */
  .appointment-workspace {
    flex: 1 1 auto;
    min-height: 0;

    padding: 12px 0 14px;

    overflow: hidden;
  }

  .appointment-workspace__inner {
    height: 100%;
    min-height: 0;

    align-items: stretch;
  }

  .appointment-form-card,
  .appointment-summary-card {
    height: 100%;
    min-height: 0;
  }

  .appointment-form-card {
    padding: 18px 22px;
    overflow: hidden;
  }

  .appointment-summary-card {
    overflow: hidden;
  }

  /*
   * Encabezado interno del formulario mas compacto.
   */
  .appointment-card-heading {
    gap: 14px;
    margin-bottom: 14px;
  }

  .appointment-card-heading__icon {
    width: 52px;
    height: 52px;
    flex-basis: 52px;
  }

  .appointment-card-heading__icon svg {
    width: 27px;
    height: 27px;
  }

  .appointment-card-heading h2 {
    margin: 1px 0 4px;
    font-size: 23px;
  }

  .appointment-card-heading p {
    font-size: 13px;
    line-height: 1.35;
  }

  /*
   * Selector y tarjetas de estudios.
   */
  .appointment-study-search {
    min-height: 44px;
    padding-inline: 14px;
  }

  .appointment-study-search select {
    min-height: 42px;
    font-size: 14px;
  }

  .appointment-study-grid {
    gap: 9px;
    margin-top: 10px;
  }

  .appointment-study-option {
    min-height: 68px;
    gap: 10px;
    padding: 10px 12px;

    font-size: 12px;
  }

  .appointment-study-option__icon {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }

  .appointment-study-option__icon svg {
    width: 23px;
    height: 23px;
  }

  /*
   * Campos de fecha, paciente y horarios.
   */
  .appointment-fields-grid {
    gap: 11px 14px;
  }

  .appointment-fields-grid label {
    gap: 4px;
  }

  .appointment-fields-grid label > span,
  .appointment-field-label {
    font-size: 12px;
  }

  .appointment-fields-grid input,
  .appointment-fields-grid select {
    min-height: 40px;
    padding-inline: 11px;
    font-size: 14px;
  }

  .appointment-fields-grid textarea {
    min-height: 68px;
    max-height: 82px;
    padding: 9px 11px;

    font-size: 14px;
  }

  .appointment-time-grid {
    gap: 7px;
    margin-top: 5px;
  }

  .appointment-time-grid button {
    min-height: 38px;
    font-size: 13px;
  }

  /*
   * Pie de acciones del formulario.
   */
  .appointment-form-footer {
    margin-top: 14px;
  }

  .appointment-primary-button,
  .appointment-secondary-button,
  .appointment-link-button {
    min-height: 42px;
    font-size: 13px;
  }

  .appointment-primary-button {
    min-width: 210px;
    padding-inline: 22px;
  }

  /*
   * Resumen lateral compacto.
   */
  .appointment-summary-card__title {
    padding: 17px 18px 13px;
  }

  .appointment-summary-card__title > span {
    width: 38px;
    height: 38px;
  }

  .appointment-summary-card__title h2 {
    font-size: 18px;
  }

  .appointment-summary-card__rows {
    margin-inline: 9px;
  }

  .appointment-summary-row {
    grid-template-columns: 28px minmax(0, 1fr);
    gap: 7px;

    padding: 10px 12px;
  }

  .appointment-summary-row svg {
    width: 18px;
    height: 18px;
  }

  .appointment-summary-row span {
    font-size: 11px;
  }

  .appointment-summary-row strong {
    font-size: 12px;
  }

  .appointment-status-pill {
    padding: 5px 8px;
    font-size: 10px !important;
  }

  .appointment-summary-note {
    gap: 8px;

    margin: 9px;
    padding: 11px;
  }

  .appointment-summary-note svg {
    width: 18px;
    height: 18px;
  }

  .appointment-summary-note strong {
    margin-bottom: 3px;
    font-size: 12px;
  }

  .appointment-summary-note p {
    font-size: 11px;
    line-height: 1.35;
  }

  /*
   * Para esta pagina no mostramos el footer en escritorio.
   * Asi el formulario completo permanece dentro del viewport.
   * La cabecera global se mantiene exactamente igual.
   */
  .appointment-page > footer,
  .appointment-page .site-footer {
    display: none !important;
  }
}

/*
 * En pantallas bajas reducimos aun mas el Hero para conservar espacio.
 */
@media (min-width: 941px) and (max-height: 760px) {

  .appointment-hero__inner {
    min-height: 92px;
  }

  .appointment-hero h1 {
    font-size: 34px;
  }

  .appointment-hero p {
    margin-top: 5px;
    font-size: 13px;
  }

  .appointment-hero__visual {
    opacity: 0.55;
  }

  .appointment-progress {
    padding: 6px 0 7px;
  }

  .appointment-progress__step small {
    display: none;
  }

  .appointment-workspace {
    padding: 8px 0 10px;
  }

  .appointment-form-card {
    padding: 14px 18px;
  }

  .appointment-card-heading {
    margin-bottom: 10px;
  }

  .appointment-study-option {
    min-height: 60px;
  }

  .appointment-summary-note {
    padding: 8px 10px;
  }
}

/*
 * Tablet y movil:
 * se permite scroll vertical normal porque es la opcion usable y segura.
 */
@media (max-width: 940px) {

  .appointment-page {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .appointment-page > main,
  .appointment-workspace {
    overflow: visible;
  }
}

'@

    [System.IO.File]::AppendAllText(
        $CssPath,
        $Patch,
        (New-Object System.Text.UTF8Encoding($false))
    )

    Write-Host "Desktop no-scroll CSS added." -ForegroundColor Green
}
else {
    Write-Host "Patch already exists in appointment.css." -ForegroundColor Yellow
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
Write-Host " PATCH 04.3A COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "The approved multi-step page was preserved." -ForegroundColor Cyan
Write-Host "Desktop: current appointment step fits in one viewport." -ForegroundColor Cyan
Write-Host "Mobile/tablet: normal scrolling remains enabled." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
