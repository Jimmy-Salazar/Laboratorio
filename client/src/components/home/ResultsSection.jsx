import {
  MonitorDown,
  FileClock,
  FileDown,
  LockKeyhole,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";

/*
 * BLOQUE DE RESULTADOS
 * ---------------------------------------------------------------------------
 * Presenta las principales funciones disponibles para los pacientes:
 *
 * - resultados actuales,
 * - historial,
 * - descarga de archivos PDF,
 * - acceso seguro.
 *
 * El boton "Ingresar a mi portal" fue eliminado del Home.
 *
 * La autenticacion se implementara posteriormente en el modulo
 * correspondiente a Patients.
 */

const featureIcons = [
  FileClock,
  FileDown,
  LockKeyhole,
];

export default function ResultsSection() {
  const { content } = useLanguage();

  return (
    <section
      id="results"
      className="results-section"
    >
      <div className="page-container results-panel">

        {/* Informacion principal */}
        <div className="results-panel__intro">
          <MonitorDown
            size={44}
            aria-hidden="true"
          />

          <div>
            <h2>
              {content.results.title}
            </h2>

            <p>
              {content.results.description}
            </p>
          </div>
        </div>

        {/* Beneficios */}
        <div className="results-panel__features">

          {content.results.features.map(
            (feature, index) => {

              const Icon = featureIcons[index];

              return (
                <div
                  className="result-feature"
                  key={feature}
                >
                  <Icon
                    size={26}
                    aria-hidden="true"
                  />

                  <span>
                    {feature}
                  </span>
                </div>
              );
            },
          )}

        </div>
      </div>
    </section>
  );
}
