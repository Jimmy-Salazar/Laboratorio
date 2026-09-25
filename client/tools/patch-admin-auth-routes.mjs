import fs from "node:fs";
import path from "node:path";

const projectPath =
  String.raw`C:\projects\Laboratorio\client`;

const appPath =
  path.join(projectPath, "src", "App.jsx");

let source = fs.readFileSync(
  appPath,
  "utf8",
);

function ensureImport(
  sourceText,
  statement,
) {
  if (sourceText.includes(statement)) {
    return sourceText;
  }

  const matches = [
    ...sourceText.matchAll(/^import .*$/gm),
  ];

  if (matches.length === 0) {
    throw new Error(
      "No imports found in App.jsx",
    );
  }

  const lastImport =
    matches[matches.length - 1];

  const insertAt =
    lastImport.index +
    lastImport[0].length;

  return (
    sourceText.slice(0, insertAt) +
    "\n" +
    statement +
    sourceText.slice(insertAt)
  );
}

source = ensureImport(
  source,
  'import { AdminAuthProvider } from "./context/AdminAuthContext";',
);

source = ensureImport(
  source,
  'import { RequireAdmin, RequireRole } from "./components/admin/RequireAdmin";',
);

source = ensureImport(
  source,
  'import AdminHomeRedirect from "./components/admin/AdminHomeRedirect";',
);

source = ensureImport(
  source,
  'import MasterAdminsPage from "./pages/MasterAdminsPage";',
);

const oldAdminRoutes =
  /<Route\s+path=["']\/admin\/login["'][\s\S]*?<Route\s+path=["']\/admin["'][\s\S]*?<\/Route>/;

const newAdminRoutes = `
      <Route
        path="/admin/login"
        element={
          <AdminAuthProvider>
            <AdminLoginPage />
          </AdminAuthProvider>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminAuthProvider>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </AdminAuthProvider>
        }
      >
        <Route
          index
          element={<AdminHomeRedirect />}
        />

        <Route
          path="dashboard"
          element={
            <RequireRole
              roles={["admin"]}
            >
              <AdminDashboardPage />
            </RequireRole>
          }
        />

        <Route
          path="administradores"
          element={
            <RequireRole
              roles={["master"]}
            >
              <MasterAdminsPage />
            </RequireRole>
          }
        />
      </Route>`;

if (oldAdminRoutes.test(source)) {
  source = source.replace(
    oldAdminRoutes,
    newAdminRoutes.trim(),
  );
} else {
  throw new Error(
    "Existing admin route block was not found. PATCH 06.0 may not be applied.",
  );
}

fs.writeFileSync(
  appPath,
  source,
  "utf8",
);

console.log(
  "Protected admin routes installed.",
);