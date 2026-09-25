import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;
const appPath = path.join(projectPath, "src", "App.jsx");

let source = fs.readFileSync(appPath, "utf8");

function ensureImport(sourceText, statement) {
  if (sourceText.includes(statement)) {
    return sourceText;
  }

  const matches = [...sourceText.matchAll(/^import .*$/gm)];

  if (matches.length === 0) {
    throw new Error("No imports found in App.jsx");
  }

  const lastImport = matches[matches.length - 1];
  const insertAt =
    lastImport.index + lastImport[0].length;

  return (
    sourceText.slice(0, insertAt) +
    "\n" +
    statement +
    sourceText.slice(insertAt)
  );
}

source = ensureImport(
  source,
  'import AdminLayout from "./components/admin/AdminLayout";',
);

source = ensureImport(
  source,
  'import AdminLoginPage from "./pages/AdminLoginPage";',
);

source = ensureImport(
  source,
  'import AdminDashboardPage from "./pages/AdminDashboardPage";',
);

if (
  !source.includes('path="/admin/login"') &&
  !source.includes("path='/admin/login'")
) {
  if (!source.includes("</Routes>")) {
    throw new Error("Could not find </Routes> in App.jsx");
  }

  const routes = `
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
      </Route>
`;

  source = source.replace(
    "</Routes>",
    routes + "    </Routes>",
  );
}

fs.writeFileSync(appPath, source, "utf8");

console.log("Admin routes added.");