import { useState } from "react";
import {

  Home,
  MapPin,
  Microscope,
  Tag,
  FileText,
  Menu,
  X,

  Sparkles,
} from "lucide-react";

import LanguageSwitcher from "../common/LanguageSwitcher";
import { useLanguage } from "../../context/LanguageContext";

import HighlightsPopup from "../home/HighlightsPopup";
/*
 * HEADER PRINCIPAL
 * ---------------------------------------------------------------------------
 * El encabezado contiene:
 *
 * - Marca Dr. Chasis
 * - Navegacion principal
 * - Selector Espanol / English
 * - Menu responsive para dispositivos moviles
 *
 * IMPORTANTE:
 * El bloque independiente de "Iniciar sesion" fue eliminado del header
 * para mantener una interfaz mas limpia.
 *
 * El acceso al portal de pacientes se realizara desde las opciones
 * relacionadas con Resultados.
 */

/* PATCH_06_23_BRAND_HEADER */

/* PATCH_06_28_1_HIGHLIGHTS_MENU_MODAL */

/* PATCH_06_28_2_RESTORE_TOP_MENU */

/* PATCH_06_30_DIRECT_HIGHLIGHTS_POPUP */

export default function SiteHeader() {
  const { content, language } = useLanguage();

  // Controla la apertura y cierre del menu en dispositivos moviles.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [highlightsOpen, setHighlightsOpen] = useState(false);

  /*
   * Navegacion principal.
   *
   * Se utilizan anclas porque todas estas secciones pertenecen
   * actualmente al Home.
   */
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
      label:
        language === "en"
          ? "Highlights"
          : "Destacados",
      href: "#highlights",
      icon: Sparkles,
      modal: true,
    },
    {
      label: content.navigation.results,
      href: "/resultados",
      icon: FileText,
    },
  ];

  /*
   * Cierra el menu movil despues de seleccionar una opcion.
   */
  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="site-header__inner page-container">

        {/* =====================================================
            MARCA
            ===================================================== */}
        <a
          className="brand brand--logo"
          href="#home"
          onClick={closeMobileMenu}
          aria-label="Laboratorio Clinico Dr. Milton Chasi"
        >
          <img
            className="brand-logo brand-logo--header"
            src="/brand/dr-milton-chasi-logo.png"
            alt="Laboratorio Clinico Dr. Milton Chasi"
          />
        </a>

        {/* =====================================================
            NAVEGACION
            ===================================================== */}
        <nav
          className={`main-navigation ${
            mobileMenuOpen ? "main-navigation--open" : ""
          }`}
          aria-label="Main navigation"
        >
          {navItems.map(
            ({
              label,
              href,
              icon: Icon,
            }) => (
              <a
                key={href}
                href={href}
                onClick={(event) => {
                  if (
                    href ===
                    "#highlights"
                  ) {
                    event.preventDefault();

                    setHighlightsOpen(
                      true,
                    );
                  }

                  closeMobileMenu();
                }}
              >
                <Icon
                  size={16}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </a>
            ),
          )}
        </nav>

        {/* =====================================================
            ACCIONES DEL HEADER
            ===================================================== */}
        <div className="site-header__actions">

          {/* Selector Espanol / English */}
          <LanguageSwitcher />

          {/* Boton hamburguesa para pantallas pequenas */}
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                (currentValue) =>
                  !currentValue,
              )
            }
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen
              ? <X />
              : <Menu />}
          </button>

        </div>
      </div>
      <HighlightsPopup
        open={highlightsOpen}
        onClose={() =>
          setHighlightsOpen(
            false,
          )
        }
      />
    </header>
  );
}


