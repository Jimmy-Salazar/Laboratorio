import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;
const contentPath = path.join(
  projectPath,
  "src",
  "data",
  "siteContent.js",
);

let source = fs.readFileSync(contentPath, "utf8");
const original = source;

/*
 * Elimina solamente objetos de navegacion cuyo destino sea #promotions.
 * No toca el bloque de contenido de promociones ni sus tarjetas.
 */
source = source.replace(
  /\{\s*label:\s*["'][^"']*["']\s*,\s*href:\s*["']#promotions["']\s*,?\s*\}\s*,?/g,
  "",
);

/*
 * Variante por si el objeto tiene href antes que label.
 */
source = source.replace(
  /\{\s*href:\s*["']#promotions["']\s*,\s*label:\s*["'][^"']*["']\s*,?\s*\}\s*,?/g,
  "",
);

/*
 * Limpieza menor de comas dobles accidentales dentro de arrays.
 */
source = source.replace(/,\s*,/g, ",");

if (source === original) {
  console.log(
    "No navigation object with href #promotions was found in siteContent.js.",
  );
  console.log(
    "No file was changed.",
  );
  process.exit(2);
}

fs.writeFileSync(contentPath, source, "utf8");

console.log(
  "Promotions navigation item removed.",
);
console.log(
  "Promotions home section was preserved.",
);