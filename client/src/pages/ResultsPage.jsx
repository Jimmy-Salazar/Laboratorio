import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileText,
  FlaskConical,
  Info,
  KeyRound,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { useLanguage } from "../context/LanguageContext";
import "../styles/results.css";

/*
 * PATIENT RESULTS PAGE
 * ---------------------------------------------------------------------------
 * Public access model:
 * - Identification number
 * - Order number
 *
 * IMPORTANT:
 * This version is frontend-only.
 * It does not query Supabase and does not expose real patient data.
 */

const translations = {
  es: {
    heroTitle: "Ver resultados",
    heroText:
      "Consulta tus resultados de laboratorio de forma segura usando tu c\u00e9dula y n\u00famero de orden.",
    accessTitle: "Acceso a resultados",
    accessText:
      "Ingresa los datos entregados por el laboratorio.",
    identification: "N\u00famero de c\u00e9dula",
    identificationPlaceholder: "Ej. 0912345678",
    order: "N\u00famero de orden",
    orderPlaceholder: "Ej. LAB-2026-K8P4X2",
    submit: "Consultar resultados",
    securityTitle: "Acceso seguro",
    securityText:
      "El n\u00famero de orden debe pertenecer a la misma c\u00e9dula ingresada.",
    orderHelpTitle: "\u00bfD\u00f3nde encuentro mi n\u00famero de orden?",
    orderHelpText:
      "Lo encontrar\u00e1s en el comprobante entregado por el laboratorio. Tambi\u00e9n podremos enviarlo por WhatsApp cuando conectemos el sistema.",
    required:
      "Ingresa tu c\u00e9dula y n\u00famero de orden para continuar.",
    demo:
      "Vista de demostraci\u00f3n: esta pantalla todav\u00eda no consulta datos reales de Supabase.",
    resultsTitle: "Mis resultados",
    resultsIntro:
      "Aqu\u00ed aparecer\u00e1n todos los resultados liberados vinculados al paciente.",
    patient: "Paciente",
    identificationShort: "C.I.",
    accessOrder: "Orden usada para acceder",
    available: "Disponible",
    processing: "En proceso",
    releasedResults: "Resultados disponibles",
    history: "Historial de resultados",
    view: "Ver resultado",
    download: "Descargar PDF",
    pendingMessage: "Resultado todav\u00eda no disponible.",
    logout: "Cerrar consulta",
    status: "Estado",
    orderLabel: "Orden",
    date: "Fecha",
    study: "Estudio",
    demoAction:
      "Los botones de PDF se habilitar\u00e1n cuando conectemos Supabase Storage.",
  },

  en: {
    heroTitle: "View results",
    heroText:
      "Access your laboratory results securely using your identification number and order number.",
    accessTitle: "Results access",
    accessText:
      "Enter the information provided by the laboratory.",
    identification: "Identification number",
    identificationPlaceholder: "Example: 0912345678",
    order: "Order number",
    orderPlaceholder: "Example: LAB-2026-K8P4X2",
    submit: "View results",
    securityTitle: "Secure access",
    securityText:
      "The order number must belong to the same identification number entered.",
    orderHelpTitle: "Where can I find my order number?",
    orderHelpText:
      "You will find it on the receipt provided by the laboratory. We can also send it through WhatsApp once the system is connected.",
    required:
      "Enter your identification number and order number to continue.",
    demo:
      "Demo view: this screen is not yet querying real Supabase data.",
    resultsTitle: "My results",
    resultsIntro:
      "All released results linked to the patient will appear here.",
    patient: "Patient",
    identificationShort: "ID",
    accessOrder: "Order used for access",
    available: "Available",
    processing: "Processing",
    releasedResults: "Available results",
    history: "Results history",
    view: "View result",
    download: "Download PDF",
    pendingMessage: "Result is not available yet.",
    logout: "Close results",
    status: "Status",
    orderLabel: "Order",
    date: "Date",
    study: "Study",
    demoAction:
      "PDF buttons will be enabled when Supabase Storage is connected.",
  },
};

const demoOrders = [
  {
    id: "order-1",
    orderNumber: "LAB-2026-K8P4X2",
    date: "2026-09-24",
    studies: [
      {
        id: "result-1",
        nameEs: "Hemograma completo",
        nameEn: "Complete blood count",
        status: "released",
      },
      {
        id: "result-2",
        nameEs: "Perfil lip\u00eddico",
        nameEn: "Lipid profile",
        status: "released",
      },
    ],
  },
  {
    id: "order-2",
    orderNumber: "LAB-2026-M3T7Q9",
    date: "2026-08-03",
    studies: [
      {
        id: "result-3",
        nameEs: "Glucosa en ayunas",
        nameEn: "Fasting glucose",
        status: "released",
      },
    ],
  },
  {
    id: "order-3",
    orderNumber: "LAB-2026-R5N2W7",
    date: "2026-07-15",
    studies: [
      {
        id: "result-4",
        nameEs: "Perfil tiroideo",
        nameEn: "Thyroid profile",
        status: "processing",
      },
    ],
  },
];

function maskIdentification(value) {
  const cleaned = value.replace(/\s+/g, "");

  if (cleaned.length <= 4) {
    return cleaned || "----";
  }

  return `${"\u2022".repeat(Math.max(4, cleaned.length - 4))}${cleaned.slice(-4)}`;
}

function formatDate(value, language) {
  const parts = value.split("-").map(Number);

  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "es-EC",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(date);
}

export default function ResultsPage() {
  const { language } = useLanguage();
  const t = translations[language] ?? translations.es;

  const [identification, setIdentification] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [authenticatedDemo, setAuthenticatedDemo] = useState(false);

  const releasedCount = useMemo(
    () =>
      demoOrders.reduce(
        (total, order) =>
          total +
          order.studies.filter(
            (study) => study.status === "released",
          ).length,
        0,
      ),
    [],
  );

  const processingCount = useMemo(
    () =>
      demoOrders.reduce(
        (total, order) =>
          total +
          order.studies.filter(
            (study) => study.status === "processing",
          ).length,
        0,
      ),
    [],
  );

  function submitAccess(event) {
    event.preventDefault();

    const cleanIdentification = identification.trim();
    const cleanOrder = orderNumber.trim();

    if (!cleanIdentification || !cleanOrder) {
      setValidationMessage(t.required);
      return;
    }

    setValidationMessage("");
    setAuthenticatedDemo(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeResults() {
    setAuthenticatedDemo(false);
    setIdentification("");
    setOrderNumber("");
    setValidationMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="results-page">
      <SiteHeader />

      <main>
        <section className="results-hero">
          <div className="results-hero__inner">
            <div className="results-hero__copy">
              <span className="results-hero__eyebrow">
                <ShieldCheck size={18} />
                {t.securityTitle}
              </span>

              <h1>{t.heroTitle}</h1>
              <p>{t.heroText}</p>
            </div>

            <div
              className="results-hero__visual"
              aria-hidden="true"
            >
              <span className="results-hero__file">
                <FileText size={67} strokeWidth={1.45} />
              </span>

              <span className="results-hero__shield">
                <LockKeyhole size={28} />
              </span>
            </div>
          </div>
        </section>

        {!authenticatedDemo ? (
          <section className="results-access-section">
            <div className="results-access-layout">
              <form
                className="results-access-card"
                onSubmit={submitAccess}
              >
                <div className="results-card-heading">
                  <span className="results-card-heading__icon">
                    <Search size={30} />
                  </span>

                  <div>
                    <h2>{t.accessTitle}</h2>
                    <p>{t.accessText}</p>
                  </div>
                </div>

                <div className="results-access-fields">
                  <label>
                    <span>{t.identification}</span>

                    <div className="results-input-shell">
                      <UserRound size={20} />

                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={t.identificationPlaceholder}
                        value={identification}
                        onChange={(event) =>
                          setIdentification(event.target.value)
                        }
                      />
                    </div>
                  </label>

                  <label>
                    <span>{t.order}</span>

                    <div className="results-input-shell">
                      <KeyRound size={20} />

                      <input
                        type="text"
                        autoComplete="off"
                        placeholder={t.orderPlaceholder}
                        value={orderNumber}
                        onChange={(event) =>
                          setOrderNumber(
                            event.target.value.toUpperCase(),
                          )
                        }
                      />
                    </div>
                  </label>
                </div>

                {validationMessage ? (
                  <div
                    className="results-validation"
                    role="alert"
                  >
                    <Info size={18} />
                    <span>{validationMessage}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="results-primary-button"
                >
                  <Search size={19} />
                  <span>{t.submit}</span>
                </button>

                <p className="results-demo-note">
                  {t.demo}
                </p>
              </form>

              <aside className="results-security-card">
                <span className="results-security-card__icon">
                  <ShieldCheck size={35} />
                </span>

                <h2>{t.securityTitle}</h2>
                <p>{t.securityText}</p>

                <div className="results-security-divider" />

                <div className="results-order-help">
                  <strong>{t.orderHelpTitle}</strong>
                  <p>{t.orderHelpText}</p>
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <section className="results-history-section">
            <div className="results-history-inner">
              <div className="results-patient-header">
                <div>
                  <span className="results-patient-header__eyebrow">
                    <CheckCircle2 size={17} />
                    {t.resultsTitle}
                  </span>

                  <h2>{t.patient}</h2>

                  <p>{t.resultsIntro}</p>
                </div>

                <button
                  type="button"
                  className="results-secondary-button"
                  onClick={closeResults}
                >
                  <ArrowLeft size={18} />
                  <span>{t.logout}</span>
                </button>
              </div>

              <div className="results-patient-meta">
                <div>
                  <span>{t.identificationShort}</span>
                  <strong>
                    {maskIdentification(identification)}
                  </strong>
                </div>

                <div>
                  <span>{t.accessOrder}</span>
                  <strong>{orderNumber}</strong>
                </div>

                <div>
                  <span>{t.releasedResults}</span>
                  <strong>{releasedCount}</strong>
                </div>

                <div>
                  <span>{t.processing}</span>
                  <strong>{processingCount}</strong>
                </div>
              </div>

              <div className="results-demo-banner">
                <Info size={18} />
                <span>{t.demo}</span>
              </div>

              <div className="results-list-heading">
                <ClipboardCheck size={23} />
                <h3>{t.history}</h3>
              </div>

              <div className="results-orders">
                {demoOrders.map((order) => (
                  <article
                    className="results-order-card"
                    key={order.id}
                  >
                    <header className="results-order-card__header">
                      <div>
                        <span className="results-order-card__label">
                          {t.orderLabel}
                        </span>

                        <strong>{order.orderNumber}</strong>
                      </div>

                      <div className="results-order-card__date">
                        <CalendarDays size={17} />
                        <span>
                          {formatDate(order.date, language)}
                        </span>
                      </div>
                    </header>

                    <div className="results-study-list">
                      {order.studies.map((study) => {
                        const released =
                          study.status === "released";

                        return (
                          <div
                            className="results-study-row"
                            key={study.id}
                          >
                            <span className="results-study-row__icon">
                              <FlaskConical size={22} />
                            </span>

                            <div className="results-study-row__copy">
                              <small>{t.study}</small>

                              <strong>
                                {language === "en"
                                  ? study.nameEn
                                  : study.nameEs}
                              </strong>
                            </div>

                            <div className="results-study-row__status">
                              <span>{t.status}</span>

                              <strong
                                className={
                                  released
                                    ? "is-released"
                                    : "is-processing"
                                }
                              >
                                {released
                                  ? t.available
                                  : t.processing}
                              </strong>
                            </div>

                            <div className="results-study-row__actions">
                              {released ? (
                                <>
                                  <button
                                    type="button"
                                    disabled
                                    title={t.demoAction}
                                  >
                                    <Eye size={17} />
                                    <span>{t.view}</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled
                                    title={t.demoAction}
                                  >
                                    <Download size={17} />
                                    <span>{t.download}</span>
                                  </button>
                                </>
                              ) : (
                                <span className="results-processing-message">
                                  <Clock3 size={16} />
                                  {t.pendingMessage}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}