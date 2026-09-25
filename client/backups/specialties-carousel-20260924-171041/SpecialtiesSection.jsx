import {
  UsersRound,
  Droplets,
  FlaskConical,
  Microscope,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";

/*
 * ESPECIALIDADES
 * ---------------------------------------------------------------------------
 * El nombre del icono llega desde data/siteContent.js.
 * Aqui se traduce a un componente visual de Lucide.
 */

const iconMap = {
  droplets: Droplets,
  flask: FlaskConical,
  microscope: Microscope,
  shield: ShieldCheck,
  lungs: HeartPulse,
};

export default function SpecialtiesSection() {
  const { content } = useLanguage();

  return (
    <section id="specialties" className="content-section content-section--tinted">
      <div className="page-container">
        <SectionHeader
          icon={UsersRound}
          title={content.specialties.title}
          subtitle={content.specialties.subtitle}
          actionLabel={content.specialties.viewAll}
          actionHref="#specialties"
        />

        <div className="specialties-grid">
          {content.specialties.items.map((specialty) => {
            const Icon = iconMap[specialty.icon] ?? FlaskConical;

            return (
              <article className="specialty-card" key={specialty.id}>
                <div className="specialty-card__icon">
                  <Icon size={34} strokeWidth={1.8} aria-hidden="true" />
                </div>

                <div>
                  <h3>{specialty.title}</h3>
                  <p>{specialty.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

