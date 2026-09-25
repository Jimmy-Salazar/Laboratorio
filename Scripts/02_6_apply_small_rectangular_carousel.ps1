#requires -Version 5.1
$ErrorActionPreference = "Stop"
$ProjectPath = "C:\projects\Laboratorio\client"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ImagesPath = Join-Path $ScriptRoot "carousel-images"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 02.6 - CARRUSEL RECTANGULAR PROFESIONAL" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$PublicImagesPath = Join-Path $ProjectPath "public\images"
$SiteContentPath = Join-Path $ProjectPath "src\data\siteContent.js"
$CssPath = Join-Path $ProjectPath "src\styles\home.css"

if (-not (Test-Path $ProjectPath)) { throw "No existe el proyecto en: $ProjectPath" }
if (-not (Test-Path $ImagesPath)) { throw "No existe la carpeta de imagenes: $ImagesPath" }

New-Item -ItemType Directory -Force -Path $PublicImagesPath | Out-Null
Copy-Item (Join-Path $ImagesPath "*") $PublicImagesPath -Force
Write-Host "Imagenes copiadas a public\images." -ForegroundColor Green

$SiteContent = Get-Content $SiteContentPath -Raw
$SiteContent = $SiteContent.Replace('/images/carousel-tests.png', '/images/carousel-study-certainty.png')
$SiteContent = $SiteContent.Replace('/images/carousel-technology.png', '/images/carousel-advanced-technology.png')
Set-Content -Path $SiteContentPath -Value $SiteContent -Encoding UTF8
Write-Host "Rutas del carrusel verificadas en siteContent.js." -ForegroundColor Green

$CssContent = Get-Content $CssPath -Raw
$Marker = "PATCH 02.6 - SMALL PROFESSIONAL CAROUSEL"
if (-not $CssContent.Contains($Marker)) {
$CssPatch = @'

/* ==========================================================================
   PATCH 02.6 - SMALL PROFESSIONAL CAROUSEL
   ========================================================================== */

.carousel-section {
  padding-top: 8px;
  padding-bottom: 8px;
}

.carousel-container {
  max-width: 1120px;
  margin: 0 auto;
}

.carousel-track {
  position: relative;
}

.carousel-card {
  position: relative;
  display: none;
  width: 100%;
  aspect-ratio: 3 / 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid #d7e7f2;
  background: #eef7fc;
  box-shadow: 0 8px 24px rgba(17, 88, 145, 0.08);
}

.carousel-card--active {
  display: block;
}

.carousel-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.carousel-indicators {
  margin-top: 10px;
}

.carousel-button {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(10, 67, 117, 0.16);
}

@media (max-width: 1024px) {
  .carousel-container { max-width: 100%; }
  .carousel-card { aspect-ratio: 16 / 7; }
}

@media (max-width: 720px) {
  .carousel-card { aspect-ratio: 16 / 9; border-radius: 12px; }
  .carousel-button { width: 38px; height: 38px; }
}

@media (max-width: 430px) {
  .carousel-card { aspect-ratio: 4 / 3; border-radius: 10px; }
  .carousel-button { width: 34px; height: 34px; }
}
'@
Add-Content -Path $CssPath -Value $CssPatch -Encoding UTF8
Write-Host "Parche visual del carrusel agregado a home.css." -ForegroundColor Green
} else {
Write-Host "El parche visual del carrusel ya estaba agregado." -ForegroundColor Yellow
}

Set-Location $ProjectPath
Write-Host ""
Write-Host "Ejecutando build..." -ForegroundColor Yellow
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
 Write-Host ""; Write-Host "BUILD FALLIDO" -ForegroundColor Red; exit $LASTEXITCODE
}
Write-Host ""; Write-Host "==============================================" -ForegroundColor Green
Write-Host " PATCH 02.6 APLICADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""; Write-Host "Luego ejecuta:" -ForegroundColor Cyan
Write-Host "cd $ProjectPath"
Write-Host "npm.cmd run dev"
