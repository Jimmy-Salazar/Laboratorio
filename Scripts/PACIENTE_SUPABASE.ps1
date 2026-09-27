#requires -Version 5.1
# PATCH 06.38
# Connects the patient portal frontend to Supabase through a secure Edge Function.
#
# Requested login rule:
#   Usuario    = cedula
#   Contrasena = same cedula
#
# IMPORTANT:
# - This script does NOT store the service_role key in the frontend.
# - The Edge Function uses the server-side Supabase environment secret.
# - Patient session token is stored only in browser sessionStorage.
# - Closing the tab removes the browser token.
# - Only released results are returned to the patient.
#
# BEFORE DEPLOYING THE FUNCTION:
# Run 020_patient_portal_supabase.sql in Supabase SQL Editor.

$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\projects\Laboratorio"
$ClientPath = Join-Path $ProjectRoot "client"
$PagePath = Join-Path $ClientPath "src\pages\ResultsPage.jsx"
$CssPath = Join-Path $ClientPath "src\styles\results.css"
$FunctionDir = Join-Path $ProjectRoot "supabase\functions\patient-portal-access"
$FunctionPath = Join-Path $FunctionDir "index.ts"
$MigrationDir = Join-Path $ProjectRoot "supabase\migrations"
$MigrationPath = Join-Path $MigrationDir "020_patient_portal_supabase.sql"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

foreach ($RequiredPath in @(
    $PagePath,
    $CssPath,
    (Join-Path $ClientPath "src\lib\supabase.js"),
    (Join-Path $ClientPath "package.json"),
    (Join-Path $ClientPath "public\brand\dr-milton-chasi-logo.png")
)) {
    if (-not (Test-Path $RequiredPath)) {
        throw "Required file not found: $RequiredPath"
    }
}

New-Item -ItemType Directory -Force -Path $FunctionDir | Out-Null
New-Item -ItemType Directory -Force -Path $MigrationDir | Out-Null

$BackupPath = Join-Path $ClientPath "backups\patient-portal-supabase-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $PagePath (Join-Path $BackupPath "ResultsPage.jsx") -Force
Copy-Item $CssPath (Join-Path $BackupPath "results.css") -Force

if (Test-Path $FunctionPath) {
    Copy-Item $FunctionPath (Join-Path $BackupPath "patient-portal-access-index.ts") -Force
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 06.38 - PATIENT PORTAL + SUPABASE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$PageCode = @'
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
      <div className="patient-login-page">
        <div className="patient-login-card">
          <div className="patient-login-brand patient-login-brand--logo">
            <img
              className="patient-login-brand-logo"
              src="/brand/dr-milton-chasi-logo.png"
              alt="Laboratorio Clinico Dr. Milton Chasi"
            />
          </div>

          <div className="patient-login-security">
            <RefreshCw size={17} />
            <span>
              Verificando sesion...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (portalData?.ok) {
    const patient =
      portalData.patient ?? {};

    const results =
      portalData.results ?? [];

    const availableCount =
      Number(
        portalData.summary
          ?.availableResults ??
          results.length,
      );

    const historyCount =
      Number(
        portalData.summary
          ?.historyOrders ?? 0,
      );

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
                  Resultados disponibles
                </small>
                <strong>
                  {availableCount}
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
                    Historial de resultados
                  </h2>

                  <p>
                    Solo se muestran
                    resultados liberados.
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

            {results.length ? (
              <div className="patient-portal-result-list">
                {results.map(
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
                          {
                            result.orderNumber
                          }
                        </small>

                        <strong>
                          {
                            result.studyName
                          }
                        </strong>

                        <span>
                          <CalendarDays size={14} />
                          {formatDate(
                            result.resultDate,
                          )}
                        </span>
                      </div>

                      <div className="patient-portal-status is-released">
                        Disponible
                      </div>

                      <div className="patient-portal-result-actions">
                        <a
                          href={
                            result.viewUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="patient-portal-link"
                        >
                          <Eye size={17} />
                          <span>Ver</span>
                        </a>

                        <a
                          href={
                            result.downloadUrl
                          }
                          className="patient-portal-link is-primary"
                        >
                          <Download size={17} />
                          <span>
                            Descargar
                          </span>
                        </a>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className="patient-portal-empty">
                <FileText size={32} />
                <strong>
                  No hay resultados
                  liberados.
                </strong>
                <span>
                  Cuando el laboratorio
                  libere un resultado,
                  aparecera aqui.
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
    <div className="patient-login-page">
      <div className="patient-login-card">
        <div className="patient-login-brand patient-login-brand--logo">
          <img
            className="patient-login-brand-logo"
            src="/brand/dr-milton-chasi-logo.png"
            alt="Laboratorio Clinico Dr. Milton Chasi"
          />
        </div>

        <div className="patient-login-heading">
          <span className="patient-login-heading__icon">
            <UserRound size={27} />
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
          <label className="patient-login-field">
            <span>
              Usuario - Cedula
            </span>

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

          <label className="patient-login-field">
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
            className="patient-login-submit"
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

        <div className="patient-login-security">
          <ShieldCheck size={16} />
          <span>
            Acceso exclusivo para
            pacientes.
          </span>
        </div>
      </div>
    </div>
  );
}
'@

$FunctionCode = @'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SESSION_MINUTES = 30;
const SIGNED_URL_SECONDS = 10 * 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function json(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store, max-age=0",
        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}

function normalizeCedula(
  value: unknown,
) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

function getClientIp(
  req: Request,
) {
  const forwarded =
    req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

  return (
    req.headers.get(
      "cf-connecting-ip",
    ) ??
    req.headers.get(
      "x-real-ip",
    ) ??
    forwarded ??
    "unknown"
  );
}

async function sha256(
  value: string,
) {
  const bytes =
    new TextEncoder()
      .encode(value);

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      bytes,
    );

  return Array.from(
    new Uint8Array(digest),
  )
    .map((item) =>
      item
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

function randomToken() {
  const bytes =
    new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return btoa(
    String.fromCharCode(
      ...bytes,
    ),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeFileName(
  value: unknown,
) {
  const raw =
    String(
      value ??
      "resultado.pdf",
    );

  const cleaned =
    raw.replace(
      /[^A-Za-z0-9._-]/g,
      "_",
    );

  return cleaned
    .toLowerCase()
    .endsWith(".pdf")
    ? cleaned
    : `${cleaned}.pdf`;
}

Deno.serve(
  async (req: Request) => {
    if (
      req.method === "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        },
      );
    }

    if (
      req.method !== "POST"
    ) {
      return json(
        {
          ok: false,
          code:
            "invalid_request",
        },
        405,
      );
    }

    const supabaseUrl =
      Deno.env.get(
        "SUPABASE_URL",
      );

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      console.error(
        "Missing Supabase environment.",
      );

      return json(
        {
          ok: false,
          code:
            "service_error",
        },
        500,
      );
    }

    const admin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        },
      );

    let body:
      Record<string, unknown>;

    try {
      body =
        await req.json();
    } catch {
      return json({
        ok: false,
        code:
          "invalid_request",
      });
    }

    const action =
      String(
        body.action ?? "",
      );

    async function claimLimit(
      scope: string,
      rawKey: string,
      maxAttempts: number,
    ) {
      const hash =
        await sha256(
          `${scope}|${rawKey}|${serviceRoleKey}`,
        );

      const {
        data,
        error,
      } =
        await admin.rpc(
          "claim_patient_portal_limit",
          {
            p_scope: scope,
            p_key_hash: hash,
            p_max_attempts:
              maxAttempts,
            p_window_seconds:
              15 * 60,
            p_block_seconds:
              15 * 60,
          },
        );

      if (error) {
        throw error;
      }

      const row =
        Array.isArray(data)
          ? data[0]
          : data;

      return {
        allowed:
          row?.allowed !==
          false,
        retryAfter:
          Number(
            row
              ?.retry_after_seconds ??
            0,
          ),
      };
    }

    async function getSession(
      rawToken: string,
    ) {
      if (
        !rawToken ||
        rawToken.length < 30
      ) {
        return null;
      }

      const tokenHash =
        await sha256(
          rawToken,
        );

      const {
        data,
        error,
      } =
        await admin
          .from(
            "patient_portal_sessions",
          )
          .select(
            "id, patient_id, expires_at, revoked_at",
          )
          .eq(
            "token_hash",
            tokenHash,
          )
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (
        !data ||
        data.revoked_at ||
        new Date(
          data.expires_at,
        ).getTime() <=
          Date.now()
      ) {
        return null;
      }

      await admin
        .from(
          "patient_portal_sessions",
        )
        .update({
          last_seen_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          data.id,
        );

      return data;
    }

    async function loadPortalData(
      patientId: string,
    ) {
      const {
        data: patient,
        error:
          patientError,
      } =
        await admin
          .from("patients")
          .select(
            [
              "id",
              "identification_number",
              "first_name",
              "last_name",
              "active",
            ].join(","),
          )
          .eq(
            "id",
            patientId,
          )
          .eq(
            "active",
            true,
          )
          .maybeSingle();

      if (
        patientError ||
        !patient
      ) {
        if (patientError) {
          console.error(
            patientError,
          );
        }

        return null;
      }

      const {
        data: orders,
        error: ordersError,
      } =
        await admin
          .from(
            "result_orders",
          )
          .select(
            "id, order_number, order_date, status",
          )
          .eq(
            "patient_id",
            patientId,
          )
          .order(
            "order_date",
            {
              ascending:
                false,
            },
          );

      if (ordersError) {
        throw ordersError;
      }

      const orderMap =
        new Map(
          (orders ?? []).map(
            (order) => [
              order.id,
              order,
            ],
          ),
        );

      const orderIds =
        Array.from(
          orderMap.keys(),
        );

      let resultRows:
        Array<Record<string, unknown>> =
          [];

      if (
        orderIds.length > 0
      ) {
        const {
          data,
          error,
        } =
          await admin
            .from(
              "patient_results",
            )
            .select(
              [
                "id",
                "order_id",
                "study_name_snapshot",
                "result_date",
                "file_path",
                "original_file_name",
                "file_size_bytes",
                "released_at",
              ].join(","),
            )
            .in(
              "order_id",
              orderIds,
            )
            .eq(
              "status",
              "released",
            )
            .order(
              "result_date",
              {
                ascending:
                  false,
              },
            );

        if (error) {
          throw error;
        }

        resultRows =
          data ?? [];
      }

      const results =
        await Promise.all(
          resultRows.map(
            async (row) => {
              const order =
                orderMap.get(
                  String(
                    row.order_id,
                  ),
                );

              const {
                data: viewData,
                error: viewError,
              } =
                await admin.storage
                  .from(
                    "patient-results",
                  )
                  .createSignedUrl(
                    String(
                      row.file_path,
                    ),
                    SIGNED_URL_SECONDS,
                  );

              if (
                viewError ||
                !viewData
                  ?.signedUrl
              ) {
                throw (
                  viewError ??
                  new Error(
                    "Could not create view URL.",
                  )
                );
              }

              const {
                data: downloadData,
                error:
                  downloadError,
              } =
                await admin.storage
                  .from(
                    "patient-results",
                  )
                  .createSignedUrl(
                    String(
                      row.file_path,
                    ),
                    SIGNED_URL_SECONDS,
                    {
                      download:
                        safeFileName(
                          row.original_file_name,
                        ),
                    },
                  );

              if (
                downloadError ||
                !downloadData
                  ?.signedUrl
              ) {
                throw (
                  downloadError ??
                  new Error(
                    "Could not create download URL.",
                  )
                );
              }

              return {
                id:
                  row.id,
                orderNumber:
                  order
                    ?.order_number ??
                  "-",
                orderDate:
                  order
                    ?.order_date ??
                  null,
                studyName:
                  row
                    .study_name_snapshot,
                resultDate:
                  row.result_date,
                releasedAt:
                  row.released_at,
                fileSizeBytes:
                  row
                    .file_size_bytes,
                viewUrl:
                  viewData
                    .signedUrl,
                downloadUrl:
                  downloadData
                    .signedUrl,
              };
            },
          ),
        );

      const historyOrders =
        new Set(
          resultRows.map(
            (row) =>
              String(
                row.order_id,
              ),
          ),
        ).size;

      return {
        patient: {
          displayName:
            `${patient.first_name} ${patient.last_name}`.trim(),
          identification:
            patient
              .identification_number,
        },
        summary: {
          availableResults:
            results.length,
          historyOrders,
        },
        results,
        signedUrlExpiresIn:
          SIGNED_URL_SECONDS,
      };
    }

    try {
      if (
        action === "login"
      ) {
        const identification =
          normalizeCedula(
            body.identification,
          );

        const password =
          normalizeCedula(
            body.password,
          );

        const ip =
          getClientIp(req);

        const ipLimit =
          await claimLimit(
            "ip",
            ip,
            30,
          );

        if (
          !ipLimit.allowed
        ) {
          return json({
            ok: false,
            code:
              "rate_limited",
            retryAfter:
              ipLimit.retryAfter,
          });
        }

        const credentialLimit =
          await claimLimit(
            "credential",
            `${ip}|${identification}`,
            8,
          );

        if (
          !credentialLimit.allowed
        ) {
          return json({
            ok: false,
            code:
              "rate_limited",
            retryAfter:
              credentialLimit.retryAfter,
          });
        }

        if (
          identification.length !==
            10 ||
          password.length !== 10 ||
          identification !==
            password
        ) {
          return json({
            ok: false,
            code:
              "invalid_credentials",
          });
        }

        const {
          data: patient,
          error:
            patientError,
        } =
          await admin
            .from("patients")
            .select("id")
            .eq(
              "identification_type",
              "cedula",
            )
            .eq(
              "identification_normalized",
              identification,
            )
            .eq(
              "active",
              true,
            )
            .maybeSingle();

        if (
          patientError
        ) {
          throw patientError;
        }

        if (!patient) {
          return json({
            ok: false,
            code:
              "invalid_credentials",
          });
        }

        const rawToken =
          randomToken();

        const tokenHash =
          await sha256(
            rawToken,
          );

        const expiresAt =
          new Date(
            Date.now() +
              SESSION_MINUTES *
                60 *
                1000,
          ).toISOString();

        const {
          error:
            sessionError,
        } =
          await admin
            .from(
              "patient_portal_sessions",
            )
            .insert({
              patient_id:
                patient.id,
              token_hash:
                tokenHash,
              expires_at:
                expiresAt,
            });

        if (
          sessionError
        ) {
          throw sessionError;
        }

        const portalData =
          await loadPortalData(
            patient.id,
          );

        if (
          !portalData
        ) {
          return json({
            ok: false,
            code:
              "invalid_credentials",
          });
        }

        return json({
          ok: true,
          sessionToken:
            rawToken,
          sessionExpiresAt:
            expiresAt,
          ...portalData,
        });
      }

      if (
        action === "refresh"
      ) {
        const rawToken =
          String(
            body.sessionToken ??
              "",
          );

        const session =
          await getSession(
            rawToken,
          );

        if (!session) {
          return json({
            ok: false,
            code:
              "session_expired",
          });
        }

        const portalData =
          await loadPortalData(
            session.patient_id,
          );

        if (
          !portalData
        ) {
          return json({
            ok: false,
            code:
              "session_expired",
          });
        }

        return json({
          ok: true,
          ...portalData,
        });
      }

      if (
        action === "logout"
      ) {
        const rawToken =
          String(
            body.sessionToken ??
              "",
          );

        if (rawToken) {
          const tokenHash =
            await sha256(
              rawToken,
            );

          await admin
            .from(
              "patient_portal_sessions",
            )
            .update({
              revoked_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "token_hash",
              tokenHash,
            );
        }

        return json({
          ok: true,
        });
      }

      return json({
        ok: false,
        code:
          "invalid_request",
      });
    } catch (error) {
      console.error(
        "patient-portal-access failed:",
        error,
      );

      return json(
        {
          ok: false,
          code:
            "service_error",
        },
        500,
      );
    }
  },
);
'@

$CssAppend = @'

/* PATIENT PORTAL SUPABASE 06.38 */

.patient-portal-results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.patient-portal-refresh {
  min-height: 39px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex: 0 0 auto;
  padding: 0 12px;
  border: 1px solid #cfdeeb;
  border-radius: 10px;
  background: #ffffff;
  color: #356184;
  font: inherit;
  font-size: 0.83rem;
  font-weight: 800;
  cursor: pointer;
}

.patient-portal-refresh:disabled {
  cursor: wait;
  opacity: 0.6;
}

.patient-portal-result-actions .patient-portal-link {
  min-height: 39px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid #cfdeeb;
  border-radius: 10px;
  background: #ffffff;
  color: #356184;
  font-size: 0.83rem;
  font-weight: 800;
  text-decoration: none;
}

.patient-portal-result-actions .patient-portal-link.is-primary {
  border-color: #176fc5;
  background: #176fc5;
  color: #ffffff;
}

.patient-portal-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 48px 20px;
  color: #74889a;
  text-align: center;
}

.patient-portal-empty svg {
  color: #2c78b9;
}

.patient-portal-empty strong {
  color: #294a67;
}

@media (max-width: 620px) {
  .patient-portal-results-heading {
    align-items: flex-start;
  }

  .patient-portal-refresh span {
    display: none;
  }
}
'@

[System.IO.File]::WriteAllText(
    $PagePath,
    $PageCode,
    $Utf8NoBom
)

[System.IO.File]::WriteAllText(
    $FunctionPath,
    $FunctionCode,
    $Utf8NoBom
)

$CssText =
    [System.IO.File]::ReadAllText(
        $CssPath
    )

if ($CssText -notmatch "PATIENT PORTAL SUPABASE 06.38") {
    $CssText += $CssAppend

    [System.IO.File]::WriteAllText(
        $CssPath,
        $CssText,
        $Utf8NoBom
    )
}

Write-Host "Files updated:" -ForegroundColor Green
Write-Host "- $PagePath"
Write-Host "- $FunctionPath"
Write-Host "- $CssPath"
Write-Host ""

Set-Location $ClientPath

Write-Host "Running production build..." -ForegroundColor Yellow
Write-Host ""

& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Send me the complete build error." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Backup: $BackupPath" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " PATCH 06.38 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT:" -ForegroundColor Yellow
Write-Host "1. Make sure 020_patient_portal_supabase.sql was run in Supabase."
Write-Host "2. Deploy Edge Function:"
Write-Host ""
Write-Host "   cd C:\projects\Laboratorio"
Write-Host "   npx.cmd supabase functions deploy patient-portal-access --project-ref farficqhjdozapcfxrge --no-verify-jwt"
Write-Host ""
Write-Host "3. Test:"
Write-Host "   http://localhost:5173/resultados"
Write-Host ""
