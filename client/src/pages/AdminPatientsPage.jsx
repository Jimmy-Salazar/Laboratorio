import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

const PAGE_SIZE = 10;

const emptyForm = {
  identificationType: "cedula",
  identificationNumber: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  sex: "not_specified",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const sexLabels = {
  male: "Masculino",
  female: "Femenino",
  other: "Otro",
  not_specified: "No especificado",
};

const identificationLabels = {
  cedula: "Cedula",
  passport: "Pasaporte",
  other: "Otro",
};

function calculateAge(value) {
  if (!value) {
    return null;
  }

  const birth =
    new Date(`${value}T00:00:00`);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const month =
    today.getMonth() -
    birth.getMonth();

  if (
    month < 0 ||
    (
      month === 0 &&
      today.getDate() <
        birth.getDate()
    )
  ) {
    age -= 1;
  }

  return age >= 0
    ? age
    : null;
}

function cleanSearchTerm(value) {
  return String(value ?? "")
    .replace(/[%_,()]/g, "")
    .trim();
}

export default function AdminPatientsPage() {
  const { profile } =
    useAdminAuth();

  const canManage =
    ["admin", "secretary"].includes(
      profile?.role,
    );

  const [patients, setPatients] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [busyId, setBusyId] =
    useState(null);

  const [search, setSearch] =
    useState("");
  const [status, setStatus] =
    useState("active");
  const [page, setPage] =
    useState(1);
  const [total, setTotal] =
    useState(0);

  const [editorOpen, setEditorOpen] =
    useState(false);
  const [editingPatient, setEditingPatient] =
    useState(null);
  const [form, setForm] =
    useState(emptyForm);

  const [message, setMessage] =
    useState("");
  const [messageType, setMessageType] =
    useState("info");

  const pageCount = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(total / PAGE_SIZE),
      ),
    [total],
  );

  const loadPatients =
    useCallback(async () => {
      setLoading(true);

      const from =
        (page - 1) * PAGE_SIZE;
      const to =
        from + PAGE_SIZE - 1;

      let query = supabase
        .from("patients")
        .select(
          "id, identification_type, identification_number, first_name, last_name, birth_date, sex, phone, email, address, notes, active, created_at, updated_at",
          { count: "exact" },
        )
        .order("last_name", {
          ascending: true,
        })
        .order("first_name", {
          ascending: true,
        })
        .range(from, to);

      if (status === "active") {
        query =
          query.eq(
            "active",
            true,
          );
      }

      if (status === "inactive") {
        query =
          query.eq(
            "active",
            false,
          );
      }

      const term =
        cleanSearchTerm(search);

      if (term) {
        query =
          query.or(
            [
              `first_name.ilike.%${term}%`,
              `last_name.ilike.%${term}%`,
              `identification_number.ilike.%${term}%`,
              `phone.ilike.%${term}%`,
            ].join(","),
          );
      }

      const {
        data,
        error,
        count,
      } = await query;

      if (error) {
        console.error(error);
        setPatients([]);
        setTotal(0);
        setMessage(
          "No fue posible cargar los pacientes.",
        );
        setMessageType("error");
        setLoading(false);
        return;
      }

      setPatients(data ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    }, [
      page,
      search,
      status,
    ]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreate() {
    if (!canManage) {
      return;
    }

    setEditingPatient(null);
    setForm(emptyForm);
    setMessage("");
    setEditorOpen(true);
  }

  function openEdit(patient) {
    if (!canManage) {
      return;
    }

    setEditingPatient(patient);

    setForm({
      identificationType:
        patient.identification_type ??
        "cedula",
      identificationNumber:
        patient.identification_number ??
        "",
      firstName:
        patient.first_name ?? "",
      lastName:
        patient.last_name ?? "",
      birthDate:
        patient.birth_date ?? "",
      sex:
        patient.sex ??
        "not_specified",
      phone:
        patient.phone ?? "",
      email:
        patient.email ?? "",
      address:
        patient.address ?? "",
      notes:
        patient.notes ?? "",
    });

    setMessage("");
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) {
      return;
    }

    setEditorOpen(false);
    setEditingPatient(null);
    setForm(emptyForm);
  }

  function validateForm() {
    const identification =
      form.identificationNumber.trim();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      return "Nombres y apellidos son obligatorios.";
    }

    if (!identification) {
      return "La identificacion es obligatoria.";
    }

    if (
      form.identificationType ===
        "cedula" &&
      !/^\d{10}$/.test(
        identification.replace(
          /\D/g,
          "",
        ),
      )
    ) {
      return "La cedula debe tener 10 digitos.";
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      return "El correo electronico no es valido.";
    }

    if (
      form.birthDate &&
      new Date(
        `${form.birthDate}T00:00:00`,
      ) > new Date()
    ) {
      return "La fecha de nacimiento no puede estar en el futuro.";
    }

    return null;
  }

  async function savePatient(event) {
    event.preventDefault();

    if (
      saving ||
      !canManage
    ) {
      return;
    }

    const validation =
      validateForm();

    if (validation) {
      setMessage(validation);
      setMessageType("error");
      return;
    }

    const payload = {
      identification_type:
        form.identificationType,
      identification_number:
        form.identificationNumber.trim(),
      first_name:
        form.firstName.trim(),
      last_name:
        form.lastName.trim(),
      birth_date:
        form.birthDate || null,
      sex:
        form.sex,
      phone:
        form.phone.trim() || null,
      email:
        form.email.trim() || null,
      address:
        form.address.trim() || null,
      notes:
        form.notes.trim() || null,
    };

    setSaving(true);
    setMessage("");

    let response;

    if (editingPatient) {
      response = await supabase
        .from("patients")
        .update(payload)
        .eq(
          "id",
          editingPatient.id,
        );
    } else {
      response = await supabase
        .from("patients")
        .insert({
          ...payload,
          active: true,
        });
    }

    setSaving(false);

    if (response.error) {
      console.error(
        response.error,
      );

      setMessage(
        response.error.code ===
          "23505"
          ? "Ya existe un paciente con esa identificacion."
          : "No fue posible guardar el paciente.",
      );
      setMessageType("error");
      return;
    }

    setEditorOpen(false);
    setEditingPatient(null);
    setForm(emptyForm);

    setMessage(
      editingPatient
        ? "Paciente actualizado."
        : "Paciente registrado.",
    );
    setMessageType("success");

    await loadPatients();
  }

  async function togglePatient(patient) {
    if (
      busyId ||
      !canManage
    ) {
      return;
    }

    setBusyId(patient.id);
    setMessage("");

    const { error } =
      await supabase
        .from("patients")
        .update({
          active:
            !patient.active,
        })
        .eq(
          "id",
          patient.id,
        );

    setBusyId(null);

    if (error) {
      console.error(error);
      setMessage(
        "No fue posible cambiar el estado del paciente.",
      );
      setMessageType("error");
      return;
    }

    setMessage(
      patient.active
        ? "Paciente desactivado."
        : "Paciente reactivado.",
    );
    setMessageType("success");

    await loadPatients();
  }

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
    <div className="admin-patients-page">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            Pacientes
          </span>

          <h1>
            Registro de pacientes
          </h1>

          <p>
            {
              "Ficha maestra para identificar y consultar a cada paciente."
            }
          </p>
        </div>

        <div className="admin-page-heading__actions">
          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={loadPatients}
            disabled={loading}
          >
            <RefreshCw size={17} />
            <span>Actualizar</span>
          </button>

          {canManage ? (
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={openCreate}
            >
              <Plus size={17} />
              <span>Nuevo paciente</span>
            </button>
          ) : null}
        </div>
      </section>

      <article className="admin-panel admin-patients-panel">
        <header className="admin-patients-toolbar">
          <div>
            <strong>Pacientes</strong>
            <span>
              {loading
                ? "Cargando..."
                : `${total} registro(s)`}
            </span>
          </div>

          <div className="admin-patients-toolbar__controls">
            <div className="admin-search-control">
              <Search size={17} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Nombre, cedula o telefono..."
              />
            </div>

            <select
              className="admin-patient-status-filter"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value,
                )
              }
            >
              <option value="active">
                Activos
              </option>
              <option value="inactive">
                Inactivos
              </option>
              <option value="all">
                Todos
              </option>
            </select>
          </div>
        </header>

        <div className="admin-patients-table-wrap">
          <table className="admin-patients-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Identificacion</th>
                <th>Contacto</th>
                <th>Edad / Sexo</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>

            <tbody>
              {!loading &&
              patients.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="admin-patient-empty"
                  >
                    <UserRound size={27} />
                    <span>
                      No hay pacientes para mostrar.
                    </span>
                  </td>
                </tr>
              ) : null}

              {patients.map((patient) => {
                const age =
                  calculateAge(
                    patient.birth_date,
                  );

                return (
                  <tr key={patient.id}>
                    <td data-label="Paciente">
                      <strong className="admin-patient-name">
                        {patient.last_name}
                        {", "}
                        {patient.first_name}
                      </strong>

                      {patient.email ? (
                        <small>
                          {patient.email}
                        </small>
                      ) : null}
                    </td>

                    <td data-label="Identificacion">
                      <strong>
                        {patient.identification_number}
                      </strong>

                      <small>
                        {identificationLabels[
                          patient.identification_type
                        ] ??
                          patient.identification_type}
                      </small>
                    </td>

                    <td data-label="Contacto">
                      <span>
                        {patient.phone ||
                          "Sin telefono"}
                      </span>

                      {patient.address ? (
                        <small>
                          {patient.address}
                        </small>
                      ) : null}
                    </td>

                    <td data-label="Edad / Sexo">
                      <span>
                        {age === null
                          ? "Edad no registrada"
                          : `${age} anios`}
                      </span>

                      <small>
                        {sexLabels[
                          patient.sex
                        ] ??
                          patient.sex}
                      </small>
                    </td>

                    <td data-label="Estado">
                      <span
                        className={[
                          "admin-patient-status",
                          patient.active
                            ? "is-active"
                            : "is-inactive",
                        ].join(" ")}
                      >
                        {patient.active
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </td>

                    <td data-label="Acciones">
                      {canManage ? (
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="admin-table-icon-button is-edit"
                            onClick={() =>
                              openEdit(
                                patient,
                              )
                            }
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            className={[
                              "admin-table-icon-button",
                              patient.active
                                ? "is-delete"
                                : "is-save",
                            ].join(" ")}
                            onClick={() =>
                              togglePatient(
                                patient,
                              )
                            }
                            disabled={
                              busyId ===
                              patient.id
                            }
                            title={
                              patient.active
                                ? "Desactivar"
                                : "Reactivar"
                            }
                          >
                            {patient.active ? (
                              <UserRoundX size={16} />
                            ) : (
                              <UserRoundCheck size={16} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="admin-patient-readonly">
                          Solo lectura
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
              <ChevronLeft size={18} />
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
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </article>

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

      {editorOpen ? (
        <div
          className="admin-patient-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditor();
            }
          }}
        >
          <section
            className="admin-patient-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-editor-title"
          >
            <header className="admin-patient-modal__header">
              <div>
                <span className="admin-panel__icon">
                  <UserRound size={20} />
                </span>

                <div>
                  <h2 id="patient-editor-title">
                    {editingPatient
                      ? "Editar paciente"
                      : "Nuevo paciente"}
                  </h2>

                  <p>
                    Datos de identificacion y contacto.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="admin-table-icon-button"
                onClick={closeEditor}
                disabled={saving}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </header>

            <form
              className="admin-patient-form"
              onSubmit={savePatient}
            >
              <div className="admin-form-two-columns">
                <label>
                  <span>
                    Tipo de identificacion
                  </span>

                  <div className="admin-form-control">
                    <select
                      value={
                        form.identificationType
                      }
                      onChange={(event) =>
                        updateForm(
                          "identificationType",
                          event.target.value,
                        )
                      }
                    >
                      <option value="cedula">
                        Cedula
                      </option>
                      <option value="passport">
                        Pasaporte
                      </option>
                      <option value="other">
                        Otro
                      </option>
                    </select>
                  </div>
                </label>

                <label>
                  <span>
                    Numero de identificacion
                  </span>

                  <div className="admin-form-control">
                    <input
                      type="text"
                      value={
                        form.identificationNumber
                      }
                      onChange={(event) =>
                        updateForm(
                          "identificationNumber",
                          event.target.value,
                        )
                      }
                      inputMode={
                        form.identificationType ===
                        "cedula"
                          ? "numeric"
                          : "text"
                      }
                    />
                  </div>
                </label>
              </div>

              <div className="admin-form-two-columns">
                <label>
                  <span>Nombres</span>

                  <div className="admin-form-control">
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(event) =>
                        updateForm(
                          "firstName",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </label>

                <label>
                  <span>Apellidos</span>

                  <div className="admin-form-control">
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(event) =>
                        updateForm(
                          "lastName",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </label>
              </div>

              <div className="admin-form-two-columns">
                <label>
                  <span>
                    Fecha de nacimiento
                  </span>

                  <div className="admin-form-control">
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(event) =>
                        updateForm(
                          "birthDate",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </label>

                <label>
                  <span>Sexo</span>

                  <div className="admin-form-control">
                    <select
                      value={form.sex}
                      onChange={(event) =>
                        updateForm(
                          "sex",
                          event.target.value,
                        )
                      }
                    >
                      <option value="not_specified">
                        No especificado
                      </option>
                      <option value="male">
                        Masculino
                      </option>
                      <option value="female">
                        Femenino
                      </option>
                      <option value="other">
                        Otro
                      </option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="admin-form-two-columns">
                <label>
                  <span>Telefono</span>

                  <div className="admin-form-control">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateForm(
                          "phone",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </label>

                <label>
                  <span>
                    Correo electronico
                  </span>

                  <div className="admin-form-control">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateForm(
                          "email",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </label>
              </div>

              <label>
                <span>Direccion</span>

                <div className="admin-form-control">
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) =>
                      updateForm(
                        "address",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </label>

              <label>
                <span>
                  Observaciones internas
                </span>

                <textarea
                  className="admin-patient-textarea"
                  value={form.notes}
                  onChange={(event) =>
                    updateForm(
                      "notes",
                      event.target.value,
                    )
                  }
                  rows="3"
                  placeholder="Opcional"
                />
              </label>

              {message &&
              messageType === "error" ? (
                <div className="admin-master-message admin-config-message is-error">
                  {message}
                </div>
              ) : null}

              <footer className="admin-patient-modal__actions">
                <button
                  type="button"
                  className="admin-button admin-button--secondary"
                  onClick={closeEditor}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="admin-button admin-button--primary"
                  disabled={saving}
                >
                  <Check size={17} />
                  <span>
                    {saving
                      ? "Guardando..."
                      : "Guardar paciente"}
                  </span>
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}