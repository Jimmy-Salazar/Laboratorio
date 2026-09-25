import { useState } from "react";
import {
  FlaskConical,
  Home,
  MapPin,
  Microscope,
  Tag,
  FileText,
  Menu,
  X,
} from "lucide-react";

import LanguageSwitcher from "../common/LanguageSwitcher";
import { useLanguage } from "../../context/LanguageContext";

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

export default function SiteHeader() {
  const { content } = useLanguage();

  // Controla la apertura y cierre del menu en dispositivos moviles.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /*
   * Navegacion principal.
   *
   * Se utilizan anclas porque todas estas secciones pertenecen
   * actualmente al Home.
   */
  const navItems = [
    {
      label: content.navigation.home,
      href: "/#home",
      icon: Home,
    },
    {
      label: content.navigation.branches,
      href: "/#branches",
      icon: MapPin,
    },
    {
      label: content.navigation.specialties,
      href: "/#specialties",
      icon: Microscope,
    },
    {
      label: content.navigation.promotions,
      href: "/#promotions",
      icon: Tag,
    },
    {
      label: content.navigation.results,
      href: "/#results",
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
          className="brand"
          href="/#home"
          onClick={closeMobileMenu}
          aria-label="Dr. Chasi"
        >
          <FlaskConical
            size={34}
            strokeWidth={2.1}
            aria-hidden="true"
          />

          <span className="brand__text">
            <strong>
              Dr. <span>Chasi</span>
            </strong>

            <small>
              Laboratorio Clínico
            </small>
          </span>
        </a>

        {/* =====================================================
            NAVEGACION
            ===================================================== */}
        <nav
          className={`main-navigation ${
            mobileMenuOpen
              ? "main-navigation--open"
              : ""
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
                onClick={closeMobileMenu}
              >
                <Icon
                  size={16}
                  aria-hidden="true"
                />

                <span>
                  {label}
                </span>
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
    </header>
  );
}


