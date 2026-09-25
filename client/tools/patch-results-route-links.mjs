import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;

const appPath = path.join(projectPath, "src", "App.jsx");
const heroPath = path.join(
  projectPath,
  "src",
  "components",
  "home",
  "HeroSection.jsx",
);
const headerPath = path.join(
  projectPath,
  "src",
  "components",
  "layout",
  "SiteHeader.jsx",
);
const footerPath = path.join(
  projectPath,
  "src",
  "components",
  "layout",
  "SiteFooter.jsx",
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
 * App route.
 */
let app = fs.readFileSync(appPath, "utf8");

app = ensureImport(
  app,
  'import ResultsPage from "./pages/ResultsPage";',
);

if (
  !app.includes('path="/resultados"') &&
  !app.includes("path='/resultados'")
) {
  const wildcardPattern =
    /(\s*<Route\s+path=["']\*["'][^>]*\/>)/;

  if (wildcardPattern.test(app)) {
    app = app.replace(
      wildcardPattern,
      '\n      <Route path="/resultados" element={<ResultsPage />} />$1',
    );
  } else if (app.includes("</Routes>")) {
    app = app.replace(
      "</Routes>",
      '      <Route path="/resultados" element={<ResultsPage />} />\n    </Routes>',
    );
  } else {
    throw new Error("Could not add /resultados route.");
  }
}

fs.writeFileSync(appPath, app, "utf8");

/*
 * Home primary CTA:
 * Ver resultados -> /resultados.
 */
let hero = fs.readFileSync(heroPath, "utf8");

if (hero.includes("content.hero.primaryAction")) {
  hero = hero.replace(
    /to=["']\/login\?role=patient["']/g,
    'to="/resultados"',
  );
}

fs.writeFileSync(heroPath, hero, "utf8");

/*
 * Shared header:
 * Resultados -> /resultados.
 */
let header = fs.readFileSync(headerPath, "utf8");

header = header.replace(
  /(label:\s*content\.navigation\.results,\s*(?:\r?\n)\s*href:\s*)["'][^"']+["']/,
  '$1"/resultados"',
);

header = header.replace(
  /href=["']\/?#results["']/g,
  'href="/resultados"',
);

fs.writeFileSync(headerPath, header, "utf8");

/*
 * Shared footer:
 * Results link -> /resultados.
 */
let footer = fs.readFileSync(footerPath, "utf8");

footer = footer.replace(
  /href=["']\/?#results["']/g,
  'href="/resultados"',
);

fs.writeFileSync(footerPath, footer, "utf8");

console.log("Route /resultados added.");
console.log("Home Results button linked to /resultados.");
console.log("Shared header Results link updated.");
console.log("Shared footer Results link updated.");