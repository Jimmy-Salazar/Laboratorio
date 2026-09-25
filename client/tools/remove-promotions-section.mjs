import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;

const homePagePath = path.join(
  projectPath,
  "src",
  "pages",
  "HomePage.jsx",
);

const siteHeaderPath = path.join(
  projectPath,
  "src",
  "components",
  "layout",
  "SiteHeader.jsx",
);

const siteContentPath = path.join(
  projectPath,
  "src",
  "data",
  "siteContent.js",
);

function updateFile(filePath, transform, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`${label}: file not found, skipped.`);
    return false;
  }

  const original = fs.readFileSync(filePath, "utf8");
  const updated = transform(original);

  if (updated === original) {
    console.log(`${label}: no matching content found.`);
    return false;
  }

  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`${label}: updated.`);
  return true;
}

let changed = false;

/*
 * HOME
 * -------------------------------------------------------------------------
 * Removes the import and JSX render of PromotionsSection.
 */
changed =
  updateFile(
    homePagePath,
    (source) => {
      let output = source;

      output = output.replace(
        /^import\s+PromotionsSection\s+from\s+["'][^"']*PromotionsSection[^"']*["'];?\s*\r?\n/gm,
        "",
      );

      output = output.replace(
        /\s*<PromotionsSection\s*\/>\s*/g,
        "\n",
      );

      output = output.replace(
        /\s*<PromotionsSection(?:\s+[^>]*)?>\s*<\/PromotionsSection>\s*/g,
        "\n",
      );

      return output;
    },
    "Home promotions section",
  ) || changed;

/*
 * HEADER
 * -------------------------------------------------------------------------
 * Removes hardcoded links pointing to #promotions.
 */
changed =
  updateFile(
    siteHeaderPath,
    (source) => {
      let output = source;

      output = output.replace(
        /\s*<a\b[^>]*href=["']#promotions["'][^>]*>[\s\S]*?<\/a>\s*/gi,
        "\n",
      );

      output = output.replace(
        /\s*<NavLink\b[^>]*to=["']#promotions["'][^>]*>[\s\S]*?<\/NavLink>\s*/gi,
        "\n",
      );

      output = output.replace(
        /\s*<Link\b[^>]*to=["']#promotions["'][^>]*>[\s\S]*?<\/Link>\s*/gi,
        "\n",
      );

      return output;
    },
    "Header promotions link",
  ) || changed;

/*
 * CONTENT DATA
 * -------------------------------------------------------------------------
 * Removes navigation objects whose href is #promotions.
 * It intentionally leaves the promotions data block in place; it is harmless
 * and can be reused later if promotions are enabled again.
 */
changed =
  updateFile(
    siteContentPath,
    (source) => {
      let output = source;

      output = output.replace(
        /\{\s*label:\s*["'][^"']*["']\s*,\s*href:\s*["']#promotions["']\s*,?\s*\}\s*,?/g,
        "",
      );

      output = output.replace(
        /\{\s*href:\s*["']#promotions["']\s*,\s*label:\s*["'][^"']*["']\s*,?\s*\}\s*,?/g,
        "",
      );

      output = output.replace(/,\s*,/g, ",");

      return output;
    },
    "Navigation data",
  ) || changed;

if (!changed) {
  console.log("");
  console.log("WARNING: no promotions references were changed.");
  console.log("The project may use a different component structure.");
  process.exit(2);
}

console.log("");
console.log("Promotions section removed from Home.");
console.log("Promotions navigation link removed where found.");