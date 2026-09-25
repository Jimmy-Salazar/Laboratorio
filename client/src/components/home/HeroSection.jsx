import {
  FileText,
  CalendarDays,
  ShieldCheck,
  Clock3,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

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

export default function HeroSection() {
  const { content } = useLanguage();

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

            <Link
              className="button button--secondary"
              to="/agendar"
            >
              <CalendarDays size={17} aria-hidden="true" />
              {content.hero.secondaryAction}
            </Link>
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

