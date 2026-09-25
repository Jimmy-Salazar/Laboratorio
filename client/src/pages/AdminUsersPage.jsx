import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  IdCard,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "../styles/admin.css";

const roleOptions = [
  {
    value: "admin",
    label: "Administrador",
  },
  {
    value: "secretary",
    label: "Secretaria",
  },
  {
    value: "laboratorist",
    label: "Laboratorista",
  },
];

const roleLabels = {
  admin: "Administrador",
  secretary: "Secretaria",
  laboratorist: "Laboratorista",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("info");

  const [form, setForm] = useState({
    fullName: "",
    identificationNumber: "",
    role: "secretary",
    password: "",
  });

  const counters = useMemo(() => {
    return users.reduce(
      (accumulator, user) => {
        if (user.active) {
          accumulator.active += 1;
        }

        if (user.role === "admin") {
          accumulator.admin += 1;
        }

        if (user.role === "secretary") {
          accumulator.secretary += 1;
        }

        if (user.role === "laboratorist") {
          accumulator.laboratorist += 1;
        }

        return accumulator;
      },
      {
        active: 0,
        admin: 0,
        secretary: 0,
        laboratorist: 0,
      },
    );
  }, [users]);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("staff_profiles")
      .select(
        "user_id, full_name, role, active, identification_number, created_at",
      )
      .neq("role", "master")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setMessage(
        "No fue posible cargar los usuarios.",
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    setUsers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (creating) {
      return;
    }

    const identificationNumber =
      form.identificationNumber.replace(/\D/g, "");

    if (
      !form.fullName.trim() ||
      !/^\d{8,15}$/.test(identificationNumber) ||
      !roleOptions.some(
        (option) => option.value === form.role,
      ) ||
      form.password.length < 8
    ) {
      setMessage(
        "Completa nombre, cedula, rol y una contrasena de al menos 8 caracteres.",
      );
      setMessageType("error");
      return;
    }

    setCreating(true);
    setMessage("");

    const { data, error } =
      await supabase.functions.invoke(
        "create-staff-user",
        {
          body: {
            fullName: form.fullName.trim(),
            identificationNumber,
            role: form.role,
            password: form.password,
          },
        },
      );

    setCreating(false);

    if (error || !data?.ok) {
      console.error(error ?? data);

      setMessage(
        data?.message ??
          "No fue posible crear el usuario.",
      );
      setMessageType("error");
      return;
    }

    setForm({
      fullName: "",
      identificationNumber: "",
      role: "secretary",
      password: "",
    });

    setMessage("Usuario creado correctamente.");
    setMessageType("success");

    await loadUsers();
  }

  async function toggleUser(user) {
    if (busyUserId) {
      return;
    }

    setBusyUserId(user.user_id);
    setMessage("");

    const { error } = await supabase
      .from("staff_profiles")
      .update({
        active: !user.active,
      })
      .eq("user_id", user.user_id)
      .neq("role", "master");

    setBusyUserId(null);

    if (error) {
      console.error(error);

      setMessage(
        "No fue posible actualizar el usuario.",
      );
      setMessageType("error");
      return;
    }

    setMessage(
      user.active
        ? "Usuario desactivado."
        : "Usuario activado.",
    );
    setMessageType("success");

    await loadUsers();
  }

  return (
    <div className="admin-users-page">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            {"Administraci\u00f3n"}
          </span>

          <h1>Usuarios</h1>

          <p>
            {
              "Crea y administra el personal que tendr\u00e1 acceso al sistema."
            }
          </p>
        </div>

        <button
          type="button"
          className="admin-button admin-button--secondary"
          onClick={loadUsers}
          disabled={loading}
        >
          <RefreshCw size={17} />
          <span>Actualizar</span>
        </button>
      </section>

      <section className="admin-user-stats">
        <article>
          <span>Total activos</span>
          <strong>{counters.active}</strong>
        </article>

        <article>
          <span>Administradores</span>
          <strong>{counters.admin}</strong>
        </article>

        <article>
          <span>Secretarias</span>
          <strong>{counters.secretary}</strong>
        </article>

        <article>
          <span>Laboratoristas</span>
          <strong>{counters.laboratorist}</strong>
        </article>
      </section>

      <section className="admin-users-grid">
        <article className="admin-panel">
          <header className="admin-panel__header">
            <div>
              <span className="admin-panel__icon">
                <UserPlus size={20} />
              </span>

              <div>
                <h2>Nuevo usuario</h2>
                <p>
                  {
                    "El rol Master no puede crearse desde esta pantalla."
                  }
                </p>
              </div>
            </div>
          </header>

          <form
            className="admin-create-form"
            onSubmit={handleCreate}
          >
            <label>
              <span>Nombre completo</span>

              <div className="admin-form-control">
                <UsersRound size={18} />

                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) =>
                    updateForm(
                      "fullName",
                      event.target.value,
                    )
                  }
                  placeholder="Nombre del usuario"
                />
              </div>
            </label>

            <label>
              <span>{"C\u00e9dula"}</span>

              <div className="admin-form-control">
                <IdCard size={18} />

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  value={form.identificationNumber}
                  onChange={(event) =>
                    updateForm(
                      "identificationNumber",
                      event.target.value.replace(
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
              <span>Rol</span>

              <div className="admin-form-control">
                <UserCog size={18} />

                <select
                  value={form.role}
                  onChange={(event) =>
                    updateForm(
                      "role",
                      event.target.value,
                    )
                  }
                >
                  {roleOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label>
              <span>{"Contrase\u00f1a inicial"}</span>

              <div className="admin-form-control">
                <LockKeyhole size={18} />

                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    updateForm(
                      "password",
                      event.target.value,
                    )
                  }
                  placeholder="Minimo 8 caracteres"
                />
              </div>
            </label>

            <button
              type="submit"
              className="admin-button admin-button--primary admin-create-submit"
              disabled={creating}
            >
              <ShieldCheck size={18} />

              <span>
                {creating
                  ? "Creando..."
                  : "Crear usuario"}
              </span>
            </button>

            {message ? (
              <div
                className={[
                  "admin-master-message",
                  `is-${messageType}`,
                ].join(" ")}
                role="status"
              >
                {message}
              </div>
            ) : null}
          </form>
        </article>

        <article className="admin-panel">
          <header className="admin-panel__header">
            <div>
              <span className="admin-panel__icon">
                <UsersRound size={20} />
              </span>

              <div>
                <h2>Usuarios registrados</h2>
                <p>
                  {loading
                    ? "Cargando..."
                    : `${users.length} cuenta(s)`}
                </p>
              </div>
            </div>
          </header>

          <div className="admin-staff-list">
            {!loading && users.length === 0 ? (
              <div className="admin-master-empty">
                No existen usuarios registrados.
              </div>
            ) : null}

            {users.map((user) => (
              <div
                className="admin-staff-row"
                key={user.user_id}
              >
                <span className="admin-user-chip__avatar">
                  <UserCog size={18} />
                </span>

                <div className="admin-staff-row__identity">
                  <strong>{user.full_name}</strong>

                  <span>
                    C.I. {user.identification_number}
                  </span>
                </div>

                <span className="admin-role-pill">
                  {roleLabels[user.role] ??
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

                <button
                  type="button"
                  className="admin-master-toggle"
                  onClick={() =>
                    toggleUser(user)
                  }
                  disabled={
                    busyUserId === user.user_id
                  }
                >
                  {busyUserId === user.user_id
                    ? "Guardando..."
                    : user.active
                      ? "Desactivar"
                      : "Activar"}
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}