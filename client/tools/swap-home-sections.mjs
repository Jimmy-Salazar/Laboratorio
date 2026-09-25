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

const branchesTag = /<BranchesSection\s*\/>/;
const specialtiesTag = /<SpecialtiesSection\s*\/>/;

const branchesMatch = source.match(branchesTag);
const specialtiesMatch = source.match(specialtiesTag);

if (!branchesMatch || !specialtiesMatch) {
  console.log("BranchesSection or SpecialtiesSection was not found.");
  process.exit(2);
}

const branchesIndex = source.indexOf(branchesMatch[0]);
const specialtiesIndex = source.indexOf(specialtiesMatch[0]);

/*
 * Queremos este orden:
 *
 *   <SpecialtiesSection />
 *   <BranchesSection />
 *
 * Si ya esta asi, no hacemos cambios innecesarios.
 */
if (specialtiesIndex < branchesIndex) {
  console.log("Specialties already appears before Branches.");
  process.exit(0);
}

/*
 * Intercambia solamente las posiciones de ambos componentes.
 * Todo el contenido que exista entre ellos se conserva.
 */
const placeholderA = "__SPECIALTIES_SECTION_PLACEHOLDER__";
const placeholderB = "__BRANCHES_SECTION_PLACEHOLDER__";

source = source.replace(branchesTag, placeholderA);
source = source.replace(specialtiesTag, placeholderB);

source = source.replace(placeholderA, "<SpecialtiesSection />");
source = source.replace(placeholderB, "<BranchesSection />");

fs.writeFileSync(homePagePath, source, "utf8");

console.log("Home section order updated:");
console.log("1. Specialties");
console.log("2. Branches");