#requires -Version 5.1
<#
================================================================================
LABORATORIO CLINICO - FRONTEND HOME APROBADO
================================================================================

Objetivo:
- Construir el Home aprobado como base visual del proyecto.
- Mantener nombres tecnicos, variables, componentes y archivos en ingles.
- Mantener comentarios explicativos en espanol para facilitar mantenimiento.
- Incluir selector Espanol / English.
- Mantener el proyecto modular y facil de migrar a cualquier hosting.
- Copiar localmente las imagenes derivadas de la maqueta aprobada.
- Hacer backup del src actual antes de reemplazarlo.

Ruta esperada del proyecto:
C:\projects\Laboratorio\client

IMPORTANTE:
Este script solo modifica el frontend.
No crea todavia autenticacion real, base de datos ni panel administrativo.
================================================================================
#>

$ErrorActionPreference = "Stop"

# -----------------------------------------------------------------------------
# CONFIGURACION PRINCIPAL
# -----------------------------------------------------------------------------

$ProjectPath = "C:\projects\Laboratorio\client"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$AssetsPath = Join-Path $ScriptRoot "assets"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " LABORATORIO - INSTALANDO HOME APROBADO" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# VALIDACIONES
# -----------------------------------------------------------------------------

if (-not (Test-Path $ProjectPath)) {
    throw "No existe el proyecto en: $ProjectPath"
}

if (-not (Test-Path (Join-Path $ProjectPath "package.json"))) {
    throw "No se encontro package.json. Verifica que esta sea la carpeta de Vite."
}

if (-not (Test-Path $AssetsPath)) {
    throw "No se encontro la carpeta assets junto al script."
}

Set-Location $ProjectPath

# -----------------------------------------------------------------------------
# INSTALAR DEPENDENCIAS
# -----------------------------------------------------------------------------
# npm.cmd evita el bloqueo habitual de npm.ps1 en PowerShell.

Write-Host "Instalando dependencias..." -ForegroundColor Yellow
& npm.cmd install lucide-react react-router-dom

# -----------------------------------------------------------------------------
# BACKUP DEL SRC ACTUAL
# -----------------------------------------------------------------------------

$SourcePath = Join-Path $ProjectPath "src"

if (Test-Path $SourcePath) {
    $BackupPath = Join-Path $ProjectPath "backups\src-$Timestamp"
    New-Item -ItemType Directory -Force -Path (Split-Path $BackupPath) | Out-Null
    Copy-Item $SourcePath $BackupPath -Recurse -Force

    Write-Host "Backup creado:" -ForegroundColor Green
    Write-Host $BackupPath

    Remove-Item $SourcePath -Recurse -Force
}

# -----------------------------------------------------------------------------
# CREAR ESTRUCTURA NORMALIZADA
# -----------------------------------------------------------------------------

$Folders = @(
    "src",
    "src\components",
    "src\components\common",
    "src\components\home",
    "src\components\layout",
    "src\context",
    "src\data",
    "src\pages",
    "src\styles",
    "public",
    "public\images"
)

foreach ($Folder in $Folders) {
    New-Item -ItemType Directory -Force -Path (Join-Path $ProjectPath $Folder) | Out-Null
}

# -----------------------------------------------------------------------------
# COPIAR IMAGENES DE LA MAQUETA APROBADA
# -----------------------------------------------------------------------------

Copy-Item "$AssetsPath\*" (Join-Path $ProjectPath "public\images") -Force

Write-Host "Imagenes copiadas a public\images." -ForegroundColor Green

# -----------------------------------------------------------------------------
# HELPER PARA ESCRIBIR ARCHIVOS UTF-8
# -----------------------------------------------------------------------------

function Write-Utf8File {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RelativePath,

        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $FullPath = Join-Path $ProjectPath $RelativePath
    $Parent = Split-Path $FullPath

    if (-not (Test-Path $Parent)) {
        New-Item -ItemType Directory -Force -Path $Parent | Out-Null
    }

    Set-Content -Path $FullPath -Value $Content -Encoding UTF8
}

# =============================================================================
# DATA / I18N
# =============================================================================

Write-Utf8File "src\data\siteContent.js" @'
/*
 * CONTENIDO CENTRAL DEL HOME
 * ---------------------------------------------------------------------------
 * Toda la informacion visible se mantiene en un solo archivo.
 * Esto evita textos duplicados dentro de los componentes y facilita:
 * - traduccion,
 * - mantenimiento,
 * - conexion futura con la base de datos,
 * - reemplazo posterior por contenido administrable.
 *
 * Los nombres tecnicos permanecen en ingles.
 */

export const siteContent = {
  es: {
    navigation: {
      home: "Inicio",
      branches: "Sucursales",
      specialties: "Especialidades",
      promotions: "Promociones",
      results: "Resultados",
      login: "Iniciar sesión",
      patient: "Paciente",
      administrator: "Administrador",
      languageLabel: "Idioma",
    },

    hero: {
      eyebrow: "TU SALUD, NUESTRA PRIORIDAD",
      titlePrefix: "Bienvenido a",
      brandName: "Laboratorio Clínico VitalLab",
      description:
        "Estudios de laboratorio confiables, con tecnología de vanguardia y resultados digitales al alcance de tus manos.",
      primaryAction: "Ver resultados",
      secondaryAction: "Agendar un estudio",
      trustItems: [
        {
          title: "Resultados confiables",
          description: "Calidad y precisión",
        },
        {
          title: "Entrega en línea",
          description: "Rápida y segura",
        },
        {
          title: "Personal especializado",
          description: "A tu servicio",
        },
      ],
      sideMessage: "Ciencia que cuida tu vida",
    },

    carousel: {
      slides: [
        {
          image: "/images/carousel-tests.png",
          title: "Estudios que dan certeza a tu salud",
        },
        {
          image: "/images/carousel-technology.png",
          title: "Tecnología avanzada para resultados confiables",
        },
        {
          image: "/images/carousel-wellbeing.png",
          title: "Comprometidos con tu bienestar",
        },
      ],
    },

    branches: {
      title: "Sucursales",
      subtitle: "Encuentra la sucursal más cercana",
      viewAll: "Ver todas las sucursales",
      items: [
        {
          id: "main-office",
          name: "Matriz Centro",
          address: "Dirección por definir",
          phone: "Teléfono por definir",
          hours: "Lun - Vie 7:00 a 19:00 · Sáb 7:00 a 14:00",
          image: "/images/branch-1.png",
        },
        {
          id: "branch-two",
          name: "Sucursal 2",
          address: "Dirección por definir",
          phone: "Teléfono por definir",
          hours: "Lun - Vie 7:00 a 19:00 · Sáb 7:00 a 14:00",
          image: "/images/branch-2.png",
        },
        {
          id: "branch-three",
          name: "Sucursal 3",
          address: "Dirección por definir",
          phone: "Teléfono por definir",
          hours: "Lun - Vie 7:00 a 19:00 · Sáb 8:00 a 14:00",
          image: "/images/branch-3.png",
        },
        {
          id: "branch-four",
          name: "Sucursal 4",
          address: "Dirección por definir",
          phone: "Teléfono por definir",
          hours: "Lun - Vie 7:00 a 19:00 · Sáb 7:00 a 14:00",
          image: "/images/branch-4.png",
        },
      ],
    },

    specialties: {
      title: "Especialidades",
      subtitle: "Amplia gama de estudios para tu salud",
      viewAll: "Ver todas las especialidades",
      items: [
        {
          id: "hematology",
          title: "Hematología",
          description: "Biometría, coagulación y más.",
          icon: "droplets",
        },
        {
          id: "clinical-chemistry",
          title: "Química Clínica",
          description: "Metabolismo, enzimas y perfiles.",
          icon: "flask",
        },
        {
          id: "microbiology",
          title: "Microbiología",
          description: "Cultivos, serologías y detección de patógenos.",
          icon: "microscope",
        },
        {
          id: "immunology",
          title: "Inmunología",
          description: "Alergias, autoinmunidad y marcadores.",
          icon: "shield",
        },
        {
          id: "respiratory",
          title: "Covid / Respiratorio",
          description: "PCR, antígenos y paneles respiratorios.",
          icon: "lungs",
        },
      ],
    },

    promotions: {
      title: "Promociones",
      subtitle: "Cuida tu salud con estudios y paquetes especiales",
      viewAll: "Ver todas las promociones",
      items: [
        {
          id: "checkup",
          title: "Check Up General",
          image: "/images/promo-checkup.png",
        },
        {
          id: "women-profile",
          title: "Perfil de la Mujer",
          image: "/images/promo-women.png",
        },
        {
          id: "men-profile",
          title: "Perfil del Hombre",
          image: "/images/promo-men.png",
        },
        {
          id: "covid",
          title: "Detección Covid-19",
          image: "/images/promo-covid.png",
        },
      ],
    },

    results: {
      title: "Consulta y descarga tus resultados en línea",
      description:
        "Ingresa a tu portal de paciente para ver y descargar tus resultados actuales e históricos en formato PDF, de manera segura, rápida y desde cualquier dispositivo.",
      features: [
        "Resultados actuales e históricos",
        "Descarga en PDF",
        "Acceso seguro 24/7",
      ],
      action: "Ingresar a mi portal",
    },

    footer: {
      contactTitle: "Contáctanos",
      phone: "Teléfono por definir",
      email: "correo@laboratorio.com",
      address: "Dirección principal por definir",
      quickLinksTitle: "Enlaces rápidos",
      socialTitle: "Síguenos",
      slogan: "Tu salud nos inspira",
      privacy: "Aviso de privacidad",
      terms: "Términos y condiciones",
      rights: "Todos los derechos reservados.",
    },

    login: {
      back: "Volver al inicio",
      title: "Portal de acceso",
      description:
        "En el siguiente módulo conectaremos este formulario con la autenticación real.",
      patient: "Paciente",
      administrator: "Administrador",
    },
  },

  en: {
    navigation: {
      home: "Home",
      branches: "Locations",
      specialties: "Specialties",
      promotions: "Promotions",
      results: "Results",
      login: "Sign in",
      patient: "Patient",
      administrator: "Administrator",
      languageLabel: "Language",
    },

    hero: {
      eyebrow: "YOUR HEALTH, OUR PRIORITY",
      titlePrefix: "Welcome to",
      brandName: "VitalLab Clinical Laboratory",
      description:
        "Reliable laboratory testing, advanced technology and digital results available at your fingertips.",
      primaryAction: "View results",
      secondaryAction: "Schedule a study",
      trustItems: [
        {
          title: "Reliable results",
          description: "Quality and precision",
        },
        {
          title: "Online delivery",
          description: "Fast and secure",
        },
        {
          title: "Specialized staff",
          description: "At your service",
        },
      ],
      sideMessage: "Science that cares for your life",
    },

    carousel: {
      slides: [
        {
          image: "/images/carousel-tests.png",
          title: "Studies that bring certainty to your health",
        },
        {
          image: "/images/carousel-technology.png",
          title: "Advanced technology for reliable results",
        },
        {
          image: "/images/carousel-wellbeing.png",
          title: "Committed to your wellbeing",
        },
      ],
    },

    branches: {
      title: "Locations",
      subtitle: "Find the nearest laboratory location",
      viewAll: "View all locations",
      items: [
        {
          id: "main-office",
          name: "Main Office",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 · Sat 7:00 to 14:00",
          image: "/images/branch-1.png",
        },
        {
          id: "branch-two",
          name: "Location 2",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 · Sat 7:00 to 14:00",
          image: "/images/branch-2.png",
        },
        {
          id: "branch-three",
          name: "Location 3",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 · Sat 8:00 to 14:00",
          image: "/images/branch-3.png",
        },
        {
          id: "branch-four",
          name: "Location 4",
          address: "Address to be defined",
          phone: "Phone to be defined",
          hours: "Mon - Fri 7:00 to 19:00 · Sat 7:00 to 14:00",
          image: "/images/branch-4.png",
        },
      ],
    },

    specialties: {
      title: "Specialties",
      subtitle: "A broad range of studies for your health",
      viewAll: "View all specialties",
      items: [
        {
          id: "hematology",
          title: "Hematology",
          description: "Blood count, coagulation and more.",
          icon: "droplets",
        },
        {
          id: "clinical-chemistry",
          title: "Clinical Chemistry",
          description: "Metabolism, enzymes and profiles.",
          icon: "flask",
        },
        {
          id: "microbiology",
          title: "Microbiology",
          description: "Cultures, serology and pathogen detection.",
          icon: "microscope",
        },
        {
          id: "immunology",
          title: "Immunology",
          description: "Allergies, autoimmunity and markers.",
          icon: "shield",
        },
        {
          id: "respiratory",
          title: "Covid / Respiratory",
          description: "PCR, antigen and respiratory panels.",
          icon: "lungs",
        },
      ],
    },

    promotions: {
      title: "Promotions",
      subtitle: "Take care of your health with special studies and packages",
      viewAll: "View all promotions",
      items: [
        {
          id: "checkup",
          title: "General Check Up",
          image: "/images/promo-checkup.png",
        },
        {
          id: "women-profile",
          title: "Women's Profile",
          image: "/images/promo-women.png",
        },
        {
          id: "men-profile",
          title: "Men's Profile",
          image: "/images/promo-men.png",
        },
        {
          id: "covid",
          title: "Covid-19 Detection",
          image: "/images/promo-covid.png",
        },
      ],
    },

    results: {
      title: "View and download your results online",
      description:
        "Sign in to your patient portal to view and download current and historical PDF results securely, quickly and from any device.",
      features: [
        "Current and historical results",
        "PDF download",
        "Secure access 24/7",
      ],
      action: "Open my portal",
    },

    footer: {
      contactTitle: "Contact us",
      phone: "Phone to be defined",
      email: "email@laboratory.com",
      address: "Main address to be defined",
      quickLinksTitle: "Quick links",
      socialTitle: "Follow us",
      slogan: "Your health inspires us",
      privacy: "Privacy notice",
      terms: "Terms and conditions",
      rights: "All rights reserved.",
    },

    login: {
      back: "Back to home",
      title: "Access portal",
      description:
        "In the next module this form will be connected to real authentication.",
      patient: "Patient",
      administrator: "Administrator",
    },
  },
};
'@

Write-Utf8File "src\context\LanguageContext.jsx" @'
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { siteContent } from "../data/siteContent";

/*
 * CONTEXTO GLOBAL DE IDIOMA
 * ---------------------------------------------------------------------------
 * Reglas:
 * 1. Si el usuario ya eligio un idioma, se recupera desde localStorage.
 * 2. Si no existe preferencia, se detecta el idioma del navegador.
 * 3. El idioma queda disponible para todo el frontend.
 */

const LanguageContext = createContext(null);

const LANGUAGE_STORAGE_KEY = "laboratory-language";

function detectInitialLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (savedLanguage === "es" || savedLanguage === "en") {
    return savedLanguage;
  }

  const browserLanguage = navigator.language?.toLowerCase() ?? "es";
  return browserLanguage.startsWith("en") ? "en" : "es";
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(detectInitialLanguage);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      content: siteContent[language],
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
'@

# =============================================================================
# COMMON COMPONENTS
# =============================================================================

Write-Utf8File "src\components\common\LanguageSwitcher.jsx" @'
import { Languages } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

/*
 * SELECTOR DE IDIOMA
 * ---------------------------------------------------------------------------
 * El componente no contiene textos de negocio.
 * Solo cambia la preferencia global ES / EN.
 */

export default function LanguageSwitcher() {
  const { language, setLanguage, content } = useLanguage();

  return (
    <div className="language-switcher" aria-label={content.navigation.languageLabel}>
      <Languages size={16} aria-hidden="true" />

      <button
        type="button"
        className={language === "es" ? "is-active" : ""}
        onClick={() => setLanguage("es")}
        aria-pressed={language === "es"}
      >
        ES
      </button>

      <span>/</span>

      <button
        type="button"
        className={language === "en" ? "is-active" : ""}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        EN
      </button>
    </div>
  );
}
'@

Write-Utf8File "src\components\common\SectionHeader.jsx" @'
/*
 * ENCABEZADO REUTILIZABLE DE SECCION
 * ---------------------------------------------------------------------------
 * Mantiene la misma jerarquia visual para Sucursales, Especialidades
 * y Promociones.
 */

export default function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  actionHref = "#",
}) {
  return (
    <div className="section-heading">
      <div className="section-heading__main">
        <div className="section-heading__title-row">
          {Icon ? <Icon size={24} aria-hidden="true" /> : null}
          <h2>{title}</h2>
        </div>

        <p>{subtitle}</p>
      </div>

      {actionLabel ? (
        <a className="section-heading__action" href={actionHref}>
          {actionLabel}
          <span aria-hidden="true">›</span>
        </a>
      ) : null}
    </div>
  );
}
'@

# =============================================================================
# LAYOUT
# =============================================================================

Write-Utf8File "src\components\layout\SiteHeader.jsx" @'
import { useState } from "react";
import {
  FlaskConical,
  Home,
  MapPin,
  Microscope,
  Tag,
  FileText,
  UserRound,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useLanguage } from "../../context/LanguageContext";

/*
 * HEADER PRINCIPAL
 * ---------------------------------------------------------------------------
 * La navegacion usa anclas dentro del Home para mantener una experiencia
 * rapida y sencilla.
 *
 * Los accesos Paciente y Administrador apuntan a /login con un parametro role.
 * En una fase posterior ese parametro seleccionara el flujo de autenticacion.
 */

export default function SiteHeader() {
  const { content } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: content.navigation.home,
      href: "#home",
      icon: Home,
    },
    {
      label: content.navigation.branches,
      href: "#branches",
      icon: MapPin,
    },
    {
      label: content.navigation.specialties,
      href: "#specialties",
      icon: Microscope,
    },
    {
      label: content.navigation.promotions,
      href: "#promotions",
      icon: Tag,
    },
    {
      label: content.navigation.results,
      href: "#results",
      icon: FileText,
    },
  ];

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="site-header__inner page-container">
        <a
          className="brand"
          href="#home"
          onClick={closeMobileMenu}
          aria-label="VitalLab"
        >
          <FlaskConical size={34} strokeWidth={2.1} aria-hidden="true" />

          <span className="brand__text">
            <strong>
              Vital<span>Lab</span>
            </strong>
            <small>Laboratorio Clínico</small>
          </span>
        </a>

        <nav
          className={`main-navigation ${
            mobileMenuOpen ? "main-navigation--open" : ""
          }`}
          aria-label="Main navigation"
        >
          {navItems.map(({ label, href, icon: Icon }) => (
            <a key={href} href={href} onClick={closeMobileMenu}>
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <LanguageSwitcher />

          <div className="login-box">
            <span className="login-box__title">
              <UserRound size={15} aria-hidden="true" />
              {content.navigation.login}
            </span>

            <div className="login-box__buttons">
              <Link
                className="login-role-button login-role-button--primary"
                to="/login?role=patient"
              >
                <UserRound size={14} aria-hidden="true" />
                {content.navigation.patient}
              </Link>

              <Link
                className="login-role-button"
                to="/login?role=administrator"
              >
                <Settings size={14} aria-hidden="true" />
                {content.navigation.administrator}
              </Link>
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen((currentValue) => !currentValue)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
'@

Write-Utf8File "src\components\layout\SiteFooter.jsx" @'
import {
  FlaskConical,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

/*
 * FOOTER
 * ---------------------------------------------------------------------------
 * Los datos de contacto actuales son temporales y se reemplazaran por la
 * informacion real del laboratorio cuando el usuario la proporcione.
 */

export default function SiteFooter() {
  const { content } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="page-container site-footer__grid">
        <div className="footer-brand">
          <div className="brand brand--footer">
            <FlaskConical size={34} aria-hidden="true" />
            <span className="brand__text">
              <strong>
                Vital<span>Lab</span>
              </strong>
              <small>Laboratorio Clínico</small>
            </span>
          </div>
        </div>

        <div>
          <h3>{content.footer.contactTitle}</h3>

          <ul className="footer-list">
            <li>
              <Phone size={15} aria-hidden="true" />
              {content.footer.phone}
            </li>

            <li>
              <Mail size={15} aria-hidden="true" />
              {content.footer.email}
            </li>

            <li>
              <MapPin size={15} aria-hidden="true" />
              {content.footer.address}
            </li>
          </ul>
        </div>

        <div>
          <h3>{content.footer.quickLinksTitle}</h3>

          <div className="footer-links">
            <a href="#home">{content.navigation.home}</a>
            <a href="#branches">{content.navigation.branches}</a>
            <a href="#specialties">{content.navigation.specialties}</a>
            <a href="#promotions">{content.navigation.promotions}</a>
            <a href="#results">{content.navigation.results}</a>
          </div>
        </div>

        <div>
          <h3>{content.footer.socialTitle}</h3>

          <div className="social-links">
            <a href="#" aria-label="Facebook">
              <Facebook size={18} />
            </a>
            <a href="#" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="#" aria-label="YouTube">
              <Youtube size={18} />
            </a>
            <a href="#" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
          </div>

          <p className="footer-slogan">{content.footer.slogan}</p>
        </div>
      </div>

      <div className="page-container site-footer__bottom">
        <span>
          © {currentYear} VitalLab. {content.footer.rights}
        </span>

        <div>
          <a href="#">{content.footer.privacy}</a>
          <span>·</span>
          <a href="#">{content.footer.terms}</a>
        </div>
      </div>
    </footer>
  );
}
'@

# =============================================================================
# HOME COMPONENTS
# =============================================================================

Write-Utf8File "src\components\home\HeroSection.jsx" @'
import {
  FileText,
  CalendarDays,
  ShieldCheck,
  Clock3,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

/*
 * HERO PRINCIPAL
 * ---------------------------------------------------------------------------
 * Replica la jerarquia del diseno aprobado:
 * - mensaje principal a la izquierda,
 * - laboratorio a la derecha,
 * - accesos rapidos,
 * - tres argumentos de confianza.
 */

const trustIcons = [ShieldCheck, Clock3, UsersRound];

export default function HeroSection() {
  const { content } = useLanguage();

  return (
    <section id="home" className="hero-section">
      <div className="page-container hero-section__grid">
        <div className="hero-copy">
          <p className="eyebrow">{content.hero.eyebrow}</p>

          <h1>
            {content.hero.titlePrefix}
            <span>{content.hero.brandName}</span>
          </h1>

          <p className="hero-copy__description">
            {content.hero.description}
          </p>

          <div className="hero-actions">
            <Link
              className="button button--primary"
              to="/login?role=patient"
            >
              <FileText size={17} aria-hidden="true" />
              {content.hero.primaryAction}
              <span aria-hidden="true">›</span>
            </Link>

            <a className="button button--secondary" href="#branches">
              <CalendarDays size={17} aria-hidden="true" />
              {content.hero.secondaryAction}
            </a>
          </div>

          <div className="trust-grid">
            {content.hero.trustItems.map((item, index) => {
              const Icon = trustIcons[index];

              return (
                <div className="trust-item" key={item.title}>
                  <Icon size={27} aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hero-media">
          <img
            src="/images/hero-lab.png"
            alt=""
            className="hero-media__image"
          />

          <div className="hero-media__message">
            {content.hero.sideMessage}
          </div>
        </div>
      </div>
    </section>
  );
}
'@

Write-Utf8File "src\components\home\HomeCarousel.jsx" @'
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

/*
 * CARRUSEL PRINCIPAL
 * ---------------------------------------------------------------------------
 * - Cambia automaticamente cada 5 segundos.
 * - Permite navegacion manual.
 * - Se detiene de forma natural al desmontar el componente.
 */

const AUTO_PLAY_INTERVAL_MS = 5000;

export default function HomeCarousel() {
  const { content } = useLanguage();
  const slides = content.carousel.slides;

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) =>
        currentIndex === slides.length - 1 ? 0 : currentIndex + 1,
      );
    }, AUTO_PLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  function showPreviousSlide() {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? slides.length - 1 : currentIndex - 1,
    );
  }

  function showNextSlide() {
    setActiveIndex((currentIndex) =>
      currentIndex === slides.length - 1 ? 0 : currentIndex + 1,
    );
  }

  return (
    <section className="carousel-section page-container" aria-label="Carousel">
      <div className="home-carousel">
        <button
          type="button"
          className="carousel-arrow carousel-arrow--left"
          onClick={showPreviousSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft />
        </button>

        <div className="carousel-track">
          {slides.map((slide, index) => (
            <article
              className={`carousel-card ${
                index === activeIndex ? "carousel-card--active" : ""
              }`}
              key={slide.title}
            >
              <img src={slide.image} alt="" />

              <div className="carousel-card__overlay" />

              <h2>{slide.title}</h2>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="carousel-arrow carousel-arrow--right"
          onClick={showNextSlide}
          aria-label="Next slide"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="carousel-dots" aria-label="Carousel pagination">
        {slides.map((slide, index) => (
          <button
            type="button"
            key={slide.title}
            className={index === activeIndex ? "is-active" : ""}
            onClick={() => setActiveIndex(index)}
            aria-label={`Slide ${index + 1}`}
            aria-pressed={index === activeIndex}
          />
        ))}
      </div>
    </section>
  );
}
'@

Write-Utf8File "src\components\home\BranchesSection.jsx" @'
import {
  MapPinned,
  MapPin,
  Phone,
  Clock3,
  ChevronRight,
} from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";

/*
 * SUCURSALES
 * ---------------------------------------------------------------------------
 * Los datos todavia son de presentacion.
 * En la fase administrativa, esta lista se cargara desde la base de datos.
 */

export default function BranchesSection() {
  const { content } = useLanguage();

  return (
    <section id="branches" className="content-section">
      <div className="page-container">
        <SectionHeader
          icon={MapPinned}
          title={content.branches.title}
          subtitle={content.branches.subtitle}
          actionLabel={content.branches.viewAll}
          actionHref="#branches"
        />

        <div className="branches-grid">
          {content.branches.items.map((branch) => (
            <article className="branch-card" key={branch.id}>
              <img
                className="branch-card__image"
                src={branch.image}
                alt={branch.name}
              />

              <div className="branch-card__body">
                <div className="branch-card__title-row">
                  <h3>{branch.name}</h3>
                  <MapPin size={18} aria-hidden="true" />
                </div>

                <p>
                  <MapPin size={14} aria-hidden="true" />
                  {branch.address}
                </p>

                <p>
                  <Phone size={14} aria-hidden="true" />
                  {branch.phone}
                </p>

                <p>
                  <Clock3 size={14} aria-hidden="true" />
                  {branch.hours}
                </p>
              </div>

              <button
                type="button"
                className="branch-card__action"
                aria-label={branch.name}
              >
                <ChevronRight size={18} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
'@

Write-Utf8File "src\components\home\SpecialtiesSection.jsx" @'
import {
  UsersRound,
  Droplets,
  FlaskConical,
  Microscope,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";

/*
 * ESPECIALIDADES
 * ---------------------------------------------------------------------------
 * El nombre del icono llega desde data/siteContent.js.
 * Aqui se traduce a un componente visual de Lucide.
 */

const iconMap = {
  droplets: Droplets,
  flask: FlaskConical,
  microscope: Microscope,
  shield: ShieldCheck,
  lungs: HeartPulse,
};

export default function SpecialtiesSection() {
  const { content } = useLanguage();

  return (
    <section id="specialties" className="content-section content-section--tinted">
      <div className="page-container">
        <SectionHeader
          icon={UsersRound}
          title={content.specialties.title}
          subtitle={content.specialties.subtitle}
          actionLabel={content.specialties.viewAll}
          actionHref="#specialties"
        />

        <div className="specialties-grid">
          {content.specialties.items.map((specialty) => {
            const Icon = iconMap[specialty.icon] ?? FlaskConical;

            return (
              <article className="specialty-card" key={specialty.id}>
                <div className="specialty-card__icon">
                  <Icon size={34} strokeWidth={1.8} aria-hidden="true" />
                </div>

                <div>
                  <h3>{specialty.title}</h3>
                  <p>{specialty.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
'@

Write-Utf8File "src\components\home\PromotionsSection.jsx" @'
import { Tag } from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import { useLanguage } from "../../context/LanguageContext";

/*
 * PROMOCIONES
 * ---------------------------------------------------------------------------
 * Las imagenes actuales son recortes de la maqueta visual aprobada.
 * En produccion, el administrador podra reemplazarlas por flyers reales.
 */

export default function PromotionsSection() {
  const { content } = useLanguage();

  return (
    <section id="promotions" className="content-section">
      <div className="page-container">
        <SectionHeader
          icon={Tag}
          title={content.promotions.title}
          subtitle={content.promotions.subtitle}
          actionLabel={content.promotions.viewAll}
          actionHref="#promotions"
        />

        <div className="promotions-grid">
          {content.promotions.items.map((promotion) => (
            <article className="promotion-card" key={promotion.id}>
              <img src={promotion.image} alt={promotion.title} loading="lazy" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
'@

Write-Utf8File "src\components\home\ResultsSection.jsx" @'
import {
  MonitorDown,
  FileClock,
  FileDown,
  LockKeyhole,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

/*
 * BLOQUE DE RESULTADOS
 * ---------------------------------------------------------------------------
 * Este bloque dirige al portal del paciente.
 * La autenticacion y la descarga segura de PDF se implementaran en backend.
 */

const featureIcons = [FileClock, FileDown, LockKeyhole];

export default function ResultsSection() {
  const { content } = useLanguage();

  return (
    <section id="results" className="results-section">
      <div className="page-container results-panel">
        <div className="results-panel__intro">
          <MonitorDown size={44} aria-hidden="true" />

          <div>
            <h2>{content.results.title}</h2>
            <p>{content.results.description}</p>
          </div>
        </div>

        <div className="results-panel__features">
          {content.results.features.map((feature, index) => {
            const Icon = featureIcons[index];

            return (
              <div className="result-feature" key={feature}>
                <Icon size={26} aria-hidden="true" />
                <span>{feature}</span>
              </div>
            );
          })}
        </div>

        <Link
          className="button button--primary results-panel__button"
          to="/login?role=patient"
        >
          {content.results.action}
          <span aria-hidden="true">›</span>
        </Link>
      </div>
    </section>
  );
}
'@

# =============================================================================
# PAGES
# =============================================================================

Write-Utf8File "src\pages\HomePage.jsx" @'
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import HeroSection from "../components/home/HeroSection";
import HomeCarousel from "../components/home/HomeCarousel";
import BranchesSection from "../components/home/BranchesSection";
import SpecialtiesSection from "../components/home/SpecialtiesSection";
import PromotionsSection from "../components/home/PromotionsSection";
import ResultsSection from "../components/home/ResultsSection";

/*
 * HOME PAGE
 * ---------------------------------------------------------------------------
 * La pagina solo compone secciones.
 * Cada seccion mantiene su propia responsabilidad y puede evolucionar sin
 * convertir HomePage en un archivo dificil de mantener.
 */

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        <HeroSection />
        <HomeCarousel />
        <BranchesSection />
        <SpecialtiesSection />
        <PromotionsSection />
        <ResultsSection />
      </main>

      <SiteFooter />
    </>
  );
}
'@

Write-Utf8File "src\pages\LoginPage.jsx" @'
import { ArrowLeft, UserRound, Settings } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";

/*
 * LOGIN TEMPORAL
 * ---------------------------------------------------------------------------
 * Esta vista reserva la ruta /login desde ahora.
 * El formulario real se agregara en la siguiente fase junto con Supabase Auth.
 */

export default function LoginPage() {
  const { content } = useLanguage();
  const [searchParams] = useSearchParams();

  const requestedRole = searchParams.get("role");
  const isAdministrator = requestedRole === "administrator";

  return (
    <main className="login-page">
      <div className="login-page__top">
        <Link to="/" className="login-page__back">
          <ArrowLeft size={18} />
          {content.login.back}
        </Link>

        <LanguageSwitcher />
      </div>

      <section className="login-card">
        <div className="login-card__icon">
          {isAdministrator ? <Settings size={34} /> : <UserRound size={34} />}
        </div>

        <p className="eyebrow">
          {isAdministrator
            ? content.login.administrator
            : content.login.patient}
        </p>

        <h1>{content.login.title}</h1>

        <p>{content.login.description}</p>

        <Link className="button button--primary" to="/">
          {content.login.back}
        </Link>
      </section>
    </main>
  );
}
'@

# =============================================================================
# APP / MAIN
# =============================================================================

Write-Utf8File "src\App.jsx" @'
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

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
    </Routes>
  );
}
'@

Write-Utf8File "src\main.jsx" @'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LanguageProvider } from "./context/LanguageContext";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/home.css";

/*
 * PUNTO DE ENTRADA
 * ---------------------------------------------------------------------------
 * BrowserRouter controla navegacion.
 * LanguageProvider controla ES / EN.
 */

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
'@

# =============================================================================
# STYLES
# =============================================================================

Write-Utf8File "src\styles\tokens.css" @'
/*
 * TOKENS DE DISENO
 * ---------------------------------------------------------------------------
 * Todos los colores, radios y sombras principales se centralizan aqui.
 * Si la marca cambia, este es el primer archivo que debe revisarse.
 */

:root {
  --color-primary-900: #073b6f;
  --color-primary-800: #0b477f;
  --color-primary-700: #075b9e;
  --color-primary-600: #0670bd;
  --color-primary-500: #0a82cf;

  --color-accent-700: #078b99;
  --color-accent-600: #08a1ad;
  --color-accent-500: #14b7c0;

  --color-text: #10375d;
  --color-text-soft: #62788e;
  --color-surface: #ffffff;
  --color-background: #f6fafc;
  --color-background-tinted: #edf9fd;
  --color-border: #d8e7f0;

  --shadow-soft: 0 10px 32px rgba(24, 74, 110, 0.08);
  --shadow-card: 0 7px 20px rgba(20, 65, 100, 0.08);
  --shadow-header: 0 2px 12px rgba(21, 64, 96, 0.08);

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;

  --page-width: 1320px;
  --header-height: 82px;

  --transition-fast: 180ms ease;
}
'@

Write-Utf8File "src\styles\global.css" @'
/*
 * ESTILOS GLOBALES
 * ---------------------------------------------------------------------------
 * Mantener este archivo limitado a comportamiento comun.
 * Los estilos especificos del Home viven en home.css.
 */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: calc(var(--header-height) + 18px);
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  color: var(--color-text);
  background: var(--color-background);
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  -webkit-font-smoothing: antialiased;
}

button,
input,
select,
textarea {
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

button {
  border: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  display: block;
  max-width: 100%;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

.page-container {
  width: min(var(--page-width), calc(100% - 40px));
  margin-inline: auto;
}

.eyebrow {
  margin-bottom: 10px;
  color: var(--color-primary-700);
  font-size: 0.77rem;
  font-weight: 800;
  letter-spacing: 0.17em;
}

.button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 18px;
  border-radius: 7px;
  font-size: 0.88rem;
  font-weight: 750;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background var(--transition-fast);
}

.button:hover {
  transform: translateY(-1px);
}

.button--primary {
  color: #ffffff;
  background: var(--color-primary-600);
  box-shadow: 0 7px 18px rgba(6, 112, 189, 0.2);
}

.button--primary:hover {
  background: var(--color-primary-700);
}

.button--secondary {
  color: var(--color-primary-700);
  background: #ffffff;
  border: 1px solid #8dbce0;
}

@media (max-width: 700px) {
  .page-container {
    width: min(100% - 24px, var(--page-width));
  }
}
'@

Write-Utf8File "src\styles\home.css" @'
/*
 * HOME APROBADO - ESTILOS
 * ---------------------------------------------------------------------------
 * Se replica la composicion visual aprobada manteniendo una implementacion
 * responsive y reutilizable.
 */

/* ==========================================================================
   HEADER
   ========================================================================== */

.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  min-height: var(--header-height);
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #e7eef4;
  box-shadow: var(--shadow-header);
  backdrop-filter: blur(12px);
}

.site-header__inner {
  min-height: var(--header-height);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--color-primary-800);
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand__text strong {
  font-size: 1.7rem;
  letter-spacing: -0.04em;
}

.brand__text strong span {
  color: var(--color-accent-600);
}

.brand__text small {
  margin-top: 4px;
  font-size: 0.61rem;
  letter-spacing: 0.06em;
}

.main-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 26px;
}

.main-navigation a {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  color: #355775;
  font-size: 0.82rem;
  font-weight: 700;
}

.main-navigation a::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  border-radius: 100px;
  background: var(--color-primary-600);
  transform: scaleX(0);
  transition: transform var(--transition-fast);
}

.main-navigation a:hover::after {
  transform: scaleX(1);
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.language-switcher {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #63788b;
  font-size: 0.75rem;
}

.language-switcher button {
  padding: 2px;
  color: #63788b;
  background: transparent;
  cursor: pointer;
}

.language-switcher button.is-active {
  color: var(--color-primary-700);
  font-weight: 900;
}

.login-box {
  min-width: 238px;
  padding: 7px;
  border: 1px solid #d9e7f1;
  border-radius: 8px;
  background: #f7fbfe;
  box-shadow: 0 5px 14px rgba(17, 67, 103, 0.08);
}

.login-box__title {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-bottom: 6px;
  font-size: 0.76rem;
  font-weight: 800;
}

.login-box__buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.login-role-button {
  min-height: 30px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  border: 1px solid #cbdde9;
  border-radius: 5px;
  background: #ffffff;
  color: var(--color-primary-800);
  font-size: 0.72rem;
  font-weight: 800;
}

.login-role-button--primary {
  color: #ffffff;
  border-color: var(--color-primary-600);
  background: var(--color-primary-600);
}

.mobile-menu-button {
  display: none;
  color: var(--color-primary-800);
  background: transparent;
  cursor: pointer;
}

/* ==========================================================================
   HERO
   ========================================================================== */

.hero-section {
  background:
    linear-gradient(90deg, #ffffff 0%, #ffffff 41%, rgba(235, 247, 253, 0.8) 100%);
}

.hero-section__grid {
  min-height: 260px;
  display: grid;
  grid-template-columns: 42% 58%;
  align-items: stretch;
}

.hero-copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 25px 28px 24px 16px;
}

.hero-copy h1 {
  margin-bottom: 8px;
  color: var(--color-primary-900);
  font-size: clamp(2rem, 3.1vw, 3.15rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.hero-copy h1 span {
  display: block;
  margin-top: 4px;
  color: var(--color-primary-800);
}

.hero-copy h1 span::first-line {
  color: var(--color-primary-800);
}

.hero-copy__description {
  max-width: 560px;
  margin-bottom: 14px;
  color: #496883;
  font-size: 0.94rem;
  line-height: 1.4;
}

.hero-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-accent-700);
}

.trust-item div {
  display: flex;
  flex-direction: column;
}

.trust-item strong {
  color: #315674;
  font-size: 0.72rem;
}

.trust-item span {
  margin-top: 2px;
  color: #72879a;
  font-size: 0.63rem;
}

.hero-media {
  position: relative;
  min-height: 260px;
  overflow: hidden;
}

.hero-media::before {
  content: "";
  position: absolute;
  z-index: 1;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      #ffffff 0%,
      rgba(255, 255, 255, 0.12) 22%,
      rgba(255, 255, 255, 0) 60%
    );
}

.hero-media__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.03);
}

.hero-media__message {
  position: absolute;
  z-index: 2;
  right: 24px;
  top: 50%;
  width: 135px;
  transform: translateY(-50%);
  color: var(--color-primary-900);
  font-size: 1.32rem;
  line-height: 1.08;
}

.hero-media__message::after {
  content: "";
  display: block;
  width: 28px;
  height: 3px;
  margin-top: 9px;
  border-radius: 20px;
  background: var(--color-accent-500);
}

/* ==========================================================================
   CAROUSEL
   ========================================================================== */

.carousel-section {
  padding-top: 12px;
  padding-bottom: 7px;
}

.home-carousel {
  position: relative;
}

.carousel-track {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.carousel-card {
  position: relative;
  height: 104px;
  overflow: hidden;
  border-radius: 6px;
  background: #dbeaf3;
  box-shadow: var(--shadow-card);
}

.carousel-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-card__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(6, 35, 69, 0.18), rgba(6, 35, 69, 0.5));
}

.carousel-card h2 {
  position: absolute;
  z-index: 2;
  top: 50%;
  right: 18px;
  width: 54%;
  transform: translateY(-50%);
  margin: 0;
  color: #ffffff;
  font-size: clamp(0.82rem, 1.15vw, 1.05rem);
  line-height: 1.13;
}

.carousel-arrow {
  position: absolute;
  z-index: 4;
  top: 50%;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--color-primary-800);
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(10, 48, 78, 0.2);
  transform: translateY(-50%);
  cursor: pointer;
}

.carousel-arrow--left {
  left: 8px;
}

.carousel-arrow--right {
  right: 8px;
}

.carousel-dots {
  height: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.carousel-dots button {
  width: 6px;
  height: 6px;
  padding: 0;
  border-radius: 50%;
  background: #a9bac7;
  cursor: pointer;
}

.carousel-dots button.is-active {
  background: var(--color-primary-600);
}

/* ==========================================================================
   SHARED SECTIONS
   ========================================================================== */

.content-section {
  padding: 9px 0 14px;
}

.content-section--tinted {
  background: linear-gradient(180deg, #eef9fd 0%, #eaf8fc 100%);
}

.section-heading {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.section-heading__main {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.section-heading__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary-800);
}

.section-heading h2 {
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: -0.02em;
}

.section-heading p {
  margin: 0;
  color: #71869a;
  font-size: 0.72rem;
}

.section-heading__action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border: 1px solid #cfe5f2;
  border-radius: 7px;
  color: var(--color-primary-700);
  background: #f4fbff;
  font-size: 0.68rem;
  font-weight: 800;
}

/* ==========================================================================
   BRANCHES
   ========================================================================== */

.branches-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.branch-card {
  position: relative;
  min-height: 125px;
  display: grid;
  grid-template-columns: 43% 57%;
  overflow: hidden;
  border: 1px solid #dbe8f0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: var(--shadow-card);
}

.branch-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.branch-card__body {
  padding: 10px 9px 9px 12px;
}

.branch-card__title-row {
  display: flex;
  justify-content: space-between;
  gap: 7px;
  color: var(--color-primary-800);
}

.branch-card h3 {
  margin-bottom: 7px;
  font-size: 0.82rem;
}

.branch-card p {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 6px;
  color: #60788e;
  font-size: 0.62rem;
  line-height: 1.25;
}

.branch-card p svg {
  flex: 0 0 auto;
  color: var(--color-primary-700);
}

.branch-card__action {
  position: absolute;
  right: 4px;
  bottom: 5px;
  color: var(--color-primary-700);
  background: transparent;
  cursor: pointer;
}

/* ==========================================================================
   SPECIALTIES
   ========================================================================== */

.specialties-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.specialty-card {
  min-height: 74px;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 12px 14px;
  border: 1px solid rgba(216, 231, 240, 0.88);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.92);
}

.specialty-card__icon {
  flex: 0 0 auto;
  color: var(--color-accent-600);
}

.specialty-card h3 {
  margin-bottom: 4px;
  color: var(--color-primary-900);
  font-size: 0.8rem;
}

.specialty-card p {
  margin: 0;
  color: #62798e;
  font-size: 0.65rem;
  line-height: 1.25;
}

/* ==========================================================================
   PROMOTIONS
   ========================================================================== */

.promotions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.promotion-card {
  overflow: hidden;
  min-height: 108px;
  border: 1px solid #dfeaf1;
  border-radius: 9px;
  background: #ffffff;
  box-shadow: var(--shadow-card);
}

.promotion-card img {
  width: 100%;
  height: 100%;
  min-height: 108px;
  object-fit: cover;
}

/* ==========================================================================
   RESULTS
   ========================================================================== */

.results-section {
  padding: 0 0 10px;
}

.results-panel {
  min-height: 76px;
  display: grid;
  grid-template-columns: minmax(360px, 1.45fr) minmax(420px, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 12px 18px;
  border: 1px solid #d9e9f3;
  border-radius: 12px;
  background: linear-gradient(90deg, #effbff 0%, #eaf7fb 100%);
}

.results-panel__intro {
  display: flex;
  align-items: center;
  gap: 15px;
  color: var(--color-primary-800);
}

.results-panel__intro > svg {
  flex: 0 0 auto;
}

.results-panel__intro h2 {
  margin-bottom: 4px;
  font-size: 1rem;
}

.results-panel__intro p {
  margin: 0;
  color: #526d85;
  font-size: 0.66rem;
  line-height: 1.3;
}

.results-panel__features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.result-feature {
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  border-left: 1px solid #cadde8;
  color: var(--color-primary-800);
}

.result-feature span {
  font-size: 0.65rem;
  line-height: 1.2;
}

.results-panel__button {
  white-space: nowrap;
}

/* ==========================================================================
   FOOTER
   ========================================================================== */

.site-footer {
  color: #ffffff;
  background:
    linear-gradient(120deg, #0b3d68 0%, #092f55 100%);
}

.site-footer__grid {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr 1fr 1fr;
  gap: 44px;
  padding-top: 18px;
  padding-bottom: 15px;
}

.brand--footer {
  color: #ffffff;
}

.brand--footer .brand__text strong span {
  color: #93e4ea;
}

.site-footer h3 {
  margin-bottom: 9px;
  font-size: 0.77rem;
}

.footer-list {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.footer-list li {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  color: #d9e8f3;
  font-size: 0.65rem;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 14px;
}

.footer-links a {
  color: #d9e8f3;
  font-size: 0.65rem;
}

.social-links {
  display: flex;
  gap: 8px;
}

.social-links a {
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: var(--color-primary-900);
  background: #ffffff;
}

.footer-slogan {
  margin: 12px 0 0;
  color: #d9f7fa;
  font-family: Georgia, serif;
  font-size: 1.12rem;
  font-style: italic;
}

.site-footer__bottom {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  color: #bfd1df;
  font-size: 0.58rem;
}

.site-footer__bottom div {
  display: flex;
  gap: 9px;
}

/* ==========================================================================
   LOGIN PLACEHOLDER
   ========================================================================== */

.login-page {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top right, #dff7fb, transparent 35%),
    linear-gradient(180deg, #f9fcfe, #eef7fb);
}

.login-page__top {
  width: min(1100px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
}

.login-page__back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary-800);
  font-weight: 750;
}

.login-card {
  width: min(440px, 100%);
  margin: 12vh auto 0;
  padding: 34px;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: #ffffff;
  box-shadow: var(--shadow-soft);
}

.login-card__icon {
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
  border-radius: 18px;
  color: var(--color-primary-700);
  background: #eaf7fd;
}

.login-card h1 {
  margin-bottom: 10px;
}

.login-card > p:not(.eyebrow) {
  margin-bottom: 22px;
  color: var(--color-text-soft);
  line-height: 1.5;
}

/* ==========================================================================
   RESPONSIVE
   ========================================================================== */

@media (max-width: 1180px) {
  .main-navigation {
    gap: 14px;
  }

  .main-navigation a {
    font-size: 0.75rem;
  }

  .login-box {
    min-width: 214px;
  }

  .branches-grid,
  .promotions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .specialties-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .results-panel {
    grid-template-columns: 1fr;
  }

  .results-panel__features {
    border-top: 1px solid #d4e5ee;
    padding-top: 10px;
  }

  .result-feature:first-child {
    border-left: 0;
  }

  .results-panel__button {
    justify-self: start;
  }
}

@media (max-width: 980px) {
  .site-header__inner {
    grid-template-columns: auto 1fr auto;
  }

  .main-navigation {
    position: absolute;
    left: 20px;
    right: 20px;
    top: calc(100% + 8px);
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 10px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: var(--shadow-soft);
  }

  .main-navigation--open {
    display: flex;
  }

  .main-navigation a {
    padding: 10px;
  }

  .mobile-menu-button {
    display: grid;
    place-items: center;
  }

  .hero-section__grid {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    order: 2;
    padding: 28px 10px 30px;
  }

  .hero-media {
    min-height: 310px;
  }

  .hero-media::before {
    background:
      linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(255, 255, 255, 0) 32%
      );
  }

  .hero-media__message {
    right: 20px;
  }

  .carousel-track {
    grid-template-columns: 1fr;
  }

  .carousel-card {
    display: none;
    height: 150px;
  }

  .carousel-card--active {
    display: block;
  }

  .site-footer__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  :root {
    --header-height: 70px;
  }

  .brand__text strong {
    font-size: 1.35rem;
  }

  .brand__text small {
    display: none;
  }

  .login-box {
    display: none;
  }

  .language-switcher > svg {
    display: none;
  }

  .hero-media {
    min-height: 230px;
  }

  .hero-copy h1 {
    font-size: 2.3rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .trust-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
  }

  .section-heading__main {
    display: block;
  }

  .section-heading p {
    margin-top: 5px;
  }

  .section-heading__action {
    display: none;
  }

  .branches-grid,
  .specialties-grid,
  .promotions-grid {
    grid-template-columns: 1fr;
  }

  .branch-card {
    grid-template-columns: 38% 62%;
  }

  .promotion-card {
    min-height: 120px;
  }

  .results-panel {
    min-width: 0;
  }

  .results-panel__intro {
    align-items: flex-start;
  }

  .results-panel__features {
    grid-template-columns: 1fr;
  }

  .result-feature {
    border-left: 0;
    border-top: 1px solid #d4e5ee;
  }

  .site-footer__grid {
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .site-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    padding: 11px 0;
  }
}

@media (max-width: 430px) {
  .site-header__actions {
    gap: 6px;
  }

  .hero-copy {
    padding-inline: 0;
  }

  .hero-copy h1 {
    font-size: 2rem;
  }

  .hero-media__message {
    width: 110px;
    font-size: 1.05rem;
  }

  .branch-card {
    grid-template-columns: 1fr;
  }

  .branch-card__image {
    height: 145px;
  }

  .specialty-card {
    min-height: 82px;
  }
}
'@

# =============================================================================
# LIMPIEZA DE ARCHIVOS VITE QUE YA NO USAMOS
# =============================================================================

$UnusedFiles = @(
    "src\App.css",
    "src\index.css"
)

foreach ($UnusedFile in $UnusedFiles) {
    $UnusedPath = Join-Path $ProjectPath $UnusedFile

    if (Test-Path $UnusedPath) {
        Remove-Item $UnusedPath -Force
    }
}

# =============================================================================
# VALIDAR BUILD
# =============================================================================

Write-Host ""
Write-Host "Ejecutando build de validacion..." -ForegroundColor Yellow

& npm.cmd run build

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host " HOME APROBADO INSTALADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proyecto:" -ForegroundColor Cyan
Write-Host $ProjectPath
Write-Host ""
Write-Host "Para iniciar:" -ForegroundColor Yellow
Write-Host "cd $ProjectPath"
Write-Host "npm.cmd run dev"
Write-Host ""
Write-Host "URL habitual:" -ForegroundColor Yellow
Write-Host "http://localhost:5173"
Write-Host ""
