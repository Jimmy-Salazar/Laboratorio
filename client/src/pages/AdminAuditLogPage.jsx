import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ScrollText,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "../styles/admin.css";

const PAGE_SIZE = 20;

const actionLabels = {
  create: "Crear",
  edit: "Editar",
  delete: "Eliminar",
  upload: "Subir",
};

const roleLabels = {
  master: "Master",
  admin: "Administrador",
  secretary: "Secretaria",
  laboratorist: "Laboratorista",
};

const entityLabels = {
  branches: "Sucursales",
  specialties: "Especialidades",
  studies: "Estudios",
  branch_studies:
    "Estudios por sucursal",
  branch_hours: "Horarios",
  staff_profiles: "Usuarios",
  patients: "Pacientes",
  patient_results: "Resultados",
  result_orders: "Ordenes de resultados",
  appointments: "Citas",
  appointment_studies:
    "Estudios de cita",
};

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
      second: "2-digit",
      hour12: false,
    },
  ).format(new Date(value));
}

export default function AdminAuditLogPage() {
  const [rows, setRows] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [page, setPage] =
    useState(1);
  const [total, setTotal] =
    useState(0);
  const [action, setAction] =
    useState("all");
  const [message, setMessage] =
    useState("");

  const pageCount = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(total / PAGE_SIZE),
      ),
    [total],
  );

  const loadLogs =
    useCallback(async () => {
      setLoading(true);
      setMessage("");

      const from =
        (page - 1) * PAGE_SIZE;
      const to =
        from + PAGE_SIZE - 1;

      let query = supabase
        .from("audit_logs")
        .select(
          "id, actor_user_id, actor_name, actor_role, action, entity_type, entity_id, description, changed_fields, created_at",
          {
            count: "exact",
          },
        )
        .order("created_at", {
          ascending: false,
        })
        .range(from, to);

      if (action !== "all") {
        query =
          query.eq(
            "action",
            action,
          );
      }

      const {
        data,
        error,
        count,
      } = await query;

      if (error) {
        console.error(error);

        setRows([]);
        setTotal(0);
        setMessage(
          "No fue posible cargar el registro de actividad.",
        );
        setLoading(false);
        return;
      }

      setRows(data ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    }, [
      action,
      page,
    ]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [action]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [
    page,
    pageCount,
  ]);

  const startItem =
    total === 0
      ? 0
      : (page - 1) *
          PAGE_SIZE +
        1;

  const endItem =
    total === 0
      ? 0
      : Math.min(
          page * PAGE_SIZE,
          total,
        );

  return (
    <div className="admin-audit-page">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            {"Configuraci\u00f3n"}
          </span>

          <h1>
            Registro de actividad
          </h1>

          <p>
            {
              "Historial de acciones realizadas por los usuarios del sistema."
            }
          </p>
        </div>

        <div className="admin-page-heading__actions">
          <select
            className="admin-audit-filter"
            value={action}
            onChange={(event) =>
              setAction(
                event.target.value,
              )
            }
            aria-label="Filtrar por accion"
          >
            <option value="all">
              Todas las acciones
            </option>
            <option value="create">
              Crear
            </option>
            <option value="edit">
              Editar
            </option>
            <option value="delete">
              Eliminar
            </option>
            <option value="upload">
              Subir
            </option>
          </select>

          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw size={17} />

            <span>
              Actualizar
            </span>
          </button>
        </div>
      </section>

      <article className="admin-panel admin-audit-panel">
        <header className="admin-panel__header">
          <div>
            <span className="admin-panel__icon">
              <ScrollText size={20} />
            </span>

            <div>
              <h2>
                Actividad registrada
              </h2>

              <p>
                {loading
                  ? "Cargando..."
                  : `${total} registro(s)`}
              </p>
            </div>
          </div>
        </header>

        <div className="admin-audit-table-wrap">
          <table className="admin-audit-table">
            <thead>
              <tr>
                <th>
                  Fecha y hora
                </th>
                <th>Usuario</th>
                <th>{"Acci\u00f3n"}</th>
                <th>{"M\u00f3dulo"}</th>
                <th>Detalle</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
              rows.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="admin-audit-empty"
                  >
                    No hay actividad registrada.
                  </td>
                </tr>
              ) : null}

              {rows.map((row) => (
                <tr key={row.id}>
                  <td
                    data-label="Fecha y hora"
                    className="admin-audit-date"
                  >
                    {formatDateTime(
                      row.created_at,
                    )}
                  </td>

                  <td data-label="Usuario">
                    <strong className="admin-audit-user">
                      {row.actor_name ||
                        "Sistema"}
                    </strong>

                    <small className="admin-audit-role">
                      {roleLabels[
                        row.actor_role
                      ] ??
                        row.actor_role ??
                        "Sistema"}
                    </small>
                  </td>

                  <td
                    data-label="Accion"
                  >
                    <span
                      className={[
                        "admin-audit-action",
                        `is-${row.action}`,
                      ].join(" ")}
                    >
                      {actionLabels[
                        row.action
                      ] ??
                        row.action}
                    </span>
                  </td>

                  <td
                    data-label="Modulo"
                  >
                    {entityLabels[
                      row.entity_type
                    ] ??
                      row.entity_type}
                  </td>

                  <td
                    data-label="Detalle"
                    className="admin-audit-description"
                  >
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-table-pagination">
          <span className="admin-table-pagination__summary">
            {total === 0
              ? "0 registros"
              : `${startItem}-${endItem} de ${total}`}
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
                page <= 1 ||
                loading
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
                page >= pageCount ||
                loading
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

      {message ? (
        <div
          className="admin-master-message admin-config-message is-error"
          role="alert"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}