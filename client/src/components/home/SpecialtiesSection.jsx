import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";

const fallbackStudy = {
  id: "study-placeholder",
  name_es: "Estudio por Definir",
  name_en: "Study to Be Defined",
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
  const { language } = useLanguage();

  const carouselRef = useRef(null);

  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadStudies() {
      setLoading(true);

      const { data, error } = await supabase
        .from("studies")
        .select(
          "id, name_es, name_en, sort_order",
        )
        .eq("active", true)
        .eq("booking_enabled", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("name_es", {
          ascending: true,
        });

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          "Could not load Home studies:",
          error,
        );

        setStudies([]);
        setLoading(false);
        return;
      }

      setStudies(data ?? []);
      setLoading(false);
    }

    loadStudies();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleStudies = useMemo(() => {
    if (loading) {
      return [];
    }

    if (studies.length === 0) {
      return [fallbackStudy];
    }

    return studies;
  }, [loading, studies]);

  const sectionCopy =
    language === "en"
      ? {
          title: "Studies",
          subtitle:
            "Explore our available laboratory studies",
          previous:
            "Previous studies",
          next:
            "Next studies",
          loading:
            "Loading studies...",
          fallback:
            "Study to Be Defined",
        }
      : {
          title: "Estudios",
          subtitle:
            "Conoce los estudios disponibles",
          previous:
            "Estudios anteriores",
          next:
            "Estudios siguientes",
          loading:
            "Cargando estudios...",
          fallback:
            "Estudio por Definir",
        };

  function getStudyName(study) {
    const requestedName =
      language === "en"
        ? study.name_en
        : study.name_es;

    const cleanName =
      String(requestedName ?? "").trim();

    return (
      cleanName ||
      sectionCopy.fallback
    );
  }

  function moveCarousel(direction) {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    const firstCard =
      carousel.querySelector(
        ".home-study-card",
      );

    if (!firstCard) {
      return;
    }

    const computedStyles =
      window.getComputedStyle(carousel);

    const gap =
      Number.parseFloat(
        computedStyles.columnGap ||
          computedStyles.gap ||
          "0",
      ) || 0;

    const visibleCardCount =
      getVisibleCardCount();

    const cardWidth =
      firstCard.getBoundingClientRect()
        .width;

    const scrollDistance =
      (cardWidth + gap) *
      visibleCardCount;

    const maxScrollLeft =
      carousel.scrollWidth -
      carousel.clientWidth;

    if (direction > 0) {
      const isAtEnd =
        carousel.scrollLeft >=
        maxScrollLeft - 10;

      carousel.scrollTo({
        left: isAtEnd
          ? 0
          : Math.min(
              carousel.scrollLeft +
                scrollDistance,
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
            carousel.scrollLeft -
              scrollDistance,
            0,
          ),
      behavior: "smooth",
    });
  }

  useEffect(() => {
    if (
      isPaused ||
      loading ||
      visibleStudies.length <= 1
    ) {
      return undefined;
    }

    const timer =
      window.setInterval(() => {
        moveCarousel(1);
      }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    isPaused,
    loading,
    visibleStudies.length,
  ]);

  const showNavigation =
    !loading &&
    visibleStudies.length > 1;

  return (
    <section
      id="specialties"
      className="content-section content-section--tinted"
    >
      <div className="page-container">
        <SectionHeader
          icon={FlaskConical}
          title={sectionCopy.title}
          subtitle={sectionCopy.subtitle}
        />

        {loading ? (
          <div
            className="home-studies-loading"
            role="status"
          >
            <FlaskConical
              size={21}
              aria-hidden="true"
            />

            <span>
              {sectionCopy.loading}
            </span>
          </div>
        ) : (
          <div
            className="specialties-carousel home-studies-carousel"
            onMouseEnter={() =>
              setIsPaused(true)
            }
            onMouseLeave={() =>
              setIsPaused(false)
            }
            onFocusCapture={() =>
              setIsPaused(true)
            }
            onBlurCapture={() =>
              setIsPaused(false)
            }
          >
            {showNavigation ? (
              <button
                type="button"
                className="specialties-carousel__arrow specialties-carousel__arrow--left"
                onClick={() =>
                  moveCarousel(-1)
                }
                aria-label={
                  sectionCopy.previous
                }
              >
                <ChevronLeft size={22} />
              </button>
            ) : null}

            <div
              ref={carouselRef}
              className="specialties-carousel__track"
              role="region"
              aria-label={
                sectionCopy.title
              }
            >
              {visibleStudies.map(
                (study) => (
                  <article
                    className="specialty-card home-study-card"
                    key={study.id}
                  >
                    <div className="specialty-card__icon home-study-card__icon">
                      <FlaskConical
                        size={31}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="specialty-card__content home-study-card__content">
                      <h3>
                        {getStudyName(
                          study,
                        )}
                      </h3>
                    </div>
                  </article>
                ),
              )}
            </div>

            {showNavigation ? (
              <button
                type="button"
                className="specialties-carousel__arrow specialties-carousel__arrow--right"
                onClick={() =>
                  moveCarousel(1)
                }
                aria-label={
                  sectionCopy.next
                }
              >
                <ChevronRight
                  size={22}
                />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}