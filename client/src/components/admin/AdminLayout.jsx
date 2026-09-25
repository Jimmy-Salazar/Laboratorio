import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  TestTube,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { useAdminAuth } from "../../context/AdminAuthContext";
import "../../styles/admin.css";

const adminNavigation = [
  {
    to: "/admin/dashboard",
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
    label: "Ordenes",
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
];

const masterNavigation = [
  {
    to: "/admin/administradores",
    end: true,
    label: "Administradores",
    icon: ShieldCheck,
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const {
    profile,
    logout,
  } = useAdminAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);
  const [loggingOut, setLoggingOut] =
    useState(false);

  const navigation =
    profile?.role === "master"
      ? masterNavigation
      : adminNavigation;

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();
      navigate("/admin/login", {
        replace: true,
      });
    } finally {
      setLoggingOut(false);
    }
  }

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
            <small>
              {profile?.role === "master"
                ? "ADMIN MASTER"
                : "ADMINISTRACION"}
            </small>
          </div>

          <button
            type="button"
            className="admin-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menu"
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
                onClick={() =>
                  setSidebarOpen(false)
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <button
            type="button"
            className="admin-nav__link admin-nav__button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={19} />
            <span>
              {loggingOut
                ? "Saliendo..."
                : "Cerrar sesion"}
            </span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menu"
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="admin-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={21} />
            </button>

            <div>
              <small>Laboratorio Dr. Chasi</small>
              <strong>
                {profile?.role === "master"
                  ? "Administracion master"
                  : "Panel administrativo"}
              </strong>
            </div>
          </div>

          <div className="admin-topbar__actions">
            {profile?.role !== "master" ? (
              <button
                type="button"
                className="admin-icon-button"
                aria-label="Notificaciones"
              >
                <Bell size={20} />
              </button>
            ) : null}

            <div className="admin-user-chip">
              <span className="admin-user-chip__avatar">
                <UserRound size={18} />
              </span>

              <div>
                <strong>
                  {profile?.full_name ??
                    "Administrador"}
                </strong>
                <small>
                  {profile?.role === "master"
                    ? "Master"
                    : "Administrador"}
                </small>
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