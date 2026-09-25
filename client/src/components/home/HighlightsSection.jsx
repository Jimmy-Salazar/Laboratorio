import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  X,
} from "lucide-react";

import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";

const ROTATION_MS = 4000;

const flyers = [
  {
    id: "services",
    image:
      "/destacados/destacado-01-servicios.png",
    es: "Servicios de laboratorio",
    en: "Laboratory services",
  },
  {
    id: "dengue",
    image:
      "/destacados/destacado-02-dengue.png",
    es: "Prueba de dengue",
    en: "Dengue testing",
  },
  {
    id: "payments",
    image:
      "/destacados/destacado-03-pagos.png",
    es: "Formas de pago",
    en: "Payment options",
  },
  {
    id: "occupational",
    image:
      "/destacados/destacado-04-ocupacional.png",
    es: "Salud ocupacional",
    en: "Occupational health",
  },
];

function getVisibleCount() {
  if (
    typeof window === "undefined"
  ) {
    return 3;
  }

  if (
    window.innerWidth <= 620
  ) {
    return 1;
  }

  if (
    window.innerWidth <= 980
  ) {
    return 2;
  }

  return 3;
}

export default function HighlightsSection() {
  const { language } =
    useLanguage();

  const [startIndex, setStartIndex] =
    useState(0);

  const [visibleCount, setVisibleCount] =
    useState(
      getVisibleCount,
    );

  const [isPaused, setIsPaused] =
    useState(false);

  const [selectedFlyer, setSelectedFlyer] =
    useState(null);

  const [floatingOpen, setFloatingOpen] =
    useState(false);

  const [floatingIndex, setFloatingIndex] =
    useState(0);

  const copy =
    language === "en"
      ? {
          title: "Highlights",
          subtitle:
            "Useful information, services and laboratory updates",
          view: "View flyer",
          close: "Close highlights",
          previous:
            "Previous highlight",
          next:
            "Next highlight",
        }
      : {
          title: "Destacados",
          subtitle:
            "Informaci\u00f3n, servicios y novedades del laboratorio",
          view: "Ver flyer",
          close: "Cerrar destacados",
          previous:
            "Destacado anterior",
          next:
            "Destacado siguiente",
        };

  useEffect(() => {
    function handleResize() {
      setVisibleCount(
        getVisibleCount(),
      );
    }

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  useEffect(() => {
    function openFloatingCarousel() {
      setFloatingIndex(
        startIndex,
      );

      setFloatingOpen(
        true,
      );
    }

    window.addEventListener(
      "open-highlights-carousel",
      openFloatingCarousel,
    );

    return () => {
      window.removeEventListener(
        "open-highlights-carousel",
        openFloatingCarousel,
      );
    };
  }, [startIndex]);

  useEffect(() => {
    if (
      isPaused ||
      selectedFlyer ||
      floatingOpen
    ) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setStartIndex(
            (current) =>
              (current + 1) %
              flyers.length,
          );
        },
        ROTATION_MS,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    isPaused,
    selectedFlyer,
    floatingOpen,
  ]);

  useEffect(() => {
    if (!floatingOpen) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setFloatingIndex(
            (current) =>
              (current + 1) %
              flyers.length,
          );
        },
        ROTATION_MS,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [floatingOpen]);

  const overlayOpen =
    Boolean(
      selectedFlyer,
    ) ||
    floatingOpen;

  useEffect(() => {
    if (!overlayOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(event) {
      if (
        event.key === "Escape"
      ) {
        setSelectedFlyer(
          null,
        );

        setFloatingOpen(
          false,
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [overlayOpen]);

  const visibleFlyers =
    useMemo(() => {
      return Array.from(
        {
          length:
            Math.min(
              visibleCount,
              flyers.length,
            ),
        },
        (_, offset) =>
          flyers[
            (
              startIndex +
              offset
            ) %
              flyers.length
          ],
      );
    }, [
      startIndex,
      visibleCount,
    ]);

  const floatingFlyer =
    flyers[
      floatingIndex %
        flyers.length
    ];

  function flyerTitle(flyer) {
    return language === "en"
      ? flyer.en
      : flyer.es;
  }

  function moveCarousel(
    direction,
  ) {
    setStartIndex(
      (current) =>
        (
          current +
          direction +
          flyers.length
        ) %
        flyers.length,
    );
  }

  function moveFloating(
    direction,
  ) {
    setFloatingIndex(
      (current) =>
        (
          current +
          direction +
          flyers.length
        ) %
        flyers.length,
    );
  }

  return (
    <section
      id="highlights"
      className="content-section home-highlights-section"
    >
      <div className="page-container">
        <div className="home-highlights-heading-row">
          <SectionHeader
            icon={Sparkles}
            title={copy.title}
            subtitle={copy.subtitle}
          />

          <div className="home-highlights-controls">
            <button
              type="button"
              onClick={() =>
                moveCarousel(
                  -1,
                )
              }
              aria-label={
                copy.previous
              }
            >
              <ChevronLeft
                size={20}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() =>
                moveCarousel(
                  1,
                )
              }
              aria-label={
                copy.next
              }
            >
              <ChevronRight
                size={20}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div
          className="home-highlights-carousel"
          onMouseEnter={() =>
            setIsPaused(
              true,
            )
          }
          onMouseLeave={() =>
            setIsPaused(
              false,
            )
          }
          onFocusCapture={() =>
            setIsPaused(
              true,
            )
          }
          onBlurCapture={() =>
            setIsPaused(
              false,
            )
          }
        >
          <div
            key={`highlights-${startIndex}-${visibleCount}`}
            className="home-highlights-grid home-highlights-grid--carousel"
            data-smooth-slide="PATCH_06_31_SMOOTH_HOME_HIGHLIGHTS"
            style={{
              "--highlights-visible":
                Math.min(
                  visibleCount,
                  flyers.length,
                ),
            }}
          >
            {visibleFlyers.map(
              (flyer) => {
                const realIndex =
                  flyers.findIndex(
                    (item) =>
                      item.id ===
                      flyer.id,
                  );

                return (
                  <article
                    className="home-highlight-card"
                    key={
                      flyer.id
                    }
                  >
                    <button
                      type="button"
                      className="home-highlight-card__preview"
                      onClick={() =>
                        setSelectedFlyer(
                          flyer,
                        )
                      }
                      aria-label={`${copy.view}: ${flyerTitle(
                        flyer,
                      )}`}
                    >
                      <img
                        src={
                          flyer.image
                        }
                        alt={flyerTitle(
                          flyer,
                        )}
                        loading="lazy"
                      />

                      <span className="home-highlight-card__overlay">
                        <Maximize2
                          size={18}
                          aria-hidden="true"
                        />
                        {copy.view}
                      </span>
                    </button>

                    <div className="home-highlight-card__copy">
                      <span>
                        {String(
                          realIndex +
                            1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <strong>
                        {flyerTitle(
                          flyer,
                        )}
                      </strong>
                    </div>
                  </article>
                );
              },
            )}
          </div>

          <div className="home-highlights-dots">
            {flyers.map(
              (flyer, index) => (
                <button
                  type="button"
                  key={
                    flyer.id
                  }
                  className={
                    index ===
                    startIndex
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setStartIndex(
                      index,
                    )
                  }
                  aria-label={`${copy.view}: ${flyerTitle(
                    flyer,
                  )}`}
                  aria-current={
                    index ===
                    startIndex
                      ? "true"
                      : undefined
                  }
                />
              ),
            )}
          </div>
        </div>
      </div>

      {selectedFlyer ? (
        <div
          className="home-highlight-modal"
          role="dialog"
          aria-modal="true"
          aria-label={flyerTitle(
            selectedFlyer,
          )}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedFlyer(
                null,
              );
            }
          }}
        >
          <div className="home-highlight-modal__dialog">
            <button
              type="button"
              className="home-highlight-modal__close"
              onClick={() =>
                setSelectedFlyer(
                  null,
                )
              }
              aria-label={
                copy.close
              }
            >
              <X
                size={21}
                aria-hidden="true"
              />
            </button>

            <img
              src={
                selectedFlyer.image
              }
              alt={flyerTitle(
                selectedFlyer,
              )}
            />
          </div>
        </div>
      ) : null}

      {floatingOpen ? (
        <div
          className="home-highlights-floating"
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setFloatingOpen(
                false,
              );
            }
          }}
        >
          <div className="home-highlights-floating__dialog">
            <div className="home-highlights-floating__header">
              <div>
                <span>
                  {copy.title}
                </span>

                <strong>
                  {flyerTitle(
                    floatingFlyer,
                  )}
                </strong>
              </div>

              <button
                type="button"
                className="home-highlights-floating__close"
                onClick={() =>
                  setFloatingOpen(
                    false,
                  )
                }
                aria-label={
                  copy.close
                }
              >
                <X
                  size={22}
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="home-highlights-floating__stage">
              <button
                type="button"
                className="home-highlights-floating__arrow is-left"
                onClick={() =>
                  moveFloating(
                    -1,
                  )
                }
                aria-label={
                  copy.previous
                }
              >
                <ChevronLeft
                  size={26}
                  aria-hidden="true"
                />
              </button>

              <img
                key={
                  floatingFlyer.id
                }
                src={
                  floatingFlyer.image
                }
                alt={flyerTitle(
                  floatingFlyer,
                )}
              />

              <button
                type="button"
                className="home-highlights-floating__arrow is-right"
                onClick={() =>
                  moveFloating(
                    1,
                  )
                }
                aria-label={
                  copy.next
                }
              >
                <ChevronRight
                  size={26}
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="home-highlights-floating__dots">
              {flyers.map(
                (flyer, index) => (
                  <button
                    type="button"
                    key={
                      flyer.id
                    }
                    className={
                      index ===
                      floatingIndex
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      setFloatingIndex(
                        index,
                      )
                    }
                    aria-label={flyerTitle(
                      flyer,
                    )}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}