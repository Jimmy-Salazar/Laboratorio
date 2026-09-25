import {
  useEffect,
  useState,
} from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  TestTube,
  UserRound,
  UsersRound,
  X,
  ScrollText,
} from "lucide-react";

import { useAdminAuth } from "../../context/AdminAuthContext";
import "../../styles/admin.css";

/* PATCH_06_18_SIMPLIFIED_OPERATIONAL_MENU */

const operationalNavigation = [
  {
    to: "/admin/dashboard",
    end: true,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/pacientes",
    label: "Pacientes",
    icon: UsersRound,
  },
  {
    to: "/admin/resultados",
    label: "Subir Resultados",
    icon: TestTube,
  },
];

const configurationNavigation = [
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
  {
    to: "/admin/actividad",
    label: "Registro de actividad",
    icon: ScrollText,
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

function NavigationLink({
  item,
  onNavigate,
  compact = false,
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          compact
            ? "admin-nav__sublink"
            : "admin-nav__link",
          isActive ? "is-active" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
      onClick={onNavigate}
    >
      <Icon size={compact ? 17 : 19} />
      <span>{item.label}</span>
    </NavLink>
  );
}

/* PATCH_06_23_BRAND_ADMIN_LAYOUT */

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    profile,
    logout,
  } = useAdminAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);
  const [loggingOut, setLoggingOut] =
    useState(false);

  const configurationIsActive =
    configurationNavigation.some(
      (item) =>
        location.pathname === item.to ||
        location.pathname.startsWith(
          `${item.to}/`,
        ),
    );

  const [configurationOpen, setConfigurationOpen] =
    useState(configurationIsActive);

  useEffect(() => {
    setConfigurationOpen(
      configurationIsActive,
    );
  }, [configurationIsActive]);

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

  function closeSidebar() {
    setSidebarOpen(false);
  }

  const isMaster =
    profile?.role === "master";

  const isAdmin =
    profile?.role === "admin";

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
          <div className="admin-brand__logo-block">
            <img
              className="admin-brand-logo"
              src="/brand/dr-milton-chasi-logo.png"
              alt="Laboratorio Clinico Dr. Milton Chasi"
            />

            <small>
              {profile?.role === "master"
                ? "ADMIN MASTER"
                : "ADMINISTRACION"}
            </small>
          </div>

          <button
            type="button"
            className="admin-sidebar__close"
            onClick={closeSidebar}
            aria-label="Cerrar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {isMaster
            ? masterNavigation.map(
                (item) => (
                  <NavigationLink
                    key={item.to}
                    item={item}
                    onNavigate={
                      closeSidebar
                    }
                  />
                ),
              )
            : operationalNavigation.map(
                (item) => (
                  <NavigationLink
                    key={item.to}
                    item={item}
                    onNavigate={
                      closeSidebar
                    }
                  />
                ),
              )}

          {isAdmin ? (
            <div
              className={[
                "admin-nav-group",
                configurationOpen
                  ? "is-open"
                  : "",
                configurationIsActive
                  ? "is-active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className="admin-nav-group__trigger"
                onClick={() =>
                  setConfigurationOpen(
                    (current) => !current,
                  )
                }
                aria-expanded={
                  configurationOpen
                }
              >
                <Settings size={19} />

                <span>
                  {"Configuraci\u00f3n"}
                </span>

                <ChevronDown
                  className="admin-nav-group__chevron"
                  size={17}
                />
              </button>

              {configurationOpen ? (
                <div className="admin-nav-submenu">
                  {configurationNavigation.map(
                    (item) => (
                      <NavigationLink
                        key={item.to}
                        item={item}
                        compact
                        onNavigate={
                          closeSidebar
                        }
                      />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
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

      {sidebarOpen ? (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={closeSidebar}
          aria-label="Cerrar menu"
        />
      ) : null}

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="admin-menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Abrir menu"
            >
              <Menu size={21} />
            </button>

            <div>
              <small>
                Laboratorio Dr. Chasi
              </small>

              <strong>
                {isMaster
                  ? "Administracion master"
                  : profile?.role ===
                      "secretary"
                    ? "Secretaria"
                    : profile?.role ===
                        "laboratorist"
                      ? "Laboratorio"
                      : "Panel administrativo"}
              </strong>
            </div>
          </div>

          <div className="admin-topbar__actions">
            {!isMaster ? (
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
                  {isMaster
                    ? "Master"
                    : profile?.role ===
                        "secretary"
                      ? "Secretaria"
                      : profile?.role ===
                          "laboratorist"
                        ? "Laboratorista"
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