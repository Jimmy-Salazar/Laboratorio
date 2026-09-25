import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;

const homePagePath = path.join(
  projectPath,
  "src",
  "pages",
  "HomePage.jsx",
);

let source = fs.readFileSync(homePagePath, "utf8");
const original = source;

/*
 * Elimina el import de ResultsSection.
 */
source = source.replace(
  /^import\s+ResultsSection\s+from\s+["'][^"']*ResultsSection[^"']*["'];?\s*\r?\n/gm,
  "",
);

/*
 * Elimina el componente del Home.
 */
source = source.replace(
  /\s*<ResultsSection\s*\/>\s*/g,
  "\n",
);

source = source.replace(
  /\s*<ResultsSection(?:\s+[^>]*)?>\s*<\/ResultsSection>\s*/g,
  "\n",
);

if (source === original) {
  console.log("No ResultsSection reference was found in HomePage.jsx.");
  process.exit(2);
}

fs.writeFileSync(homePagePath, source, "utf8");

console.log("Results section removed from Home.");
console.log("Navigation item 'Resultados' was preserved.");