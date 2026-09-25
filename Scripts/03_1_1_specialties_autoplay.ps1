#requires -Version 5.1
# PATCH 03.1.1
# Makes the specialties carousel advance automatically and loop continuously.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$SpecialtiesPath = Join-Path $ProjectPath "src\components\home\SpecialtiesSection.jsx"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 03.1.1 - AUTO SPECIALTIES CAROUSEL" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $SpecialtiesPath)) {
    throw "SpecialtiesSection.jsx not found: $SpecialtiesPath"
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\specialties-auto-carousel-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $SpecialtiesPath (Join-Path $BackupPath "SpecialtiesSection.jsx") -Force

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

# ---------------------------------------------------------------------------
# 2. REPLACE COMPONENT
# ---------------------------------------------------------------------------

$ComponentCode = @'
import { useEffect, useRef, useState } from "react";
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
 * CARRUSEL AUTOMATICO DE ESPECIALIDADES
 * ---------------------------------------------------------------------------
 * - Una sola fila horizontal.
 * - Avance automatico cada 4 segundos.
 * - Bucle continuo: al llegar al final vuelve al inicio.
 * - Flechas manuales.
 * - Pausa al colocar el mouse encima o al enfocar el carrusel.
 * - Compatible con touch y desplazamiento horizontal.
 */

const iconMap = {
  droplets: Droplets,
  flask: FlaskConical,
  microscope: Microscope,
  shield: ShieldCheck,
  lungs: HeartPulse,
};

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
  const [isPaused, setIsPaused] = useState(false);

  function moveCarousel(direction) {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    const firstCard = carousel.querySelector(".specialty-card");

    if (!firstCard) {
      return;
    }

    const computedStyles = window.getComputedStyle(carousel);

    const gap =
      Number.parseFloat(
        computedStyles.columnGap ||
        computedStyles.gap ||
        "0",
      ) || 0;

    const visibleCardCount = getVisibleCardCount();

    const cardWidth =
      firstCard.getBoundingClientRect().width;

    const scrollDistance =
      (cardWidth + gap) * visibleCardCount;

    const maxScrollLeft =
      carousel.scrollWidth - carousel.clientWidth;

    if (direction > 0) {
      const isAtEnd =
        carousel.scrollLeft >= maxScrollLeft - 10;

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

    const isAtStart =
      carousel.scrollLeft <= 10;

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

  /*
   * AUTOPLAY
   * -------------------------------------------------------------------------
   * Cada 4 segundos avanza una pagina.
   * Si el usuario coloca el mouse encima o navega con teclado dentro del
   * carrusel, el autoplay se pausa temporalmente.
   */
  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      moveCarousel(1);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPaused]);

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
        />

        <div
          className="specialties-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          <button
            type="button"
            className="specialties-carousel__arrow specialties-carousel__arrow--left"
            onClick={() => moveCarousel(-1)}
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
            onClick={() => moveCarousel(1)}
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

Write-Host "Automatic carousel enabled." -ForegroundColor Green

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
Write-Host " PATCH 03.1.1 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Autoplay: every 4 seconds" -ForegroundColor Cyan
Write-Host "Loop: enabled" -ForegroundColor Cyan
Write-Host "Mouse hover pause: enabled" -ForegroundColor Cyan
Write-Host "Manual arrows: enabled" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
