import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;

const heroPath = path.join(
  projectPath,
  "src",
  "components",
  "home",
  "HeroSection.jsx",
);

let source = fs.readFileSync(heroPath, "utf8");
const original = source;

/*
 * El boton secundario del Hero es "Agendar un estudio".
 * Antes apuntaba a #branches. Ahora debe abrir /agendar.
 *
 * Link ya esta importado en HeroSection porque tambien se usa
 * para el boton de resultados.
 */

const exactOldBlock = `<a className="button button--secondary" href="#branches">
              <CalendarDays size={17} aria-hidden="true" />
              {content.hero.secondaryAction}
            </a>`;

const exactNewBlock = `<Link
              className="button button--secondary"
              to="/agendar"
            >
              <CalendarDays size={17} aria-hidden="true" />
              {content.hero.secondaryAction}
            </Link>`;

if (source.includes(exactOldBlock)) {
  source = source.replace(
    exactOldBlock,
    exactNewBlock,
  );
} else {
  /*
   * Fallback por si el formato del archivo cambio ligeramente.
   * Solo modifica el boton que contiene content.hero.secondaryAction.
   */
  const flexiblePattern =
    /<a\b([^>]*className=["'][^"']*button--secondary[^"']*["'][^>]*)href=["'][^"']*["']([^>]*)>\s*<CalendarDays([^>]*)\/>\s*\{content\.hero\.secondaryAction\}\s*<\/a>/m;

  if (flexiblePattern.test(source)) {
    source = source.replace(
      flexiblePattern,
      `<Link
              className="button button--secondary"
              to="/agendar"
            >
              <CalendarDays size={17} aria-hidden="true" />
              {content.hero.secondaryAction}
            </Link>`,
    );
  }
}

if (source === original) {
  /*
   * Si ya estaba enlazado, lo tratamos como correcto.
   */
  if (
    source.includes('to="/agendar"') &&
    source.includes("content.hero.secondaryAction")
  ) {
    console.log("Home booking button is already linked to /agendar.");
    process.exit(0);
  }

  console.log(
    "Could not locate the Home booking button in HeroSection.jsx.",
  );
  process.exit(2);
}

fs.writeFileSync(heroPath, source, "utf8");

console.log("Home booking button linked to /agendar.");