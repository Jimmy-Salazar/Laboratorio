import {
  MapPinned,
  MapPin,
  Phone,
  Clock3,
  ChevronRight,
} from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";

/*
 * SUCURSALES
 * ---------------------------------------------------------------------------
 * Los datos todavia son de presentacion.
 * En la fase administrativa, esta lista se cargara desde la base de datos.
 */

export default function BranchesSection() {
  const { content } = useLanguage();

  return (
    <section id="branches" className="content-section">
      <div className="page-container">
        <SectionHeader
          icon={MapPinned}
          title={content.branches.title}
          subtitle={content.branches.subtitle}

        />

        <div className="branches-grid">
          {content.branches.items.map((branch) => (
            <article className="branch-card" key={branch.id}>
              <img
                className="branch-card__image"
                src={branch.image}
                alt={branch.name}
              />

              <div className="branch-card__body">
                <div className="branch-card__title-row">
                  <h3>{branch.name}</h3>
                  <MapPin size={18} aria-hidden="true" />
                </div>

                <p>
                  <MapPin size={14} aria-hidden="true" />
                  {branch.address}
                </p>

                <p>
                  <Phone size={14} aria-hidden="true" />
                  {branch.phone}
                </p>

                <p>
                  <Clock3 size={14} aria-hidden="true" />
                  {branch.hours}
                </p>
              </div>

              <button
                type="button"
                className="branch-card__action"
                aria-label={branch.name}
              >
                <ChevronRight size={18} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

