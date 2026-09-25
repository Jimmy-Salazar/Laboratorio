const exactTranslations = new Map([
  ["hemograma completo", "Complete blood count"],
  ["hemograma", "Blood count"],
  ["quimica sanguinea", "Blood chemistry"],
  ["perfil lipidico", "Lipid profile"],
  ["perfil tiroideo", "Thyroid profile"],
  ["perfil renal", "Renal profile"],
  ["perfil hepatico", "Liver profile"],
  ["perfil hormonal", "Hormone profile"],
  ["glucosa en ayunas", "Fasting glucose"],
  ["glucosa", "Glucose"],
  ["hemoglobina glicosilada", "Glycated hemoglobin"],
  ["hemoglobina glucosilada", "Glycated hemoglobin"],
  ["examen de orina", "Urinalysis"],
  ["uroanalisis", "Urinalysis"],
  ["urocultivo", "Urine culture"],
  ["cultivo de orina", "Urine culture"],
  ["cultivo de sangre", "Blood culture"],
  ["hemocultivo", "Blood culture"],
  ["coproparasitario", "Stool ova and parasite test"],
  ["examen de heces", "Stool examination"],
  ["prueba de embarazo", "Pregnancy test"],
  ["tiempo de protrombina", "Prothrombin time"],
  ["tiempo de tromboplastina", "Partial thromboplastin time"],
  ["acido urico", "Uric acid"],
  ["creatinina", "Creatinine"],
  ["urea", "Urea"],
  ["colesterol total", "Total cholesterol"],
  ["colesterol hdl", "HDL cholesterol"],
  ["colesterol ldl", "LDL cholesterol"],
  ["trigliceridos", "Triglycerides"],
  ["bilirrubina total", "Total bilirubin"],
  ["bilirrubina directa", "Direct bilirubin"],
  ["bilirrubina indirecta", "Indirect bilirubin"],
  ["proteinas totales", "Total proteins"],
  ["proteina c reactiva", "C-reactive protein"],
  ["factor reumatoideo", "Rheumatoid factor"],
  ["ferritina", "Ferritin"],
  ["hierro serico", "Serum iron"],
  ["vitamina d", "Vitamin D"],
  ["vitamina b12", "Vitamin B12"],
  ["acido folico", "Folic acid"],
  ["sodio", "Sodium"],
  ["potasio", "Potassium"],
  ["cloro", "Chloride"],
  ["calcio", "Calcium"],
  ["magnesio", "Magnesium"],
  ["fosforo", "Phosphorus"],
  ["insulina", "Insulin"],
  ["cortisol", "Cortisol"],
  ["prolactina", "Prolactin"],
  ["progesterona", "Progesterone"],
  ["testosterona", "Testosterone"],
  ["estradiol", "Estradiol"],
  ["hormona estimulante de tiroides", "Thyroid-stimulating hormone"],
  ["antigeno prostatico especifico", "Prostate-specific antigen"],
  ["vih", "HIV"],
  ["hepatitis b", "Hepatitis B"],
  ["hepatitis c", "Hepatitis C"],
]);

const wordTranslations = new Map([
  ["acido", "acid"],
  ["anticuerpo", "antibody"],
  ["anticuerpos", "antibodies"],
  ["antigeno", "antigen"],
  ["ayunas", "fasting"],
  ["completo", "complete"],
  ["completa", "complete"],
  ["cultivo", "culture"],
  ["directa", "direct"],
  ["directo", "direct"],
  ["examen", "test"],
  ["heces", "stool"],
  ["hepatico", "liver"],
  ["hepatica", "liver"],
  ["indirecta", "indirect"],
  ["indirecto", "indirect"],
  ["orina", "urine"],
  ["perfil", "profile"],
  ["proteina", "protein"],
  ["proteinas", "proteins"],
  ["renal", "renal"],
  ["sangre", "blood"],
  ["serico", "serum"],
  ["serica", "serum"],
  ["tiroideo", "thyroid"],
  ["tiroidea", "thyroid"],
  ["total", "total"],
  ["totales", "total"],
]);

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function sentenceCase(value) {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toLocaleUpperCase("en") +
    value.slice(1)
  );
}

export function translateStudyNameToEnglish(nameEs) {
  const original = String(nameEs ?? "").trim();

  if (!original) {
    return "";
  }

  const normalized = normalizeText(original);

  const exact = exactTranslations.get(normalized);

  if (exact) {
    return exact;
  }

  const words = normalized.split(" ");

  let translatedCount = 0;

  const translated = words.map((word) => {
    if (
      word === "de" ||
      word === "del" ||
      word === "la" ||
      word === "el" ||
      word === "y" ||
      word === "en"
    ) {
      return null;
    }

    const replacement =
      wordTranslations.get(word);

    if (replacement) {
      translatedCount += 1;
      return replacement;
    }

    return word;
  });

  const compact = translated
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  /*
   * If the glossary recognized nothing, preserving the source name is safer
   * than inventing a clinical translation.
   * It can later be upgraded to an AI/server translator without changing DB.
   */
  if (translatedCount === 0) {
    return original;
  }

  return sentenceCase(compact);
}