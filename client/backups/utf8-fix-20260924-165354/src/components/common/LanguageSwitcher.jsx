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

