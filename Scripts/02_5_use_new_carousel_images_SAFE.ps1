#requires -Version 5.1
<#!
PATCH 02.5 (SEGURO)
Usa las 5 nuevas imagenes del carrusel, actualiza siteContent.js
con un archivo ya validado y agrega un refuerzo responsive.
#>

$ErrorActionPreference = "Stop"
$ProjectPath = "C:\projects\Laboratorio\client"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ImagesPath = Join-Path $ScriptRoot "carousel-images"
$SiteContentSource = Join-Path $ScriptRoot "siteContent.js"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 02.5 - USAR NUEVAS IMAGENES DEL CARRUSEL" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ProjectPath)) {
    throw "No existe el proyecto en: $ProjectPath"
}

if (-not (Test-Path $ImagesPath)) {
    throw "No existe la carpeta de imagenes: $ImagesPath"
}

if (-not (Test-Path $SiteContentSource)) {
    throw "No existe el archivo fuente siteContent.js en el paquete."
}

$PublicImagesPath = Join-Path $ProjectPath "public\images"
$TargetSiteContent = Join-Path $ProjectPath "src\data\siteContent.js"
$CssPath = Join-Path $ProjectPath "src\styles\home.css"

New-Item -ItemType Directory -Force -Path $PublicImagesPath | Out-Null

Copy-Item (Join-Path $ImagesPath "*") $PublicImagesPath -Force
Copy-Item $SiteContentSource $TargetSiteContent -Force

Write-Host "Imagenes copiadas a public\\images." -ForegroundColor Green
Write-Host "siteContent.js actualizado." -ForegroundColor Green

$CssContent = Get-Content $CssPath -Raw
$Marker = "PATCH 02.5 - RESPONSIVE CAROUSEL IMAGE FIT"

if (-not $CssContent.Contains($Marker)) {
    $CssPatch = @'

/* ==========================================================================
   PATCH 02.5 - RESPONSIVE CAROUSEL IMAGE FIT
   --------------------------------------------------------------------------
   Asegura mejor escalado del carrusel en desktop, tablet y movil.
   ========================================================================== */

.carousel-card {
  aspect-ratio: 3 / 1;
  height: auto;
  min-height: 150px;
}

.carousel-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

@media (max-width: 980px) {
  .carousel-card {
    aspect-ratio: 16 / 7;
    min-height: 0;
  }
}

@media (max-width: 720px) {
  .carousel-card {
    aspect-ratio: 16 / 9;
  }

  .carousel-card h2 {
    width: min(72%, 320px);
    right: 16px;
    font-size: clamp(0.95rem, 3.8vw, 1.25rem);
  }
}

@media (max-width: 430px) {
  .carousel-card {
    aspect-ratio: 4 / 3;
  }

  .carousel-card h2 {
    width: 68%;
    right: 12px;
    font-size: clamp(0.9rem, 4vw, 1.1rem);
  }
}
'@
    Add-Content -Path $CssPath -Value $CssPatch -Encoding UTF8
    Write-Host "Refuerzo responsive agregado a home.css." -ForegroundColor Green
} else {
    Write-Host "El refuerzo responsive ya estaba aplicado." -ForegroundColor Yellow
}

Set-Location $ProjectPath
Write-Host ""
Write-Host "Ejecutando build..." -ForegroundColor Yellow
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FALLIDO" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " PATCH 02.5 APLICADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Luego ejecuta:" -ForegroundColor Cyan
Write-Host "cd $ProjectPath"
Write-Host "npm.cmd run dev"
