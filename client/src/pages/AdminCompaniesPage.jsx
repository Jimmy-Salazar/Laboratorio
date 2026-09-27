import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

const PAGE_SIZE = 10;

const emptyForm = {
  identificationType: "ruc",
  identificationNumber: "",
  legalName: "",
  tradeName: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const identificationLabels = {
  ruc: "RUC",
  cedula: "Cedula",
};

function cleanSearchTerm(value) {
  return String(value ?? "")
    .replace(/[%_,()]/g, "")
    .trim();
}

export default function AdminCompaniesPage() {
  const { profile } = useAdminAuth();

  const canManage =
    ["admin", "secretary"].includes(
      profile?.role,
    );

  const [companies, setCompanies] =
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

  const [editingCompany, setEditingCompany] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("info");

  const [sriLoading, setSriLoading] =
    useState(false);

  const [sriMessage, setSriMessage] =
    useState("");

  const [sriMessageType, setSriMessageType] =
    useState("info");

  const [sriInfo, setSriInfo] =
    useState(null);

  const [lastSriRuc, setLastSriRuc] =
    useState("");

  const pageCount =
    useMemo(
      () =>
        Math.max(
          1,
          Math.ceil(
            total / PAGE_SIZE,
          ),
        ),
      [total],
    );

  const loadCompanies =
    useCallback(async () => {
      setLoading(true);

      const from =
        (page - 1) * PAGE_SIZE;

      const to =
        from + PAGE_SIZE - 1;

      let query =
        supabase
          .from("companies")
          .select(
            [
              "id",
              "identification_type",
              "identification_number",
              "legal_name",
              "trade_name",
              "contact_name",
              "phone",
              "email",
              "address",
              "notes",
              "active",
              "created_at",
              "updated_at",
            ].join(","),
            {
              count: "exact",
            },
          )
          .order(
            "legal_name",
            {
              ascending: true,
            },
          )
          .range(
            from,
            to,
          );

      if (
        status === "active"
      ) {
        query =
          query.eq(
            "active",
            true,
          );
      }

      if (
        status === "inactive"
      ) {
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
              `legal_name.ilike.%${term}%`,
              `trade_name.ilike.%${term}%`,
              `identification_number.ilike.%${term}%`,
              `contact_name.ilike.%${term}%`,
              `phone.ilike.%${term}%`,
              `email.ilike.%${term}%`,
            ].join(","),
          );
      }

      const {
        data,
        error,
        count,
      } =
        await query;

      if (error) {
        console.error(error);

        setCompanies([]);
        setTotal(0);

        setMessage(
          "No fue posible cargar las empresas.",
        );

        setMessageType(
          "error",
        );

        setLoading(false);
        return;
      }

      setCompanies(
        data ?? [],
      );

      setTotal(
        count ?? 0,
      );

      setLoading(false);
    }, [
      page,
      search,
      status,
    ]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    status,
  ]);

  useEffect(() => {
    if (
      page > pageCount
    ) {
      setPage(
        pageCount,
      );
    }
  }, [
    page,
    pageCount,
  ]);

  const lookupCompanyInSri =
    useCallback(
      async (
        rawRuc,
        force = false,
      ) => {

        const ruc =
          String(
            rawRuc ?? "",
          )
            .replace(
              /\D/g,
              "",
            );

        if (
          !/^\d{13}$/.test(
            ruc,
          )
        ) {
          setSriMessage(
            "Ingrese un RUC de 13 digitos.",
          );

          setSriMessageType(
            "error",
          );

          return;
        }

        if (
          !force &&
          ruc === lastSriRuc
        ) {
          return;
        }

        setSriLoading(
          true,
        );

        setSriMessage(
          "Consultando directamente al SRI...",
        );

        setSriMessageType(
          "info",
        );

        try {

          const {
            data,
            error,
          } =
            await supabase
              .functions
              .invoke(
                "lookup-company-ruc",
                {
                  body: {
                    ruc,
                  },
                },
              );

          let errorBody =
            null;

          if (
            error?.context &&
            typeof error.context.json ===
              "function"
          ) {
            try {
              errorBody =
                await error.context.json();
            }
            catch {
              errorBody =
                null;
            }
          }

          if (
            error ||
            !data?.ok ||
            !data?.company
          ) {
            console.error(
              "SRI lookup:",
              error ??
                data,
            );

            setSriInfo(
              null,
            );

            setSriMessage(
              errorBody?.message ||
              data?.message ||
              "No fue posible obtener los datos del SRI.",
            );

            setSriMessageType(
              "error",
            );

            setLastSriRuc(
              ruc,
            );

            return;
          }

          const company =
            data.company;

          setForm(
            (current) => ({
              ...current,

              identificationType:
                "ruc",

              identificationNumber:
                ruc,

              legalName:
                company.legalName ||
                current.legalName,

              tradeName:
                company.tradeName ||
                current.tradeName,

              email:
                company.email ||
                current.email,

              phone:
                company.phone ||
                current.phone,

              address:
                company.address ||
                current.address,
            }),
          );

          setSriInfo({
            status:
              company.sriStatus ||
              "",

            taxpayerType:
              company.taxpayerType ||
              "",

            principalActivity:
              company.principalActivity ||
              "",

            accountingRequired:
              company.accountingRequired ||
              "",

            category:
              company.category ||
              "",

            consultedAt:
              company.consultedAt ||
              null,
          });

          setSriMessage(
            "Datos obtenidos directamente del SRI.",
          );

          setSriMessageType(
            "success",
          );

          setLastSriRuc(
            ruc,
          );

        }
        catch (error) {

          console.error(
            "SRI lookup:",
            error,
          );

          setSriInfo(
            null,
          );

          setSriMessage(
            "No fue posible consultar el SRI en este momento.",
          );

          setSriMessageType(
            "error",
          );

        }
        finally {

          setSriLoading(
            false,
          );

        }
      },
      [
        lastSriRuc,
      ],
    );


  /*
   * Consulta automatica:
   * se dispara cuando se completan los 13 digitos.
   */
  useEffect(() => {

    if (
      !editorOpen ||
      form.identificationType !==
        "ruc"
    ) {
      return;
    }

    const ruc =
      String(
        form.identificationNumber ??
        "",
      )
        .replace(
          /\D/g,
          "",
        );

    if (
      ruc.length !== 13
    ) {
      if (lastSriRuc) {
        setLastSriRuc("");
      }

      setSriInfo(
        null,
      );

      return;
    }

    if (
      ruc === lastSriRuc
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          lookupCompanyInSri(
            ruc,
          );
        },
        500,
      );

    return () =>
      window.clearTimeout(
        timer,
      );

  }, [
    editorOpen,
    form.identificationType,
    form.identificationNumber,
    lastSriRuc,
    lookupCompanyInSri,
  ]);


  useEffect(() => {

    if (!editorOpen) {
      setSriMessage("");
      setSriInfo(null);
      setLastSriRuc("");
      setSriLoading(false);
    }

  }, [
    editorOpen,
  ]);


  function updateForm(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function openCreate() {
    if (!canManage) {
      return;
    }

    setEditingCompany(
      null,
    );

    setForm(
      emptyForm,
    );

    setMessage("");

    setEditorOpen(
      true,
    );
  }

  function openEdit(
    company,
  ) {
    if (!canManage) {
      return;
    }

    setEditingCompany(
      company,
    );

    setForm({
      identificationType: "ruc",

      identificationNumber:
        company.identification_number ??
        "",

      legalName:
        company.legal_name ??
        "",

      tradeName:
        company.trade_name ??
        "",

      contactName:
        company.contact_name ??
        "",

      phone:
        company.phone ??
        "",

      email:
        company.email ??
        "",

      address:
        company.address ??
        "",

      notes:
        company.notes ??
        "",
    });

    setMessage("");

    setEditorOpen(
      true,
    );
  }

  function closeEditor() {
    if (saving) {
      return;
    }

    setEditorOpen(
      false,
    );

    setEditingCompany(
      null,
    );

    setForm(
      emptyForm,
    );
  }

  function validateForm() {
    const identification =
      form.identificationNumber
        .replace(
          /\D/g,
          "",
        );

    if (
      !form.legalName.trim()
    ) {
      return "La razon social es obligatoria.";
    }

    if (
      form.identificationType ===
        "ruc" &&
      !/^\d{13}$/.test(
        identification,
      )
    ) {
      return "El RUC debe tener 13 digitos.";
    }

    if (
      form.identificationType ===
        "cedula" &&
      !/^\d{10}$/.test(
        identification,
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

    return null;
  }

  async function saveCompany(
    event,
  ) {
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
      setMessage(
        validation,
      );

      setMessageType(
        "error",
      );

      return;
    }

    const payload = {
      identification_type:
        form.identificationType,

      identification_number:
        form.identificationNumber.trim(),

      legal_name:
        form.legalName.trim(),

      trade_name:
        form.tradeName.trim() ||
        null,

      contact_name:
        form.contactName.trim() ||
        null,

      phone:
        form.phone.trim() ||
        null,

      email:
        form.email.trim() ||
        null,

      address:
        form.address.trim() ||
        null,

      notes:
        form.notes.trim() ||
        null,
    };

    setSaving(
      true,
    );

    setMessage("");

    let response;

    if (
      editingCompany
    ) {
      response =
        await supabase
          .from(
            "companies",
          )
          .update(
            payload,
          )
          .eq(
            "id",
            editingCompany.id,
          );
    }
    else {
      response =
        await supabase
          .from(
            "companies",
          )
          .insert({
            ...payload,
            active: true,
          });
    }

    setSaving(
      false,
    );

    if (
      response.error
    ) {
      console.error(
        response.error,
      );

      setMessage(
        response.error.code ===
          "23505"
          ? "Ya existe una empresa con esa identificacion."
          : "No fue posible guardar la empresa.",
      );

      setMessageType(
        "error",
      );

      return;
    }

    const wasEditing =
      Boolean(
        editingCompany,
      );

    setEditorOpen(
      false,
    );

    setEditingCompany(
      null,
    );

    setForm(
      emptyForm,
    );

    setMessage(
      wasEditing
        ? "Empresa actualizada."
        : "Empresa registrada.",
    );

    setMessageType(
      "success",
    );

    await loadCompanies();
  }

  async function toggleCompany(
    company,
  ) {
    if (
      busyId ||
      !canManage
    ) {
      return;
    }

    setBusyId(
      company.id,
    );

    setMessage("");

    const {
      error,
    } =
      await supabase
        .from(
          "companies",
        )
        .update({
          active:
            !company.active,
        })
        .eq(
          "id",
          company.id,
        );

    setBusyId(
      null,
    );

    if (error) {
      console.error(
        error,
      );

      setMessage(
        "No fue posible cambiar el estado de la empresa.",
      );

      setMessageType(
        "error",
      );

      return;
    }

    setMessage(
      company.active
        ? "Empresa desactivada."
        : "Empresa reactivada.",
    );

    setMessageType(
      "success",
    );

    await loadCompanies();
  }

  const startItem =
    total === 0
      ? 0
      : (
          page - 1
        ) *
          PAGE_SIZE +
        1;

  const endItem =
    total === 0
      ? 0
      : Math.min(
          page *
            PAGE_SIZE,
          total,
        );

  return (
    <div className="admin-patients-page">

      <section className="admin-page-heading">

        <div>

          <span className="admin-page-heading__eyebrow">
            Empresas
          </span>

          <h1>
            Clientes corporativos
          </h1>

          <p>
            Registro de empresas que envian trabajadores al laboratorio.
          </p>

        </div>


        <div className="admin-page-heading__actions">

          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={
              loadCompanies
            }
            disabled={
              loading
            }
          >
            <RefreshCw
              size={17}
            />

            <span>
              Actualizar
            </span>
          </button>


          {canManage ? (

            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={
                openCreate
              }
            >
              <Plus
                size={17}
              />

              <span>
                Nueva empresa
              </span>
            </button>

          ) : null}

        </div>

      </section>


      <article className="admin-panel admin-patients-panel">

        <header className="admin-patients-toolbar">

          <div>
            <strong>
              Empresas
            </strong>

            <span>
              {loading
                ? "Cargando..."
                : `${total} registro(s)`}
            </span>
          </div>


          <div className="admin-patients-toolbar__controls">

            <div className="admin-search-control">

              <Search
                size={17}
              />

              <input
                type="search"
                value={
                  search
                }
                onChange={
                  (event) =>
                    setSearch(
                      event.target.value,
                    )
                }
                placeholder="RUC, empresa, contacto..."
              />

            </div>


            <select
              className="admin-patient-status-filter"
              value={
                status
              }
              onChange={
                (event) =>
                  setStatus(
                    event.target.value,
                  )
              }
            >
              <option value="active">
                Activas
              </option>

              <option value="inactive">
                Inactivas
              </option>

              <option value="all">
                Todas
              </option>
            </select>

          </div>

        </header>


        <div className="admin-patients-table-wrap">

          <table className="admin-patients-table">

            <thead>
              <tr>
                <th>
                  Empresa
                </th>

                <th>
                  Identificacion
                </th>

                <th>
                  Contacto
                </th>

                <th>
                  Direccion
                </th>

                <th>
                  Estado
                </th>

                <th
                  aria-label="Acciones"
                />
              </tr>
            </thead>


            <tbody>

              {!loading &&
              companies.length ===
                0 ? (

                <tr>
                  <td
                    colSpan="6"
                    className="admin-patient-empty"
                  >
                    <Building2
                      size={27}
                    />

                    <span>
                      No hay empresas para mostrar.
                    </span>
                  </td>
                </tr>

              ) : null}


              {companies.map(
                (company) => (

                  <tr
                    key={
                      company.id
                    }
                  >

                    <td
                      data-label="Empresa"
                    >
                      <strong className="admin-patient-name">
                        {
                          company.legal_name
                        }
                      </strong>

                      {company.trade_name ? (
                        <small>
                          {
                            company.trade_name
                          }
                        </small>
                      ) : null}
                    </td>


                    <td
                      data-label="Identificacion"
                    >
                      <strong>
                        {
                          company.identification_number
                        }
                      </strong>

                      <small>
                        {
                          identificationLabels[
                            company.identification_type
                          ] ??
                          company.identification_type
                        }
                      </small>
                    </td>


                    <td
                      data-label="Contacto"
                    >
                      <span>
                        {
                          company.contact_name ||
                          "Sin contacto"
                        }
                      </span>

                      <small>
                        {
                          company.phone ||
                          company.email ||
                          "Sin telefono"
                        }
                      </small>
                    </td>


                    <td
                      data-label="Direccion"
                    >
                      <span>
                        {
                          company.address ||
                          "Sin direccion"
                        }
                      </span>
                    </td>


                    <td
                      data-label="Estado"
                    >
                      <span
                        className={[
                          "admin-patient-status",
                          company.active
                            ? "is-active"
                            : "is-inactive",
                        ].join(
                          " ",
                        )}
                      >
                        {
                          company.active
                            ? "Activa"
                            : "Inactiva"
                        }
                      </span>
                    </td>


                    <td
                      data-label="Acciones"
                    >

                      {canManage ? (

                        <div className="admin-table-actions">

                          <button
                            type="button"
                            className="admin-table-icon-button is-edit"
                            onClick={() =>
                              openEdit(
                                company,
                              )
                            }
                            title="Editar"
                          >
                            <Edit3
                              size={16}
                            />
                          </button>


                          <button
                            type="button"
                            className={[
                              "admin-table-icon-button",
                              company.active
                                ? "is-delete"
                                : "is-save",
                            ].join(
                              " ",
                            )}
                            onClick={() =>
                              toggleCompany(
                                company,
                              )
                            }
                            disabled={
                              busyId ===
                              company.id
                            }
                            title={
                              company.active
                                ? "Desactivar"
                                : "Reactivar"
                            }
                          >
                            {company.active ? (
                              <XCircle
                                size={16}
                              />
                            ) : (
                              <Check
                                size={16}
                              />
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

                ),
              )}

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
                page >=
                  pageCount ||
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
          className={[
            "admin-master-message",
            "admin-config-message",
            `is-${messageType}`,
          ].join(
            " ",
          )}
          role="status"
        >
          {message}
        </div>

      ) : null}


      {editorOpen ? (

        <div
          className="admin-patient-modal-backdrop"
          role="presentation"
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeEditor();
              }
            }
          }
        >

          <section
            className="admin-patient-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-editor-title"
          >

            <header className="admin-patient-modal__header">

              <div>

                <span className="admin-panel__icon">
                  <Building2
                    size={20}
                  />
                </span>


                <div>

                  <h2 id="company-editor-title">
                    {editingCompany
                      ? "Editar empresa"
                      : "Nueva empresa"}
                  </h2>

                  <p>
                    Datos generales del cliente corporativo.
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="admin-table-icon-button"
                onClick={
                  closeEditor
                }
                disabled={
                  saving
                }
                aria-label="Cerrar"
              >
                <X
                  size={18}
                />
              </button>

            </header>


            <form
              className="admin-patient-form admin-company-form"
              onSubmit={
                saveCompany
              }
            >

              <div className="admin-company-ruc-line">

                <span className="admin-company-ruc-label">
                  RUC
                </span>

                <div className="admin-form-control">

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={13}
                    value={
                      form.identificationNumber
                    }
                    onChange={
                      (event) =>
                        updateForm(
                          "identificationNumber",
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 13),
                        )
                    }
                    placeholder="13 digitos"
                  />

                </div>

              </div>


              {sriMessage ? (

                <small
                  className={[
                    "admin-company-sri-message",
                    `is-${sriMessageType}`,
                  ].join(" ")}
                >
                  {sriMessage}
                </small>

              ) : null}


              <label>
                <span>
                  Razon social
                </span>

                <div className="admin-form-control">

                  <input
                    type="text"
                    value={
                      form.legalName
                    }
                    onChange={
                      (event) =>
                        updateForm(
                          "legalName",
                          event.target.value,
                        )
                    }
                  />

                </div>
              </label>


              <label>
                <span>
                  Nombre comercial
                </span>

                <div className="admin-form-control">

                  <input
                    type="text"
                    value={
                      form.tradeName
                    }
                    onChange={
                      (event) =>
                        updateForm(
                          "tradeName",
                          event.target.value,
                        )
                    }
                  />

                </div>
              </label>


              <div className="admin-form-two-columns">

                <label>
                  <span>
                    Persona de contacto
                  </span>

                  <div className="admin-form-control">

                    <input
                      type="text"
                      value={
                        form.contactName
                      }
                      onChange={
                        (event) =>
                          updateForm(
                            "contactName",
                            event.target.value,
                          )
                      }
                    />

                  </div>
                </label>


                <label>
                  <span>
                    Telefono
                  </span>

                  <div className="admin-form-control">

                    <input
                      type="tel"
                      value={
                        form.phone
                      }
                      onChange={
                        (event) =>
                          updateForm(
                            "phone",
                            event.target.value,
                          )
                      }
                    />

                  </div>
                </label>

              </div>


              <label>
                <span>
                  Correo electronico
                </span>

                <div className="admin-form-control">

                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={
                      (event) =>
                        updateForm(
                          "email",
                          event.target.value,
                        )
                    }
                  />

                </div>
              </label>


              <label>
                <span>
                  Direccion
                </span>

                <div className="admin-form-control">

                  <input
                    type="text"
                    value={
                      form.address
                    }
                    onChange={
                      (event) =>
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
                  Observaciones
                </span>

                <textarea
                  className="admin-patient-textarea"
                  value={
                    form.notes
                  }
                  onChange={
                    (event) =>
                      updateForm(
                        "notes",
                        event.target.value,
                      )
                  }
                  rows="3"
                  placeholder="Opcional"
                />
              </label>


              <footer className="admin-patient-modal__actions">

                <button
                  type="button"
                  className="admin-button admin-button--secondary"
                  onClick={
                    closeEditor
                  }
                  disabled={
                    saving
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="admin-button admin-button--primary"
                  disabled={
                    saving
                  }
                >
                  <Check
                    size={17}
                  />

                  <span>
                    {saving
                      ? "Guardando..."
                      : "Guardar empresa"}
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