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

