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