import fs from "node:fs";
import path from "node:path";

const appPath = String.raw`C:\projects\Laboratorio\client\src\App.jsx`;
let source = fs.readFileSync(appPath, "utf8");
let changed = false;

if (!source.includes("AppointmentPage")) {
  const matches = [...source.matchAll(/^import .*$/gm)];
  if (!matches.length) throw new Error("No imports found in App.jsx");
  const last = matches[matches.length - 1];
  const at = last.index + last[0].length;
  source = source.slice(0, at) + '\nimport AppointmentPage from "./pages/AppointmentPage";' + source.slice(at);
  changed = true;
}

if (!source.includes('path="/agendar"') && !source.includes("path='/agendar'")) {
  if (!source.includes("</Routes>")) throw new Error("Could not find </Routes> in App.jsx");
  source = source.replace(
    "</Routes>",
    '        <Route path="/agendar" element={<AppointmentPage />} />\n      </Routes>',
  );
  changed = true;
}

if (changed) fs.writeFileSync(appPath, source, "utf8");
console.log(changed ? "Appointment route added." : "Appointment route already exists.");