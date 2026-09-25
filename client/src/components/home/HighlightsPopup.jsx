import {
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import "../../styles/highlights-popup.css";

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

export default function HighlightsPopup({
  open,
  onClose,
}) {
  const { language } =
    useLanguage();

  const [index, setIndex] =
    useState(0);

  const copy =
    language === "en"
      ? {
          title: "Highlights",
          close:
            "Close highlights",
          previous:
            "Previous highlight",
          next:
            "Next highlight",
        }
      : {
          title: "Destacados",
          close:
            "Cerrar destacados",
          previous:
            "Destacado anterior",
          next:
            "Destacado siguiente",
        };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event,
    ) {
      if (
        event.key === "Escape"
      ) {
        onClose();
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
  }, [
    open,
    onClose,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setIndex(
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
  }, [open]);

  if (
    !open ||
    typeof document ===
      "undefined"
  ) {
    return null;
  }

  const flyer =
    flyers[index];

  const title =
    language === "en"
      ? flyer.en
      : flyer.es;

  function move(
    direction,
  ) {
    setIndex(
      (current) =>
        (
          current +
          direction +
          flyers.length
        ) %
        flyers.length,
    );
  }

  return createPortal(
    <div
      className="highlights-popup"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="highlights-popup__dialog">
        <div className="highlights-popup__header">
          <div>
            <span>
              {copy.title}
            </span>

            <strong>
              {title}
            </strong>
          </div>

          <button
            type="button"
            className="highlights-popup__close"
            onClick={onClose}
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

        <div className="highlights-popup__stage">
          <button
            type="button"
            className="highlights-popup__arrow highlights-popup__arrow--left"
            onClick={() =>
              move(-1)
            }
            aria-label={
              copy.previous
            }
          >
            <ChevronLeft
              size={27}
              aria-hidden="true"
            />
          </button>

          <img
            key={flyer.id}
            src={flyer.image}
            alt={title}
          />

          <button
            type="button"
            className="highlights-popup__arrow highlights-popup__arrow--right"
            onClick={() =>
              move(1)
            }
            aria-label={
              copy.next
            }
          >
            <ChevronRight
              size={27}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="highlights-popup__dots">
          {flyers.map(
            (item, itemIndex) => (
              <button
                type="button"
                key={item.id}
                className={
                  itemIndex ===
                  index
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  setIndex(
                    itemIndex,
                  )
                }
                aria-label={
                  language ===
                  "en"
                    ? item.en
                    : item.es
                }
                aria-current={
                  itemIndex ===
                  index
                    ? "true"
                    : undefined
                }
              />
            ),
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}