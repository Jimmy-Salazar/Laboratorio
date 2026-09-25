#requires -Version 5.1
# PATCH 03.1
# Converts the Specialties section into a single-row responsive carousel.
# Keeps English technical names in code and Spanish comments in the React file.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$SpecialtiesPath = Join-Path $ProjectPath "src\components\home\SpecialtiesSection.jsx"
$CssPath = Join-Path $ProjectPath "src\styles\home.css"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 03.1 - SPECIALTIES CAROUSEL" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ProjectPath)) {
    throw "Project not found: $ProjectPath"
}

if (-not (Test-Path $SpecialtiesPath)) {
    throw "SpecialtiesSection.jsx not found: $SpecialtiesPath"
}

if (-not (Test-Path $CssPath)) {
    throw "home.css not found: $CssPath"
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\specialties-carousel-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $SpecialtiesPath (Join-Path $BackupPath "SpecialtiesSection.jsx") -Force
Copy-Item $CssPath (Join-Path $BackupPath "home.css") -Force

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

# ---------------------------------------------------------------------------
# 2. REPLACE SPECIALTIES COMPONENT
# ---------------------------------------------------------------------------

$ComponentCode = @'
import { useRef } from "react";
import {
  UsersRound,
  Droplets,
  FlaskConical,
  Microscope,
  ShieldCheck,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";

/*
 * CARRUSEL DE ESPECIALIDADES
 * ---------------------------------------------------------------------------
 * Objetivo:
 * - mantener todas las especialidades en una sola fila;
 * - permitir desplazamiento horizontal;
 * - mostrar varias tarjetas en escritorio;
 * - reducir progresivamente la cantidad visible en tablet y movil;
 * - conservar el contenido bilingue desde siteContent.js.
 *
 * Los nombres tecnicos de variables y funciones permanecen en ingles.
 */

const iconMap = {
  droplets: Droplets,
  flask: FlaskConical,
  microscope: Microscope,
  shield: ShieldCheck,
  lungs: HeartPulse,
};

/*
 * Cantidad aproximada de tarjetas visibles por ancho de pantalla.
 * CSS controla el ancho real; esta funcion solo determina cuanto avanzar.
 */
function getVisibleCardCount() {
  const viewportWidth = window.innerWidth;

  if (viewportWidth <= 520) {
    return 1;
  }

  if (viewportWidth <= 820) {
    return 2;
  }

  if (viewportWidth <= 1100) {
    return 3;
  }

  return 4;
}

export default function SpecialtiesSection() {
  const { content } = useLanguage();
  const carouselRef = useRef(null);

  /*
   * Mueve el carrusel una "pagina" hacia la izquierda o derecha.
   */
  function scrollCarousel(direction) {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    const firstCard = carousel.querySelector(".specialty-card");

    if (!firstCard) {
      return;
    }

    const styles = window.getComputedStyle(carousel);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0");
    const visibleCardCount = getVisibleCardCount();

    const scrollDistance =
      (firstCard.getBoundingClientRect().width + gap) *
      visibleCardCount;

    const maxScrollLeft =
      carousel.scrollWidth - carousel.clientWidth;

    /*
     * Si llegamos al final, la flecha derecha vuelve al inicio.
     * Si estamos al inicio, la flecha izquierda lleva al final.
     */
    if (direction > 0) {
      const isAtEnd =
        carousel.scrollLeft >= maxScrollLeft - 8;

      carousel.scrollTo({
        left: isAtEnd
          ? 0
          : Math.min(
              carousel.scrollLeft + scrollDistance,
              maxScrollLeft,
            ),
        behavior: "smooth",
      });

      return;
    }

    const isAtStart = carousel.scrollLeft <= 8;

    carousel.scrollTo({
      left: isAtStart
        ? maxScrollLeft
        : Math.max(
            carousel.scrollLeft - scrollDistance,
            0,
          ),
      behavior: "smooth",
    });
  }

  return (
    <section
      id="specialties"
      className="content-section content-section--tinted"
    >
      <div className="page-container">

        <SectionHeader
          icon={UsersRound}
          title={content.specialties.title}
          subtitle={content.specialties.subtitle}
          actionLabel={content.specialties.viewAll}
          actionHref="#specialties"
        />

        <div className="specialties-carousel">
          <button
            type="button"
            className="specialties-carousel__arrow specialties-carousel__arrow--left"
            onClick={() => scrollCarousel(-1)}
            aria-label="Previous specialties"
          >
            <ChevronLeft size={22} />
          </button>

          <div
            ref={carouselRef}
            className="specialties-carousel__track"
            role="region"
            aria-label={content.specialties.title}
          >
            {content.specialties.items.map((specialty) => {
              const Icon =
                iconMap[specialty.icon] ??
                FlaskConical;

              return (
                <article
                  className="specialty-card"
                  key={specialty.id}
                >
                  <div className="specialty-card__icon">
                    <Icon
                      size={34}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="specialty-card__content">
                    <h3>
                      {specialty.title}
                    </h3>

                    <p>
                      {specialty.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className="specialties-carousel__arrow specialties-carousel__arrow--right"
            onClick={() => scrollCarousel(1)}
            aria-label="Next specialties"
          >
            <ChevronRight size={22} />
          </button>
        </div>

      </div>
    </section>
  );
}
'@

[System.IO.File]::WriteAllText(
    $SpecialtiesPath,
    $ComponentCode,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "SpecialtiesSection.jsx updated." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 3. APPEND OVERRIDE CSS
# ---------------------------------------------------------------------------

$CssContent = [System.IO.File]::ReadAllText(
    $CssPath,
    [System.Text.Encoding]::UTF8
)

$CssMarker = "PATCH 03.1 - SPECIALTIES SINGLE ROW CAROUSEL"

if (-not $CssContent.Contains($CssMarker)) {

    $CssPatch = @'

/* ==========================================================================
   PATCH 03.1 - SPECIALTIES SINGLE ROW CAROUSEL
   --------------------------------------------------------------------------
   Todas las especialidades permanecen en una sola fila horizontal.
   ========================================================================== */

.specialties-carousel {
  position: relative;
  width: 100%;
  margin-top: 4px;
}

/*
 * Track horizontal.
 * Se oculta la barra visual, pero sigue funcionando con mouse,
 * touchpad, gestos tactiles y las flechas laterales.
 */
.specialties-carousel__track {
  display: flex;
  flex-wrap: nowrap;
  gap: 12px;

  width: 100%;

  overflow-x: auto;
  overflow-y: hidden;

  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;

  padding: 3px 2px 8px;

  scrollbar-width: none;
  -ms-overflow-style: none;
}

.specialties-carousel__track::-webkit-scrollbar {
  display: none;
}

/*
 * Desktop: cuatro tarjetas visibles aproximadamente.
 */
.specialties-carousel__track .specialty-card {
  flex:
    0
    0
    calc((100% - 36px) / 4);

  min-width: 0;
  min-height: 94px;

  scroll-snap-align: start;
}

/*
 * Las tarjetas conservan un diseno compacto.
 */
.specialty-card__content {
  min-width: 0;
}

.specialty-card__content h3 {
  overflow-wrap: anywhere;
}

.specialty-card__content p {
  display: -webkit-box;
  overflow: hidden;

  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

/*
 * Flechas laterales.
 */
.specialties-carousel__arrow {
  position: absolute;
  z-index: 5;
  top: 50%;

  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  padding: 0;

  border: 1px solid #d6e5ef;
  border-radius: 50%;

  color: var(--color-primary-800);
  background: #ffffff;

  box-shadow:
    0 5px 16px
    rgba(12, 66, 104, 0.15);

  transform: translateY(-50%);
  cursor: pointer;
}

.specialties-carousel__arrow--left {
  left: -18px;
}

.specialties-carousel__arrow--right {
  right: -18px;
}

/* Laptop */
@media (max-width: 1100px) {

  .specialties-carousel__track .specialty-card {
    flex:
      0
      0
      calc((100% - 24px) / 3);
  }

  .specialties-carousel__arrow--left {
    left: 4px;
  }

  .specialties-carousel__arrow--right {
    right: 4px;
  }
}

/* Tablet */
@media (max-width: 820px) {

  .specialties-carousel__track .specialty-card {
    flex:
      0
      0
      calc((100% - 12px) / 2);
  }
}

/* Movil */
@media (max-width: 520px) {

  .specialties-carousel__track {
    gap: 10px;
    padding-inline: 2px;
  }

  .specialties-carousel__track .specialty-card {
    flex: 0 0 100%;
  }

  .specialties-carousel__arrow {
    width: 34px;
    height: 34px;
  }

  .specialties-carousel__arrow--left {
    left: 6px;
  }

  .specialties-carousel__arrow--right {
    right: 6px;
  }
}

'@

    [System.IO.File]::AppendAllText(
        $CssPath,
        $CssPatch,
        (New-Object System.Text.UTF8Encoding($false))
    )

    Write-Host "Carousel CSS added." -ForegroundColor Green
}
else {
    Write-Host "Carousel CSS already exists." -ForegroundColor Yellow
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
Write-Host " PATCH 03.1 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Desktop: 4 specialties visible" -ForegroundColor Cyan
Write-Host "Laptop:  3 specialties visible" -ForegroundColor Cyan
Write-Host "Tablet:  2 specialties visible" -ForegroundColor Cyan
Write-Host "Mobile:  1 specialty visible" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
