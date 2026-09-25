import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Droplets,
  FlaskConical,
  HeartPulse,
  Info,
  MapPin,
  MessageCircle,
  Microscope,
  Search,
  TestTube,
  UserRound,
} from "lucide-react";

import "../styles/appointment.css";

/*
 * PAGINA PUBLICA DE AGENDAMIENTO
 * ---------------------------------------------------------------------------
 * Primera version frontend. Todavia NO guarda informacion en Supabase.
 * Los identificadores tecnicos permanecen en ingles.
 */

const translations = {
  es: {
    nav: {
      home: "Inicio",
      specialties: "Especialidades",
      branches: "Sucursales",
      results: "Resultados",
      booking: "Agendar un estudio",
      contact: "Contáctanos",
    },
    hero: {
      title: "Agendar un estudio",
      description:
        "Selecciona el estudio, la sucursal y el horario que prefieres. Tu solicitud quedará pendiente de confirmación.",
    },
    steps: [
      ["Estudio", "Selecciona el examen"],
      ["Fecha y sucursal", "Elige cuándo y dónde"],
      ["Datos del paciente", "Ingresa tu información"],
      ["Confirmar", "Revisa y envía tu solicitud"],
    ],
    study: {
      title: "¿Qué estudio necesitas?",
      subtitle:
        "Selecciona el estudio o examen que deseas realizar. Si necesitas varios estudios, podrás solicitarlos posteriormente.",
      placeholder: "Selecciona un estudio o examen",
      viewAll: "Ver todos los estudios",
      continue: "Continuar",
    },
    schedule: {
      title: "Elige fecha y sucursal",
      subtitle: "Selecciona la sede, fecha y horario que prefieres para tu estudio.",
      branch: "Sucursal",
      date: "Fecha preferida",
      time: "Hora preferida",
      placeholder: "Selecciona una sucursal",
      continue: "Continuar",
      back: "Volver",
    },
    patient: {
      title: "Datos del paciente",
      subtitle:
        "Ingresa la información necesaria para que podamos contactarte y confirmar la solicitud.",
      firstName: "Nombres",
      lastName: "Apellidos",
      identification: "Identificación",
      phone: "Teléfono / WhatsApp",
      email: "Correo electrónico",
      notes: "Observaciones",
      optional: "opcional",
      review: "Revisar solicitud",
      back: "Volver",
    },
    confirm: {
      title: "Revisa tu solicitud",
      subtitle: "Confirma que la información sea correcta antes de enviarla.",
      send: "Enviar solicitud",
      edit: "Editar",
    },
    summary: {
      title: "Tu solicitud",
      study: "Estudio o examen",
      branch: "Sucursal",
      date: "Fecha preferida",
      time: "Hora preferida",
      status: "Estado",
      pending: "Pendiente de confirmación",
      important: "Importante",
      note:
        "Esta es una solicitud de agendamiento. Una vez enviada, nuestro equipo la revisará y te contactará para confirmar la fecha y hora de tu cita.",
    },
    success: {
      title: "Solicitud preparada",
      message:
        "La interfaz ya está lista. En el siguiente paso conectaremos este formulario con Supabase.",
      restart: "Agendar otro estudio",
    },
  },
  en: {
    nav: {
      home: "Home",
      specialties: "Specialties",
      branches: "Branches",
      results: "Results",
      booking: "Book a study",
      contact: "Contact us",
    },
    hero: {
      title: "Book a study",
      description:
        "Select the study, branch and preferred time. Your request will remain pending confirmation.",
    },
    steps: [
      ["Study", "Select the exam"],
      ["Date and branch", "Choose when and where"],
      ["Patient details", "Enter your information"],
      ["Confirm", "Review and send your request"],
    ],
    study: {
      title: "Which study do you need?",
      subtitle:
        "Select the study or exam you need. Additional studies can be requested later.",
      placeholder: "Select a study or exam",
      viewAll: "View all studies",
      continue: "Continue",
    },
    schedule: {
      title: "Choose date and branch",
      subtitle: "Select the branch, date and preferred time for your study.",
      branch: "Branch",
      date: "Preferred date",
      time: "Preferred time",
      placeholder: "Select a branch",
      continue: "Continue",
      back: "Back",
    },
    patient: {
      title: "Patient details",
      subtitle:
        "Enter the information we need to contact you and confirm the request.",
      firstName: "First name",
      lastName: "Last name",
      identification: "Identification",
      phone: "Phone / WhatsApp",
      email: "Email",
      notes: "Notes",
      optional: "optional",
      review: "Review request",
      back: "Back",
    },
    confirm: {
      title: "Review your request",
      subtitle: "Confirm that the information is correct before sending it.",
      send: "Send request",
      edit: "Edit",
    },
    summary: {
      title: "Your request",
      study: "Study or exam",
      branch: "Branch",
      date: "Preferred date",
      time: "Preferred time",
      status: "Status",
      pending: "Pending confirmation",
      important: "Important",
      note:
        "This is an appointment request. Once submitted, our team will review it and contact you to confirm the date and time.",
    },
    success: {
      title: "Request prepared",
      message:
        "The frontend is ready. In the next step we will connect this form to Supabase.",
      restart: "Book another study",
    },
  },
};

const studies = [
  { id: "cbc", es: "Hemograma completo", en: "Complete blood count", icon: Droplets },
  { id: "chemistry", es: "Química sanguínea", en: "Blood chemistry", icon: FlaskConical },
  { id: "lipid", es: "Perfil lipídico", en: "Lipid profile", icon: HeartPulse },
  { id: "thyroid", es: "Perfil tiroideo", en: "Thyroid profile", icon: TestTube },
  { id: "glucose", es: "Glucosa en ayunas", en: "Fasting glucose", icon: FlaskConical },
  { id: "urinalysis", es: "Examen de orina", en: "Urinalysis", icon: Microscope },
];

const branches = [
  { id: "main", es: "Matriz", en: "Main Branch" },
  { id: "branch-2", es: "Sucursal 2", en: "Branch 2" },
  { id: "branch-3", es: "Sucursal 3", en: "Branch 3" },
];

const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const initialForm = {
  studyId: "",
  branchId: "",
  date: "",
  time: "",
  firstName: "",
  lastName: "",
  identification: "",
  phone: "",
  email: "",
  notes: "",
};

function AppointmentLogo() {
  return (
    <Link to="/" className="appointment-logo" aria-label="Dr. Chasi">
      <span className="appointment-logo__icon"><FlaskConical size={40} strokeWidth={1.9} /></span>
      <span className="appointment-logo__copy">
        <strong>Dr. <span>Chasi</span></strong>
        <small>LABORATORIO CLÍNICO</small>
      </span>
    </Link>
  );
}

export default function AppointmentPage() {
  const [language, setLanguage] = useState("es");
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const t = translations[language];

  const selectedStudy = useMemo(
    () => studies.find((item) => item.id === form.studyId),
    [form.studyId],
  );

  const selectedBranch = useMemo(
    () => branches.find((item) => item.id === form.branchId),
    [form.branchId],
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const canContinue = () => {
    if (currentStep === 1) return Boolean(form.studyId);
    if (currentStep === 2) return Boolean(form.branchId && form.date && form.time);
    if (currentStep === 3) {
      return Boolean(
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.identification.trim() &&
        form.phone.trim(),
      );
    }
    return true;
  };

  const summaryRows = [
    [FlaskConical, t.summary.study, selectedStudy ? selectedStudy[language] : "—"],
    [Building2, t.summary.branch, selectedBranch ? selectedBranch[language] : "—"],
    [CalendarDays, t.summary.date, form.date || "—"],
    [Clock, t.summary.time, form.time || "—"],
  ];

  return (
    <div className="appointment-page">
      <header className="appointment-header">
        <div className="appointment-header__inner">
          <AppointmentLogo />

          <nav className="appointment-nav" aria-label="Main navigation">
            <Link to="/">{t.nav.home}</Link>
            <Link to="/#specialties">{t.nav.specialties}</Link>
            <Link to="/#branches">{t.nav.branches}</Link>
            <Link to="/#results">{t.nav.results}</Link>
            <Link to="/agendar" className="appointment-nav__active">{t.nav.booking}</Link>
          </nav>

          <div className="appointment-header__actions">
            <div className="appointment-language">
              <button type="button" className={language === "es" ? "is-active" : ""} onClick={() => setLanguage("es")}>ES</button>
              <button type="button" className={language === "en" ? "is-active" : ""} onClick={() => setLanguage("en")}>EN</button>
            </div>
            <Link to="/#contact" className="appointment-contact-button">
              <MessageCircle size={18} />
              <span>{t.nav.contact}</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="appointment-hero">
          <div className="appointment-hero__inner">
            <div className="appointment-hero__copy">
              <h1>{t.hero.title}</h1>
              <p>{t.hero.description}</p>
            </div>
            <div className="appointment-hero__visual" aria-hidden="true">
              <span><TestTube size={78} strokeWidth={1.35} /></span>
            </div>
          </div>
        </section>

        <section className="appointment-progress-wrap">
          <div className="appointment-progress">
            {t.steps.map(([title, subtitle], index) => {
              const number = index + 1;
              const completed = currentStep > number;
              const active = currentStep === number;
              const icons = [ClipboardList, MapPin, UserRound, CheckCircle2];
              const Icon = icons[index];

              return (
                <div className={`appointment-progress__step ${active ? "is-active" : ""} ${completed ? "is-completed" : ""}`} key={title}>
                  <div className="appointment-progress__top">
                    <span className="appointment-progress__number">{completed ? <CheckCircle2 size={20} /> : number}</span>
                    <span className="appointment-progress__icon"><Icon size={23} strokeWidth={1.8} /></span>
                    {index < 3 && <span className="appointment-progress__line" />}
                  </div>
                  <strong>{title}</strong>
                  <small>{subtitle}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="appointment-workspace">
          <div className="appointment-workspace__inner">
            <div className="appointment-form-card">
              {currentStep === 1 && (
                <>
                  <div className="appointment-card-heading">
                    <span className="appointment-card-heading__icon"><FlaskConical size={36} /></span>
                    <div><h2>{t.study.title}</h2><p>{t.study.subtitle}</p></div>
                  </div>

                  <label className="appointment-study-search">
                    <Search size={21} />
                    <select value={form.studyId} onChange={(e) => updateField("studyId", e.target.value)}>
                      <option value="">{t.study.placeholder}</option>
                      {studies.map((study) => <option value={study.id} key={study.id}>{study[language]}</option>)}
                    </select>
                  </label>

                  <div className="appointment-study-grid">
                    {studies.map((study) => {
                      const Icon = study.icon;
                      const selected = form.studyId === study.id;
                      return (
                        <button type="button" className={`appointment-study-option ${selected ? "is-selected" : ""}`} key={study.id} onClick={() => updateField("studyId", study.id)}>
                          <span className="appointment-study-option__icon"><Icon size={29} strokeWidth={1.8} /></span>
                          <span>{study[language]}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="appointment-form-footer">
                    <button type="button" className="appointment-link-button">
                      <ClipboardList size={18} /><span>{t.study.viewAll}</span><ArrowRight size={17} />
                    </button>
                    <button type="button" className="appointment-primary-button" disabled={!canContinue()} onClick={() => setCurrentStep(2)}>
                      <span>{t.study.continue}</span><ArrowRight size={19} />
                    </button>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="appointment-card-heading">
                    <span className="appointment-card-heading__icon"><MapPin size={34} /></span>
                    <div><h2>{t.schedule.title}</h2><p>{t.schedule.subtitle}</p></div>
                  </div>

                  <div className="appointment-fields-grid">
                    <label><span>{t.schedule.branch}</span>
                      <select value={form.branchId} onChange={(e) => updateField("branchId", e.target.value)}>
                        <option value="">{t.schedule.placeholder}</option>
                        {branches.map((branch) => <option value={branch.id} key={branch.id}>{branch[language]} - {language === "es" ? "Dirección por definir" : "Address to be defined"}</option>)}
                      </select>
                    </label>

                    <label><span>{t.schedule.date}</span><input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} /></label>

                    <div className="appointment-field-full">
                      <span className="appointment-field-label">{t.schedule.time}</span>
                      <div className="appointment-time-grid">
                        {timeSlots.map((slot) => <button type="button" key={slot} className={form.time === slot ? "is-selected" : ""} onClick={() => updateField("time", slot)}>{slot}</button>)}
                      </div>
                    </div>
                  </div>

                  <div className="appointment-form-footer">
                    <button type="button" className="appointment-secondary-button" onClick={() => setCurrentStep(1)}><ArrowLeft size={18} /><span>{t.schedule.back}</span></button>
                    <button type="button" className="appointment-primary-button" disabled={!canContinue()} onClick={() => setCurrentStep(3)}><span>{t.schedule.continue}</span><ArrowRight size={19} /></button>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <div className="appointment-card-heading">
                    <span className="appointment-card-heading__icon"><UserRound size={34} /></span>
                    <div><h2>{t.patient.title}</h2><p>{t.patient.subtitle}</p></div>
                  </div>

                  <div className="appointment-fields-grid">
                    <label><span>{t.patient.firstName}</span><input value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} /></label>
                    <label><span>{t.patient.lastName}</span><input value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} /></label>
                    <label><span>{t.patient.identification}</span><input value={form.identification} onChange={(e) => updateField("identification", e.target.value)} /></label>
                    <label><span>{t.patient.phone}</span><input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} /></label>
                    <label className="appointment-field-full"><span>{t.patient.email} <em>({t.patient.optional})</em></span><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} /></label>
                    <label className="appointment-field-full"><span>{t.patient.notes} <em>({t.patient.optional})</em></span><textarea rows="4" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} /></label>
                  </div>

                  <div className="appointment-form-footer">
                    <button type="button" className="appointment-secondary-button" onClick={() => setCurrentStep(2)}><ArrowLeft size={18} /><span>{t.patient.back}</span></button>
                    <button type="button" className="appointment-primary-button" disabled={!canContinue()} onClick={() => setCurrentStep(4)}><span>{t.patient.review}</span><ArrowRight size={19} /></button>
                  </div>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <div className="appointment-card-heading">
                    <span className="appointment-card-heading__icon"><CheckCircle2 size={34} /></span>
                    <div><h2>{t.confirm.title}</h2><p>{t.confirm.subtitle}</p></div>
                  </div>

                  <div className="appointment-review">
                    {summaryRows.map(([Icon, label, value]) => (
                      <div className="appointment-review__row" key={label}>
                        <span className="appointment-review__icon"><Icon size={19} /></span>
                        <span><small>{label}</small><strong>{value}</strong></span>
                      </div>
                    ))}
                    <div className="appointment-review__row">
                      <span className="appointment-review__icon"><UserRound size={19} /></span>
                      <span><small>{t.patient.title}</small><strong>{form.firstName} {form.lastName}</strong></span>
                    </div>
                  </div>

                  <div className="appointment-form-footer">
                    <button type="button" className="appointment-secondary-button" onClick={() => setCurrentStep(3)}><ArrowLeft size={18} /><span>{t.confirm.edit}</span></button>
                    <button type="button" className="appointment-primary-button" onClick={() => setCurrentStep(5)}><span>{t.confirm.send}</span><ArrowRight size={19} /></button>
                  </div>
                </>
              )}

              {currentStep === 5 && (
                <div className="appointment-success">
                  <span className="appointment-success__icon"><CheckCircle2 size={50} strokeWidth={1.7} /></span>
                  <h2>{t.success.title}</h2>
                  <p>{t.success.message}</p>
                  <button type="button" className="appointment-primary-button" onClick={() => { setForm(initialForm); setCurrentStep(1); }}>{t.success.restart}</button>
                </div>
              )}
            </div>

            <aside className="appointment-summary-card">
              <div className="appointment-summary-card__title">
                <span><UserRound size={23} /></span><h2>{t.summary.title}</h2>
              </div>

              <div className="appointment-summary-card__rows">
                {summaryRows.map(([Icon, label, value]) => (
                  <div className="appointment-summary-row" key={label}>
                    <Icon size={22} strokeWidth={1.7} />
                    <div><span>{label}</span><strong>{value}</strong></div>
                  </div>
                ))}
                <div className="appointment-summary-row">
                  <ClipboardList size={22} strokeWidth={1.7} />
                  <div><span>{t.summary.status}</span><strong className="appointment-status-pill">{t.summary.pending}</strong></div>
                </div>
              </div>

              <div className="appointment-summary-note">
                <Info size={23} />
                <div><strong>{t.summary.important}</strong><p>{t.summary.note}</p></div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
