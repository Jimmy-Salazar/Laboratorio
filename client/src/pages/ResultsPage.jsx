import {
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  IdCard,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "../styles/admin.css";
import "../styles/results.css";

const PATIENT_SESSION_KEY =
  "dr-chasi-patient-portal-token";

function normalizeIdentification(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      `${value}T12:00:00Z`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-EC",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(date);
}

function getStoredToken() {
  if (
    typeof window === "undefined"
  ) {
    return "";
  }

  return (
    window.sessionStorage.getItem(
      PATIENT_SESSION_KEY,
    ) ?? ""
  );
}

function saveToken(token) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  if (token) {
    window.sessionStorage.setItem(
      PATIENT_SESSION_KEY,
      token,
    );
  } else {
    window.sessionStorage.removeItem(
      PATIENT_SESSION_KEY,
    );
  }
}

async function callPatientPortal(
  body,
) {
  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      "patient-portal-access",
      {
        body,
      },
    );

  if (error) {
    console.error(
      "Patient portal function error:",
      error,
    );

    throw error;
  }

  return data;
}

export default function ResultsPage() {
  const [identification, setIdentification] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [message, setMessage] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [restoring, setRestoring] =
    useState(true);

  const [sessionToken, setSessionToken] =
    useState("");
  const [portalData, setPortalData] =
    useState(null);

  async function restoreSession() {
    const token =
      getStoredToken();

    if (!token) {
      setRestoring(false);
      return;
    }

    try {
      const data =
        await callPatientPortal({
          action: "refresh",
          sessionToken: token,
        });

      if (!data?.ok) {
        saveToken("");
        setSessionToken("");
        setPortalData(null);
        setRestoring(false);
        return;
      }

      setSessionToken(token);
      setPortalData(data);
      setIdentification(
        data.patient
          ?.identification ?? "",
      );
    } catch {
      saveToken("");
      setSessionToken("");
      setPortalData(null);
    } finally {
      setRestoring(false);
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const cleanIdentification =
      normalizeIdentification(
        identification,
      );

    const cleanPassword =
      normalizeIdentification(
        password,
      );

    if (
      cleanIdentification.length !==
        10 ||
      cleanPassword.length !== 10
    ) {
      setMessage(
        "Ingresa una cedula valida de 10 digitos.",
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data =
        await callPatientPortal({
          action: "login",
          identification:
            cleanIdentification,
          password:
            cleanPassword,
        });

      if (!data?.ok) {
        if (
          data?.code ===
          "rate_limited"
        ) {
          setMessage(
            "Se realizaron demasiados intentos. Espera unos minutos e intentalo nuevamente.",
          );
        } else {
          setMessage(
            "Usuario o contrasena no validos.",
          );
        }

        return;
      }

      saveToken(
        data.sessionToken,
      );

      setSessionToken(
        data.sessionToken,
      );
      setPortalData(data);
      setIdentification(
        data.patient
          ?.identification ?? "",
      );
      setPassword("");
      setMessage("");
    } catch {
      setMessage(
        "No fue posible ingresar al portal en este momento.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshResults() {
    if (
      !sessionToken ||
      loading
    ) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data =
        await callPatientPortal({
          action: "refresh",
          sessionToken,
        });

      if (!data?.ok) {
        await closePortal();
        return;
      }

      setPortalData(data);
    } catch {
      setMessage(
        "No fue posible actualizar los resultados.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function openPatientResult(
    result,
    accessType,
  ) {
    if (
      !result?.id ||
      loading
    ) {
      return;
    }

    const token =
      sessionToken ||
      getStoredToken();

    if (!token) {
      await closePortal();
      return;
    }

    let previewWindow =
      null;

    if (
      accessType === "view"
    ) {
      previewWindow =
        window.open(
          "about:blank",
          "_blank",
        );

      if (previewWindow) {
        previewWindow.opener =
          null;
      }
    }

    setLoading(true);
    setMessage("");

    try {
      const data =
        await callPatientPortal({
          action:
            "open_result",

          sessionToken:
            token,

          resultId:
            result.id,

          accessType,
        });

      if (!data?.ok) {
        if (previewWindow) {
          previewWindow.close();
        }

        if (
          data?.code ===
          "session_expired"
        ) {
          await closePortal();
          return;
        }

        setMessage(
          "No fue posible abrir el resultado.",
        );

        return;
      }

      /*
       * IMPORTANTE:
       * La Edge Function ya registro que el paciente
       * vio o descargo el resultado.
       *
       * Por eso actualizamos inmediatamente las listas.
       */
      setPortalData(data);

      if (
        accessType === "view"
      ) {
        if (previewWindow) {
          previewWindow.location.href =
            data.url;
        }
        else {
          window.open(
            data.url,
            "_blank",
            "noopener,noreferrer",
          );
        }
      }
      else {
        const link =
          document.createElement(
            "a",
          );

        link.href =
          data.url;

        link.rel =
          "noopener noreferrer";

        document.body
          .appendChild(link);

        link.click();

        link.remove();
      }
    }
    catch (error) {
      console.error(
        "Patient result access error:",
        error,
      );

      if (previewWindow) {
        previewWindow.close();
      }

      setMessage(
        "No fue posible abrir el resultado.",
      );
    }
    finally {
      setLoading(false);
    }
  }

  async function closePortal() {
    const token =
      sessionToken ||
      getStoredToken();

    saveToken("");
    setSessionToken("");
    setPortalData(null);
    setIdentification("");
    setPassword("");
    setMessage("");
    setShowPassword(false);

    if (token) {
      try {
        await callPatientPortal({
          action: "logout",
          sessionToken: token,
        });
      } catch {
        // Browser session is already cleared.
      }
    }
  }

  if (restoring) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-brand admin-login-brand--logo">
            <img
              className="admin-login-brand-logo"
              src="/brand/dr-milton-chasi-logo.png"
              alt="Laboratorio Clinico Dr. Milton Chasi"
            />
          </div>

          <div className="admin-login-heading">
            <span className="admin-login-heading__icon">
              <ShieldCheck size={27} />
            </span>
            <div>
              <h1>Portal de pacientes</h1>
              <p>Verificando sesion...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (portalData?.ok) {
    const patient =
      portalData.patient ?? {};

    const results =
      portalData.results ??
      [];

    const recentResults =
      portalData.recentResults ??
      results.filter(
        (result) =>
          !result.accessed,
      );

    const historyResults =
      portalData.historyResults ??
      results.filter(
        (result) =>
          result.accessed,
      );

    const currentResult =
      portalData.currentResult ??
      recentResults[0] ??
      null;

    const currentResultName =
      currentResult
        ?.studyName ??
      "Sin resultados nuevos";

    const historyCount =
      historyResults.length;

    return (
      <div className="patient-portal-page">
        <header className="patient-portal-topbar">
          <div className="patient-portal-topbar__brand patient-portal-topbar__brand--logo">
            <img
              className="patient-portal-brand-logo patient-portal-brand-logo--topbar"
              src="/brand/dr-milton-chasi-logo.png"
              alt="Laboratorio Clinico Dr. Milton Chasi"
            />
          </div>

          <button
            type="button"
            onClick={closePortal}
          >
            <LogOut size={18} />
            <span>
              Cerrar sesion
            </span>
          </button>
        </header>

        <main className="patient-portal-main">
          <section className="patient-portal-welcome">
            <div>
              <span className="patient-portal-eyebrow">
                <ShieldCheck size={17} />
                Portal de pacientes
              </span>

              <h1>
                Mis resultados
              </h1>

              <p>
                Revisa y descarga los
                resultados liberados por
                el laboratorio.
              </p>
            </div>

            <div className="patient-portal-user-card">
              <span>
                <UserRound size={24} />
              </span>

              <div>
                <small>
                  Paciente
                </small>

                <strong>
                  {patient.displayName}
                </strong>

                <span className="patient-portal-user-id">
                  C.I.{" "}
                  {patient.identification}
                </span>
              </div>
            </div>
          </section>

          <section className="patient-portal-summary">
            <article>
              <span className="is-green">
                <CheckCircle2 size={22} />
              </span>

              <div>
                <small>
                  Resultado actual
                </small>

                <strong className="patient-portal-current-study">
                  {currentResultName}
                </strong>
              </div>
            </article>

            <article>
              <span className="is-blue">
                <CalendarDays size={22} />
              </span>

              <div>
                <small>
                  Historial
                </small>
                <strong>
                  {historyCount}
                </strong>
              </div>
            </article>
          </section>

          {message ? (
            <div
              className="patient-login-message"
              role="status"
            >
              {message}
            </div>
          ) : null}

          <section className="patient-portal-results-card">

            <div className="patient-portal-results-heading">

              <div>
                <span>
                  <FileText size={22} />
                </span>

                <div>
                  <h2>
                    Estudios recientes
                  </h2>

                  <p>
                    Resultados nuevos que aun
                    no has visto ni descargado.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="patient-portal-refresh"
                onClick={refreshResults}
                disabled={loading}
              >
                <RefreshCw size={16} />

                <span>
                  {loading
                    ? "Actualizando..."
                    : "Actualizar"}
                </span>
              </button>

            </div>


            {recentResults.length ? (

              <div className="patient-portal-result-list">

                {recentResults.map(
                  (result) => (

                    <article
                      className="patient-portal-result-row"
                      key={result.id}
                    >

                      <span className="patient-portal-result-icon">
                        <FileText size={22} />
                      </span>


                      <div className="patient-portal-result-copy">

                        <small>
                          {result.orderNumber}
                        </small>

                        <strong>
                          {result.studyName}
                        </strong>

                        <span>
                          <CalendarDays size={14} />

                          {formatDate(
                            result.resultDate,
                          )}
                        </span>

                      </div>


                      <div className="patient-portal-status is-released">
                        Nuevo
                      </div>


                      <div className="patient-portal-result-actions">

                        <button
                          type="button"
                          className="patient-portal-link"
                          disabled={loading}
                          onClick={() =>
                            openPatientResult(
                              result,
                              "view",
                            )
                          }
                        >
                          <Eye size={17} />

                          <span>
                            Ver
                          </span>
                        </button>


                        <button
                          type="button"
                          className="patient-portal-link is-primary"
                          disabled={loading}
                          onClick={() =>
                            openPatientResult(
                              result,
                              "download",
                            )
                          }
                        >
                          <Download size={17} />

                          <span>
                            Descargar
                          </span>
                        </button>

                      </div>

                    </article>

                  ),
                )}

              </div>

            ) : (

              <div className="patient-portal-empty">

                <CheckCircle2 size={32} />

                <strong>
                  No tienes estudios nuevos.
                </strong>

                <span>
                  Los nuevos resultados
                  liberados apareceran aqui.
                </span>

              </div>

            )}

          </section>



          <section className="patient-portal-results-card patient-portal-history-card">

            <div className="patient-portal-results-heading">

              <div>

                <span>
                  <CalendarDays size={22} />
                </span>

                <div>

                  <h2>
                    Historial de resultados
                  </h2>

                  <p>
                    Resultados que ya viste
                    o descargaste.
                  </p>

                </div>

              </div>

            </div>


            {historyResults.length ? (

              <div className="patient-portal-result-list">

                {historyResults.map(
                  (result) => (

                    <article
                      className="patient-portal-result-row"
                      key={result.id}
                    >

                      <span className="patient-portal-result-icon">
                        <FileText size={22} />
                      </span>


                      <div className="patient-portal-result-copy">

                        <small>
                          {result.orderNumber}
                        </small>

                        <strong>
                          {result.studyName}
                        </strong>

                        <span>
                          <CalendarDays size={14} />

                          {formatDate(
                            result.resultDate,
                          )}
                        </span>

                      </div>


                      <div className="patient-portal-status">
                        Historial
                      </div>


                      <div className="patient-portal-result-actions">

                        <button
                          type="button"
                          className="patient-portal-link"
                          disabled={loading}
                          onClick={() =>
                            openPatientResult(
                              result,
                              "view",
                            )
                          }
                        >
                          <Eye size={17} />

                          <span>
                            Ver
                          </span>
                        </button>


                        <button
                          type="button"
                          className="patient-portal-link is-primary"
                          disabled={loading}
                          onClick={() =>
                            openPatientResult(
                              result,
                              "download",
                            )
                          }
                        >
                          <Download size={17} />

                          <span>
                            Descargar
                          </span>
                        </button>

                      </div>

                    </article>

                  ),
                )}

              </div>

            ) : (

              <div className="patient-portal-empty">

                <FileText size={32} />

                <strong>
                  Tu historial esta vacio.
                </strong>

                <span>
                  Cuando veas o descargues
                  un resultado aparecera aqui.
                </span>

              </div>

            )}

          </section>


          <button
            type="button"
            className="patient-portal-back"
            onClick={closePortal}
          >
            <ArrowLeft size={17} />
            <span>
              Salir del portal
            </span>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand admin-login-brand--logo">
          <img
            className="admin-login-brand-logo"
            src="/brand/dr-milton-chasi-logo.png"
            alt="Laboratorio Clinico Dr. Milton Chasi"
          />
        </div>

        <div className="admin-login-heading">
          <span className="admin-login-heading__icon">
            <ShieldCheck size={27} />
          </span>

          <div>
            <h1>
              Portal de pacientes
            </h1>

            <p>
              Acceso para consulta de
              resultados de laboratorio.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          <label className="admin-login-field">
            <span>Cedula</span>

            <div>
              <IdCard size={19} />

              <input
                type="text"
                inputMode="numeric"
                autoComplete="username"
                maxLength={10}
                value={identification}
                onChange={(event) =>
                  setIdentification(
                    normalizeIdentification(
                      event.target.value,
                    ),
                  )
                }
                placeholder="Ingresa tu cedula"
              />
            </div>
          </label>

          <label className="admin-login-field">
            <span>
              Contrasena
            </span>

            <div>
              <LockKeyhole size={19} />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={10}
                value={password}
                onChange={(event) =>
                  setPassword(
                    normalizeIdentification(
                      event.target.value,
                    ),
                  )
                }
                placeholder="Ingresa tu contrasena"
              />

              <button
                type="button"
                className="patient-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (value) =>
                      !value,
                  )
                }
                aria-label={
                  showPassword
                    ? "Ocultar contrasena"
                    : "Mostrar contrasena"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          {message ? (
            <div
              className="patient-login-message"
              role="alert"
            >
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={
              loading ||
              !identification ||
              !password
            }
          >
            {loading
              ? "Ingresando..."
              : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}