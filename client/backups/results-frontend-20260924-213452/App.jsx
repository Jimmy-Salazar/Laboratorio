import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AppointmentPage from "./pages/AppointmentPage";

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
      <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/agendar" element={<AppointmentPage />} />
      </Routes>
  );
}

