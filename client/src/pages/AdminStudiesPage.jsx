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
  FlaskConical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import {
  translateStudyNameToEnglish,
} from "../utils/studyTranslation";
import "../styles/admin.css";

const PAGE_SIZE = 10;

function getPageCount(totalItems) {
  return Math.max(
    1,
    Math.ceil(totalItems / PAGE_SIZE),
  );
}

function getPageItems(items, page) {
  const start =
    (page - 1) * PAGE_SIZE;

  return items.slice(
    start,
    start + PAGE_SIZE,
  );
}

function Pagination({
  page,
  pageCount,
  totalItems,
  onPrevious,
  onNext,
}) {
  const startItem =
    totalItems === 0
      ? 0
      : (page - 1) * PAGE_SIZE + 1;

  const endItem =
    totalItems === 0
      ? 0
      : Math.min(
          page * PAGE_SIZE,
          totalItems,
        );

  return (
    <div className="admin-table-pagination">
      <span className="admin-table-pagination__summary">
        {totalItems === 0
          ? "0 registros"
          : `${startItem}-${endItem} de ${totalItems}`}
      </span>

      <div className="admin-table-pagination__controls">
        <button
          type="button"
          className="admin-pagination-button"
          onClick={onPrevious}
          disabled={page <= 1}
          aria-label="Pagina anterior"
          title="Pagina anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="admin-table-pagination__page">
          Pagina {page} de {pageCount}
        </span>

        <button
          type="button"
          className="admin-pagination-button"
          onClick={onNext}
          disabled={page >= pageCount}
          aria-label="Pagina siguiente"
          title="Pagina siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function AdminStudiesPage() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] =
    useState(null);
  const [editingName, setEditingName] =
    useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("info");

  const [
    availablePage,
    setAvailablePage,
  ] = useState(1);

  const [
    catalogPage,
    setCatalogPage,
  ] = useState(1);

  const loadStudies = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("studies")
      .select(
        "id, name_es, name_en, active, booking_enabled, archived_at, created_at",
      )
      .is("archived_at", null)
      .order("name_es", {
        ascending: true,
      });

    if (error) {
      console.error(error);

      setMessage(
        "No fue posible cargar los estudios.",
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    setStudies(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStudies();
  }, [loadStudies]);

  const availableStudies = useMemo(
    () =>
      studies.filter(
        (study) =>
          study.active === true &&
          study.booking_enabled === true,
      ),
    [studies],
  );

  const catalogStudies = useMemo(() => {
    const term = search
      .trim()
      .toLocaleLowerCase();

    if (!term) {
      return studies;
    }

    return studies.filter((study) =>
      String(study.name_es ?? "")
        .toLocaleLowerCase()
        .includes(term),
    );
  }, [search, studies]);

  const availablePageCount = useMemo(
    () =>
      getPageCount(
        availableStudies.length,
      ),
    [availableStudies.length],
  );

  const catalogPageCount = useMemo(
    () =>
      getPageCount(
        catalogStudies.length,
      ),
    [catalogStudies.length],
  );

  const pagedAvailableStudies =
    useMemo(
      () =>
        getPageItems(
          availableStudies,
          availablePage,
        ),
      [
        availableStudies,
        availablePage,
      ],
    );

  const pagedCatalogStudies =
    useMemo(
      () =>
        getPageItems(
          catalogStudies,
          catalogPage,
        ),
      [
        catalogStudies,
        catalogPage,
      ],
    );

  useEffect(() => {
    if (
      availablePage >
      availablePageCount
    ) {
      setAvailablePage(
        availablePageCount,
      );
    }
  }, [
    availablePage,
    availablePageCount,
  ]);

  useEffect(() => {
    if (
      catalogPage >
      catalogPageCount
    ) {
      setCatalogPage(
        catalogPageCount,
      );
    }
  }, [
    catalogPage,
    catalogPageCount,
  ]);

  useEffect(() => {
    setCatalogPage(1);
  }, [search]);

  function beginCreate() {
    setCreating(true);
    setNewName("");
    setEditingId(null);
    setMessage("");
    setCatalogPage(1);
  }

  function cancelCreate() {
    setCreating(false);
    setNewName("");
  }

  function beginEdit(study) {
    setCreating(false);
    setEditingId(study.id);
    setEditingName(
      study.name_es ?? "",
    );
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function createStudy() {
    if (busyId) {
      return;
    }

    const nameEs = newName.trim();

    if (!nameEs) {
      setMessage(
        "Escribe el nombre del estudio.",
      );
      setMessageType("error");
      return;
    }

    const nameEn =
      translateStudyNameToEnglish(nameEs);

    setBusyId("create");
    setMessage("");

    const { error } = await supabase
      .from("studies")
      .insert({
        name_es: nameEs,
        name_en: nameEn,
        active: true,
        booking_enabled: false,
      });

    setBusyId(null);

    if (error) {
      console.error(error);

      setMessage(
        "No fue posible crear el estudio.",
      );
      setMessageType("error");
      return;
    }

    setCreating(false);
    setNewName("");
    setCatalogPage(1);

    setMessage(
      "Estudio creado en el Catalogo. Activalo cuando quieras mostrarlo como disponible.",
    );
    setMessageType("success");

    await loadStudies();
  }

  async function saveEdit(studyId) {
    if (busyId) {
      return;
    }

    const nameEs =
      editingName.trim();

    if (!nameEs) {
      setMessage(
        "El nombre del estudio no puede quedar vacio.",
      );
      setMessageType("error");
      return;
    }

    const nameEn =
      translateStudyNameToEnglish(nameEs);

    setBusyId(studyId);
    setMessage("");

    const { error } = await supabase
      .from("studies")
      .update({
        name_es: nameEs,
        name_en: nameEn,
      })
      .eq("id", studyId);

    setBusyId(null);

    if (error) {
      console.error(error);

      setMessage(
        "No fue posible editar el estudio.",
      );
      setMessageType("error");
      return;
    }

    setEditingId(null);
    setEditingName("");

    setMessage(
      "Estudio actualizado.",
    );
    setMessageType("success");

    await loadStudies();
  }

  async function toggleAvailability(study) {
    if (busyId) {
      return;
    }

    const nextValue =
      !study.booking_enabled;

    setBusyId(study.id);
    setMessage("");

    const { error } = await supabase
      .from("studies")
      .update({
        booking_enabled: nextValue,
        active: true,
      })
      .eq("id", study.id);

    setBusyId(null);

    if (error) {
      console.error(error);

      setMessage(
        "No fue posible cambiar la disponibilidad.",
      );
      setMessageType("error");
      return;
    }

    setMessage(
      nextValue
        ? "Estudio agregado a Estudios Disponibles."
        : "Estudio retirado de Estudios Disponibles.",
    );
    setMessageType("success");

    await loadStudies();
  }

  async function removeStudy(study) {
    if (busyId) {
      return;
    }

    const confirmed = window.confirm(
      `Eliminar "${study.name_es}"?\n\n` +
        "Se retirara del Catalogo y del Home, " +
        "pero se conservara el historial.",
    );

    if (!confirmed) {
      return;
    }

    setBusyId(study.id);
    setMessage("");

    const { error } = await supabase
      .from("studies")
      .update({
        archived_at:
          new Date().toISOString(),
        active: false,
        booking_enabled: false,
      })
      .eq("id", study.id);

    setBusyId(null);

    if (error) {
      console.error(error);

      setMessage(
        "No fue posible eliminar el estudio.",
      );
      setMessageType("error");
      return;
    }

    if (editingId === study.id) {
      cancelEdit();
    }

    setMessage(
      "Estudio eliminado.",
    );
    setMessageType("success");

    await loadStudies();
  }

  return (
    <div className="admin-simple-studies-page">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            {"Configuraci\u00f3n"}
          </span>

          <h1>Estudios</h1>

          <p>
            {
              "Define qu\u00e9 estudios est\u00e1n disponibles para los pacientes."
            }
          </p>
        </div>

        <div className="admin-page-heading__actions">
          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={loadStudies}
            disabled={loading}
          >
            <RefreshCw size={17} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={beginCreate}
            disabled={creating}
          >
            <Plus size={17} />
            <span>Nuevo estudio</span>
          </button>
        </div>
      </section>

      <article className="admin-panel admin-available-studies-panel">
        <header className="admin-study-section-heading">
          <div>
            <span className="admin-panel__icon">
              <Check size={19} />
            </span>

            <div>
              <h2>
                Estudios Disponibles
              </h2>

              <p>
                {
                  "Estos son los estudios que se mostrar\u00e1n en el Home."
                }
              </p>
            </div>
          </div>

          <span className="admin-study-count-badge">
            {availableStudies.length}
          </span>
        </header>

        <div className="admin-simple-study-table-wrap">
          <table className="admin-simple-study-table admin-available-study-table">
            <thead>
              <tr>
                <th>Nombre del estudio</th>
                <th className="admin-study-status-column">
                  Disponible
                </th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
              availableStudies.length === 0 ? (
                <tr>
                  <td
                    colSpan="2"
                    className="admin-simple-study-empty"
                  >
                    <FlaskConical size={25} />

                    <span>
                      No hay estudios disponibles.
                    </span>
                  </td>
                </tr>
              ) : null}

              {pagedAvailableStudies.map(
                (study) => (
                  <tr key={study.id}>
                    <td>
                      <strong className="admin-study-name-only">
                        {study.name_es}
                      </strong>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-availability-switch is-on"
                        onClick={() =>
                          toggleAvailability(
                            study,
                          )
                        }
                        disabled={
                          busyId ===
                          study.id
                        }
                        aria-pressed="true"
                        aria-label={`Desactivar ${study.name_es}`}
                      >
                        <span className="admin-availability-switch__track">
                          <span />
                        </span>

                        <strong>ON</strong>
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={availablePage}
          pageCount={
            availablePageCount
          }
          totalItems={
            availableStudies.length
          }
          onPrevious={() =>
            setAvailablePage(
              (current) =>
                Math.max(
                  1,
                  current - 1,
                ),
            )
          }
          onNext={() =>
            setAvailablePage(
              (current) =>
                Math.min(
                  availablePageCount,
                  current + 1,
                ),
            )
          }
        />
      </article>

      <article className="admin-panel admin-catalog-study-panel">
        <header className="admin-simple-study-toolbar">
          <div>
            <strong>Catalogo</strong>

            <span>
              {loading
                ? "Cargando..."
                : `${studies.length} estudio(s)`}
            </span>
          </div>

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
              placeholder="Buscar por nombre..."
            />
          </div>
        </header>

        <div className="admin-simple-study-table-wrap">
          <table className="admin-simple-study-table admin-catalog-study-table">
            <thead>
              <tr>
                <th>Nombre del estudio</th>

                <th className="admin-study-status-column">
                  Disponible
                </th>

                <th
                  className="admin-simple-study-table__actions-heading"
                  aria-label="Acciones"
                />
              </tr>
            </thead>

            <tbody>
              {creating ? (
                <tr className="is-editing">
                  <td>
                    <input
                      className="admin-study-inline-input"
                      type="text"
                      autoFocus
                      value={newName}
                      onChange={(event) =>
                        setNewName(
                          event.target.value,
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter"
                        ) {
                          event.preventDefault();
                          createStudy();
                        }

                        if (
                          event.key === "Escape"
                        ) {
                          cancelCreate();
                        }
                      }}
                      placeholder="Nombre del estudio"
                    />
                  </td>

                  <td>
                    <span className="admin-new-study-off">
                      OFF
                    </span>
                  </td>

                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-table-icon-button is-save"
                        onClick={createStudy}
                        disabled={
                          busyId === "create"
                        }
                        title="Guardar"
                        aria-label="Guardar estudio"
                      >
                        <Check size={17} />
                      </button>

                      <button
                        type="button"
                        className="admin-table-icon-button"
                        onClick={cancelCreate}
                        disabled={
                          busyId === "create"
                        }
                        title="Cancelar"
                        aria-label="Cancelar"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading &&
              !creating &&
              catalogStudies.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="admin-simple-study-empty"
                  >
                    <FlaskConical size={25} />

                    <span>
                      No hay estudios para mostrar.
                    </span>
                  </td>
                </tr>
              ) : null}

              {pagedCatalogStudies.map(
                (study) => {
                  const editing =
                    editingId === study.id;

                  const enabled =
                    study.active === true &&
                    study.booking_enabled ===
                      true;

                  return (
                    <tr
                      key={study.id}
                      className={
                        editing
                          ? "is-editing"
                          : ""
                      }
                    >
                      <td>
                        {editing ? (
                          <input
                            className="admin-study-inline-input"
                            type="text"
                            autoFocus
                            value={
                              editingName
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditingName(
                                event.target
                                  .value,
                              )
                            }
                            onKeyDown={(
                              event,
                            ) => {
                              if (
                                event.key ===
                                "Enter"
                              ) {
                                event.preventDefault();

                                saveEdit(
                                  study.id,
                                );
                              }

                              if (
                                event.key ===
                                "Escape"
                              ) {
                                cancelEdit();
                              }
                            }}
                          />
                        ) : (
                          <strong className="admin-study-name-only">
                            {study.name_es}
                          </strong>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={[
                            "admin-availability-switch",
                            enabled
                              ? "is-on"
                              : "is-off",
                          ].join(" ")}
                          onClick={() =>
                            toggleAvailability(
                              study,
                            )
                          }
                          disabled={
                            busyId ===
                              study.id ||
                            editing
                          }
                          aria-pressed={
                            enabled
                          }
                          aria-label={
                            enabled
                              ? `Desactivar ${study.name_es}`
                              : `Activar ${study.name_es}`
                          }
                        >
                          <span className="admin-availability-switch__track">
                            <span />
                          </span>

                          <strong>
                            {enabled
                              ? "ON"
                              : "OFF"}
                          </strong>
                        </button>
                      </td>

                      <td>
                        <div className="admin-table-actions">
                          {editing ? (
                            <>
                              <button
                                type="button"
                                className="admin-table-icon-button is-save"
                                onClick={() =>
                                  saveEdit(
                                    study.id,
                                  )
                                }
                                disabled={
                                  busyId ===
                                  study.id
                                }
                                title="Guardar"
                                aria-label="Guardar cambios"
                              >
                                <Check size={17} />
                              </button>

                              <button
                                type="button"
                                className="admin-table-icon-button"
                                onClick={
                                  cancelEdit
                                }
                                disabled={
                                  busyId ===
                                  study.id
                                }
                                title="Cancelar"
                                aria-label="Cancelar edicion"
                              >
                                <X size={17} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="admin-table-icon-button is-edit"
                                onClick={() =>
                                  beginEdit(
                                    study,
                                  )
                                }
                                disabled={
                                  busyId ===
                                  study.id
                                }
                                title="Editar"
                                aria-label={`Editar ${study.name_es}`}
                              >
                                <Edit3 size={16} />
                              </button>

                              <button
                                type="button"
                                className="admin-table-icon-button is-delete"
                                onClick={() =>
                                  removeStudy(
                                    study,
                                  )
                                }
                                disabled={
                                  busyId ===
                                  study.id
                                }
                                title="Eliminar"
                                aria-label={`Eliminar ${study.name_es}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={catalogPage}
          pageCount={
            catalogPageCount
          }
          totalItems={
            catalogStudies.length
          }
          onPrevious={() =>
            setCatalogPage(
              (current) =>
                Math.max(
                  1,
                  current - 1,
                ),
            )
          }
          onNext={() =>
            setCatalogPage(
              (current) =>
                Math.min(
                  catalogPageCount,
                  current + 1,
                ),
            )
          }
        />
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
    </div>
  );
}