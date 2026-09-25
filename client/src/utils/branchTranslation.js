/*
 * TRADUCCION AUTOMATICA DE SUCURSALES
 * ---------------------------------------------------------------------------
 * Se ejecuta solamente al crear una sucursal o cuando cambia el texto ES.
 *
 * Los nombres propios se conservan.
 * Las palabras administrativas y de direccion mas comunes se traducen.
 * Esto evita depender de una API externa para cada carga de pantalla.
 */

function normalize(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

const exactBranchNames = new Map([
  ["matriz", "Main Office"],
  ["casa matriz", "Main Office"],
  ["matriz centro", "Main Office - Center"],
  ["sucursal centro", "Central Branch"],
  ["sucursal norte", "North Branch"],
  ["sucursal sur", "South Branch"],
  ["sucursal este", "East Branch"],
  ["sucursal oeste", "West Branch"],
]);

const nameWords = new Map([
  ["sucursal", "Branch"],
  ["matriz", "Main Office"],
  ["centro", "Center"],
  ["central", "Central"],
  ["norte", "North"],
  ["sur", "South"],
  ["este", "East"],
  ["oeste", "West"],
  ["laboratorio", "Laboratory"],
  ["clinico", "Clinical"],
  ["clinica", "Clinical"],
]);

const addressWords = new Map([
  ["avenida", "Avenue"],
  ["av", "Ave"],
  ["calle", "Street"],
  ["carretera", "Road"],
  ["via", "Road"],
  ["sector", "Sector"],
  ["norte", "North"],
  ["sur", "South"],
  ["este", "East"],
  ["oeste", "West"],
  ["diagonal", "Diagonal"],
  ["edificio", "Building"],
  ["local", "Suite"],
  ["piso", "Floor"],
  ["esquina", "Corner"],
]);

function translateTokens(value, dictionary) {
  return String(value ?? "")
    .split(/(\s+|[,.;:/()#-])/)
    .map((token) => {
      const key = normalize(
        token.replace(/\.$/, ""),
      );

      if (!key) {
        return token;
      }

      const translated =
        dictionary.get(key);

      if (!translated) {
        return token;
      }

      return token.endsWith(".")
        ? `${translated}.`
        : translated;
    })
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function translateBranchNameToEnglish(
  value,
) {
  const cleanValue =
    String(value ?? "").trim();

  if (!cleanValue) {
    return "";
  }

  const key =
    normalize(cleanValue);

  if (exactBranchNames.has(key)) {
    return exactBranchNames.get(key);
  }

  if (
    key.startsWith("sucursal ")
  ) {
    const suffix =
      cleanValue
        .replace(
          /^\s*sucursal\s+/i,
          "",
        )
        .trim();

    const suffixKey =
      normalize(suffix);

    const directional =
      new Map([
        ["norte", "North Branch"],
        ["sur", "South Branch"],
        ["este", "East Branch"],
        ["oeste", "West Branch"],
        ["centro", "Central Branch"],
      ]);

    if (
      directional.has(suffixKey)
    ) {
      return directional.get(
        suffixKey,
      );
    }

    return `Branch ${suffix}`;
  }

  return translateTokens(
    cleanValue,
    nameWords,
  );
}

export function translateBranchAddressToEnglish(
  value,
) {
  const cleanValue =
    String(value ?? "").trim();

  if (!cleanValue) {
    return "To be defined";
  }

  if (
    normalize(cleanValue) ===
    "por definir"
  ) {
    return "To be defined";
  }

  /*
   * Las direcciones oficiales contienen nombres propios.
   * Solo traducimos palabras estructurales; los nombres de calles,
   * ciudadelas, urbanizaciones y referencias se preservan.
   */
  return translateTokens(
    cleanValue,
    addressWords,
  );
}