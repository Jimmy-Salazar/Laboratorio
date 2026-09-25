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