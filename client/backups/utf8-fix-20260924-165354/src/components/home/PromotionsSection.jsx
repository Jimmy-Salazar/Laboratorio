import { Tag } from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";

/*
 * PROMOCIONES
 * ---------------------------------------------------------------------------
 * Las imagenes actuales son recortes de la maqueta visual aprobada.
 * En produccion, el administrador podra reemplazarlas por flyers reales.
 */

export default function PromotionsSection() {
  const { content } = useLanguage();

  return (
    <section id="promotions" className="content-section">
      <div className="page-container">
        <SectionHeader
          icon={Tag}
          title={content.promotions.title}
          subtitle={content.promotions.subtitle}
          actionLabel={content.promotions.viewAll}
          actionHref="#promotions"
        />

        <div className="promotions-grid">
          {content.promotions.items.map((promotion) => (
            <article className="promotion-card" key={promotion.id}>
              <img src={promotion.image} alt={promotion.title} loading="lazy" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

