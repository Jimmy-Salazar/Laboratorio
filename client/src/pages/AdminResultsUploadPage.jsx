import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Eye,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

/* PATCH_06_21_1_REMOVE_SECURITY_CARD */
/* PATCH_06_21_2_REMOVE_IMMEDIATE_RELEASE */

const PAGE_SIZE = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function todayInGuayaquil() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Guayaquil",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date());
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "es-EC",
    {
      timeZone:
        "America/Guayaquil",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(
    new Date(
      `${value}T12:00:00-05:00`,
    ),
  );
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "es-EC",
    {
      timeZone:
        "America/Guayaquil",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(new Date(value));
}

function formatBytes(value) {
  const bytes =
    Number(value) || 0;

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function cleanSearch(value) {
  return String(value ?? "")
    .replace(
      /[%_,()]/g,
      "",
    )
    .trim();
}

function patientFullName(patient) {
  return [
    patient?.first_name,
    patient?.last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function AdminResultsUploadPage() {
  const { profile } =
    useAdminAuth();

  const canManage =
    ["admin", "laboratorist"].includes(
      profile?.role,
    );

  const [studies, setStudies] =
    useState([]);
  const [patientSearch, setPatientSearch] =
    useState("");
  const [patientMatches, setPatientMatches] =
    useState([]);
  const [searchingPatients, setSearchingPatients] =
    useState(false);
  const [selectedPatient, setSelectedPatient] =
    useState(null);

  const [studyId, setStudyId] =
    useState("");
  const [resultDate, setResultDate] =
    useState(
      todayInGuayaquil(),
    );
  const [pdfFile, setPdfFile] =
    useState(null);
  const [uploading, setUploading] =
    useState(false);

  const [results, setResults] =
    useState([]);
  const [loadingResults, setLoadingResults] =
    useState(true);
  const [resultSearch, setResultSearch] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [page, setPage] =
    useState(1);
  const [busyResultId, setBusyResultId] =
    useState(null);

  const [message, setMessage] =
    useState("");
  const [messageType, setMessageType] =
    useState("info");

  const loadStudies =
    useCallback(async () => {
      const {
        data,
        error,
      } = await supabase
        .from("studies")
        .select(
          "id, name_es, active, sort_order",
        )
        .eq(
          "active",
          true,
        )
        .order(
          "sort_order",
          {
            ascending: true,
          },
        )
        .order(
          "name_es",
          {
            ascending: true,
          },
        );

      if (error) {
        console.error(error);
        return;
      }

      setStudies(
        data ?? [],
      );
    }, []);

  const loadResults =
    useCallback(async () => {
      setLoadingResults(true);

      const {
        data,
        error,
      } = await supabase
        .from("patient_results")
        .select(
          `
            id,
            order_id,
            study_id,
            study_name_snapshot,
            result_date,
            file_path,
            original_file_name,
            file_size_bytes,
            status,
            uploaded_at,
            released_at,
            result_orders!inner(
              id,
              order_number,
              status,
              patient_id,
              patients!inner(
                id,
                first_name,
                last_name,
                identification_number
              )
            )
          `,
        )
        .order(
          "uploaded_at",
          {
            ascending: false,
          },
        )
        .limit(250);

      if (error) {
        console.error(error);
        setResults([]);
        setMessage(
          "No fue posible cargar los resultados.",
        );
        setMessageType(
          "error",
        );
        setLoadingResults(false);
        return;
      }

      setResults(
        data ?? [],
      );
      setLoadingResults(false);
    }, []);

  useEffect(() => {
    loadStudies();
    loadResults();
  }, [
    loadStudies,
    loadResults,
  ]);

  useEffect(() => {
    const term =
      cleanSearch(
        patientSearch,
      );

    if (
      selectedPatient &&
      term ===
        cleanSearch(
          patientFullName(
            selectedPatient,
          ),
        )
    ) {
      setPatientMatches([]);
      return undefined;
    }

    if (
      term.length < 2
    ) {
      setPatientMatches([]);
      setSearchingPatients(false);
      return undefined;
    }

    let cancelled = false;

    const timer =
      window.setTimeout(
        async () => {
          setSearchingPatients(
            true,
          );

          const {
            data,
            error,
          } = await supabase
            .from("patients")
            .select(
              "id, first_name, last_name, identification_number, phone, active",
            )
            .eq(
              "active",
              true,
            )
            .or(
              [
                `first_name.ilike.%${term}%`,
                `last_name.ilike.%${term}%`,
                `identification_number.ilike.%${term}%`,
                `phone.ilike.%${term}%`,
              ].join(","),
            )
            .order(
              "last_name",
              {
                ascending: true,
              },
            )
            .limit(8);

          if (cancelled) {
            return;
          }

          if (error) {
            console.error(error);
            setPatientMatches([]);
          } else {
            setPatientMatches(
              data ?? [],
            );
          }

          setSearchingPatients(
            false,
          );
        },
        250,
      );

    return () => {
      cancelled = true;
      window.clearTimeout(
        timer,
      );
    };
  }, [
    patientSearch,
    selectedPatient,
  ]);

  function selectPatient(patient) {
    setSelectedPatient(patient);
    setPatientSearch(
      patientFullName(patient),
    );
    setPatientMatches([]);
  }

  function clearPatient() {
    setSelectedPatient(null);
    setPatientSearch("");
    setPatientMatches([]);
  }

  function handleFileChange(event) {
    const file =
      event.target.files?.[0] ??
      null;

    setMessage("");

    if (!file) {
      setPdfFile(null);
      return;
    }

    if (
      file.type !==
      "application/pdf"
    ) {
      setPdfFile(null);
      event.target.value = "";
      setMessage(
        "Solo se permiten archivos PDF.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setPdfFile(null);
      event.target.value = "";
      setMessage(
        "El PDF no puede superar 20 MB.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    setPdfFile(file);
  }

  async function uploadResult(
    event,
  ) {
    event.preventDefault();

    if (
      uploading ||
      !canManage
    ) {
      return;
    }

    if (!selectedPatient) {
      setMessage(
        "Selecciona un paciente.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    if (!studyId) {
      setMessage(
        "Selecciona un estudio.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    if (!resultDate) {
      setMessage(
        "Selecciona la fecha del resultado.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    if (!pdfFile) {
      setMessage(
        "Selecciona el PDF del resultado.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    setUploading(true);
    setMessage("");

    const orderId =
      crypto.randomUUID();

    const fileToken =
      crypto.randomUUID();

    const filePath =
      `${selectedPatient.id}/${orderId}/${fileToken}.pdf`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        "patient-results",
      )
      .upload(
        filePath,
        pdfFile,
        {
          contentType:
            "application/pdf",
          upsert: false,
        },
      );

    if (uploadError) {
      console.error(
        uploadError,
      );

      setUploading(false);
      setMessage(
        "No fue posible subir el PDF.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    const {
      data,
      error: rpcError,
    } = await supabase.rpc(
      "create_uploaded_patient_result",
      {
        p_order_id:
          orderId,
        p_patient_id:
          selectedPatient.id,
        p_study_id:
          studyId,
        p_result_date:
          resultDate,
        p_file_path:
          filePath,
        p_original_file_name:
          pdfFile.name,
        p_file_size_bytes:
          pdfFile.size,
        p_release: false,
      },
    );

    if (rpcError) {
      console.error(
        rpcError,
      );

      await supabase.storage
        .from(
          "patient-results",
        )
        .remove([
          filePath,
        ]);

      setUploading(false);
      setMessage(
        "El PDF se retiro porque no fue posible registrar el resultado.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    const created =
      Array.isArray(data)
        ? data[0]
        : data;

    setUploading(false);

    setMessage(
      `Resultado subido como borrador. Orden ${created?.order_number ?? ""}`,
    );
    setMessageType(
      "success",
    );

    setStudyId("");
    setResultDate(
      todayInGuayaquil(),
    );
    setPdfFile(null);

    const input =
      document.getElementById(
        "result-pdf-input",
      );

    if (input) {
      input.value = "";
    }

    await loadResults();
  }

  async function viewPdf(result) {
    if (!canManage) {
      return;
    }

    setBusyResultId(
      result.id,
    );
    setMessage("");

    const {
      data,
      error,
    } = await supabase.storage
      .from(
        "patient-results",
      )
      .createSignedUrl(
        result.file_path,
        300,
      );

    setBusyResultId(
      null,
    );

    if (
      error ||
      !data?.signedUrl
    ) {
      console.error(error);
      setMessage(
        "No fue posible abrir el PDF.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function releaseResult(
    result,
  ) {
    if (
      !canManage ||
      busyResultId
    ) {
      return;
    }

    setBusyResultId(
      result.id,
    );
    setMessage("");

    const {
      error,
    } = await supabase.rpc(
      "release_patient_result",
      {
        p_result_id:
          result.id,
      },
    );

    setBusyResultId(
      null,
    );

    if (error) {
      console.error(error);
      setMessage(
        "No fue posible liberar el resultado.",
      );
      setMessageType(
        "error",
      );
      return;
    }

    setMessage(
      "Resultado liberado correctamente.",
    );
    setMessageType(
      "success",
    );

    await loadResults();
  }

  async function copyOrderNumber(
    orderNumber,
  ) {
    try {
      await navigator.clipboard.writeText(
        orderNumber,
      );

      setMessage(
        `Orden ${orderNumber} copiada.`,
      );
      setMessageType(
        "success",
      );
    } catch (error) {
      console.error(error);
    }
  }

  const filteredResults =
    useMemo(() => {
      const term =
        cleanSearch(
          resultSearch,
        ).toLocaleLowerCase();

      return results.filter(
        (result) => {
          if (
            statusFilter !==
              "all" &&
            result.status !==
              statusFilter
          ) {
            return false;
          }

          if (!term) {
            return true;
          }

          const order =
            result.result_orders;

          const patient =
            order?.patients;

          const haystack = [
            result.study_name_snapshot,
            order?.order_number,
            patient?.first_name,
            patient?.last_name,
            patient?.identification_number,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase();

          return haystack.includes(
            term,
          );
        },
      );
    }, [
      results,
      resultSearch,
      statusFilter,
    ]);

  const pageCount =
    Math.max(
      1,
      Math.ceil(
        filteredResults.length /
          PAGE_SIZE,
      ),
    );

  useEffect(() => {
    setPage(1);
  }, [
    resultSearch,
    statusFilter,
  ]);

  useEffect(() => {
    if (
      page >
      pageCount
    ) {
      setPage(
        pageCount,
      );
    }
  }, [
    page,
    pageCount,
  ]);

  const pagedResults =
    filteredResults.slice(
      (page - 1) *
        PAGE_SIZE,
      page *
        PAGE_SIZE,
    );

  const startItem =
    filteredResults.length === 0
      ? 0
      : (page - 1) *
          PAGE_SIZE +
        1;

  const endItem =
    filteredResults.length === 0
      ? 0
      : Math.min(
          page *
            PAGE_SIZE,
          filteredResults.length,
        );

  return (
    <div className="admin-results-upload-page">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            Resultados
          </span>

          <h1>
            Subir resultados
          </h1>

          <p>
            {
              "Carga el PDF del paciente y controla cuando queda disponible."
            }
          </p>
        </div>

        <div className="admin-page-heading__actions">
          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={
              loadResults
            }
            disabled={
              loadingResults
            }
          >
            <RefreshCw size={17} />
            <span>
              Actualizar
            </span>
          </button>
        </div>
      </section>

      {canManage ? (
        <section className="admin-results-upload-grid">
          <article className="admin-panel admin-result-upload-card">
            <header className="admin-panel__header">
              <div>
                <span className="admin-panel__icon">
                  <Upload size={20} />
                </span>

                <div>
                  <h2>
                    Nuevo resultado
                  </h2>

                  <p>
                    PDF privado, maximo 20 MB
                  </p>
                </div>
              </div>
            </header>

            <form
              className="admin-result-upload-form"
              onSubmit={
                uploadResult
              }
            >
              <label>
                <span>
                  Paciente
                </span>

                <div className="admin-result-patient-search">
                  <Search size={17} />

                  <input
                    type="search"
                    value={
                      patientSearch
                    }
                    onChange={(
                      event,
                    ) => {
                      setPatientSearch(
                        event.target
                          .value,
                      );

                      if (
                        selectedPatient
                      ) {
                        setSelectedPatient(
                          null,
                        );
                      }
                    }}
                    placeholder="Nombre, cedula o telefono..."
                    autoComplete="off"
                  />

                  {selectedPatient ? (
                    <button
                      type="button"
                      onClick={
                        clearPatient
                      }
                      aria-label="Quitar paciente"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>

                {searchingPatients ? (
                  <small className="admin-result-help">
                    Buscando...
                  </small>
                ) : null}

                {patientMatches.length >
                0 ? (
                  <div className="admin-result-patient-matches">
                    {patientMatches.map(
                      (patient) => (
                        <button
                          type="button"
                          key={
                            patient.id
                          }
                          onClick={() =>
                            selectPatient(
                              patient,
                            )
                          }
                        >
                          <UserRound
                            size={17}
                          />

                          <span>
                            <strong>
                              {patientFullName(
                                patient,
                              )}
                            </strong>

                            <small>
                              C.I.{" "}
                              {
                                patient.identification_number
                              }
                              {patient.phone
                                ? ` - ${patient.phone}`
                                : ""}
                            </small>
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                ) : null}

                {selectedPatient ? (
                  <div className="admin-result-selected-patient">
                    <CheckCircle2
                      size={17}
                    />

                    <span>
                      <strong>
                        {patientFullName(
                          selectedPatient,
                        )}
                      </strong>

                      <small>
                        C.I.{" "}
                        {
                          selectedPatient.identification_number
                        }
                      </small>
                    </span>
                  </div>
                ) : null}
              </label>

              <div className="admin-form-two-columns">
                <label>
                  <span>
                    Estudio
                  </span>

                  <div className="admin-form-control">
                    <select
                      value={
                        studyId
                      }
                      onChange={(
                        event,
                      ) =>
                        setStudyId(
                          event.target
                            .value,
                        )
                      }
                    >
                      <option value="">
                        Seleccionar...
                      </option>

                      {studies.map(
                        (study) => (
                          <option
                            key={
                              study.id
                            }
                            value={
                              study.id
                            }
                          >
                            {
                              study.name_es
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </label>

                <label>
                  <span>
                    Fecha del resultado
                  </span>

                  <div className="admin-form-control">
                    <input
                      type="date"
                      value={
                        resultDate
                      }
                      onChange={(
                        event,
                      ) =>
                        setResultDate(
                          event.target
                            .value,
                        )
                      }
                    />
                  </div>
                </label>
              </div>

              <label>
                <span>
                  Archivo PDF
                </span>

                <div className="admin-result-file-control">
                  <FileText
                    size={21}
                  />

                  <div>
                    <strong>
                      {pdfFile
                        ? pdfFile.name
                        : "Seleccionar PDF"}
                    </strong>

                    <small>
                      {pdfFile
                        ? formatBytes(
                            pdfFile.size,
                          )
                        : "Solo PDF - hasta 20 MB"}
                    </small>
                  </div>

                  <input
                    id="result-pdf-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={
                      handleFileChange
                    }
                  />
                </div>
              </label>

              <button
                type="submit"
                className="admin-button admin-button--primary admin-result-submit"
                disabled={
                  uploading
                }
              >
                <Upload
                  size={18}
                />

                <span>
                  {uploading
                    ? "Subiendo..."
                    : "Subir resultado"}
                </span>
              </button>
            </form>
          </article>
        </section>
      ) : (
        <div className="admin-preview-banner">
          <ShieldCheck
            size={18}
          />

          <span>
            Puedes consultar el registro, pero solo Administrador y Laboratorista pueden subir o liberar resultados.
          </span>
        </div>
      )}

      {message ? (
        <div
          className={[
            "admin-master-message",
            "admin-config-message",
            `is-${messageType}`,
          ].join(" ")}
          role="status"
        >
          {message}
        </div>
      ) : null}

      <article className="admin-panel admin-results-list-panel">
        <header className="admin-results-list-toolbar">
          <div>
            <strong>
              Resultados cargados
            </strong>

            <span>
              {loadingResults
                ? "Cargando..."
                : `${filteredResults.length} registro(s)`}
            </span>
          </div>

          <div className="admin-results-list-controls">
            <div className="admin-search-control">
              <Search size={17} />

              <input
                type="search"
                value={
                  resultSearch
                }
                onChange={(
                  event,
                ) =>
                  setResultSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Paciente, cedula, orden o estudio..."
              />
            </div>

            <select
              className="admin-result-status-filter"
              value={
                statusFilter
              }
              onChange={(
                event,
              ) =>
                setStatusFilter(
                  event.target
                    .value,
                )
              }
            >
              <option value="all">
                Todos
              </option>

              <option value="draft">
                Borradores
              </option>

              <option value="released">
                Liberados
              </option>

              <option value="cancelled">
                Cancelados
              </option>
            </select>
          </div>
        </header>

        <div className="admin-results-table-wrap">
          <table className="admin-results-table">
            <thead>
              <tr>
                <th>
                  Paciente
                </th>
                <th>
                  Orden
                </th>
                <th>
                  Estudio
                </th>
                <th>
                  Fecha
                </th>
                <th>
                  Estado
                </th>
                <th>
                  PDF
                </th>
                <th
                  aria-label="Acciones"
                />
              </tr>
            </thead>

            <tbody>
              {!loadingResults &&
              pagedResults.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="admin-result-empty"
                  >
                    No hay resultados para mostrar.
                  </td>
                </tr>
              ) : null}

              {pagedResults.map(
                (result) => {
                  const order =
                    result.result_orders;

                  const patient =
                    order?.patients;

                  return (
                    <tr
                      key={
                        result.id
                      }
                    >
                      <td
                        data-label="Paciente"
                      >
                        <strong className="admin-result-patient-name">
                          {patientFullName(
                            patient,
                          )}
                        </strong>

                        <small>
                          C.I.{" "}
                          {
                            patient?.identification_number
                          }
                        </small>
                      </td>

                      <td
                        data-label="Orden"
                      >
                        <div className="admin-result-order-number">
                          <strong>
                            {
                              order?.order_number
                            }
                          </strong>

                          <button
                            type="button"
                            onClick={() =>
                              copyOrderNumber(
                                order?.order_number,
                              )
                            }
                            title="Copiar orden"
                          >
                            <Clipboard
                              size={14}
                            />
                          </button>
                        </div>
                      </td>

                      <td
                        data-label="Estudio"
                      >
                        <strong>
                          {
                            result.study_name_snapshot
                          }
                        </strong>

                        <small>
                          {
                            result.original_file_name
                          }
                          {" - "}
                          {formatBytes(
                            result.file_size_bytes,
                          )}
                        </small>
                      </td>

                      <td
                        data-label="Fecha"
                      >
                        <span>
                          {formatDate(
                            result.result_date,
                          )}
                        </span>

                        <small>
                          Subido{" "}
                          {formatDateTime(
                            result.uploaded_at,
                          )}
                        </small>
                      </td>

                      <td
                        data-label="Estado"
                      >
                        <span
                          className={[
                            "admin-result-status",
                            `is-${result.status}`,
                          ].join(
                            " ",
                          )}
                        >
                          {result.status ===
                          "released"
                            ? "Liberado"
                            : result.status ===
                                "draft"
                              ? "Borrador"
                              : "Cancelado"}
                        </span>
                      </td>

                      <td
                        data-label="PDF"
                      >
                        {canManage ? (
                          <button
                            type="button"
                            className="admin-result-view-button"
                            onClick={() =>
                              viewPdf(
                                result,
                              )
                            }
                            disabled={
                              busyResultId ===
                              result.id
                            }
                          >
                            <Eye
                              size={15}
                            />
                            <span>
                              Ver PDF
                            </span>
                          </button>
                        ) : (
                          <span className="admin-result-metadata-only">
                            Restringido
                          </span>
                        )}
                      </td>

                      <td
                        data-label="Acciones"
                      >
                        {canManage &&
                        result.status ===
                          "draft" ? (
                          <button
                            type="button"
                            className="admin-button admin-button--primary admin-result-release-button"
                            onClick={() =>
                              releaseResult(
                                result,
                              )
                            }
                            disabled={
                              busyResultId ===
                              result.id
                            }
                          >
                            <CheckCircle2
                              size={15}
                            />

                            <span>
                              Liberar
                            </span>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-pagination">
          <span className="admin-table-pagination__summary">
            {filteredResults.length ===
            0
              ? "0 registros"
              : `${startItem}-${endItem} de ${filteredResults.length}`}
          </span>

          <div className="admin-table-pagination__controls">
            <button
              type="button"
              className="admin-pagination-button"
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                )
              }
              disabled={
                page <= 1
              }
              aria-label="Pagina anterior"
            >
              <ChevronLeft
                size={18}
              />
            </button>

            <span className="admin-table-pagination__page">
              Pagina {page} de{" "}
              {pageCount}
            </span>

            <button
              type="button"
              className="admin-pagination-button"
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      pageCount,
                      current + 1,
                    ),
                )
              }
              disabled={
                page >=
                pageCount
              }
              aria-label="Pagina siguiente"
            >
              <ChevronRight
                size={18}
              />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}