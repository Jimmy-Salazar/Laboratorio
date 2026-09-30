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
import "../styles/admin-result-unified.css";

/* PATCH_06_47_RESULTS_WITHOUT_STUDY */

/* PATCH_06_21_1_REMOVE_SECURITY_CARD */
/* PATCH_06_21_2_REMOVE_IMMEDIATE_RELEASE */

const PAGE_SIZE = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ADMIN_RESULT_BRANCH_PREFIX = "GYE";

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
    ["admin", "secretary", "laboratorist"].includes(
      profile?.role,
    );

  const canRelease =
    ["admin", "secretary", "laboratorist"].includes(
      profile?.role,
    );

  const [branches, setBranches] =
    useState([]);
  const [selectedBranchId, setSelectedBranchId] =
    useState("");
  const [uploadMode, setUploadMode] =
    useState("single");

  const [bulkRows, setBulkRows] =
    useState([]);
  const [bulkProcessing, setBulkProcessing] =
    useState(false);

  const [patientSearch, setPatientSearch] =
    useState("");
  const [patientMatches, setPatientMatches] =
    useState([]);
  const [searchingPatients, setSearchingPatients] =
    useState(false);
  const [selectedPatient, setSelectedPatient] =
    useState(null);
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

  const loadBranches =
    useCallback(async () => {
      const {
        data,
        error,
      } = await supabase
        .from("branches")
        .select(
          "id, name_es, result_order_prefix, active, sort_order",
        )
        .eq(
          "active",
          true,
        )
        .not(
          "result_order_prefix",
          "is",
          null,
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
        setBranches([]);
        setMessage(
          "No fue posible cargar las sucursales.",
        );
        setMessageType(
          "error",
        );
        return;
      }

      setBranches(
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
              branch_id,
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
    loadResults();
    loadBranches();
  }, [
    loadResults,
    loadBranches,
  ]);

  useEffect(() => {
    if (!profile) {
      setSelectedBranchId("");
      return;
    }

    const branchId = profile.role === "admin"
      ? branches.find(
          (branch) =>
            branch.result_order_prefix === ADMIN_RESULT_BRANCH_PREFIX,
        )?.id
      : profile.branch_id;

    setSelectedBranchId(
      branchId && branches.some((branch) => branch.id === branchId)
        ? branchId
        : "",
    );
  }, [
    profile,
    branches,
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
    setPatientSearch(patientFullName(patient));
    setPatientMatches([]);
  }

  function clearPatient() {
    setSelectedPatient(null);
    setPatientSearch("");
    setPatientMatches([]);
  }

  function branchById(
    branchId,
  ) {
    return branches.find(
      (branch) =>
        branch.id === branchId,
    ) ?? null;
  }

  function branchLabel(
    branchId,
  ) {
    const branch =
      branchById(
        branchId,
      );

    if (!branch) {
      return "-";
    }

    return branch.result_order_prefix
      ? `${branch.result_order_prefix} - ${branch.name_es}`
      : branch.name_es;
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

    if (!selectedBranchId) {
      setMessage(
        "Selecciona la sucursal.",
      );
      setMessageType(
        "error",
      );
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
      "create_uploaded_patient_result_v2",
      {
        p_order_id:
          orderId,
        p_patient_id:
          selectedPatient.id,
        p_branch_id:
          selectedBranchId,
        p_study_id: null,
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

    clearPatient();
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

  function handleBulkFiles(
    event,
  ) {
    const files =
      Array.from(
        event.target.files ?? [],
      );

    setMessage("");

    if (files.length === 0) {
      return;
    }

    const invalid =
      files.find(
        (file) =>
          file.type !==
            "application/pdf" ||
          file.size >
            MAX_FILE_SIZE,
      );

    if (invalid) {
      setMessage(
        "Todos los archivos deben ser PDF y pesar maximo 20 MB cada uno.",
      );
      setMessageType(
        "error",
      );
      event.target.value = "";
      return;
    }

    const rows = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
      orderNumber: "",
      error: "",
    }));

    setBulkRows(
      rows,
    );
  }

  function updateBulkRow(
    rowId,
    patch,
  ) {
    setBulkRows(
      (current) =>
        current.map(
          (row) =>
            row.id === rowId
              ? {
                  ...row,
                  ...patch,
                }
              : row,
        ),
    );
  }

  function startNewBulkBatch() {
    if (bulkProcessing) return;
    if (
      bulkRows.some((row) => row.status !== "success") &&
      !window.confirm("¿Descartar los PDF pendientes o fallidos y empezar otro lote?")
    ) return;

    setBulkRows([]);
    clearPatient();
    const input = document.getElementById("result-bulk-pdf-input");
    if (input) input.value = "";
    setMessage("");
  }

  function removeBulkRow(
    rowId,
  ) {
    if (bulkProcessing) {
      return;
    }

    setBulkRows(
      (current) =>
        current.filter(
          (row) =>
            row.id !== rowId,
        ),
    );
  }

  async function processBulkResults(
    event,
  ) {
    event.preventDefault();

    if (
      bulkProcessing ||
      !canManage
    ) {
      return;
    }

    if (!selectedBranchId) {
      setMessage(
        "Selecciona la sucursal.",
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

    const pendingRows =
      bulkRows.filter(
        (row) =>
          row.status !==
          "success",
      );

    if (
      pendingRows.length === 0
    ) {
      setMessage(
        "No hay resultados pendientes para procesar.",
      );
      setMessageType(
        "info",
      );
      return;
    }

    if (!selectedPatient) {
      setMessage("Selecciona el paciente para todos los PDF del lote.");
      setMessageType("error");
      return;
    }

    setBulkProcessing(
      true,
    );
    setMessage("");

    let successCount = 0;
    let errorCount = 0;

    for (
      const row of pendingRows
    ) {
      updateBulkRow(
        row.id,
        {
          status:
            "uploading",
          error:
            "",
          orderNumber:
            "",
        },
      );

      const orderId =
        crypto.randomUUID();

      const fileToken =
        crypto.randomUUID();

      const filePath =
        `${selectedPatient.id}/${orderId}/${fileToken}.pdf`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            "patient-results",
          )
          .upload(
            filePath,
            row.file,
            {
              contentType:
                "application/pdf",
              upsert:
                false,
            },
          );

      if (uploadError) {
        console.error(
          uploadError,
        );

        errorCount +=
          1;

        updateBulkRow(
          row.id,
          {
            status:
              "error",
            error:
              "No fue posible subir el PDF.",
          },
        );

        continue;
      }

      const {
        data,
        error:
          rpcError,
      } =
        await supabase.rpc(
          "create_uploaded_patient_result_v2",
          {
            p_order_id:
              orderId,
            p_patient_id:
              selectedPatient.id,
            p_branch_id:
              selectedBranchId,
            p_study_id:
              null,
            p_result_date:
              resultDate,
            p_file_path:
              filePath,
            p_original_file_name:
              row.file.name,
            p_file_size_bytes:
              row.file.size,
            p_release:
              false,
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

        errorCount +=
          1;

        updateBulkRow(
          row.id,
          {
            status:
              "error",
            error:
              "No fue posible registrar el resultado.",
          },
        );

        continue;
      }

      const created =
        Array.isArray(
          data,
        )
          ? data[0]
          : data;

      successCount +=
        1;

      updateBulkRow(
        row.id,
        {
          status:
            "success",
          orderNumber:
            created?.order_number ??
            "",
          error:
            "",
        },
      );
    }

    setBulkProcessing(
      false,
    );

    await loadResults();

    if (
      errorCount === 0
    ) {
      setMessage(
        `${successCount} resultado(s) cargado(s) correctamente.`,
      );
      setMessageType(
        "success",
      );
    }
    else if (
      successCount > 0
    ) {
      setMessage(
        `${successCount} resultado(s) correctos y ${errorCount} con error. Puedes reintentar solo los fallidos.`,
      );
      setMessageType(
        "error",
      );
    }
    else {
      setMessage(
        `No fue posible procesar ${errorCount} resultado(s). Revisa los errores e intenta nuevamente.`,
      );
      setMessageType(
        "error",
      );
    }
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
      !canRelease ||
      busyResultId
    ) {
      return;
    }

    setBusyResultId(
      result.id,
    );

    setMessage("");

    const {
      error: releaseError,
    } =
      await supabase.rpc(
        "release_patient_result",
        {
          p_result_id:
            result.id,
        },
      );

    if (releaseError) {
      console.error(
        releaseError,
      );

      setBusyResultId(
        null,
      );

      setMessage(
        "No fue posible liberar el resultado.",
      );

      setMessageType(
        "error",
      );

      return;
    }

    let notificationStatus =
      "unknown";

    try {
      const {
        data:
          notificationData,

        error:
          notificationError,
      } =
        await supabase.functions.invoke(
          "notify-released-result",
          {
            body: {
              resultId:
                result.id,
            },
          },
        );

      if (
        notificationError
      ) {
        throw notificationError;
      }

      notificationStatus =
        notificationData
          ?.notificationStatus ??
        "unknown";
    }
    catch (
      notificationError
    ) {
      console.error(
        "Resultado liberado, pero fallo el correo:",
        notificationError,
      );

      notificationStatus =
        "failed";
    }

    setBusyResultId(
      null,
    );

    if (
      notificationStatus ===
      "sent"
    ) {
      setMessage(
        "Resultado liberado y correo de aviso enviado al paciente.",
      );

      setMessageType(
        "success",
      );
    }
    else if (
      notificationStatus ===
      "already_sent"
    ) {
      setMessage(
        "Resultado liberado. El correo de aviso ya habia sido enviado.",
      );

      setMessageType(
        "success",
      );
    }
    else if (
      notificationStatus ===
      "no_email"
    ) {
      setMessage(
        "Resultado liberado. El paciente no tiene un correo valido registrado.",
      );

      setMessageType(
        "success",
      );
    }
    else {
      setMessage(
        "Resultado liberado, pero no fue posible enviar el correo de aviso.",
      );

      setMessageType(
        "error",
      );
    }

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

          const branch =
            branchById(
              order?.branch_id,
            );

          const haystack = [
            order?.order_number,
            branch?.name_es,
            branch?.result_order_prefix,
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
      branches,
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

  const bulkHasSuccess = bulkRows.some((row) => row.status === "success");
  const patientLocked = uploading || bulkProcessing || bulkHasSuccess;

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
            onClick={() => {
              loadResults();
              loadBranches();
            }}
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
                    Subir resultados
                  </h2>

                  <p>
                    Orden interna automatica por sucursal y ano.
                  </p>
                </div>
              </div>
            </header>

            <div className="admin-result-upload-form">
              <label>
                <span>
                  Sucursal
                </span>

                <div className="admin-form-control">
                  <input
                    type="text"
                    value={
                      selectedBranchId
                        ? branchLabel(selectedBranchId)
                        : "Sin sucursal asignada"
                    }
                    readOnly
                    aria-label="Sucursal asignada automáticamente"
                  />
                </div>

                {selectedBranchId ? (
                  <small className="admin-result-help">
                    Sucursal aplicada automáticamente al iniciar sesión.
                  </small>
                ) : (
                  <small className="admin-result-help">
                    No hay una sucursal activa para esta cuenta. Consulta al administrador.
                  </small>
                )}
              </label>

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
                    disabled={patientLocked}
                  />

                  {selectedPatient ? (
                    <button
                      type="button"
                      onClick={
                        clearPatient
                      }
                      aria-label="Quitar paciente"
                      disabled={patientLocked}
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
                          disabled={patientLocked}
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

                {uploadMode === "bulk" ? (
                  <small className="admin-result-help">
                    Este paciente se asignará a todos los PDF del lote.
                  </small>
                ) : null}
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
                    disabled={patientLocked}
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

              <div className="admin-result-upload-mode">
                <button
                  type="button"
                  className={[
                    "admin-result-mode-button",
                    uploadMode ===
                    "single"
                      ? "is-active"
                      : "",
                  ].join(" ")}
                  onClick={() =>
                    setUploadMode(
                      "single",
                    )
                  }
                  disabled={
                    bulkProcessing ||
                    uploading ||
                    bulkHasSuccess
                  }
                >
                  Subir un resultado
                </button>

                <button
                  type="button"
                  className={[
                    "admin-result-mode-button",
                    uploadMode ===
                    "bulk"
                      ? "is-active"
                      : "",
                  ].join(" ")}
                  onClick={() =>
                    setUploadMode(
                      "bulk",
                    )
                  }
                  disabled={
                    bulkProcessing ||
                    uploading ||
                    bulkHasSuccess
                  }
                >
                  Subida masiva
                </button>
              </div>

              {uploadMode ===
              "single" ? (
                <form
                  className="admin-result-upload-form admin-result-upload-form--nested"
                  onSubmit={
                    uploadResult
                  }
                >
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
                      uploading ||
                      !selectedBranchId
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
              ) : (
                <form
                  className="admin-result-bulk-form"
                  onSubmit={
                    processBulkResults
                  }
                >
                  <div className="admin-result-bulk-top">
                    <label>
                      <span>
                        Archivos PDF
                      </span>

                      <div className="admin-result-file-control">
                        <FileText
                          size={21}
                        />

                        <div>
                          <strong>
                            {bulkRows.length >
                            0
                              ? `${bulkRows.length} PDF seleccionado(s)`
                              : "Seleccionar varios PDF"}
                          </strong>

                          <small>
                            Cada PDF puede pesar hasta 20 MB
                          </small>
                        </div>

                        <input
                          id="result-bulk-pdf-input"
                          type="file"
                          accept="application/pdf,.pdf"
                          multiple
                          onChange={
                            handleBulkFiles
                          }
                          disabled={
                            bulkProcessing ||
                            bulkHasSuccess
                          }
                        />
                      </div>
                    </label>
                  </div>

                  {bulkRows.length >
                  0 ? (
                    <div className="admin-result-bulk-list">
                      {bulkRows.map(
                        (row) => (
                          <article
                            className={[
                              "admin-result-bulk-row",
                              `is-${row.status}`,
                            ].join(" ")}
                            key={
                              row.id
                            }
                          >
                            <div className="admin-result-bulk-file">
                              <FileText
                                size={18}
                              />

                              <span>
                                <strong>
                                  {row.file.name}
                                </strong>

                                <small>
                                  {formatBytes(
                                    row.file.size,
                                  )}
                                </small>
                              </span>
                            </div>

                            <div className="admin-result-bulk-status">
                              {row.status ===
                              "success" ? (
                                <>
                                  <CheckCircle2
                                    size={17}
                                  />
                                  <strong>
                                    {row.orderNumber}
                                  </strong>
                                </>
                              ) : row.status ===
                                "uploading" ? (
                                <span>
                                  Subiendo...
                                </span>
                              ) : row.status ===
                                "error" ? (
                                <>
                                  <strong>
                                    Error
                                  </strong>
                                  <small>
                                    {row.error}
                                  </small>
                                </>
                              ) : selectedPatient ? (
                                <span>
                                  Listo
                                </span>
                              ) : (
                                <span>
                                  Pendiente
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              className="admin-result-bulk-remove"
                              onClick={() =>
                                removeBulkRow(
                                  row.id,
                                )
                              }
                              disabled={
                                bulkProcessing ||
                                row.status ===
                                  "success"
                              }
                              aria-label="Quitar archivo"
                              title={
                                row.status ===
                                "success"
                                  ? "El resultado ya fue procesado"
                                  : "Quitar archivo"
                              }
                            >
                              <X
                                size={16}
                              />
                            </button>
                          </article>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="admin-result-bulk-empty">
                      Selecciona varios PDF para preparar la carga masiva.
                    </div>
                  )}

                  <button
                    type="submit"
                    className="admin-button admin-button--primary admin-result-submit"
                    disabled={
                      bulkProcessing ||
                      !selectedBranchId ||
                      !selectedPatient ||
                      bulkRows.length ===
                        0 ||
                      bulkRows.every(
                        (row) =>
                          row.status ===
                          "success",
                      )
                    }
                  >
                    <Upload
                      size={18}
                    />

                    <span>
                      {bulkProcessing
                        ? "Procesando..."
                        : `Procesar ${bulkRows.filter(
                            (row) =>
                              row.status !==
                              "success",
                          ).length} resultado(s)`}
                    </span>
                  </button>

                  {bulkRows.length > 0 ? (
                    <button
                      type="button"
                      className="admin-button admin-button--secondary"
                      onClick={startNewBulkBatch}
                      disabled={bulkProcessing}
                    >
                      Nuevo lote
                    </button>
                  ) : null}
                </form>
              )}
            </div>
          </article>
        </section>
      ) : (
        <div className="admin-preview-banner">
          <ShieldCheck
            size={18}
          />

          <span>
            Tu usuario no tiene permiso para cargar resultados.
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
                placeholder="Paciente, cedula u orden..."
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
                  Sucursal
                </th>
                <th>
                  Archivo
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
                    colSpan="8"
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
                        data-label="Sucursal"
                      >
                        <strong>
                          {branchLabel(
                            order?.branch_id,
                          )}
                        </strong>
                      </td>

                      <td
                        data-label="Archivo"
                      >
                        <strong>
                          {
                            result.original_file_name
                          }
                        </strong>

                        <small>
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
                        {canRelease &&
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
