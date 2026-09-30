import { useEffect, useState } from "react";
import {
  MessageCircle,
  FileText,
  CalendarDays,
  ShieldCheck,
  Clock3,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";

/*
 * HERO PRINCIPAL
 * ---------------------------------------------------------------------------
 * Replica la jerarquia del diseno aprobado:
 * - mensaje principal a la izquierda,
 * - laboratorio a la derecha,
 * - accesos rapidos,
 * - tres argumentos de confianza.
 */

const trustIcons = [ShieldCheck, Clock3, UsersRound];

function normalizeWhatsappNumber(
  value,
) {

  let digits =
    String(
      value ?? "",
    )
      .replace(
        /\D/g,
        "",
      );

  /*
   * Ecuador:
   *
   * 0991234567
   * ->
   * 593991234567
   */
  if (
    /^09\d{8}$/.test(
      digits,
    )
  ) {

    digits =
      "593" +
      digits.slice(1);

  }

  /*
   * Si escribieron:
   * 009593...
   */
  if (
    digits.startsWith(
      "00",
    )
  ) {

    digits =
      digits.slice(2);

  }

  return digits;
}


function buildQuoteWhatsappUrl(
  value,
) {

  const digits =
    normalizeWhatsappNumber(
      value,
    );

  if (!digits) {
    return "";
  }

  const message =
    "Hola, quisiera cotizar estudios de laboratorio.";

  return (
    `https://wa.me/${digits}?text=` +
    encodeURIComponent(
      message,
    )
  );
}

export default function HeroSection() {
  const { content } = useLanguage();

  const [
    quoteWhatsappUrl,
    setQuoteWhatsappUrl,
  ] =
    useState("");

  useEffect(() => {

    let mounted =
      true;

    async function loadWhatsapp() {

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "site_contact_settings",
          )
          .select(
            "whatsapp, whatsapp_enabled",
          )
          .eq(
            "id",
            "main",
          )
          .maybeSingle();

      if (!mounted) {
        return;
      }

      if (error) {

        console.error(
          "Could not load quote WhatsApp:",
          error,
        );

        return;
      }

      if (
        data?.whatsapp_enabled &&
        String(
          data?.whatsapp ?? "",
        ).trim()
      ) {

        setQuoteWhatsappUrl(
          buildQuoteWhatsappUrl(
            data.whatsapp,
          ),
        );

      }
      else {

        setQuoteWhatsappUrl(
          "",
        );

      }
    }

    loadWhatsapp();

    return () => {
      mounted =
        false;
    };

  }, []);

  return (
    <section id="home" className="hero-section">
      <div className="page-container hero-section__grid">
        <div className="hero-copy">
          <p className="eyebrow">{content.hero.eyebrow}</p>

          <h1>
            {content.hero.titlePrefix}
            <span>{content.hero.brandName}</span>
          </h1>

          <p className="hero-copy__description">
            {content.hero.description}
          </p>

          <div className="hero-actions">
            <Link
              className="button button--primary"
              to="/resultados"
            >
              <FileText size={17} aria-hidden="true" />
              {content.hero.primaryAction}
              <span aria-hidden="true">›</span>
            </Link>

            {quoteWhatsappUrl ? (
              <a
                className="button button--secondary"
                href={quoteWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle
                  size={17}
                  aria-hidden="true"
                />

                {content.hero.quoteAction ??
                  "Cotizar"}
              </a>
            ) : null}
          </div>

          <div className="trust-grid">
            {content.hero.trustItems.map((item, index) => {
              const Icon = trustIcons[index];

              return (
                <div className="trust-item" key={item.title}>
                  <Icon size={27} aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hero-media">
          <img
            src="/images/hero-lab.png"
            alt=""
            className="hero-media__image"
          />

          <div className="hero-media__message">
            {content.hero.sideMessage}
          </div>
        </div>
      </div>
    </section>
  );
}

