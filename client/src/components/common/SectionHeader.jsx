/*
 * ENCABEZADO REUTILIZABLE DE SECCION
 * ---------------------------------------------------------------------------
 * Mantiene la misma jerarquia visual para Sucursales, Especialidades
 * y Promociones.
 */

export default function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  actionHref = "#",
}) {
  return (
    <div className="section-heading">
      <div className="section-heading__main">
        <div className="section-heading__title-row">
          {Icon ? <Icon size={24} aria-hidden="true" /> : null}
          <h2>{title}</h2>
        </div>

        <p>{subtitle}</p>
      </div>

      {actionLabel ? (
        <a className="section-heading__action" href={actionHref}>
          {actionLabel}
          <span aria-hidden="true">›</span>
        </a>
      ) : null}
    </div>
  );
}

