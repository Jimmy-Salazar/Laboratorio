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