import { useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  Eye,
  EyeOff,

  IdCard,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin.css";

/* PATCH_06_23_BRAND_ADMIN_LOGIN */

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const {
    session,
    profile,
    loading: authLoading,
    login,
  } = useAdminAuth();

  const [identification, setIdentification] =
    useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  if (!authLoading && session && profile) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setMessage("");
    setSubmitting(true);

    const result = await login(
      identification,
      password,
    );

    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    if (result.profile.role === "master") {
      navigate("/admin/administradores", {
        replace: true,
      });
      return;
    }

    navigate("/admin/dashboard", {
      replace: true,
    });
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand admin-login-brand--logo">
          <img
            className="admin-login-brand-logo"
            src="/brand/dr-milton-chasi-logo.png"
            alt="Laboratorio Clinico Dr. Milton Chasi"
          />
        </div>

        <div className="admin-login-heading">
          <span className="admin-login-heading__icon">
            <ShieldCheck size={27} />
          </span>

          <div>
            <h1>Administracion</h1>
            <p>
              Acceso exclusivo para personal autorizado.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="admin-login-field">
            <span>Cedula</span>

            <div>
              <IdCard size={19} />

              <input
                type="text"
                inputMode="numeric"
                autoComplete="username"
                maxLength={15}
                value={identification}
                onChange={(event) =>
                  setIdentification(
                    event.target.value.replace(/\D/g, ""),
                  )
                }
                placeholder="Ingresa tu cedula"
              />
            </div>
          </label>

          <label className="admin-login-field">
            <span>Contrasena</span>

            <div>
              <LockKeyhole size={19} />

              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Ingresa tu contrasena"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
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
              className="admin-login-message"
              role="alert"
            >
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={
              submitting ||
              !identification.trim() ||
              !password
            }
          >
            {submitting
              ? "Validando..."
              : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}