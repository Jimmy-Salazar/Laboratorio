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

