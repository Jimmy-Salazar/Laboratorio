import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Edit3,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import {
  supabase,
} from "../lib/supabase";

import {
  useAdminAuth,
} from "../context/AdminAuthContext";

import "../styles/admin.css";


const roleOptions = [
  {
    value:
      "admin",

    label:
      "Administrador",
  },
  {
    value:
      "secretary",

    label:
      "Secretaria",
  },
  {
    value:
      "laboratorist",

    label:
      "Laboratorista",
  },
];


const roleLabels = {
  admin:
    "Administrador",

  secretary:
    "Secretaria",

  laboratorist:
    "Laboratorista",
};


function emptyCreateForm() {
  return {
    fullName:
      "",

    identificationNumber:
      "",

    email:
      "",

    role:
      "secretary",

    branchId:
      "",
  };
}


export default function AdminUsersPage() {

  const {
    profile:
      currentProfile,
  } =
    useAdminAuth();


  const [
    users,
    setUsers,
  ] =
    useState([]);


  const [
    branches,
    setBranches,
  ] =
    useState([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    creating,
    setCreating,
  ] =
    useState(false);


  const [
    busyUserId,
    setBusyUserId,
  ] =
    useState(null);


  const [
    message,
    setMessage,
  ] =
    useState("");


  const [
    messageType,
    setMessageType,
  ] =
    useState("info");


  const [
    form,
    setForm,
  ] =
    useState(
      emptyCreateForm(),
    );


  const [
    editingUser,
    setEditingUser,
  ] =
    useState(null);


  const [
    editForm,
    setEditForm,
  ] =
    useState(null);


  const [
    savingEdit,
    setSavingEdit,
  ] =
    useState(false);


  const [
    resetUser,
    setResetUser,
  ] =
    useState(null);


  const [
    resettingPassword,
    setResettingPassword,
  ] =
    useState(false);


  const counters =
    useMemo(
      () => {

        return users.reduce(
          (
            accumulator,
            user,
          ) => {

            if (
              user.active
            ) {
              accumulator.active +=
                1;
            }


            if (
              user.role ===
              "admin"
            ) {
              accumulator.admin +=
                1;
            }


            if (
              user.role ===
              "secretary"
            ) {
              accumulator.secretary +=
                1;
            }


            if (
              user.role ===
              "laboratorist"
            ) {
              accumulator.laboratorist +=
                1;
            }


            return accumulator;

          },
          {
            active:
              0,

            admin:
              0,

            secretary:
              0,

            laboratorist:
              0,
          },
        );

      },
      [
        users,
      ],
    );


  const loadBranches =
    useCallback(
      async () => {

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "branches",
            )
            .select(
              "id, code, name_es, active, sort_order",
            )
            .eq(
              "active",
              true,
            )
            .order(
              "sort_order",
              {
                ascending:
                  true,
              },
            )
            .order(
              "name_es",
              {
                ascending:
                  true,
              },
            );


        if (error) {

          console.error(
            error,
          );

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

      },
      [],
    );


  const loadUsers =
    useCallback(
      async () => {

        setLoading(
          true,
        );


        const {
          data,
          error,
        } =
          await supabase
            .from(
              "staff_profiles",
            )
            .select(
              "user_id, full_name, role, active, identification_number, branch_id, email, must_change_password, password_changed_at, temporary_password_sent_at, created_at",
            )
            .neq(
              "role",
              "master",
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            );


        if (error) {

          console.error(
            error,
          );

          setMessage(
            "No fue posible cargar los usuarios.",
          );

          setMessageType(
            "error",
          );

          setLoading(
            false,
          );

          return;
        }


        setUsers(
          data ?? [],
        );

        setLoading(
          false,
        );

      },
      [],
    );


  useEffect(
    () => {

      loadUsers();
      loadBranches();

    },
    [
      loadUsers,
      loadBranches,
    ],
  );


  function updateForm(
    field,
    value,
  ) {

    setForm(
      (
        current,
      ) => ({
        ...current,
        [field]:
          value,
      }),
    );

  }


  function updateEditForm(
    field,
    value,
  ) {

    setEditForm(
      (
        current,
      ) => ({
        ...current,
        [field]:
          value,
      }),
    );

  }


  function branchLabel(
    branchId,
  ) {

    if (!branchId) {
      return "Todos";
    }


    return (
      branches.find(
        (
          branch,
        ) =>
          branch.id ===
          branchId,
      )?.name_es ??
      "Sucursal no disponible"
    );

  }


  async function handleCreate(
    event,
  ) {

    event.preventDefault();


    if (creating) {
      return;
    }


    const identificationNumber =
      form
        .identificationNumber
        .replace(
          /\D/g,
          "",
        );


    const email =
      form.email
        .trim()
        .toLowerCase();


    if (
      !form.fullName.trim() ||
      !/^\d{8,15}$/.test(
        identificationNumber,
      ) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      ) ||
      !roleOptions.some(
        (
          option,
        ) =>
          option.value ===
          form.role,
      )
    ) {

      setMessage(
        "Completa nombre, cedula, correo y rol.",
      );

      setMessageType(
        "error",
      );

      return;
    }


    setCreating(
      true,
    );

    setMessage(
      "",
    );


    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke(
          "create-staff-user",
          {
            body: {
              fullName:
                form.fullName
                  .trim(),

              identificationNumber,

              email,

              role:
                form.role,

              branchId:
                form.role ===
                "admin"
                  ? null
                  : form.branchId ||
                    null,
            },
          },
        );


    setCreating(
      false,
    );


    if (
      error ||
      !data?.ok
    ) {

      console.error(
        error ??
        data,
      );

      setMessage(
        data?.message ??
          "No fue posible crear el usuario.",
      );

      setMessageType(
        "error",
      );

      return;
    }


    setForm(
      emptyCreateForm(),
    );


    setMessage(
      "Usuario creado y credenciales enviadas por correo.",
    );

    setMessageType(
      "success",
    );


    await loadUsers();

  }


  function openEdit(
    user,
  ) {

    setEditingUser(
      user,
    );


    setEditForm({
      fullName:
        user.full_name ??
        "",

      identificationNumber:
        user.identification_number ??
        "",

      email:
        user.email ??
        "",

      role:
        user.role,

      branchId:
        user.branch_id ??
        "",
    });


    setMessage(
      "",
    );

  }


  function closeEdit() {

    if (
      savingEdit
    ) {
      return;
    }


    setEditingUser(
      null,
    );

    setEditForm(
      null,
    );

  }


  async function saveEdit(
    event,
  ) {

    event.preventDefault();


    if (
      savingEdit ||
      !editingUser ||
      !editForm
    ) {
      return;
    }


    const identificationNumber =
      editForm
        .identificationNumber
        .replace(
          /\D/g,
          "",
        );


    const email =
      editForm
        .email
        .trim()
        .toLowerCase();


    if (
      !editForm.fullName.trim() ||
      !/^\d{8,15}$/.test(
        identificationNumber,
      ) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      ) ||
      !roleOptions.some(
        (
          option,
        ) =>
          option.value ===
          editForm.role,
      )
    ) {

      setMessage(
        "Completa correctamente los datos del usuario.",
      );

      setMessageType(
        "error",
      );

      return;
    }


    setSavingEdit(
      true,
    );


    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke(
          "update-staff-user",
          {
            body: {
              userId:
                editingUser.user_id,

              fullName:
                editForm.fullName
                  .trim(),

              identificationNumber,

              email,

              role:
                editForm.role,

              branchId:
                editForm.role ===
                "admin"
                  ? null
                  : editForm.branchId ||
                    null,
            },
          },
        );


    setSavingEdit(
      false,
    );


    if (
      error ||
      !data?.ok
    ) {

      console.error(
        error ??
        data,
      );

      setMessage(
        data?.message ??
          "No fue posible editar el usuario.",
      );

      setMessageType(
        "error",
      );

      return;
    }


    const editingSelf =
      editingUser.user_id ===
      currentProfile?.user_id;


    setEditingUser(
      null,
    );

    setEditForm(
      null,
    );


    await loadUsers();


    if (
      editingSelf
    ) {

      window.location.reload();
      return;

    }


    setMessage(
      "Usuario actualizado correctamente.",
    );

    setMessageType(
      "success",
    );

  }


  async function confirmResetPassword() {

    if (
      !resetUser ||
      resettingPassword
    ) {
      return;
    }


    setResettingPassword(
      true,
    );


    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke(
          "reset-staff-password",
          {
            body: {
              userId:
                resetUser.user_id,
            },
          },
        );


    setResettingPassword(
      false,
    );


    if (
      error ||
      !data?.ok
    ) {

      console.error(
        error ??
        data,
      );


      setMessage(
        data?.message ??
          "No fue posible resetear la contrasena.",
      );

      setMessageType(
        "error",
      );


      if (
        data?.passwordChanged
      ) {
        setResetUser(
          null,
        );
      }

      return;
    }


    const resettingSelf =
      resetUser.user_id ===
      currentProfile?.user_id;


    setResetUser(
      null,
    );


    await loadUsers();


    setMessage(
      "Nueva contrasena temporal enviada correctamente.",
    );

    setMessageType(
      "success",
    );


    if (
      resettingSelf
    ) {
      window.location.reload();
    }

  }


  async function toggleUser(
    user,
  ) {

    if (
      busyUserId
    ) {
      return;
    }


    setBusyUserId(
      user.user_id,
    );

    setMessage(
      "",
    );


    const {
      error,
    } =
      await supabase
        .from(
          "staff_profiles",
        )
        .update({
          active:
            !user.active,
        })
        .eq(
          "user_id",
          user.user_id,
        )
        .neq(
          "role",
          "master",
        );


    setBusyUserId(
      null,
    );


    if (error) {

      console.error(
        error,
      );

      setMessage(
        "No fue posible actualizar el usuario.",
      );

      setMessageType(
        "error",
      );

      return;
    }


    setMessage(
      user.active
        ? "Usuario desactivado."
        : "Usuario activado.",
    );

    setMessageType(
      "success",
    );


    await loadUsers();

  }


  return (
    <div className="admin-users-page">

      <section className="admin-page-heading">

        <div>

          <span className="admin-page-heading__eyebrow">
            Administracion
          </span>

          <h1>
            Usuarios
          </h1>

          <p>
            Crea y administra el personal que tendra acceso al sistema.
          </p>

        </div>


        <button
          type="button"
          className="admin-button admin-button--secondary"
          onClick={() => {
            loadUsers();
            loadBranches();
          }}
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

      </section>


      <section className="admin-user-stats">

        <article>
          <span>
            Total activos
          </span>
          <strong>
            {counters.active}
          </strong>
        </article>

        <article>
          <span>
            Administradores
          </span>
          <strong>
            {counters.admin}
          </strong>
        </article>

        <article>
          <span>
            Secretarias
          </span>
          <strong>
            {counters.secretary}
          </strong>
        </article>

        <article>
          <span>
            Laboratoristas
          </span>
          <strong>
            {counters.laboratorist}
          </strong>
        </article>

      </section>


      {message ? (

        <div
          className={[
            "admin-master-message",
            `is-${messageType}`,
            "admin-user-page-message",
          ].join(" ")}
          role="status"
        >
          {message}
        </div>

      ) : null}


      <section className="admin-users-grid">

        <article className="admin-panel">

          <header className="admin-panel__header">

            <div>

              <span className="admin-panel__icon">
                <UserPlus
                  size={20}
                />
              </span>

              <div>
                <h2>
                  Nuevo usuario
                </h2>

                <p>
                  Se enviara una contrasena temporal al correo indicado.
                </p>
              </div>

            </div>

          </header>


          <form
            className="admin-create-form"
            onSubmit={
              handleCreate
            }
          >

            <label>

              <span>
                Nombre completo
              </span>

              <div className="admin-form-control">

                <UsersRound
                  size={18}
                />

                <input
                  type="text"
                  value={
                    form.fullName
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "fullName",
                      event.target
                        .value,
                    )
                  }
                  placeholder="Nombre del usuario"
                />

              </div>

            </label>


            <label>

              <span>
                Cedula
              </span>

              <div className="admin-form-control">

                <IdCard
                  size={18}
                />

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  value={
                    form.identificationNumber
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "identificationNumber",
                      event.target
                        .value
                        .replace(
                          /\D/g,
                          "",
                        ),
                    )
                  }
                  placeholder="Numero de cedula"
                />

              </div>

            </label>


            <label>

              <span>
                Correo electronico
              </span>

              <div className="admin-form-control">

                <Mail
                  size={18}
                />

                <input
                  type="email"
                  autoComplete="email"
                  value={
                    form.email
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "email",
                      event.target
                        .value,
                    )
                  }
                  placeholder="usuario@correo.com"
                />

              </div>

            </label>


            <label>

              <span>
                Rol
              </span>

              <div className="admin-form-control">

                <UserCog
                  size={18}
                />

                <select
                  value={
                    form.role
                  }
                  onChange={(
                    event,
                  ) => {

                    const role =
                      event.target
                        .value;


                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        role,

                        branchId:
                          role ===
                          "admin"
                            ? ""
                            : current
                                .branchId,
                      }),
                    );

                  }}
                >

                  {roleOptions.map(
                    (
                      option,
                    ) => (

                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>

                    ),
                  )}

                </select>

              </div>

            </label>


            <label>

              <span>
                Sucursal
              </span>

              <div className="admin-form-control">

                <MapPin
                  size={18}
                />

                <select
                  value={
                    form.role ===
                    "admin"
                      ? ""
                      : form.branchId
                  }
                  disabled={
                    form.role ===
                    "admin"
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "branchId",
                      event.target
                        .value,
                    )
                  }
                >

                  <option value="">
                    Todos
                  </option>

                  {branches.map(
                    (
                      branch,
                    ) => (

                      <option
                        key={
                          branch.id
                        }
                        value={
                          branch.id
                        }
                      >
                        {branch.name_es}
                      </option>

                    ),
                  )}

                </select>

              </div>

            </label>


            <button
              type="submit"
              className="admin-button admin-button--primary admin-create-submit"
              disabled={
                creating
              }
            >

              <ShieldCheck
                size={18}
              />

              <span>
                {creating
                  ? "Creando..."
                  : "Crear usuario"}
              </span>

            </button>

          </form>

        </article>


        <article className="admin-panel">

          <header className="admin-panel__header">

            <div>

              <span className="admin-panel__icon">
                <UsersRound
                  size={20}
                />
              </span>

              <div>

                <h2>
                  Usuarios registrados
                </h2>

                <p>
                  {loading
                    ? "Cargando..."
                    : `${users.length} cuenta(s)`}
                </p>

              </div>

            </div>

          </header>


          <div className="admin-staff-list">

            {!loading &&
            users.length ===
              0 ? (

              <div className="admin-master-empty">
                No existen usuarios registrados.
              </div>

            ) : null}


            {users.map(
              (
                user,
              ) => (

                <div
                  className="admin-staff-row admin-staff-row--actions"
                  key={
                    user.user_id
                  }
                >

                  <span className="admin-user-chip__avatar">
                    <UserCog
                      size={18}
                    />
                  </span>


                  <div className="admin-staff-row__identity">

                    <strong>
                      {user.full_name}
                    </strong>

                    <span>
                      C.I.{" "}
                      {user.identification_number}
                    </span>

                    {user.email ? (
                      <span>
                        {user.email}
                      </span>
                    ) : (
                      <span>
                        Sin correo registrado
                      </span>
                    )}

                    <span>
                      Sucursal:{" "}
                      {branchLabel(
                        user.branch_id,
                      )}
                    </span>

                    {user.must_change_password ? (
                      <span className="admin-user-password-status">
                        Cambio de contrasena pendiente
                      </span>
                    ) : null}

                  </div>


                  <span className="admin-role-pill">
                    {roleLabels[
                      user.role
                    ] ??
                      user.role}
                  </span>


                  <span
                    className={[
                      "admin-status-pill",

                      user.active
                        ? "is-confirmed"
                        : "is-disabled",
                    ].join(" ")}
                  >

                    {user.active
                      ? "Activo"
                      : "Inactivo"}

                  </span>


                  <div className="admin-staff-actions">

                    <button
                      type="button"
                      className="admin-user-action"
                      onClick={() =>
                        openEdit(
                          user,
                        )
                      }
                    >
                      <Edit3
                        size={15}
                      />
                      Editar
                    </button>


                    <button
                      type="button"
                      className="admin-user-action"
                      onClick={() =>
                        setResetUser(
                          user,
                        )
                      }
                      disabled={
                        !user.active
                      }
                    >
                      <KeyRound
                        size={15}
                      />
                      Resetear
                    </button>


                    <button
                      type="button"
                      className="admin-master-toggle"
                      onClick={() =>
                        toggleUser(
                          user,
                        )
                      }
                      disabled={
                        busyUserId ===
                        user.user_id
                      }
                    >

                      {busyUserId ===
                      user.user_id
                        ? "Guardando..."
                        : user.active
                          ? "Desactivar"
                          : "Activar"}

                    </button>

                  </div>

                </div>

              ),
            )}

          </div>

        </article>

      </section>


      {editingUser &&
      editForm ? (

        <div className="admin-dialog-overlay">

          <section className="admin-dialog">

            <header className="admin-dialog__header">

              <div>

                <h2>
                  Editar usuario
                </h2>

                <p>
                  {editingUser.full_name}
                </p>

              </div>


              <button
                type="button"
                className="admin-dialog__close"
                onClick={
                  closeEdit
                }
                disabled={
                  savingEdit
                }
                aria-label="Cerrar"
              >
                <X
                  size={20}
                />
              </button>

            </header>


            <form
              className="admin-create-form"
              onSubmit={
                saveEdit
              }
            >

              <label>

                <span>
                  Nombre completo
                </span>

                <div className="admin-form-control">

                  <UsersRound
                    size={18}
                  />

                  <input
                    type="text"
                    value={
                      editForm.fullName
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditForm(
                        "fullName",
                        event.target
                          .value,
                      )
                    }
                  />

                </div>

              </label>


              <label>

                <span>
                  Cedula
                </span>

                <div className="admin-form-control">

                  <IdCard
                    size={18}
                  />

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={15}
                    value={
                      editForm.identificationNumber
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditForm(
                        "identificationNumber",
                        event.target
                          .value
                          .replace(
                            /\D/g,
                            "",
                          ),
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

                  <Mail
                    size={18}
                  />

                  <input
                    type="email"
                    value={
                      editForm.email
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditForm(
                        "email",
                        event.target
                          .value,
                      )
                    }
                  />

                </div>

              </label>


              <label>

                <span>
                  Rol
                </span>

                <div className="admin-form-control">

                  <UserCog
                    size={18}
                  />

                  <select
                    value={
                      editForm.role
                    }
                    onChange={(
                      event,
                    ) => {

                      const role =
                        event.target
                          .value;


                      setEditForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          role,

                          branchId:
                            role ===
                            "admin"
                              ? ""
                              : current
                                  .branchId,
                        }),
                      );

                    }}
                  >

                    {roleOptions.map(
                      (
                        option,
                      ) => (

                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>

                      ),
                    )}

                  </select>

                </div>

              </label>


              <label>

                <span>
                  Sucursal
                </span>

                <div className="admin-form-control">

                  <MapPin
                    size={18}
                  />

                  <select
                    value={
                      editForm.role ===
                      "admin"
                        ? ""
                        : editForm.branchId
                    }
                    disabled={
                      editForm.role ===
                      "admin"
                    }
                    onChange={(
                      event,
                    ) =>
                      updateEditForm(
                        "branchId",
                        event.target
                          .value,
                      )
                    }
                  >

                    <option value="">
                      Todos
                    </option>

                    {branches.map(
                      (
                        branch,
                      ) => (

                        <option
                          key={
                            branch.id
                          }
                          value={
                            branch.id
                          }
                        >
                          {branch.name_es}
                        </option>

                      ),
                    )}

                  </select>

                </div>

              </label>


              <div className="admin-dialog__actions">

                <button
                  type="button"
                  className="admin-button admin-button--secondary"
                  onClick={
                    closeEdit
                  }
                  disabled={
                    savingEdit
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="admin-button admin-button--primary"
                  disabled={
                    savingEdit
                  }
                >
                  {savingEdit
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>

              </div>

            </form>

          </section>

        </div>

      ) : null}


      {resetUser ? (

        <div className="admin-dialog-overlay">

          <section className="admin-dialog admin-dialog--small">

            <header className="admin-dialog__header">

              <div>

                <h2>
                  Resetear contrasena
                </h2>

                <p>
                  {resetUser.full_name}
                </p>

              </div>


              <button
                type="button"
                className="admin-dialog__close"
                onClick={() =>
                  setResetUser(
                    null,
                  )
                }
                disabled={
                  resettingPassword
                }
                aria-label="Cerrar"
              >
                <X
                  size={20}
                />
              </button>

            </header>


            <div className="admin-reset-password-content">

              <span className="admin-reset-password-icon">
                <KeyRound
                  size={28}
                />
              </span>

              <p>
                Se generara una nueva contrasena temporal y se enviara a:
              </p>

              <strong>
                {resetUser.email ||
                  "Sin correo registrado"}
              </strong>

              <p>
                La contrasena actual dejara de ser valida y el usuario debera crear una nueva al ingresar.
              </p>


              {!resetUser.email ? (

                <div className="admin-master-message is-error">
                  Primero edita este usuario y registra un correo electronico.
                </div>

              ) : null}


              <div className="admin-dialog__actions">

                <button
                  type="button"
                  className="admin-button admin-button--secondary"
                  onClick={() =>
                    setResetUser(
                      null,
                    )
                  }
                  disabled={
                    resettingPassword
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="admin-button admin-button--primary"
                  onClick={
                    confirmResetPassword
                  }
                  disabled={
                    resettingPassword ||
                    !resetUser.email
                  }
                >
                  <KeyRound
                    size={17}
                  />

                  {resettingPassword
                    ? "Reseteando..."
                    : "Resetear y enviar"}
                </button>

              </div>

            </div>

          </section>

        </div>

      ) : null}

    </div>
  );
}