#requires -Version 5.1
# PATCH 05.0
# Creates the patient-facing Results page.
# Access model: identification number + order number.
# Frontend-only: real patient data and PDFs are NOT connected yet.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$PagePath = Join-Path $ProjectPath "src\pages\ResultsPage.jsx"
$CssPath = Join-Path $ProjectPath "src\styles\results.css"
$AppPath = Join-Path $ProjectPath "src\App.jsx"
$HeroPath = Join-Path $ProjectPath "src\components\home\HeroSection.jsx"
$HeaderPath = Join-Path $ProjectPath "src\components\layout\SiteHeader.jsx"
$FooterPath = Join-Path $ProjectPath "src\components\layout\SiteFooter.jsx"

$ToolsPath = Join-Path $ProjectPath "tools"
$NodePatchPath = Join-Path $ToolsPath "patch-results-route-links.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 05.0 - PATIENT RESULTS FRONTEND" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($RequiredPath in @(
    $AppPath,
    $HeroPath,
    $HeaderPath,
    $FooterPath
)) {
    if (-not (Test-Path $RequiredPath)) {
        throw "Required file not found: $RequiredPath"
    }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found."
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\results-frontend-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

foreach ($File in @(
    $AppPath,
    $HeroPath,
    $HeaderPath,
    $FooterPath
)) {
    Copy-Item $File (Join-Path $BackupPath (Split-Path $File -Leaf)) -Force
}

if (Test-Path $PagePath) {
    Copy-Item $PagePath (Join-Path $BackupPath "ResultsPage.jsx") -Force
}

if (Test-Path $CssPath) {
    Copy-Item $CssPath (Join-Path $BackupPath "results.css") -Force
}

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# ---------------------------------------------------------------------------
# 2. RESULTS PAGE
# ---------------------------------------------------------------------------

$PageCode = @'
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
'@

[System.IO.File]::WriteAllText(
    $PagePath,
    $PageCode,
    $Utf8NoBom
)

Write-Host "ResultsPage.jsx created." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 3. RESULTS CSS
# ---------------------------------------------------------------------------

$CssCode = @'
/* ==========================================================================
   DR. CHASI - PATIENT RESULTS
   ========================================================================== */

.results-page {
  min-height: 100vh;
  color: #12345b;
  background: #f6faff;
}

.results-page main {
  min-height: 540px;
}

/* --------------------------------------------------------------------------
   HERO
   -------------------------------------------------------------------------- */

.results-hero {
  overflow: hidden;

  background:
    linear-gradient(
      90deg,
      rgba(239, 248, 255, 0.99) 0%,
      rgba(226, 242, 255, 0.94) 48%,
      rgba(211, 233, 250, 0.83) 100%
    );
}

.results-hero__inner {
  position: relative;

  width: min(1320px, calc(100% - 48px));
  min-height: 190px;
  margin: 0 auto;

  display: flex;
  align-items: center;
}

.results-hero__copy {
  position: relative;
  z-index: 3;

  width: min(760px, 70%);
}

.results-hero__eyebrow,
.results-patient-header__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: #0c66cf;

  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.results-hero h1 {
  margin: 8px 0 0;

  color: #073b80;

  font-size: clamp(38px, 4vw, 58px);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.results-hero p {
  max-width: 760px;
  margin: 15px 0 0;

  color: #42658d;

  font-size: clamp(16px, 1.55vw, 20px);
  line-height: 1.46;
}

.results-hero__visual {
  position: absolute;
  inset: 0 0 0 auto;

  width: 34%;

  display: grid;
  place-items: center;

  color: #0b6bd9;
}

.results-hero__visual::before {
  content: "";

  position: absolute;

  width: 250px;
  height: 250px;

  border-radius: 50%;

  background:
    linear-gradient(
      160deg,
      rgba(22, 126, 226, 0.17),
      rgba(255, 255, 255, 0.25)
    );
}

.results-hero__file {
  position: relative;
  z-index: 2;

  width: 116px;
  height: 116px;

  display: grid;
  place-items: center;

  border: 1px solid rgba(9, 93, 183, 0.12);
  border-radius: 30px;

  background: rgba(255, 255, 255, 0.63);

  transform: rotate(-4deg);
}

.results-hero__shield {
  position: absolute;
  z-index: 3;

  right: 27%;
  bottom: 33px;

  width: 52px;
  height: 52px;

  display: grid;
  place-items: center;

  border: 4px solid #e2f1ff;
  border-radius: 50%;

  color: #ffffff;
  background: #0968d8;
}

/* --------------------------------------------------------------------------
   ACCESS
   -------------------------------------------------------------------------- */

.results-access-section,
.results-history-section {
  padding: 34px 0 52px;
}

.results-access-layout,
.results-history-inner {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto;
}

.results-access-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1.5fr)
    minmax(300px, 0.75fr);
  gap: 22px;
  align-items: stretch;
}

.results-access-card,
.results-security-card,
.results-order-card,
.results-patient-meta,
.results-success-card {
  border: 1px solid #dfe8f1;
  border-radius: 17px;

  background: #ffffff;

  box-shadow:
    0 8px 28px
    rgba(35, 78, 120, 0.07);
}

.results-access-card {
  padding: 30px;
}

.results-card-heading {
  display: flex;
  align-items: flex-start;
  gap: 17px;

  margin-bottom: 24px;
}

.results-card-heading__icon {
  width: 60px;
  height: 60px;

  flex: 0 0 60px;

  display: grid;
  place-items: center;

  border-radius: 50%;

  color: #0b69d7;
  background: #e9f4ff;
}

.results-card-heading h2 {
  margin: 2px 0 6px;

  color: #073b80;

  font-size: 27px;
  line-height: 1.18;
}

.results-card-heading p {
  margin: 0;

  color: #667e99;

  font-size: 14px;
}

.results-access-fields {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.results-access-fields label {
  display: grid;
  gap: 7px;
}

.results-access-fields label > span {
  color: #294f79;

  font-size: 13px;
  font-weight: 700;
}

.results-input-shell {
  min-height: 50px;

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 0 13px;

  border: 1px solid #c6d8e9;
  border-radius: 10px;

  color: #4f7092;
  background: #ffffff;

  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.results-input-shell:focus-within {
  border-color: #69a7ed;

  box-shadow:
    0 0 0 3px
    rgba(30, 113, 211, 0.1);
}

.results-input-shell input {
  width: 100%;
  min-width: 0;
  min-height: 48px;

  border: 0;
  outline: 0;

  color: #173d67;
  background: transparent;

  font: inherit;
  font-size: 16px;
}

.results-validation {
  display: flex;
  align-items: center;
  gap: 9px;

  margin-top: 14px;
  padding: 11px 13px;

  border: 1px solid #efd18c;
  border-radius: 10px;

  color: #75510d;
  background: #fff8e8;

  font-size: 13px;
  font-weight: 600;
}

.results-primary-button,
.results-secondary-button {
  min-height: 48px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  border-radius: 10px;

  font: inherit;
  font-weight: 700;

  cursor: pointer;
}

.results-primary-button {
  width: 100%;

  margin-top: 18px;

  border: 1px solid #0c63d5;

  color: #ffffff;
  background:
    linear-gradient(
      135deg,
      #0f66dc,
      #1475f0
    );

  box-shadow:
    0 10px 22px
    rgba(13, 100, 217, 0.17);
}

.results-secondary-button {
  padding: 0 17px;

  border: 1px solid #c9d9e8;

  color: #28537e;
  background: #ffffff;
}

.results-demo-note {
  margin: 12px 0 0;

  color: #8093a9;

  font-size: 11px;
  text-align: center;
}

.results-security-card {
  padding: 30px 27px;

  color: #264f77;

  background:
    linear-gradient(
      160deg,
      #f7fbff,
      #edf7ff
    );
}

.results-security-card__icon {
  width: 62px;
  height: 62px;

  display: grid;
  place-items: center;

  border-radius: 50%;

  color: #0c68d5;
  background: #ddecff;
}

.results-security-card h2 {
  margin: 18px 0 8px;

  color: #0a438d;

  font-size: 22px;
}

.results-security-card > p,
.results-order-help p {
  margin: 0;

  color: #5d7896;

  font-size: 13px;
  line-height: 1.55;
}

.results-security-divider {
  height: 1px;

  margin: 22px 0;

  background: #d5e6f5;
}

.results-order-help strong {
  display: block;

  margin-bottom: 7px;

  color: #1e5489;

  font-size: 13px;
}

/* --------------------------------------------------------------------------
   RESULTS HISTORY
   -------------------------------------------------------------------------- */

.results-patient-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;

  margin-bottom: 18px;
}

.results-patient-header h2 {
  margin: 6px 0 3px;

  color: #073b80;

  font-size: 30px;
}

.results-patient-header p {
  margin: 0;

  color: #637d9a;

  font-size: 14px;
}

.results-patient-meta {
  display: grid;
  grid-template-columns:
    1fr 1.5fr 1fr 1fr;

  margin-bottom: 15px;

  overflow: hidden;
}

.results-patient-meta > div {
  min-width: 0;

  display: grid;
  gap: 4px;

  padding: 16px 18px;

  border-right: 1px solid #e5edf5;
}

.results-patient-meta > div:last-child {
  border-right: 0;
}

.results-patient-meta span {
  color: #7088a2;

  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.results-patient-meta strong {
  overflow-wrap: anywhere;

  color: #173f6b;

  font-size: 15px;
}

.results-demo-banner {
  display: flex;
  align-items: center;
  gap: 9px;

  margin-bottom: 22px;
  padding: 10px 13px;

  border: 1px solid #cfe1f2;
  border-radius: 10px;

  color: #53718f;
  background: #f2f8fe;

  font-size: 12px;
}

.results-list-heading {
  display: flex;
  align-items: center;
  gap: 9px;

  margin-bottom: 12px;

  color: #0b5db7;
}

.results-list-heading h3 {
  margin: 0;

  color: #173f6b;

  font-size: 19px;
}

.results-orders {
  display: grid;
  gap: 14px;
}

.results-order-card {
  overflow: hidden;
}

.results-order-card__header {
  min-height: 64px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  padding: 12px 18px;

  border-bottom: 1px solid #e3edf6;

  background: #f8fbff;
}

.results-order-card__header > div:first-child {
  display: grid;
  gap: 2px;
}

.results-order-card__label {
  color: #7289a2;

  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.results-order-card__header strong {
  color: #0b4386;

  font-size: 15px;
}

.results-order-card__date {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: #557493;

  font-size: 12px;
  font-weight: 600;
}

.results-study-list {
  display: grid;
}

.results-study-row {
  min-width: 0;

  display: grid;
  grid-template-columns:
    42px
    minmax(170px, 1.2fr)
    minmax(120px, 0.55fr)
    minmax(270px, 1fr);
  gap: 12px;
  align-items: center;

  padding: 15px 18px;

  border-bottom: 1px solid #edf2f7;
}

.results-study-row:last-child {
  border-bottom: 0;
}

.results-study-row__icon {
  width: 40px;
  height: 40px;

  display: grid;
  place-items: center;

  border-radius: 50%;

  color: #0c67cf;
  background: #eaf4ff;
}

.results-study-row__copy,
.results-study-row__status {
  min-width: 0;

  display: grid;
  gap: 3px;
}

.results-study-row small,
.results-study-row__status > span {
  color: #7b90a7;

  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.results-study-row__copy strong {
  color: #173f69;

  font-size: 14px;
}

.results-study-row__status strong {
  width: max-content;

  padding: 5px 9px;

  border-radius: 999px;

  font-size: 11px;
}

.results-study-row__status strong.is-released {
  color: #11633d;
  background: #e5f7ed;
}

.results-study-row__status strong.is-processing {
  color: #8a5d07;
  background: #fff0c8;
}

.results-study-row__actions {
  min-width: 0;

  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.results-study-row__actions button {
  min-height: 38px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 0 11px;

  border: 1px solid #c8d9e9;
  border-radius: 8px;

  color: #4f6d89;
  background: #f8fbfe;

  font: inherit;
  font-size: 11px;
  font-weight: 700;
}

.results-study-row__actions button:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.results-processing-message {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;

  color: #7d6540;

  font-size: 11px;
}

/* --------------------------------------------------------------------------
   RESPONSIVE
   -------------------------------------------------------------------------- */

@media (max-width: 940px) {
  .results-hero__inner,
  .results-access-layout,
  .results-history-inner {
    width: min(100% - 28px, 900px);
  }

  .results-access-layout {
    grid-template-columns: 1fr;
  }

  .results-security-card {
    order: -1;
  }

  .results-patient-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .results-patient-meta > div:nth-child(2) {
    border-right: 0;
  }

  .results-patient-meta > div:nth-child(-n + 2) {
    border-bottom: 1px solid #e5edf5;
  }

  .results-study-row {
    grid-template-columns:
      42px
      minmax(0, 1fr)
      minmax(120px, 0.55fr);
  }

  .results-study-row__actions {
    grid-column: 2 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 650px) {
  .results-hero__inner {
    min-height: 170px;
  }

  .results-hero__copy {
    width: 100%;
  }

  .results-hero__visual {
    width: 48%;
    opacity: 0.17;
  }

  .results-access-section,
  .results-history-section {
    padding-top: 22px;
  }

  .results-access-card,
  .results-security-card {
    padding: 22px 18px;
  }

  .results-card-heading {
    gap: 12px;
  }

  .results-card-heading__icon {
    width: 50px;
    height: 50px;
    flex-basis: 50px;
  }

  .results-access-fields {
    grid-template-columns: 1fr;
  }

  .results-patient-header {
    align-items: stretch;
    flex-direction: column;
  }

  .results-secondary-button {
    width: 100%;
  }

  .results-patient-meta {
    grid-template-columns: 1fr;
  }

  .results-patient-meta > div {
    border-right: 0;
    border-bottom: 1px solid #e5edf5;
  }

  .results-patient-meta > div:last-child {
    border-bottom: 0;
  }

  .results-study-row {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .results-study-row__status,
  .results-study-row__actions {
    grid-column: 2;
  }

  .results-study-row__actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 430px) {
  .results-hero h1 {
    font-size: 35px;
  }

  .results-hero p {
    font-size: 15px;
  }

  .results-hero__inner,
  .results-access-layout,
  .results-history-inner {
    width: calc(100% - 20px);
  }

  .results-study-row__actions {
    display: grid;
  }

  .results-study-row__actions button {
    width: 100%;
  }
}
'@

[System.IO.File]::WriteAllText(
    $CssPath,
    $CssCode,
    $Utf8NoBom
)

Write-Host "results.css created." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 4. PATCH ROUTE AND EXISTING LINKS
# ---------------------------------------------------------------------------

New-Item -ItemType Directory -Force -Path $ToolsPath | Out-Null

$NodePatch = @'
import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;

const appPath = path.join(projectPath, "src", "App.jsx");
const heroPath = path.join(
  projectPath,
  "src",
  "components",
  "home",
  "HeroSection.jsx",
);
const headerPath = path.join(
  projectPath,
  "src",
  "components",
  "layout",
  "SiteHeader.jsx",
);
const footerPath = path.join(
  projectPath,
  "src",
  "components",
  "layout",
  "SiteFooter.jsx",
);

function ensureImport(source, statement) {
  if (source.includes(statement)) {
    return source;
  }

  const matches = [...source.matchAll(/^import .*$/gm)];

  if (matches.length === 0) {
    throw new Error("No import statements found.");
  }

  const lastImport = matches[matches.length - 1];
  const insertAt = lastImport.index + lastImport[0].length;

  return (
    source.slice(0, insertAt) +
    "\n" +
    statement +
    source.slice(insertAt)
  );
}

/*
 * App route.
 */
let app = fs.readFileSync(appPath, "utf8");

app = ensureImport(
  app,
  'import ResultsPage from "./pages/ResultsPage";',
);

if (
  !app.includes('path="/resultados"') &&
  !app.includes("path='/resultados'")
) {
  const wildcardPattern =
    /(\s*<Route\s+path=["']\*["'][^>]*\/>)/;

  if (wildcardPattern.test(app)) {
    app = app.replace(
      wildcardPattern,
      '\n      <Route path="/resultados" element={<ResultsPage />} />$1',
    );
  } else if (app.includes("</Routes>")) {
    app = app.replace(
      "</Routes>",
      '      <Route path="/resultados" element={<ResultsPage />} />\n    </Routes>',
    );
  } else {
    throw new Error("Could not add /resultados route.");
  }
}

fs.writeFileSync(appPath, app, "utf8");

/*
 * Home primary CTA:
 * Ver resultados -> /resultados.
 */
let hero = fs.readFileSync(heroPath, "utf8");

if (hero.includes("content.hero.primaryAction")) {
  hero = hero.replace(
    /to=["']\/login\?role=patient["']/g,
    'to="/resultados"',
  );
}

fs.writeFileSync(heroPath, hero, "utf8");

/*
 * Shared header:
 * Resultados -> /resultados.
 */
let header = fs.readFileSync(headerPath, "utf8");

header = header.replace(
  /(label:\s*content\.navigation\.results,\s*(?:\r?\n)\s*href:\s*)["'][^"']+["']/,
  '$1"/resultados"',
);

header = header.replace(
  /href=["']\/?#results["']/g,
  'href="/resultados"',
);

fs.writeFileSync(headerPath, header, "utf8");

/*
 * Shared footer:
 * Results link -> /resultados.
 */
let footer = fs.readFileSync(footerPath, "utf8");

footer = footer.replace(
  /href=["']\/?#results["']/g,
  'href="/resultados"',
);

fs.writeFileSync(footerPath, footer, "utf8");

console.log("Route /resultados added.");
console.log("Home Results button linked to /resultados.");
console.log("Shared header Results link updated.");
console.log("Shared footer Results link updated.");
'@

[System.IO.File]::WriteAllText(
    $NodePatchPath,
    $NodePatch,
    $Utf8NoBom
)

& node $NodePatchPath

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ROUTE/LINK PATCH FAILED" -ForegroundColor Red
    Write-Host "Backup available at:" -ForegroundColor Yellow
    Write-Host $BackupPath
    exit $LASTEXITCODE
}

# ---------------------------------------------------------------------------
# 5. BUILD VALIDATION
# ---------------------------------------------------------------------------

Set-Location $ProjectPath

Write-Host ""
Write-Host "Running production build..." -ForegroundColor Yellow
Write-Host ""

& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Backup available at:" -ForegroundColor Yellow
    Write-Host $BackupPath
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " PATCH 05.0 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "New patient page:" -ForegroundColor Cyan
Write-Host "http://localhost:5173/resultados"
Write-Host ""
Write-Host "Access model:" -ForegroundColor Cyan
Write-Host "Identification number + order number"
Write-Host ""
Write-Host "Home and shared navigation now point to /resultados." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "This is still a frontend demo."
Write-Host "No real patient data or PDF files are exposed."
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
