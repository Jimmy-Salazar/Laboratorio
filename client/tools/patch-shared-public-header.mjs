import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;

const appointmentPath = path.join(
  projectPath,
  "src",
  "pages",
  "AppointmentPage.jsx",
);

const headerPath = path.join(
  projectPath,
  "src",
  "components",
  "layout",
  "SiteHeader.jsx",
);

function ensureImport(source, statement) {
  if (source.includes(statement)) {
    return source;
  }

  const matches = [...source.matchAll(/^import .*$/gm)];

  if (matches.length === 0) {
    throw new Error("No import statements found.");
  }

  const lastImport = matches[matches.length - 1];
  const insertAt = lastImport.index + lastImport[0].length;

  return (
    source.slice(0, insertAt) +
    "\n" +
    statement +
    source.slice(insertAt)
  );
}

/*
 * --------------------------------------------------------------------------
 * APPOINTMENT PAGE
 * --------------------------------------------------------------------------
 */

let appointment = fs.readFileSync(appointmentPath, "utf8");

/*
 * El header de esta pagina ya no debe mantener su propio idioma.
 * El idioma se toma del contexto global usado tambien por SiteHeader.
 */
appointment = ensureImport(
  appointment,
  'import SiteHeader from "../components/layout/SiteHeader";',
);

appointment = ensureImport(
  appointment,
  'import SiteFooter from "../components/layout/SiteFooter";',
);

appointment = ensureImport(
  appointment,
  'import { useLanguage } from "../context/LanguageContext";',
);

/*
 * El Link solo era necesario para el header local.
 */
appointment = appointment.replace(
  /^import\s+\{\s*Link\s*\}\s+from\s+["']react-router-dom["'];?\s*\r?\n/m,
  "",
);

/*
 * MessageCircle solo era utilizado por el header local.
 * Se elimina de la lista de iconos si esta presente.
 */
appointment = appointment.replace(
  /^(\s*)MessageCircle,\s*\r?\n/m,
  "",
);

/*
 * Elimina el logo/header local de AppointmentPage.
 */
appointment = appointment.replace(
  /\nfunction AppointmentLogo\(\)\s*\{[\s\S]*?\n\}\n\nexport default function AppointmentPage\(\)/,
  "\nexport default function AppointmentPage()",
);

/*
 * Sustituye el estado de idioma local por el contexto global.
 */
appointment = appointment.replace(
  /const\s+\[language,\s*setLanguage\]\s*=\s*useState\(["']es["']\);/,
  "const { language } = useLanguage();",
);

/*
 * Sustituye el header particular por el SiteHeader oficial del proyecto.
 */
const localHeaderPattern =
  /\s*<header\s+className=["']appointment-header["']>[\s\S]*?<\/header>\s*/;

if (localHeaderPattern.test(appointment)) {
  appointment = appointment.replace(
    localHeaderPattern,
    "\n      <SiteHeader />\n\n",
  );
} else if (!appointment.includes("<SiteHeader />")) {
  throw new Error(
    "Appointment local header was not found and SiteHeader is not present.",
  );
}

/*
 * Agrega el mismo footer publico utilizado por el Home.
 */
if (!appointment.includes("<SiteFooter />")) {
  const mainClosingPattern =
    /(\s*<\/main>)(\s*<\/div>\s*\);\s*\})\s*$/;

  if (!mainClosingPattern.test(appointment)) {
    throw new Error(
      "Could not find the final </main> block in AppointmentPage.jsx.",
    );
  }

  appointment = appointment.replace(
    mainClosingPattern,
    "$1\n\n      <SiteFooter />$2\n",
  );
}

fs.writeFileSync(appointmentPath, appointment, "utf8");

console.log("AppointmentPage now uses global SiteHeader.");
console.log("AppointmentPage now uses global language context.");
console.log("AppointmentPage now uses global SiteFooter.");

/*
 * --------------------------------------------------------------------------
 * SITE HEADER
 * --------------------------------------------------------------------------
 * Las anclas del Home deben funcionar tambien cuando el usuario esta en
 * /agendar u otra ruta publica.
 *
 * #specialties  -> /#specialties
 * #branches     -> /#branches
 * etc.
 *
 * Solo se transforman hrefs internos que aun comienzan directamente con #.
 */

let header = fs.readFileSync(headerPath, "utf8");

header = header.replace(
  /href:\s*["']#([A-Za-z0-9_-]+)["']/g,
  'href: "/#$1"',
);

header = header.replace(
  /href=["']#([A-Za-z0-9_-]+)["']/g,
  'href="/#$1"',
);

fs.writeFileSync(headerPath, header, "utf8");

console.log("SiteHeader Home anchors are now route-safe.");