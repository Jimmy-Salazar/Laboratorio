import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AppointmentPage from "./pages/AppointmentPage";
import ResultsPage from "./pages/ResultsPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { RequireAdmin, RequireRole } from "./components/admin/RequireAdmin";
import AdminHomeRedirect from "./components/admin/AdminHomeRedirect";
import MasterAdminsPage from "./pages/MasterAdminsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminStudiesPage from "./pages/AdminStudiesPage";
import AdminBranchesPage from "./pages/AdminBranchesPage";

import AdminAuditLogPage from "./pages/AdminAuditLogPage";
import AdminPatientsPage from "./pages/AdminPatientsPage";
import AdminResultsUploadPage from "./pages/AdminResultsUploadPage";
/*
 * MAPA DE RUTAS DEL FRONTEND
 * ---------------------------------------------------------------------------
 * Por ahora solo necesitamos:
 * - Home publico
 * - Login reservado
 *
 * Despues agregaremos /patient y /admin con rutas protegidas.
 */

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/resultados" element={<ResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/agendar" element={<AppointmentPage />} />
      
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
              roles={["admin", "secretary", "laboratorist"]}
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
        <Route
          path="usuarios"
          element={
            <RequireRole
              roles={["admin"]}
            >
              <AdminUsersPage />
            </RequireRole>
          }
        />

      
        <Route
          path="estudios"
          element={
            <RequireRole roles={["admin"]}>
              <AdminStudiesPage />
            </RequireRole>
          }
        />

        <Route
          path="sucursales"
          element={
            <RequireRole roles={["admin"]}>
              <AdminBranchesPage />
            </RequireRole>
          }
        />

        <Route
          path="actividad"
          element={
            <RequireRole
              roles={["admin"]}
            >
              <AdminAuditLogPage />
            </RequireRole>
          }
        />

        <Route
          path="pacientes"
          element={
            <RequireRole
              roles={[
                "admin",
                "secretary",
                "laboratorist",
              ]}
            >
              <AdminPatientsPage />
            </RequireRole>
          }
        />

        <Route
          path="resultados"
          element={
            <RequireRole
              roles={[
                "admin",
                "secretary",
                "laboratorist",
              ]}
            >
              <AdminResultsUploadPage />
            </RequireRole>
          }
        />
</Route>
    </Routes>
  );
}

