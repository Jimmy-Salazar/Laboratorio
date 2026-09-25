import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;

const allowedExtensions = new Set([
  ".js",
  ".jsx",
  ".css",
  ".json",
  ".html",
]);

/*
 * IMPORTANT:
 * This file uses only ASCII source code.
 *
 * All non-ASCII characters are represented with Unicode escapes.
 * This prevents Windows PowerShell from corrupting the repair script itself.
 */

const replacements = new Map([
  // Double-encoded UTF-8 sequences.
  ["\u00C3\u0192\u00C2\u00A1", "\u00E1"],
  ["\u00C3\u0192\u00C2\u00A9", "\u00E9"],
  ["\u00C3\u0192\u00C2\u00AD", "\u00ED"],
  ["\u00C3\u0192\u00C2\u00B3", "\u00F3"],
  ["\u00C3\u0192\u00C2\u00BA", "\u00FA"],
  ["\u00C3\u0192\u00C2\u00B1", "\u00F1"],

  // Standard UTF-8 interpreted as Windows-1252 / Latin-1.
  ["\u00C3\u00A1", "\u00E1"],
  ["\u00C3\u00A9", "\u00E9"],
  ["\u00C3\u00AD", "\u00ED"],
  ["\u00C3\u00B3", "\u00F3"],
  ["\u00C3\u00BA", "\u00FA"],
  ["\u00C3\u00B1", "\u00F1"],

  ["\u00C3\u0081", "\u00C1"],
  ["\u00C3\u0089", "\u00C9"],
  ["\u00C3\u008D", "\u00CD"],
  ["\u00C3\u0093", "\u00D3"],
  ["\u00C3\u009A", "\u00DA"],
  ["\u00C3\u0091", "\u00D1"],

  ["\u00C2\u00BF", "\u00BF"],
  ["\u00C2\u00A1", "\u00A1"],
  ["\u00C2\u00B0", "\u00B0"],
  ["\u00C2\u00B7", "\u00B7"],

  // Common smart punctuation mojibake.
  ["\u00E2\u20AC\u0153", "\u201C"],
  ["\u00E2\u20AC\u009D", "\u201D"],
  ["\u00E2\u20AC\u02DC", "\u2018"],
  ["\u00E2\u20AC\u2122", "\u2019"],
  ["\u00E2\u20AC\u201C", "\u2013"],
  ["\u00E2\u20AC\u201D", "\u2014"],
  ["\u00E2\u20AC\u00A6", "\u2026"],
]);

const suspiciousTokens = [
  "\u00C3",
  "\u00C2",
  "\u00E2\u20AC",
];

function collectFiles(directory) {
  const output = [];

  if (!fs.existsSync(directory)) {
    return output;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      output.push(...collectFiles(fullPath));
      continue;
    }

    if (allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      output.push(fullPath);
    }
  }

  return output;
}

const files = collectFiles(path.join(projectPath, "src"));

const indexPath = path.join(projectPath, "index.html");
if (fs.existsSync(indexPath)) {
  files.push(indexPath);
}

let modifiedFiles = 0;
let replacementCount = 0;

for (const filePath of files) {
  const original = fs.readFileSync(filePath, "utf8");
  let updated = original;

  // Up to three passes so double-encoded strings can be repaired safely.
  for (let pass = 0; pass < 3; pass += 1) {
    const beforePass = updated;

    for (const [badText, goodText] of replacements) {
      if (!updated.includes(badText)) {
        continue;
      }

      const occurrences = updated.split(badText).length - 1;
      replacementCount += occurrences;
      updated = updated.split(badText).join(goodText);
    }

    if (updated === beforePass) {
      break;
    }
  }

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, "utf8");
    modifiedFiles += 1;
    console.log(`FIXED: ${path.relative(projectPath, filePath)}`);
  }
}

const remaining = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");

  for (const token of suspiciousTokens) {
    if (content.includes(token)) {
      remaining.push({
        file: path.relative(projectPath, filePath),
        token,
      });
    }
  }
}

console.log("");
console.log(`Modified files: ${modifiedFiles}`);
console.log(`Replacements: ${replacementCount}`);

if (remaining.length === 0) {
  console.log("No common mojibake sequences remain.");
} else {
  console.log("");
  console.log("WARNING: possible suspicious sequences remain:");

  const unique = new Set(
    remaining.map((item) => `${item.file} :: U+${item.token.charCodeAt(0).toString(16).toUpperCase()}`)
  );

  for (const item of unique) {
    console.log(`  ${item}`);
  }
}