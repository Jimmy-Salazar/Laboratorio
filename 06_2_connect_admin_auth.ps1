#requires -Version 5.1
# PATCH 06.2
# Real Supabase login for admin/master + protected admin routes + master admin manager.
#
# This patch:
# - Installs @supabase/supabase-js if needed.
# - Creates src/lib/supabase.js.
# - Creates AdminAuthContext.
# - Protects /admin.
# - Uses identification number + password at /admin/login.
# - Redirects master -> /admin/administradores.
# - Redirects normal admin -> /admin/dashboard.
# - Creates master UI to list/create/activate/deactivate administrators.
# - Creates local Supabase Edge Function source: supabase/functions/create-admin/index.ts.
#
# IMPORTANT:
# - The browser only receives the public anon/publishable key.
# - The service_role key NEVER goes in Vite, React, .env.local, or GitHub.
# - The create-admin Edge Function uses the server-side Supabase secret automatically.

$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\projects\Laboratorio"
$ProjectPath = Join-Path $ProjectRoot "client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$AppPath = Join-Path $ProjectPath "src\App.jsx"
$PackagePath = Join-Path $ProjectPath "package.json"
$GitIgnorePath = Join-Path $ProjectRoot ".gitignore"
$EnvPath = Join-Path $ProjectPath ".env.local"
$EnvExamplePath = Join-Path $ProjectPath ".env.example"

$LibPath = Join-Path $ProjectPath "src\lib"
$ContextPath = Join-Path $ProjectPath "src\context"
$AdminComponentsPath = Join-Path $ProjectPath "src\components\admin"
$PagesPath = Join-Path $ProjectPath "src\pages"
$ToolsPath = Join-Path $ProjectPath "tools"

$SupabaseFunctionPath = Join-Path $ProjectRoot "supabase\functions\create-admin"

$SupabaseClientPath = Join-Path $LibPath "supabase.js"
$AuthContextPath = Join-Path $ContextPath "AdminAuthContext.jsx"
$RequireAdminPath = Join-Path $AdminComponentsPath "RequireAdmin.jsx"
$AdminHomeRedirectPath = Join-Path $AdminComponentsPath "AdminHomeRedirect.jsx"
$AdminLayoutPath = Join-Path $AdminComponentsPath "AdminLayout.jsx"
$AdminLoginPath = Join-Path $PagesPath "AdminLoginPage.jsx"
$AdminDashboardPath = Join-Path $PagesPath "AdminDashboardPage.jsx"
$MasterAdminsPath = Join-Path $PagesPath "MasterAdminsPage.jsx"
$EdgeFunctionPath = Join-Path $SupabaseFunctionPath "index.ts"
$NodePatchPath = Join-Path $ToolsPath "patch-admin-auth-routes.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 06.2 - REAL ADMIN AUTH" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($RequiredPath in @(
    $ProjectPath,
    $AppPath,
    $PackagePath,
    $AdminLayoutPath,
    $AdminLoginPath,
    $AdminDashboardPath
)) {
    if (-not (Test-Path $RequiredPath)) {
        throw "Required path not found: $RequiredPath"
    }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found."
}

# ---------------------------------------------------------------------------
# 1. BACKUP
# ---------------------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\admin-auth-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

foreach ($File in @(
    $AppPath,
    $AdminLayoutPath,
    $AdminLoginPath
)) {
    Copy-Item $File (Join-Path $BackupPath (Split-Path $File -Leaf)) -Force
}

if (Test-Path $MasterAdminsPath) {
    Copy-Item $MasterAdminsPath (Join-Path $BackupPath "MasterAdminsPage.jsx") -Force
}

if (Test-Path $AuthContextPath) {
    Copy-Item $AuthContextPath (Join-Path $BackupPath "AdminAuthContext.jsx") -Force
}

if (Test-Path $RequireAdminPath) {
    Copy-Item $RequireAdminPath (Join-Path $BackupPath "RequireAdmin.jsx") -Force
}

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

New-Item -ItemType Directory -Force -Path $LibPath | Out-Null
New-Item -ItemType Directory -Force -Path $ContextPath | Out-Null
New-Item -ItemType Directory -Force -Path $AdminComponentsPath | Out-Null
New-Item -ItemType Directory -Force -Path $PagesPath | Out-Null
New-Item -ItemType Directory -Force -Path $ToolsPath | Out-Null
New-Item -ItemType Directory -Force -Path $SupabaseFunctionPath | Out-Null

# ---------------------------------------------------------------------------
# 2. ENSURE .gitignore PROTECTS LOCAL ENV
# ---------------------------------------------------------------------------

if (-not (Test-Path $GitIgnorePath)) {
    [System.IO.File]::WriteAllText(
        $GitIgnorePath,
        ".env`r`n.env.*`r`n!.env.example`r`nnode_modules/`r`ndist/`r`n",
        $Utf8NoBom
    )
}
else {
    $GitIgnore = [System.IO.File]::ReadAllText($GitIgnorePath)

    if ($GitIgnore -notmatch '(?m)^\.env\.\*$') {
        Add-Content -Path $GitIgnorePath -Value ".env.*"
    }

    if ($GitIgnore -notmatch '(?m)^!\.env\.example$') {
        Add-Content -Path $GitIgnorePath -Value "!.env.example"
    }
}

# ---------------------------------------------------------------------------
# 3. PUBLIC SUPABASE CONFIG
# ---------------------------------------------------------------------------

$ExistingEnv = ""

if (Test-Path $EnvPath) {
    $ExistingEnv = [System.IO.File]::ReadAllText($EnvPath)
}

$HasUrl = $ExistingEnv -match '(?m)^VITE_SUPABASE_URL=.+$'
$HasKey = $ExistingEnv -match '(?m)^VITE_SUPABASE_(ANON_KEY|PUBLISHABLE_KEY)=.+$'

if (-not ($HasUrl -and $HasKey)) {
    Write-Host "Frontend Supabase configuration is required." -ForegroundColor Yellow
    Write-Host "Use ONLY the public anon/publishable key here." -ForegroundColor Yellow
    Write-Host "NEVER use service_role or sb_secret in the frontend." -ForegroundColor Red
    Write-Host ""

    $SupabaseUrl = (Read-Host "Supabase Project URL").Trim().TrimEnd("/")
    $PublicKey = (Read-Host "Supabase anon/publishable key").Trim()

    if (-not $SupabaseUrl.StartsWith("https://")) {
        throw "Invalid Supabase URL."
    }

    if ([string]::IsNullOrWhiteSpace($PublicKey)) {
        throw "Public Supabase key is required."
    }

    $EnvContent = @"
VITE_SUPABASE_URL=$SupabaseUrl
VITE_SUPABASE_PUBLISHABLE_KEY=$PublicKey
"@

    [System.IO.File]::WriteAllText(
        $EnvPath,
        $EnvContent,
        $Utf8NoBom
    )

    Write-Host ".env.local created (gitignored)." -ForegroundColor Green
}
else {
    Write-Host "Existing .env.local Supabase configuration detected." -ForegroundColor Green
}

$EnvExample = @'
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
'@

[System.IO.File]::WriteAllText(
    $EnvExamplePath,
    $EnvExample,
    $Utf8NoBom
)

# ---------------------------------------------------------------------------
# 4. INSTALL SUPABASE JS IF NEEDED
# ---------------------------------------------------------------------------

$PackageJson = Get-Content $PackagePath -Raw | ConvertFrom-Json
$HasSupabaseJs = $false

if ($PackageJson.dependencies -and $PackageJson.dependencies.'@supabase/supabase-js') {
    $HasSupabaseJs = $true
}

if (-not $HasSupabaseJs) {
    Write-Host ""
    Write-Host "Installing @supabase/supabase-js..." -ForegroundColor Yellow

    Set-Location $ProjectPath
    & npm.cmd install @supabase/supabase-js

    if ($LASTEXITCODE -ne 0) {
        throw "npm install @supabase/supabase-js failed."
    }
}
else {
    Write-Host "@supabase/supabase-js already installed." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 5. SUPABASE CLIENT
# ---------------------------------------------------------------------------

$SupabaseClientCode = @'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabasePublicKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublicKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or public Supabase key.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublicKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
'@

[System.IO.File]::WriteAllText(
    $SupabaseClientPath,
    $SupabaseClientCode,
    $Utf8NoBom
)

# ---------------------------------------------------------------------------
# 6. ADMIN AUTH CONTEXT
# ---------------------------------------------------------------------------

$AuthContextCode = @'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AdminAuthContext = createContext(null);

function normalizeIdentification(value) {
  return String(value ?? "").replace(/\D/g, "");
}

async function loadStaffProfile(userId) {
  const { data, error } = await supabase
    .from("staff_profiles")
    .select(
      "user_id, full_name, role, active, identification_number",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (nextSession) => {
    if (!nextSession?.user?.id) {
      setProfile(null);
      return null;
    }

    const nextProfile = await loadStaffProfile(
      nextSession.user.id,
    );

    if (!nextProfile?.active) {
      await supabase.auth.signOut();
      setProfile(null);
      return null;
    }

    if (
      nextProfile.role !== "master" &&
      nextProfile.role !== "admin"
    ) {
      await supabase.auth.signOut();
      setProfile(null);
      return null;
    }

    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(currentSession);

        if (currentSession) {
          await refreshProfile(currentSession);
        }
      } catch (error) {
        console.error("Admin auth boot failed:", error);

        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) {
          return;
        }

        setSession(nextSession);

        if (!nextSession) {
          setProfile(null);
          setLoading(false);
          return;
        }

        try {
          await refreshProfile(nextSession);
        } catch (error) {
          console.error(
            "Could not refresh admin profile:",
            error,
          );

          setProfile(null);
        } finally {
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const login = useCallback(
    async (identification, password) => {
      const cleanIdentification =
        normalizeIdentification(identification);

      if (!/^\d{8,15}$/.test(cleanIdentification)) {
        return {
          ok: false,
          message:
            "Ingresa un numero de identificacion valido.",
        };
      }

      const email =
        `${cleanIdentification}@admin.drchasi.local`;

      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        return {
          ok: false,
          message: "Credenciales no validas.",
        };
      }

      try {
        const nextProfile = await loadStaffProfile(
          data.session.user.id,
        );

        if (
          !nextProfile?.active ||
          !["master", "admin"].includes(nextProfile.role)
        ) {
          await supabase.auth.signOut();

          return {
            ok: false,
            message: "Credenciales no validas.",
          };
        }

        setSession(data.session);
        setProfile(nextProfile);

        return {
          ok: true,
          profile: nextProfile,
        };
      } catch (profileError) {
        console.error(
          "Could not load staff profile:",
          profileError,
        );

        await supabase.auth.signOut();

        return {
          ok: false,
          message:
            "No fue posible validar el acceso administrativo.",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      login,
      logout,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      login,
      logout,
      refreshProfile,
    ],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth must be used inside AdminAuthProvider.",
    );
  }

  return context;
}
'@

[System.IO.File]::WriteAllText(
    $AuthContextPath,
    $AuthContextCode,
    $Utf8NoBom
)

# ---------------------------------------------------------------------------
# 7. ROUTE GUARDS
# ---------------------------------------------------------------------------

$RequireAdminCode = @'
import { Navigate, useLocation } from "react-router-dom";

import { useAdminAuth } from "../../context/AdminAuthContext";

export function RequireAdmin({ children }) {
  const { session, profile, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-auth-loading">
        Validando acceso...
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export function RequireRole({
  children,
  roles,
  fallback = "/admin",
}) {
  const { profile, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="admin-auth-loading">
        Validando permisos...
      </div>
    );
  }

  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
'@

[System.IO.File]::WriteAllText(
    $RequireAdminPath,
    $RequireAdminCode,
    $Utf8NoBom
)

$AdminHomeRedirectCode = @'
import { Navigate } from "react-router-dom";

import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminHomeRedirect() {
  const { profile } = useAdminAuth();

  if (profile?.role === "master") {
    return (
      <Navigate
        to="/admin/administradores"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/admin/dashboard"
      replace
    />
  );
}
'@

[System.IO.File]::WriteAllText(
    $AdminHomeRedirectPath,
    $AdminHomeRedirectCode,
    $Utf8NoBom
)

# ---------------------------------------------------------------------------
# 8. REAL ADMIN LOGIN
# ---------------------------------------------------------------------------

$AdminLoginCode = @'
import { useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  Eye,
  EyeOff,
  FlaskConical,
  IdCard,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin.css";

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
        <div className="admin-login-brand">
          <span>
            <FlaskConical size={39} />
          </span>

          <div>
            <strong>
              Dr. <em>Chasi</em>
            </strong>
            <small>LABORATORIO CLINICO</small>
          </div>
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
'@

[System.IO.File]::WriteAllText(
    $AdminLoginPath,
    $AdminLoginCode,
    $Utf8NoBom
)

# ---------------------------------------------------------------------------
# 9. ROLE-AWARE ADMIN LAYOUT
# ---------------------------------------------------------------------------

$AdminLayoutCode = @'
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
'@

[System.IO.File]::WriteAllText(
    $AdminLayoutPath,
    $AdminLayoutCode,
    $Utf8NoBom
)

# ---------------------------------------------------------------------------
# 10. MASTER ADMINISTRATORS PAGE
# ---------------------------------------------------------------------------

$MasterAdminsCode = @'
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
'@

[System.IO.File]::WriteAllText(
    $MasterAdminsPath,
    $MasterAdminsCode,
    $Utf8NoBom
)

# ---------------------------------------------------------------------------
# 11. EDGE FUNCTION: CREATE ADMIN
# ---------------------------------------------------------------------------

$EdgeFunctionCode = @'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json(
      {
        ok: false,
        message: "Metodo no permitido.",
      },
      405,
    );
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");

  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY");

  const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey
  ) {
    return json(
      {
        ok: false,
        message:
          "Configuracion del servidor incompleta.",
      },
      500,
    );
  }

  const authorization =
    req.headers.get("Authorization");

  if (!authorization) {
    return json(
      {
        ok: false,
        message: "No autorizado.",
      },
      401,
    );
  }

  const callerClient = createClient(
    supabaseUrl,
    anonKey,
    {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    },
  );

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();

  if (callerError || !caller) {
    return json(
      {
        ok: false,
        message: "No autorizado.",
      },
      401,
    );
  }

  const adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const {
    data: callerProfile,
    error: profileError,
  } = await adminClient
    .from("staff_profiles")
    .select("role, active")
    .eq("user_id", caller.id)
    .maybeSingle();

  if (
    profileError ||
    callerProfile?.role !== "master" ||
    callerProfile?.active !== true
  ) {
    return json(
      {
        ok: false,
        message: "No autorizado.",
      },
      403,
    );
  }

  let body: {
    fullName?: string;
    identificationNumber?: string;
    password?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json(
      {
        ok: false,
        message: "Solicitud invalida.",
      },
      400,
    );
  }

  const fullName =
    String(body.fullName ?? "").trim();

  const identificationNumber =
    String(
      body.identificationNumber ?? "",
    ).replace(/\D/g, "");

  const password =
    String(body.password ?? "");

  if (
    fullName.length < 2 ||
    !/^\d{8,15}$/.test(
      identificationNumber,
    ) ||
    password.length < 8
  ) {
    return json(
      {
        ok: false,
        message:
          "Datos del administrador incompletos o invalidos.",
      },
      400,
    );
  }

  const email =
    `${identificationNumber}@admin.drchasi.local`;

  const {
    data: existingProfile,
  } = await adminClient
    .from("staff_profiles")
    .select("user_id")
    .eq(
      "identification_number",
      identificationNumber,
    )
    .maybeSingle();

  if (existingProfile) {
    return json(
      {
        ok: false,
        message:
          "Ya existe un usuario con esa cedula.",
      },
      409,
    );
  }

  const {
    data: created,
    error: createError,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      identification_number:
        identificationNumber,
      role: "admin",
    },
  });

  if (createError || !created.user) {
    return json(
      {
        ok: false,
        message:
          "No fue posible crear la cuenta de acceso.",
      },
      400,
    );
  }

  const {
    error: insertError,
  } = await adminClient
    .from("staff_profiles")
    .insert({
      user_id: created.user.id,
      full_name: fullName,
      role: "admin",
      active: true,
      identification_number:
        identificationNumber,
    });

  if (insertError) {
    await adminClient.auth.admin.deleteUser(
      created.user.id,
    );

    return json(
      {
        ok: false,
        message:
          "No fue posible crear el perfil administrativo.",
      },
      500,
    );
  }

  return json({
    ok: true,
    admin: {
      userId: created.user.id,
      fullName,
      identificationNumber,
      role: "admin",
      active: true,
    },
  });
});
'@

[System.IO.File]::WriteAllText(
    $EdgeFunctionPath,
    $EdgeFunctionCode,
    $Utf8NoBom
)

# ---------------------------------------------------------------------------
# 12. APP ROUTES
# ---------------------------------------------------------------------------

$NodePatch = @'
import fs from "node:fs";
import path from "node:path";

const projectPath =
  String.raw`C:\projects\Laboratorio\client`;

const appPath =
  path.join(projectPath, "src", "App.jsx");

let source = fs.readFileSync(
  appPath,
  "utf8",
);

function ensureImport(
  sourceText,
  statement,
) {
  if (sourceText.includes(statement)) {
    return sourceText;
  }

  const matches = [
    ...sourceText.matchAll(/^import .*$/gm),
  ];

  if (matches.length === 0) {
    throw new Error(
      "No imports found in App.jsx",
    );
  }

  const lastImport =
    matches[matches.length - 1];

  const insertAt =
    lastImport.index +
    lastImport[0].length;

  return (
    sourceText.slice(0, insertAt) +
    "\n" +
    statement +
    sourceText.slice(insertAt)
  );
}

source = ensureImport(
  source,
  'import { AdminAuthProvider } from "./context/AdminAuthContext";',
);

source = ensureImport(
  source,
  'import { RequireAdmin, RequireRole } from "./components/admin/RequireAdmin";',
);

source = ensureImport(
  source,
  'import AdminHomeRedirect from "./components/admin/AdminHomeRedirect";',
);

source = ensureImport(
  source,
  'import MasterAdminsPage from "./pages/MasterAdminsPage";',
);

const oldAdminRoutes =
  /<Route\s+path=["']\/admin\/login["'][\s\S]*?<Route\s+path=["']\/admin["'][\s\S]*?<\/Route>/;

const newAdminRoutes = `
      <Route
        path="/admin/login"
        element={
          <AdminAuthProvider>
            <AdminLoginPage />
          </AdminAuthProvider>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminAuthProvider>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </AdminAuthProvider>
        }
      >
        <Route
          index
          element={<AdminHomeRedirect />}
        />

        <Route
          path="dashboard"
          element={
            <RequireRole
              roles={["admin"]}
            >
              <AdminDashboardPage />
            </RequireRole>
          }
        />

        <Route
          path="administradores"
          element={
            <RequireRole
              roles={["master"]}
            >
              <MasterAdminsPage />
            </RequireRole>
          }
        />
      </Route>`;

if (oldAdminRoutes.test(source)) {
  source = source.replace(
    oldAdminRoutes,
    newAdminRoutes.trim(),
  );
} else {
  throw new Error(
    "Existing admin route block was not found. PATCH 06.0 may not be applied.",
  );
}

fs.writeFileSync(
  appPath,
  source,
  "utf8",
);

console.log(
  "Protected admin routes installed.",
);
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
    Write-Host "Backup:" -ForegroundColor Yellow
    Write-Host $BackupPath
    exit $LASTEXITCODE
}

# ---------------------------------------------------------------------------
# 13. APPEND ADMIN MASTER STYLES
# ---------------------------------------------------------------------------

$AdminCssPath = Join-Path $ProjectPath "src\styles\admin.css"

$ExtraCss = @'

/* ==========================================================================
   PATCH 06.2 - AUTH + MASTER
   ========================================================================== */

.admin-auth-loading {
  min-height: 100vh;

  display: grid;
  place-items: center;

  color: #4f6f91;
  background: #f5f8fc;

  font-weight: 700;
}

.admin-login-message {
  padding: 10px 12px;

  border: 1px solid #efc5c5;
  border-radius: 9px;

  color: #8b2e2e;
  background: #fff3f3;

  font-size: 12px;
  font-weight: 650;
}

.admin-nav__button {
  width: 100%;

  border: 0;

  text-align: left;

  cursor: pointer;
}

.admin-nav__button:disabled {
  opacity: 0.55;
  cursor: wait;
}

.admin-master-grid {
  display: grid;
  grid-template-columns:
    minmax(300px, 0.72fr)
    minmax(0, 1.28fr);
  gap: 15px;
}

.admin-create-form {
  display: grid;
  gap: 14px;

  padding: 18px;
}

.admin-create-form label {
  display: grid;
  gap: 6px;
}

.admin-create-form label > span {
  color: #3c5e7f;

  font-size: 11px;
  font-weight: 750;
}

.admin-form-control {
  min-height: 47px;

  display: flex;
  align-items: center;
  gap: 9px;

  padding: 0 11px;

  border: 1px solid #cbd9e6;
  border-radius: 9px;

  color: #617e9a;
  background: #ffffff;
}

.admin-form-control:focus-within {
  border-color: #6ba9ee;

  box-shadow:
    0 0 0 3px
    rgba(27, 111, 210, 0.1);
}

.admin-form-control input {
  width: 100%;
  min-width: 0;
  min-height: 45px;

  border: 0;
  outline: 0;

  color: #173e68;
  background: transparent;

  font: inherit;
  font-size: 15px;
}

.admin-create-submit {
  width: 100%;
  margin-top: 3px;
}

.admin-create-submit:disabled {
  opacity: 0.55;
  cursor: wait;
}

.admin-master-message {
  padding: 10px 12px;

  border-radius: 9px;

  font-size: 11px;
  font-weight: 700;
}

.admin-master-message.is-success {
  border: 1px solid #bde2cc;

  color: #1c6942;
  background: #edf9f2;
}

.admin-master-message.is-error {
  border: 1px solid #efcaca;

  color: #8c3434;
  background: #fff3f3;
}

.admin-master-message.is-info {
  border: 1px solid #d1e2f2;

  color: #4b6c8d;
  background: #f3f8fd;
}

.admin-master-list {
  display: grid;
}

.admin-master-empty {
  padding: 28px 18px;

  color: #8194a7;

  font-size: 12px;
  text-align: center;
}

.admin-master-row {
  min-width: 0;

  display: grid;
  grid-template-columns:
    38px
    minmax(0, 1fr)
    auto
    auto;
  gap: 10px;
  align-items: center;

  padding: 13px 16px;

  border-bottom: 1px solid #edf2f7;
}

.admin-master-row:last-child {
  border-bottom: 0;
}

.admin-master-row__identity {
  min-width: 0;

  display: grid;
  gap: 2px;
}

.admin-master-row__identity strong {
  color: #264d73;
  font-size: 12px;
}

.admin-master-row__identity span {
  color: #8195a8;
  font-size: 10px;
}

.admin-status-pill.is-disabled {
  color: #6d7480;
  background: #edf0f4;
}

.admin-master-toggle {
  min-height: 34px;

  padding: 0 10px;

  border: 1px solid #cddbe8;
  border-radius: 8px;

  color: #355e84;
  background: #ffffff;

  font: inherit;
  font-size: 10px;
  font-weight: 750;

  cursor: pointer;
}

@media (max-width: 980px) {
  .admin-master-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .admin-master-row {
    grid-template-columns:
      38px
      minmax(0, 1fr);
  }

  .admin-master-row .admin-status-pill,
  .admin-master-toggle {
    grid-column: 2;
    width: max-content;
  }
}
'@

Add-Content -Path $AdminCssPath -Value $ExtraCss

# ---------------------------------------------------------------------------
# 14. BUILD
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
Write-Host " PATCH 06.2 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Real admin login:" -ForegroundColor Cyan
Write-Host "http://localhost:5173/admin/login"
Write-Host ""
Write-Host "Master page:" -ForegroundColor Cyan
Write-Host "http://localhost:5173/admin/administradores"
Write-Host ""
Write-Host "Edge Function source created at:" -ForegroundColor Cyan
Write-Host $EdgeFunctionPath
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "Run 004_admin_auth_policies.sql in Supabase."
Write-Host "Then deploy Edge Function create-admin before testing administrator creation."
Write-Host ""
