import {
  ArrowRight,

  CheckCircle2,

  Clock3,
  FileCheck2,
  TestTube,
  UserPlus,
  UsersRound,
} from "lucide-react";

import "../styles/admin.css";

/* PATCH_06_20_1_DASHBOARD_QUICK_ACTIONS */

import { useNavigate } from "react-router-dom";
/* PATCH_06_19_DASHBOARD_CLEANUP */

const stats = [
  {
    label: "Pacientes de hoy",
    value: "9",
    note: "2 pacientes nuevos",
    icon: UsersRound,
  },
  {
    label: "Resultados liberados",
    value: "7",
    note: "Disponibles para consulta",
    icon: TestTube,
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
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <section className="admin-page-heading">
        <div>
          <span className="admin-page-heading__eyebrow">
            Dashboard
          </span>

          <h1>Resumen del laboratorio</h1>

          <p>
            Vista general de pacientes y resultados.
          </p>
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
                <h2>{"Acciones r\u00e1pidas"}</h2>
                <p>Accesos directos frecuentes</p>
              </div>
            </div>
          </header>

          <div className="admin-quick-actions">
            <button
              type="button"
              onClick={() => navigate("/admin/pacientes")}
            >
              <UserPlus size={21} />
              <span>
                <strong>Nuevo paciente</strong>
                <small>Registrar un nuevo paciente</small>
              </span>
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/resultados")}
            >
              <FileCheck2 size={21} />
              <span>
                <strong>Subir resultado</strong>
                <small>Cargar y liberar resultado del paciente</small>
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