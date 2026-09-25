import { useCallback, useEffect, useState } from "react";
import {
  IdCard,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "../styles/admin.css";

export default function MasterAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("info");

  const [form, setForm] = useState({
    fullName: "",
    identificationNumber: "",
    password: "",
  });

  const loadAdmins = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("staff_profiles")
      .select(
        "user_id, full_name, role, active, identification_number, created_at",
      )
      .eq("role", "admin")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setMessage(
        "No fue posible cargar los administradores.",
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    setAdmins(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

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
      form.password.length < 8
    ) {
      setMessage(
        "Completa nombre, cedula valida y una contrasena de al menos 8 caracteres.",
      );
      setMessageType("error");
      return;
    }

    setCreating(true);
    setMessage("");

    const {
      data,
      error,
    } = await supabase.functions.invoke(
      "create-admin",
      {
        body: {
          fullName: form.fullName.trim(),
          identificationNumber,
          password: form.password,
        },
      },
    );

    setCreating(false);

    if (error || !data?.ok) {
      console.error(error ?? data);

      setMessage(
        data?.message ??
          "No fue posible crear el administrador. Verifica que la Edge Function create-admin este desplegada.",
      );
      setMessageType("error");
      return;
    }

    setForm({
      fullName: "",
      identificationNumber: "",
      password: "",
    });

    setMessage("Administrador creado correctamente.");
    setMessageType("success");

    await loadAdmins();
  }

  async function toggleAdmin(admin) {
    setMessage("");

    const { error } = await supabase
      .from("staff_profiles")
      .update({
        active: !admin.active,
      })
      .eq("user_id", admin.user_id)
      .eq("role", "admin");

    if (error) {
      console.error(error);
      setMessage(
        "No fue posible actualizar el administrador.",
      );
      setMessageType("error");
      return;
    }

    setMessage(
      admin.active
        ? "Administrador desactivado."
        : "Administrador activado.",
    );
    setMessageType("success");

    await loadAdmins();
  }

  return (
    <div className="admin-master-page">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            Master
          </span>

          <h1>Administradores</h1>

          <p>
            Crea y controla las cuentas administrativas del laboratorio.
          </p>
        </div>

        <button
          type="button"
          className="admin-button admin-button--secondary"
          onClick={loadAdmins}
          disabled={loading}
        >
          <RefreshCw size={17} />
          <span>Actualizar</span>
        </button>
      </section>

      <section className="admin-master-grid">
        <article className="admin-panel admin-create-admin-panel">
          <header className="admin-panel__header">
            <div>
              <span className="admin-panel__icon">
                <UserPlus size={20} />
              </span>

              <div>
                <h2>Nuevo administrador</h2>
                <p>
                  El Master es el unico rol autorizado para crear estas cuentas.
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
                  placeholder="Nombre del administrador"
                />
              </div>
            </label>

            <label>
              <span>Cedula</span>

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
                  placeholder="Cedula"
                />
              </div>
            </label>

            <label>
              <span>Contrasena inicial</span>

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
                  : "Crear administrador"}
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
                <h2>Administradores registrados</h2>
                <p>
                  {loading
                    ? "Cargando..."
                    : `${admins.length} cuenta(s)`}
                </p>
              </div>
            </div>
          </header>

          <div className="admin-master-list">
            {!loading && admins.length === 0 ? (
              <div className="admin-master-empty">
                Aun no existen administradores normales.
              </div>
            ) : null}

            {admins.map((admin) => (
              <div
                className="admin-master-row"
                key={admin.user_id}
              >
                <span className="admin-user-chip__avatar">
                  <ShieldCheck size={18} />
                </span>

                <div className="admin-master-row__identity">
                  <strong>{admin.full_name}</strong>
                  <span>
                    C.I. {admin.identification_number}
                  </span>
                </div>

                <span
                  className={[
                    "admin-status-pill",
                    admin.active
                      ? "is-confirmed"
                      : "is-disabled",
                  ].join(" ")}
                >
                  {admin.active
                    ? "Activo"
                    : "Inactivo"}
                </span>

                <button
                  type="button"
                  className="admin-master-toggle"
                  onClick={() =>
                    toggleAdmin(admin)
                  }
                >
                  {admin.active
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