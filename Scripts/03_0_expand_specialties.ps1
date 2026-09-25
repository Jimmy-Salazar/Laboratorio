#requires -Version 5.1
# PATCH 03.0
# Expands the clinical laboratory specialties catalog in Spanish and English.
# Uses Node.js for UTF-8-safe file editing and creates backups first.

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$SiteContentPath = Join-Path $ProjectPath "src\data\siteContent.js"
$CssPath = Join-Path $ProjectPath "src\styles\home.css"
$ToolsPath = Join-Path $ProjectPath "tools"
$NodePatchPath = Join-Path $ToolsPath "patch-specialties.mjs"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 03.0 - SPECIALTIES CATALOG" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ProjectPath)) {
    throw "Project not found: $ProjectPath"
}

if (-not (Test-Path $SiteContentPath)) {
    throw "siteContent.js not found: $SiteContentPath"
}

if (-not (Test-Path $CssPath)) {
    throw "home.css not found: $CssPath"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found."
}

# ------------------------------------------------------------
# 1. BACKUP
# ------------------------------------------------------------

$BackupPath = Join-Path $ProjectPath "backups\specialties-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item $SiteContentPath (Join-Path $BackupPath "siteContent.js") -Force
Copy-Item $CssPath (Join-Path $BackupPath "home.css") -Force

Write-Host "Backup created:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

# ------------------------------------------------------------
# 2. CREATE UTF-8 SAFE NODE PATCH
# ------------------------------------------------------------

New-Item -ItemType Directory -Force -Path $ToolsPath | Out-Null

$NodePatch = @'
import fs from "node:fs";
import path from "node:path";

const projectPath = String.raw`C:\projects\Laboratorio\client`;
const contentPath = path.join(projectPath, "src", "data", "siteContent.js");

let source = fs.readFileSync(contentPath, "utf8");

const spanishBlock = `    specialties: {
      title: "Especialidades",
      subtitle: "Amplia gama de estudios para el cuidado de tu salud",
      viewAll: "Ver todas las especialidades",
      items: [
        {
          id: "hematology",
          title: "Hematolog\u00eda",
          description:
            "Hemogramas, biometr\u00eda hem\u00e1tica, reticulocitos y estudios hematol\u00f3gicos.",
          icon: "droplets",
        },
        {
          id: "clinical-chemistry",
          title: "Qu\u00edmica Cl\u00ednica",
          description:
            "Glucosa, l\u00edpidos, funci\u00f3n renal, hep\u00e1tica, enzimas y perfiles metab\u00f3licos.",
          icon: "flask",
        },
        {
          id: "coagulation",
          title: "Coagulaci\u00f3n y Hemostasia",
          description:
            "TP, TTP, INR, fibrin\u00f3geno y estudios de coagulaci\u00f3n.",
          icon: "shield",
        },
        {
          id: "immunology",
          title: "Inmunolog\u00eda",
          description:
            "Anticuerpos, autoinmunidad, inmunoglobulinas y marcadores inmunol\u00f3gicos.",
          icon: "shield",
        },
        {
          id: "serology",
          title: "Serolog\u00eda",
          description:
            "Pruebas para detecci\u00f3n de anticuerpos y enfermedades infecciosas.",
          icon: "flask",
        },
        {
          id: "microbiology",
          title: "Microbiolog\u00eda y Bacteriolog\u00eda",
          description:
            "Cultivos, antibiogramas e identificaci\u00f3n de microorganismos.",
          icon: "microscope",
        },
        {
          id: "parasitology",
          title: "Parasitolog\u00eda",
          description:
            "Ex\u00e1menes coproparasitarios y detecci\u00f3n de par\u00e1sitos.",
          icon: "microscope",
        },
        {
          id: "urinalysis",
          title: "Uroan\u00e1lisis",
          description:
            "Examen general de orina, sedimento urinario y pruebas complementarias.",
          icon: "droplets",
        },
        {
          id: "endocrinology",
          title: "Hormonas y Endocrinolog\u00eda",
          description:
            "Tiroides, hormonas sexuales, cortisol, insulina y estudios endocrinos.",
          icon: "flask",
        },
        {
          id: "molecular-biology",
          title: "Biolog\u00eda Molecular",
          description:
            "PCR y otras t\u00e9cnicas moleculares para detecci\u00f3n de agentes infecciosos.",
          icon: "microscope",
        },
        {
          id: "tumor-markers",
          title: "Marcadores Tumorales",
          description:
            "PSA, CEA, CA 125, CA 19-9, AFP y otros marcadores.",
          icon: "shield",
        },
        {
          id: "allergy",
          title: "Alergolog\u00eda",
          description:
            "IgE total, IgE espec\u00edfica y estudios relacionados con alergias.",
          icon: "shield",
        },
        {
          id: "toxicology",
          title: "Toxicolog\u00eda",
          description:
            "Detecci\u00f3n y medici\u00f3n de sustancias, drogas y compuestos t\u00f3xicos.",
          icon: "flask",
        },
        {
          id: "fertility",
          title: "Fertilidad y Reproducci\u00f3n",
          description:
            "Hormonas reproductivas y pruebas relacionadas con fertilidad.",
          icon: "droplets",
        },
        {
          id: "immunohematology",
          title: "Inmunohematolog\u00eda",
          description:
            "Grupo sangu\u00edneo, factor Rh, Coombs y estudios inmunohematol\u00f3gicos.",
          icon: "droplets",
        },
        {
          id: "therapeutic-drug-monitoring",
          title: "Monitoreo de F\u00e1rmacos",
          description:
            "Determinaci\u00f3n de niveles de medicamentos cuando el estudio est\u00e9 disponible.",
          icon: "flask",
        },
      ],
    },`;

const englishBlock = `    specialties: {
      title: "Specialties",
      subtitle: "A broad range of laboratory studies for your health",
      viewAll: "View all specialties",
      items: [
        {
          id: "hematology",
          title: "Hematology",
          description:
            "Blood counts, reticulocytes and other hematological studies.",
          icon: "droplets",
        },
        {
          id: "clinical-chemistry",
          title: "Clinical Chemistry",
          description:
            "Glucose, lipids, kidney and liver function, enzymes and metabolic profiles.",
          icon: "flask",
        },
        {
          id: "coagulation",
          title: "Coagulation and Hemostasis",
          description:
            "PT, PTT, INR, fibrinogen and coagulation studies.",
          icon: "shield",
        },
        {
          id: "immunology",
          title: "Immunology",
          description:
            "Antibodies, autoimmunity, immunoglobulins and immune markers.",
          icon: "shield",
        },
        {
          id: "serology",
          title: "Serology",
          description:
            "Antibody testing and studies for infectious diseases.",
          icon: "flask",
        },
        {
          id: "microbiology",
          title: "Microbiology and Bacteriology",
          description:
            "Cultures, antimicrobial susceptibility and microorganism identification.",
          icon: "microscope",
        },
        {
          id: "parasitology",
          title: "Parasitology",
          description:
            "Stool studies and parasite detection.",
          icon: "microscope",
        },
        {
          id: "urinalysis",
          title: "Urinalysis",
          description:
            "Routine urinalysis, urine sediment and complementary studies.",
          icon: "droplets",
        },
        {
          id: "endocrinology",
          title: "Hormones and Endocrinology",
          description:
            "Thyroid, reproductive hormones, cortisol, insulin and endocrine studies.",
          icon: "flask",
        },
        {
          id: "molecular-biology",
          title: "Molecular Biology",
          description:
            "PCR and molecular techniques for infectious agent detection.",
          icon: "microscope",
        },
        {
          id: "tumor-markers",
          title: "Tumor Markers",
          description:
            "PSA, CEA, CA 125, CA 19-9, AFP and other markers.",
          icon: "shield",
        },
        {
          id: "allergy",
          title: "Allergy Testing",
          description:
            "Total IgE, specific IgE and allergy-related studies.",
          icon: "shield",
        },
        {
          id: "toxicology",
          title: "Toxicology",
          description:
            "Detection and measurement of drugs, substances and toxic compounds.",
          icon: "flask",
        },
        {
          id: "fertility",
          title: "Fertility and Reproduction",
          description:
            "Reproductive hormones and fertility-related testing.",
          icon: "droplets",
        },
        {
          id: "immunohematology",
          title: "Immunohematology",
          description:
            "Blood type, Rh factor, Coombs testing and related studies.",
          icon: "droplets",
        },
        {
          id: "therapeutic-drug-monitoring",
          title: "Therapeutic Drug Monitoring",
          description:
            "Measurement of medication levels when the study is available.",
          icon: "flask",
        },
      ],
    },`;

function replaceSpecialtiesBlock(text, languageKey, nextLanguageKey, replacement) {
  const languageMarker = `  ${languageKey}: {`;
  const languageStart = text.indexOf(languageMarker);

  if (languageStart === -1) {
    throw new Error(`Language section not found: ${languageKey}`);
  }

  let languageEnd = text.length;

  if (nextLanguageKey) {
    const nextMarker = `  ${nextLanguageKey}: {`;
    languageEnd = text.indexOf(nextMarker, languageStart + languageMarker.length);

    if (languageEnd === -1) {
      throw new Error(`Next language section not found: ${nextLanguageKey}`);
    }
  }

  const languageSection = text.slice(languageStart, languageEnd);

  const specialtiesStart = languageSection.indexOf("    specialties: {");
  const promotionsStart = languageSection.indexOf(
    "    promotions: {",
    specialtiesStart,
  );

  if (specialtiesStart === -1 || promotionsStart === -1) {
    throw new Error(`Specialties/promotions boundary not found in: ${languageKey}`);
  }

  const newLanguageSection =
    languageSection.slice(0, specialtiesStart) +
    replacement +
    "\n\n" +
    languageSection.slice(promotionsStart);

  return (
    text.slice(0, languageStart) +
    newLanguageSection +
    text.slice(languageEnd)
  );
}

// Replace English first, then Spanish.
source = replaceSpecialtiesBlock(source, "en", null, englishBlock);
source = replaceSpecialtiesBlock(source, "es", "en", spanishBlock);

fs.writeFileSync(contentPath, source, "utf8");

console.log("Specialties catalog updated successfully.");
'@

# Write the helper without BOM.
[System.IO.File]::WriteAllText(
    $NodePatchPath,
    $NodePatch,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "UTF-8 safe helper created." -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# 3. APPLY CONTENT PATCH
# ------------------------------------------------------------

& node $NodePatchPath

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "CONTENT PATCH FAILED" -ForegroundColor Red
    exit $LASTEXITCODE
}

# ------------------------------------------------------------
# 4. RESPONSIVE SPECIALTIES GRID
# ------------------------------------------------------------

$CssContent = [System.IO.File]::ReadAllText(
    $CssPath,
    [System.Text.Encoding]::UTF8
)

$CssMarker = "PATCH 03.0 - EXPANDED SPECIALTIES GRID"

if (-not $CssContent.Contains($CssMarker)) {
    $CssPatch = @'

/* ==========================================================================
   PATCH 03.0 - EXPANDED SPECIALTIES GRID
   ========================================================================== */

.specialties-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.specialty-card {
  min-height: 92px;
}

@media (max-width: 1100px) {
  .specialties-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .specialties-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .specialties-grid {
    grid-template-columns: 1fr;
  }
}

'@

    [System.IO.File]::AppendAllText(
        $CssPath,
        $CssPatch,
        (New-Object System.Text.UTF8Encoding($false))
    )

    Write-Host "Responsive specialties grid added." -ForegroundColor Green
}
else {
    Write-Host "Responsive specialties grid already exists." -ForegroundColor Yellow
}

# ------------------------------------------------------------
# 5. BUILD VALIDATION
# ------------------------------------------------------------

Set-Location $ProjectPath

Write-Host ""
Write-Host "Running production build..." -ForegroundColor Yellow
Write-Host ""

& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "Backup available at:" -ForegroundColor Yellow
    Write-Host $BackupPath
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " PATCH 03.0 COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Specialties added: 16" -ForegroundColor Cyan
Write-Host "Languages: Spanish + English" -ForegroundColor Cyan
Write-Host "Responsive: desktop + tablet + mobile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
