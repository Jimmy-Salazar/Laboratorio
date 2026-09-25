import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  FlaskConical,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import "../styles/admin.css";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    /*
     * Vista previa.
     * PATCH 06.1 conectara este formulario con Supabase Auth.
     */
    navigate("/admin");
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span>
            <FlaskConical size={39} />
          </span>

          <div>
            <strong>
              Dr. <em>Chasi</em>
            </strong>
            <small>LABORATORIO CL\u00cdNICO</small>
          </div>
        </div>

        <div className="admin-login-heading">
          <span className="admin-login-heading__icon">
            <ShieldCheck size={27} />
          </span>

          <div>
            <h1>Administraci\u00f3n</h1>
            <p>
              Ingresa con tu cuenta autorizada para gestionar el laboratorio.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="admin-login-field">
            <span>Correo electr\u00f3nico</span>

            <div>
              <Mail size={19} />

              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="admin@laboratorio.com"
              />
            </div>
          </label>

          <label className="admin-login-field">
            <span>Contrase\u00f1a</span>

            <div>
              <LockKeyhole size={19} />

              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Ingresa tu contrase\u00f1a"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                aria-label={
                  showPassword
                    ? "Ocultar contrase\u00f1a"
                    : "Mostrar contrase\u00f1a"
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

          <button
            type="submit"
            className="admin-login-submit"
            disabled={!email.trim() || !password.trim()}
          >
            Ingresar
          </button>

          <p className="admin-login-demo">
            Vista previa: la autenticaci\u00f3n real con Supabase se conectar\u00e1 en el siguiente paso.
          </p>
        </form>
      </div>
    </div>
  );
}