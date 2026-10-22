// El sistema del negocio tiene dos sub-rubros "bolsa": ALIMENTOS (arroz, azúcar,
// fideos, harina…) y AGUAS Y GASEOSAS. Solo en la tienda se abren por palabras
// del nombre, sin tocar el sistema. Donde ya hay un sub-rubro del sistema que
// sirve (CONDIMENTOS, FIAMBRES Y LACTEOS) se usa ese; lo que no coincide con
// nada se queda con el nombre del sistema.
//
// El orden importa: gana la primera regla que coincide.
const REGLAS: Record<string, [RegExp, string][]> = {
  ALIMENTOS: [
    [/\bARROZ\b/, "ARROZ"],
    [/\bAZUCAR\b/, "AZUCAR"],
    [/\b(FIDEOS?|FORATTI|MOÑOS)\b/, "FIDEOS"],
    [/HARINA/, "HARINAS"],
    [/\bHUEVOS?\b/, "HUEVOS"],
    [/\bTOMATES?\b/, "TOMATES"],
    [/\bSAL\b/, "CONDIMENTOS"],
    [/\bLECHE\b/, "FIAMBRES Y LACTEOS"],
  ],
  "AGUAS Y GASEOSAS": [
    // "AGUA FRESH" es la saborizada: por eso va antes que AGUAS
    [/\b(JUGOS?|TANG|CEPITA|BRIO|SABORIZADAS?|LEVITE|AQUARIUS|FRESH)\b/, "JUGOS Y SABORIZADAS"],
    [/\b(AGUA|SODA|BIDON|ECO ANDES|SALDAN)\b/, "AGUAS"],
    [/./, "GASEOSAS"],
  ],
};

export function subrubroWeb(subcategoria: string | null, nombre: string | null): string | null {
  const reglas = subcategoria ? REGLAS[subcategoria] : undefined;
  if (!reglas) return subcategoria;
  const n = (nombre || "").toUpperCase();
  return reglas.find(([re]) => re.test(n))?.[1] ?? subcategoria;
}
