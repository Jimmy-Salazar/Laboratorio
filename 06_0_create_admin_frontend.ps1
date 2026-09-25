#requires -Version 5.1
# PATCH 06.0
# Creates the first administrator frontend:
# - /admin/login
# - /admin
# - shared admin layout/sidebar
# Frontend preview only. Supabase Auth will be connected in the next patch.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$AdminComponentsPath = Join-Path $ProjectPath "src\components\admin"
$PagesPath = Join-Path $ProjectPath "src\pages"
$StylesPath = Join-Path $ProjectPath "src\styles"
$ToolsPath = Join-Path $ProjectPath "tools"

$LayoutPath = Join-Path $AdminComponentsPath "AdminLayout.jsx"
$LoginPath = Join-Path $PagesPath "AdminLoginPage.jsx"
$DashboardPath = Join-Path $PagesPath "AdminDashboardPage.jsx"
$CssPath = Join-Path $StylesPath "admin.css"
$AppPath = Join-Path $ProjectPath "src\App.jsx"
$NodePatchPath = Join-Path $ToolsPath "patch-admin-routes.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 06.0 - ADMIN FRONTEND" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ProjectPath)) {
    throw "Project not found: $ProjectPath"
}

if (-not (Test-Path $AppPath)) {
    throw "App.jsx not found: $AppPath"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found."
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\admin-frontend-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $AppPath (Join-Path $BackupPath "App.jsx") -Force

foreach ($Item in @($LayoutPath, $LoginPath, $DashboardPath, $CssPath)) {
    if (Test-Path $Item) {
        Copy-Item $Item (Join-Path $BackupPath (Split-Path $Item -Leaf)) -Force
    }
}

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

New-Item -ItemType Directory -Force -Path $AdminComponentsPath | Out-Null
New-Item -ItemType Directory -Force -Path $PagesPath | Out-Null
New-Item -ItemType Directory -Force -Path $StylesPath | Out-Null
New-Item -ItemType Directory -Force -Path $ToolsPath | Out-Null

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# ---------------------------------------------------------------------------
# 2. ADMIN LAYOUT
# ---------------------------------------------------------------------------

$LayoutCode = @'
import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  TestTube,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";

import "../../styles/admin.css";

const navigation = [
  {
    to: "/admin",
    end: true,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/agenda",
    label: "Agenda",
    icon: CalendarDays,
  },
  {
    to: "/admin/pacientes",
    label: "Pacientes",
    icon: UsersRound,
  },
  {
    to: "/admin/ordenes",
    label: "\u00d3rdenes",
    icon: ClipboardList,
  },
  {
    to: "/admin/resultados",
    label: "Resultados",
    icon: TestTube,
  },
  {
    to: "/admin/estudios",
    label: "Estudios",
    icon: FlaskConical,
  },
  {
    to: "/admin/sucursales",
    label: "Sucursales",
    icon: Building2,
  },
  {
    to: "/admin/usuarios",
    label: "Usuarios",
    icon: UserRound,
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside
        className={[
          "admin-sidebar",
          sidebarOpen ? "is-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="admin-brand">
          <span className="admin-brand__icon">
            <FlaskConical size={31} />
          </span>

          <div>
            <strong>
              Dr. <span>Chasi</span>
            </strong>
            <small>ADMINISTRACI\u00d3N</small>
          </div>

          <button
            type="button"
            className="admin-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar men\u00fa"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive
                    ? "admin-nav__link is-active"
                    : "admin-nav__link"
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <NavLink
            to="/"
            className="admin-nav__link"
          >
            <LogOut size={19} />
            <span>Volver al sitio</span>
          </NavLink>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar men\u00fa"
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="admin-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir men\u00fa"
            >
              <Menu size={21} />
            </button>

            <div>
              <small>Laboratorio Dr. Chasi</small>
              <strong>Panel administrativo</strong>
            </div>
          </div>

          <div className="admin-topbar__actions">
            <button
              type="button"
              className="admin-icon-button"
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              <span className="admin-notification-dot" />
            </button>

            <div className="admin-user-chip">
              <span className="admin-user-chip__avatar">
                <UserRound size={18} />
              </span>

              <div>
                <strong>Administrador</strong>
                <small>Vista previa</small>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
'@

[System.IO.File]::WriteAllText(
    $LayoutPath,
    $LayoutCode,
    $Utf8NoBom
)

Write-Host "AdminLayout.jsx created." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 3. ADMIN LOGIN PAGE
# ---------------------------------------------------------------------------

$LoginCode = @'
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
'@

[System.IO.File]::WriteAllText(
    $LoginPath,
    $LoginCode,
    $Utf8NoBom
)

Write-Host "AdminLoginPage.jsx created." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 4. ADMIN DASHBOARD
# ---------------------------------------------------------------------------

$DashboardCode = @'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  TestTube,
  UserPlus,
  UsersRound,
} from "lucide-react";

import "../styles/admin.css";

const stats = [
  {
    label: "Citas de hoy",
    value: "12",
    note: "3 pendientes de confirmar",
    icon: CalendarDays,
  },
  {
    label: "Pacientes de hoy",
    value: "9",
    note: "2 pacientes nuevos",
    icon: UsersRound,
  },
  {
    label: "Resultados por liberar",
    value: "7",
    note: "Requieren revisi\u00f3n",
    icon: TestTube,
  },
  {
    label: "\u00d3rdenes del d\u00eda",
    value: "14",
    note: "10 completadas",
    icon: ClipboardList,
  },
];

const appointments = [
  {
    time: "08:00",
    patient: "Mar\u00eda L\u00f3pez",
    study: "Hemograma completo",
    status: "Confirmada",
    statusClass: "is-confirmed",
  },
  {
    time: "08:30",
    patient: "Carlos P\u00e9rez",
    study: "Perfil lip\u00eddico",
    status: "Pendiente",
    statusClass: "is-pending",
  },
  {
    time: "09:00",
    patient: "Ana Torres",
    study: "Perfil tiroideo",
    status: "Confirmada",
    statusClass: "is-confirmed",
  },
  {
    time: "09:30",
    patient: "Pedro G\u00f3mez",
    study: "Qu\u00edmica sangu\u00ednea",
    status: "Completada",
    statusClass: "is-completed",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="admin-dashboard">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            Dashboard
          </span>

          <h1>Resumen del laboratorio</h1>

          <p>
            Vista general de citas, pacientes, \u00f3rdenes y resultados.
          </p>
        </div>

        <div className="admin-page-heading__actions">
          <button
            type="button"
            className="admin-button admin-button--secondary"
          >
            <UserPlus size={18} />
            <span>Nuevo paciente</span>
          </button>

          <button
            type="button"
            className="admin-button admin-button--primary"
          >
            <CalendarDays size={18} />
            <span>Nueva cita</span>
          </button>
        </div>
      </section>

      <section className="admin-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className="admin-stat-card"
              key={stat.label}
            >
              <span className="admin-stat-card__icon">
                <Icon size={23} />
              </span>

              <div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </div>
            </article>
          );
        })}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel">
          <header className="admin-panel__header">
            <div>
              <span className="admin-panel__icon">
                <Clock3 size={20} />
              </span>

              <div>
                <h2>Agenda de hoy</h2>
                <p>Pr\u00f3ximas citas programadas</p>
              </div>
            </div>

            <button type="button">
              Ver agenda
              <ArrowRight size={17} />
            </button>
          </header>

          <div className="admin-appointments">
            {appointments.map((appointment) => (
              <div
                className="admin-appointment-row"
                key={`${appointment.time}-${appointment.patient}`}
              >
                <strong className="admin-appointment-time">
                  {appointment.time}
                </strong>

                <div className="admin-appointment-patient">
                  <strong>{appointment.patient}</strong>
                  <span>{appointment.study}</span>
                </div>

                <span
                  className={[
                    "admin-status-pill",
                    appointment.statusClass,
                  ].join(" ")}
                >
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <aside className="admin-panel">
          <header className="admin-panel__header">
            <div>
              <span className="admin-panel__icon">
                <CheckCircle2 size={20} />
              </span>

              <div>
                <h2>Acciones r\u00e1pidas</h2>
                <p>Operaciones frecuentes</p>
              </div>
            </div>
          </header>

          <div className="admin-quick-actions">
            <button type="button">
              <CalendarDays size={21} />
              <span>
                <strong>Registrar cita</strong>
                <small>Crear una nueva cita manual</small>
              </span>
              <ArrowRight size={17} />
            </button>

            <button type="button">
              <ClipboardList size={21} />
              <span>
                <strong>Crear orden</strong>
                <small>Registrar estudios para un paciente</small>
              </span>
              <ArrowRight size={17} />
            </button>

            <button type="button">
              <FileCheck2 size={21} />
              <span>
                <strong>Cargar resultado</strong>
                <small>Subir PDF y liberar resultado</small>
              </span>
              <ArrowRight size={17} />
            </button>
          </div>
        </aside>
      </section>

      <div className="admin-preview-banner">
        <FileCheck2 size={18} />
        <span>
          Vista previa del panel. Los valores mostrados son demostrativos hasta conectar Supabase.
        </span>
      </div>
    </div>
  );
}
'@

[System.IO.File]::WriteAllText(
    $DashboardPath,
    $DashboardCode,
    $Utf8NoBom
)

Write-Host "AdminDashboardPage.jsx created." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 5. ADMIN CSS
# ---------------------------------------------------------------------------

$CssCode = @'
/* ==========================================================================
   DR. CHASI - ADMIN
   ========================================================================== */

.admin-login-page,
.admin-shell {
  color: #153b66;
  background: #f5f8fc;
}

/* --------------------------------------------------------------------------
   LOGIN
   -------------------------------------------------------------------------- */

.admin-login-page {
  min-height: 100vh;

  display: grid;
  place-items: center;

  padding: 28px;

  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(45, 126, 220, 0.09),
      transparent 34%
    ),
    radial-gradient(
      circle at 85% 80%,
      rgba(20, 101, 194, 0.08),
      transparent 30%
    ),
    #f5f9fd;
}

.admin-login-card {
  width: min(430px, 100%);

  padding: 34px;

  border: 1px solid #dfe8f1;
  border-radius: 20px;

  background: #ffffff;

  box-shadow:
    0 20px 60px
    rgba(30, 74, 115, 0.12);
}

.admin-login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  margin-bottom: 28px;
}

.admin-login-brand > span {
  color: #0b65d5;
}

.admin-login-brand > div {
  display: grid;
}

.admin-login-brand strong {
  color: #0a4b9f;

  font-family: Georgia, "Times New Roman", serif;
  font-size: 25px;
  line-height: 1;
}

.admin-login-brand strong em {
  color: #126be1;
  font-style: normal;
}

.admin-login-brand small {
  margin-top: 4px;

  color: #2472bc;

  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.admin-login-heading {
  display: flex;
  gap: 14px;
  align-items: flex-start;

  margin-bottom: 23px;
}

.admin-login-heading__icon {
  width: 48px;
  height: 48px;

  flex: 0 0 48px;

  display: grid;
  place-items: center;

  border-radius: 50%;

  color: #0b68d7;
  background: #eaf4ff;
}

.admin-login-heading h1 {
  margin: 1px 0 5px;

  color: #103f78;

  font-size: 25px;
}

.admin-login-heading p {
  margin: 0;

  color: #6b829b;

  font-size: 13px;
  line-height: 1.5;
}

.admin-login-card form {
  display: grid;
  gap: 15px;
}

.admin-login-field {
  display: grid;
  gap: 6px;
}

.admin-login-field > span {
  color: #36597c;

  font-size: 12px;
  font-weight: 700;
}

.admin-login-field > div {
  min-height: 49px;

  display: flex;
  align-items: center;
  gap: 9px;

  padding: 0 12px;

  border: 1px solid #c9d9e8;
  border-radius: 10px;

  color: #607d99;
  background: #ffffff;
}

.admin-login-field > div:focus-within {
  border-color: #6ba9ee;

  box-shadow:
    0 0 0 3px
    rgba(27, 111, 210, 0.1);
}

.admin-login-field input {
  width: 100%;
  min-width: 0;
  min-height: 47px;

  border: 0;
  outline: 0;

  color: #173e68;
  background: transparent;

  font: inherit;
  font-size: 16px;
}

.admin-login-field button {
  display: grid;
  place-items: center;

  padding: 4px;

  border: 0;

  color: #5f7d9a;
  background: transparent;

  cursor: pointer;
}

.admin-login-submit {
  min-height: 50px;

  margin-top: 3px;

  border: 1px solid #0b62d0;
  border-radius: 10px;

  color: #ffffff;
  background:
    linear-gradient(
      135deg,
      #0e62d4,
      #1475f0
    );

  font: inherit;
  font-weight: 800;

  cursor: pointer;
}

.admin-login-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.admin-login-demo {
  margin: 0;

  color: #899bae;

  font-size: 10px;
  line-height: 1.4;
  text-align: center;
}

/* --------------------------------------------------------------------------
   SHELL
   -------------------------------------------------------------------------- */

.admin-shell {
  min-height: 100vh;

  display: grid;
  grid-template-columns: 244px minmax(0, 1fr);
}

.admin-sidebar {
  position: sticky;
  top: 0;

  height: 100vh;

  display: flex;
  flex-direction: column;

  padding: 18px 14px;

  color: #dcecff;
  background:
    linear-gradient(
      180deg,
      #07386f,
      #062d5b
    );

  overflow-y: auto;
}

.admin-brand {
  min-height: 62px;

  display: flex;
  align-items: center;
  gap: 9px;

  padding: 0 8px 15px;

  border-bottom:
    1px solid
    rgba(255, 255, 255, 0.11);
}

.admin-brand__icon {
  color: #78b7ff;
}

.admin-brand > div {
  display: grid;
}

.admin-brand strong {
  color: #ffffff;

  font-family: Georgia, "Times New Roman", serif;
  font-size: 20px;
  line-height: 1;
}

.admin-brand strong span {
  color: #8ec5ff;
}

.admin-brand small {
  margin-top: 4px;

  color: #9fc4e8;

  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.admin-sidebar__close {
  display: none;

  margin-left: auto;

  border: 0;

  color: #ffffff;
  background: transparent;

  cursor: pointer;
}

.admin-nav {
  display: grid;
  gap: 5px;

  margin-top: 17px;
}

.admin-nav__link {
  min-height: 43px;

  display: flex;
  align-items: center;
  gap: 11px;

  padding: 0 12px;

  border-radius: 9px;

  color: #c7dbef;

  font-size: 13px;
  font-weight: 650;
  text-decoration: none;

  transition:
    background 150ms ease,
    color 150ms ease;
}

.admin-nav__link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.07);
}

.admin-nav__link.is-active {
  color: #ffffff;
  background:
    linear-gradient(
      90deg,
      rgba(44, 128, 225, 0.44),
      rgba(55, 139, 236, 0.19)
    );
}

.admin-sidebar__footer {
  margin-top: auto;
  padding-top: 15px;

  border-top:
    1px solid
    rgba(255, 255, 255, 0.1);
}

.admin-main {
  min-width: 0;
}

.admin-topbar {
  min-height: 68px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;

  padding: 0 26px;

  border-bottom: 1px solid #e1e9f1;

  background: #ffffff;
}

.admin-topbar__left,
.admin-topbar__actions {
  display: flex;
  align-items: center;
  gap: 13px;
}

.admin-topbar__left > div {
  display: grid;
}

.admin-topbar__left small {
  color: #8598aa;
  font-size: 10px;
}

.admin-topbar__left strong {
  color: #21496f;
  font-size: 14px;
}

.admin-menu-button {
  display: none;
}

.admin-menu-button,
.admin-icon-button {
  width: 40px;
  height: 40px;

  place-items: center;

  border: 1px solid #d9e5ef;
  border-radius: 9px;

  color: #416585;
  background: #ffffff;

  cursor: pointer;
}

.admin-icon-button {
  position: relative;
  display: grid;
}

.admin-notification-dot {
  position: absolute;
  top: 7px;
  right: 7px;

  width: 7px;
  height: 7px;

  border: 2px solid #ffffff;
  border-radius: 50%;

  background: #df4352;
}

.admin-user-chip {
  display: flex;
  align-items: center;
  gap: 9px;
}

.admin-user-chip__avatar {
  width: 36px;
  height: 36px;

  display: grid;
  place-items: center;

  border-radius: 50%;

  color: #0b66d3;
  background: #eaf4ff;
}

.admin-user-chip > div {
  display: grid;
}

.admin-user-chip strong {
  color: #264d72;
  font-size: 12px;
}

.admin-user-chip small {
  color: #8a9cad;
  font-size: 10px;
}

.admin-content {
  padding: 24px 26px 34px;
}

.admin-dashboard {
  width: min(1380px, 100%);
  margin: 0 auto;
}

/* --------------------------------------------------------------------------
   PAGE HEADING
   -------------------------------------------------------------------------- */

.admin-page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;

  margin-bottom: 19px;
}

.admin-page-heading__eyebrow {
  display: block;

  margin-bottom: 4px;

  color: #0c67cf;

  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.admin-page-heading h1 {
  margin: 0;

  color: #143f6d;

  font-size: 28px;
}

.admin-page-heading p {
  margin: 5px 0 0;

  color: #71879e;

  font-size: 13px;
}

.admin-page-heading__actions {
  display: flex;
  gap: 9px;
}

.admin-button {
  min-height: 42px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 0 15px;

  border-radius: 9px;

  font: inherit;
  font-size: 12px;
  font-weight: 750;

  cursor: pointer;
}

.admin-button--primary {
  border: 1px solid #0d61c9;

  color: #ffffff;
  background: #0e66d7;
}

.admin-button--secondary {
  border: 1px solid #cbd9e6;

  color: #315b81;
  background: #ffffff;
}

/* --------------------------------------------------------------------------
   STATS
   -------------------------------------------------------------------------- */

.admin-stats-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 13px;

  margin-bottom: 15px;
}

.admin-stat-card {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 13px;

  padding: 17px;

  border: 1px solid #dfe8f1;
  border-radius: 13px;

  background: #ffffff;

  box-shadow:
    0 5px 18px
    rgba(39, 77, 113, 0.055);
}

.admin-stat-card__icon {
  width: 45px;
  height: 45px;

  flex: 0 0 45px;

  display: grid;
  place-items: center;

  border-radius: 11px;

  color: #0e66d4;
  background: #eaf4ff;
}

.admin-stat-card > div {
  min-width: 0;

  display: grid;
}

.admin-stat-card > div > span {
  color: #6e859c;

  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.admin-stat-card strong {
  margin-top: 2px;

  color: #153f6c;

  font-size: 24px;
}

.admin-stat-card small {
  margin-top: 2px;

  color: #8295a8;

  font-size: 10px;
}

/* --------------------------------------------------------------------------
   PANELS
   -------------------------------------------------------------------------- */

.admin-dashboard-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.65fr)
    minmax(300px, 0.75fr);
  gap: 15px;
}

.admin-panel {
  overflow: hidden;

  border: 1px solid #dfe8f1;
  border-radius: 14px;

  background: #ffffff;

  box-shadow:
    0 5px 18px
    rgba(39, 77, 113, 0.055);
}

.admin-panel__header {
  min-height: 67px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  padding: 13px 17px;

  border-bottom: 1px solid #e7eef5;
}

.admin-panel__header > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-panel__icon {
  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  border-radius: 10px;

  color: #0c65ce;
  background: #eaf4ff;
}

.admin-panel__header h2 {
  margin: 0;

  color: #234d75;

  font-size: 15px;
}

.admin-panel__header p {
  margin: 2px 0 0;

  color: #8a9dad;

  font-size: 10px;
}

.admin-panel__header button {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  border: 0;

  color: #0c63c9;
  background: transparent;

  font: inherit;
  font-size: 11px;
  font-weight: 700;

  cursor: pointer;
}

.admin-appointment-row {
  min-height: 62px;

  display: grid;
  grid-template-columns:
    58px
    minmax(0, 1fr)
    auto;
  gap: 12px;
  align-items: center;

  padding: 10px 17px;

  border-bottom: 1px solid #edf2f7;
}

.admin-appointment-row:last-child {
  border-bottom: 0;
}

.admin-appointment-time {
  color: #0e62c8;
  font-size: 13px;
}

.admin-appointment-patient {
  min-width: 0;

  display: grid;
  gap: 2px;
}

.admin-appointment-patient strong {
  color: #264d73;
  font-size: 12px;
}

.admin-appointment-patient span {
  color: #8094a8;
  font-size: 10px;
}

.admin-status-pill {
  display: inline-flex;

  padding: 6px 9px;

  border-radius: 999px;

  font-size: 10px;
  font-weight: 750;
}

.admin-status-pill.is-confirmed {
  color: #13623e;
  background: #e5f7ed;
}

.admin-status-pill.is-pending {
  color: #86600b;
  background: #fff0c9;
}

.admin-status-pill.is-completed {
  color: #315b83;
  background: #eaf2fa;
}

.admin-quick-actions {
  display: grid;
  gap: 0;
}

.admin-quick-actions button {
  min-height: 74px;

  display: grid;
  grid-template-columns:
    37px
    minmax(0, 1fr)
    18px;
  gap: 10px;
  align-items: center;

  padding: 12px 16px;

  border: 0;
  border-bottom: 1px solid #edf2f7;

  color: #0d64cb;
  background: #ffffff;

  text-align: left;

  cursor: pointer;
}

.admin-quick-actions button:last-child {
  border-bottom: 0;
}

.admin-quick-actions button:hover {
  background: #f8fbff;
}

.admin-quick-actions button > span {
  min-width: 0;

  display: grid;
  gap: 2px;
}

.admin-quick-actions strong {
  color: #284f75;
  font-size: 12px;
}

.admin-quick-actions small {
  color: #8195a8;
  font-size: 10px;
}

.admin-preview-banner {
  display: flex;
  align-items: center;
  gap: 8px;

  margin-top: 14px;
  padding: 10px 13px;

  border: 1px solid #d6e5f3;
  border-radius: 10px;

  color: #55728d;
  background: #f4f9fe;

  font-size: 10px;
}

/* --------------------------------------------------------------------------
   RESPONSIVE
   -------------------------------------------------------------------------- */

.admin-sidebar-overlay {
  display: none;
}

@media (max-width: 1050px) {
  .admin-stats-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .admin-dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .admin-shell {
    display: block;
  }

  .admin-sidebar {
    position: fixed;
    z-index: 90;
    inset: 0 auto 0 0;

    width: min(280px, 84vw);

    transform: translateX(-102%);

    transition: transform 180ms ease;
  }

  .admin-sidebar.is-open {
    transform: translateX(0);
  }

  .admin-sidebar__close {
    display: grid;
    place-items: center;
  }

  .admin-sidebar-overlay {
    position: fixed;
    z-index: 80;
    inset: 0;

    display: block;

    border: 0;

    background: rgba(8, 30, 53, 0.42);
  }

  .admin-menu-button {
    display: grid;
  }

  .admin-content {
    padding-inline: 16px;
  }
}

@media (max-width: 620px) {
  .admin-topbar {
    padding-inline: 12px;
  }

  .admin-user-chip > div {
    display: none;
  }

  .admin-page-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-page-heading__actions {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .admin-stats-grid {
    grid-template-columns: 1fr;
  }

  .admin-appointment-row {
    grid-template-columns:
      50px
      minmax(0, 1fr);
  }

  .admin-status-pill {
    grid-column: 2;
    width: max-content;
  }

  .admin-login-page {
    padding: 14px;
  }

  .admin-login-card {
    padding: 25px 20px;
  }
}
'@

[System.IO.File]::WriteAllText(
    $CssPath,
    $CssCode,
    $Utf8NoBom
)

Write-Host "admin.css created." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 6. PATCH ROUTES
# ---------------------------------------------------------------------------

$NodePatch = @'
import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;
const appPath = path.join(projectPath, "src", "App.jsx");

let source = fs.readFileSync(appPath, "utf8");

function ensureImport(sourceText, statement) {
  if (sourceText.includes(statement)) {
    return sourceText;
  }

  const matches = [...sourceText.matchAll(/^import .*$/gm)];

  if (matches.length === 0) {
    throw new Error("No imports found in App.jsx");
  }

  const lastImport = matches[matches.length - 1];
  const insertAt =
    lastImport.index + lastImport[0].length;

  return (
    sourceText.slice(0, insertAt) +
    "\n" +
    statement +
    sourceText.slice(insertAt)
  );
}

source = ensureImport(
  source,
  'import AdminLayout from "./components/admin/AdminLayout";',
);

source = ensureImport(
  source,
  'import AdminLoginPage from "./pages/AdminLoginPage";',
);

source = ensureImport(
  source,
  'import AdminDashboardPage from "./pages/AdminDashboardPage";',
);

if (
  !source.includes('path="/admin/login"') &&
  !source.includes("path='/admin/login'")
) {
  if (!source.includes("</Routes>")) {
    throw new Error("Could not find </Routes> in App.jsx");
  }

  const routes = `
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
      </Route>
`;

  source = source.replace(
    "</Routes>",
    routes + "    </Routes>",
  );
}

fs.writeFileSync(appPath, source, "utf8");

console.log("Admin routes added.");
'@

[System.IO.File]::WriteAllText(
    $NodePatchPath,
    $NodePatch,
    $Utf8NoBom
)

& node $NodePatchPath

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ROUTE PATCH FAILED" -ForegroundColor Red
    Write-Host "Backup available at:" -ForegroundColor Yellow
    Write-Host $BackupPath
    exit $LASTEXITCODE
}

# ---------------------------------------------------------------------------
# 7. BUILD VALIDATION
# ---------------------------------------------------------------------------

Set-Location $ProjectPath

Write-Host ""
Write-Host "Running production build..." -ForegroundColor Yellow
Write-Host ""

& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Backup available at:" -ForegroundColor Yellow
    Write-Host $BackupPath
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " PATCH 06.0 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Admin login:" -ForegroundColor Cyan
Write-Host "http://localhost:5173/admin/login"
Write-Host ""
Write-Host "Admin dashboard preview:" -ForegroundColor Cyan
Write-Host "http://localhost:5173/admin"
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "Authentication is still a frontend preview."
Write-Host "PATCH 06.1 will connect Supabase Auth and route protection."
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
