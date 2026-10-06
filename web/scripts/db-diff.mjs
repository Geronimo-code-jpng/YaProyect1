// Prueba en seco del esquema: muestra qué SQL generaría drizzle para llevar la
// base real a lo que dice db/schema.ts, SIN tocar la base (solo la lee).
//
//   pnpm db:diff                              # contra DATABASE_URL del .env
//   DRIZZLE_URL=postgresql://… pnpm db:diff   # contra una rama de prueba de Neon
//
// Qué mirar en el resultado: tiene que haber SOLO ADD COLUMN, CREATE TABLE y
// CREATE INDEX nuevos. Si aparece un DROP o un ALTER … TYPE que no se buscaba,
// hay que corregir schema.ts y repetir.
//
// Un detalle de drizzle-kit 0.31: al leer la base ("pull") anota mal las clases
// de operador de los índices (por ejemplo, int8_ops en una columna de texto), y
// por eso toda comparación contra schema.ts muestra un DROP INDEX + CREATE INDEX
// de índices que ya existen y son idénticos. Acá se descartan esas anotaciones
// antes de comparar, para que el resultado muestre solo diferencias reales.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const SALIDA = ".tmp-drizzle";
const env = { ...process.env, DRIZZLE_OUT: SALIDA };
const drizzle = (...args) =>
  execFileSync("npx", ["drizzle-kit", ...args], { env, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

rmSync(SALIDA, { recursive: true, force: true });
try {
  console.log("1/3  Leyendo la base (solo lectura)…");
  drizzle("pull");

  console.log("2/3  Descartando las clases de operador mal anotadas…");
  const foto = join(SALIDA, "meta", "0000_snapshot.json");
  const snapshot = JSON.parse(readFileSync(foto, "utf8"));
  for (const tabla of Object.values(snapshot.tables)) {
    for (const indice of Object.values(tabla.indexes ?? {})) {
      for (const columna of indice.columns) delete columna.opclass;
    }
  }
  writeFileSync(foto, JSON.stringify(snapshot, null, 2));

  console.log("3/3  Comparando contra db/schema.ts…\n");
  drizzle("generate", "--name=diff");
  const archivo = readdirSync(SALIDA).find((f) => f.endsWith("_diff.sql"));
  if (!archivo) {
    console.log("No hay diferencias: la base ya coincide con schema.ts.");
  } else {
    const sql = readFileSync(join(SALIDA, archivo), "utf8");
    console.log(sql);
    const peligrosas = sql.split("\n").filter((l) => /\b(DROP|ALTER TABLE .* ALTER COLUMN .* TYPE|TRUNCATE)\b/i.test(l));
    if (peligrosas.length) {
      console.log("\n⚠ HAY CAMBIOS QUE BORRAN O CAMBIAN TIPOS. No empujar sin entender por qué:\n  " + peligrosas.join("\n  "));
      process.exitCode = 1;
    } else {
      console.log("\n✓ Solo agrega: es seguro empujar (drizzle-kit push).");
    }
  }
} finally {
  if (existsSync(SALIDA)) rmSync(SALIDA, { recursive: true, force: true });
}
