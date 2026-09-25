import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";

/*
 * CARRUSEL PRINCIPAL
 * ---------------------------------------------------------------------------
 * Comportamiento:
 *
 * Desktop:
 * - muestra 2 publicaciones simultaneamente.
 *
 * Movil:
 * - CSS oculta la segunda publicacion y muestra solo una.
 *
 * Navegacion:
 * - avanza una posicion por vez.
 * - cuando llega al final, vuelve al comienzo.
 *
 * Las nuevas imagenes ya contienen su propio texto publicitario.
 * Por esa razon NO agregamos un titulo encima de la fotografia.
 */

const AUTO_PLAY_INTERVAL_MS = 5000;

export default function HomeCarousel() {
  const { content } = useLanguage();

  const slides = content.carousel.slides;

  /*
   * activeIndex representa la primera imagen visible.
   */
  const [activeIndex, setActiveIndex] = useState(0);

  /*
   * Calculamos las dos publicaciones que deben mostrarse.
   *
   * Ejemplo:
   * activeIndex = 0
   * visibleSlides = [0, 1]
   *
   * activeIndex = 4
   * visibleSlides = [4, 0]
   */
  const visibleSlides = useMemo(() => {
    if (!slides.length) {
      return [];
    }

    const firstIndex = activeIndex;
    const secondIndex =
      (activeIndex + 1) % slides.length;

    return [
      {
        ...slides[firstIndex],
        originalIndex: firstIndex,
      },
      {
        ...slides[secondIndex],
        originalIndex: secondIndex,
      },
    ];
  }, [activeIndex, slides]);

  /*
   * Reproduccion automatica.
   */
  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) =>
        (currentIndex + 1) % slides.length
      );
    }, AUTO_PLAY_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [slides.length]);

  /*
   * Mostrar publicacion anterior.
   */
  function showPreviousSlide() {
    setActiveIndex((currentIndex) =>
      currentIndex === 0
        ? slides.length - 1
        : currentIndex - 1
    );
  }

  /*
   * Mostrar siguiente publicacion.
   */
  function showNextSlide() {
    setActiveIndex((currentIndex) =>
      (currentIndex + 1) % slides.length
    );
  }

  return (
    <section
      className="carousel-section page-container"
      aria-label="Promotional carousel"
    >
      <div className="home-carousel">

        {/* Flecha izquierda */}
        <button
          type="button"
          className="carousel-arrow carousel-arrow--left"
          onClick={showPreviousSlide}
          aria-label="Previous promotion"
        >
          <ChevronLeft />
        </button>

        {/* Dos publicaciones visibles */}
        <div className="carousel-track">

          {visibleSlides.map((slide) => (
            <article
              className="carousel-card carousel-card--visible"
              key={`${slide.originalIndex}-${slide.image}`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                loading="eager"
              />
            </article>
          ))}

        </div>

        {/* Flecha derecha */}
        <button
          type="button"
          className="carousel-arrow carousel-arrow--right"
          onClick={showNextSlide}
          aria-label="Next promotion"
        >
          <ChevronRight />
        </button>

      </div>

      {/* Indicadores de posicion */}
      <div
        className="carousel-dots"
        aria-label="Carousel pagination"
      >
        {slides.map((slide, index) => (
          <button
            type="button"
            key={`${slide.title}-${index}`}
            className={
              index === activeIndex
                ? "is-active"
                : ""
            }
            onClick={() => setActiveIndex(index)}
            aria-label={`Slide ${index + 1}`}
            aria-pressed={index === activeIndex}
          />
        ))}
      </div>
    </section>
  );
}
