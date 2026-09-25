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