/**
 * Copia COMPLETA de la base, para empezar de cero en otra: arma UN archivo .sql
 * con el esquema (el de db/schema.ts), las funciones, TODOS los datos y los
 * contadores de ids. Solo lee la base de origen; no la modifica.
 *
 * Uso (desde web/):
 *   pnpm db:export                              # origen: DATABASE_URL (del entorno o de .env)
 *   ORIGEN_URL=postgresql://… pnpm db:export    # otra base de origen
 *
 * Deja el archivo en .respaldos/ (ignorado por git: tiene datos de clientes y
 * contraseñas hasheadas). Para cargarlo en la base nueva, que tiene que estar vacía:
 *   DESTINO_URL=postgresql://… pnpm db:import .respaldos/<archivo>.sql
 * o con psql:
 *   psql "$DESTINO_URL" -v ON_ERROR_STOP=1 -f .respaldos/<archivo>.sql
 *
 * Antes de escribir nada compara la base real con schema.ts: si la base tiene una
 * tabla o columna que schema.ts no conoce, se frena (esos datos se perderían).
 * Todo se lee dentro de una misma transacción, así que la copia es una foto
 * coherente aunque el sistema del negocio esté escribiendo mientras tanto.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";
import { is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import * as schema from "../db/schema";

export type Consultar = (texto: string) => Promise<Record<string, unknown>[]>;

const id = (nombre: string) => `"${nombre.replaceAll('"', '""')}"`;
const literal = (texto: string) => `'${texto.replaceAll("'", "''")}'`;

export async function generarVolcado(consultar: Consultar) {
  const tablas = Object.values(schema)
    .filter((t): t is PgTable => is(t, PgTable))
    .map((t) => getTableConfig(t));

  // 1. La base real contra schema.ts
  const columnasReales = new Map<string, string[]>();
  for (const { tabla, columna } of await consultar(`
    SELECT c.table_name AS tabla, c.column_name AS columna
    FROM information_schema.columns c
    JOIN information_schema.tables t USING (table_schema, table_name)
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name, c.ordinal_position`)) {
    const lista = columnasReales.get(tabla as string) ?? [];
    lista.push(columna as string);
    columnasReales.set(tabla as string, lista);
  }

  const faltanEnSchema: string[] = [];
  for (const [tabla, columnas] of columnasReales) {
    const t = tablas.find((x) => x.name === tabla);
    if (!t) faltanEnSchema.push(`tabla ${tabla}`);
    else for (const c of columnas) if (!t.columns.some((x) => x.name === c)) faltanEnSchema.push(`columna ${tabla}.${c}`);
  }
  if (faltanEnSchema.length) {
    throw new Error(
      "La base tiene cosas que schema.ts no conoce; la copia las perdería. Agregarlas a schema.ts y repetir:\n  " +
        faltanEnSchema.join("\n  "),
    );
  }

  const avisos: string[] = [];
  for (const t of tablas) {
    const reales = columnasReales.get(t.name);
    if (!reales) avisos.push(`la tabla ${t.name} no existe en la base: se crea vacía`);
    else for (const c of t.columns) if (!reales.includes(c.name)) avisos.push(`${t.name}.${c.name} no existe en la base: queda con su valor por defecto`);
  }
  for (const { que } of await consultar(`
    SELECT 'vista ' || viewname AS que FROM pg_views WHERE schemaname = 'public'
    UNION ALL SELECT 'vista materializada ' || matviewname FROM pg_matviews WHERE schemaname = 'public'
    UNION ALL SELECT 'trigger ' || tg.tgname || ' en ' || tg.tgrelid::regclass
      FROM pg_trigger tg JOIN pg_class c ON c.oid = tg.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE NOT tg.tgisinternal AND n.nspname = 'public'
    UNION ALL SELECT 'esquema ' || nspname FROM pg_namespace
      WHERE nspname NOT IN ('public', 'information_schema') AND nspname NOT LIKE 'pg\\_%'`)) {
    avisos.push(`${que}: NO se copia`);
  }

  // 2. El archivo
  const salida: string[] = [
    `-- Copia completa de la base, generada por scripts/db-export.mts el ${new Date().toISOString()}.`,
    "-- Se carga en una base VACÍA. Todo va en una transacción: si algo falla, no queda nada a medias.",
    "",
    "BEGIN;",
    "SET client_encoding = 'UTF8';",
    "SET standard_conforming_strings = on;",
    "SET check_function_bodies = false;",
    "",
    "-- Extensiones",
  ];
  for (const { extname } of await consultar(`SELECT extname FROM pg_extension WHERE extname <> 'plpgsql' ORDER BY 1`)) {
    salida.push(`CREATE EXTENSION IF NOT EXISTS ${id(extname as string)};`);
  }

  salida.push("", "-- Esquema (db/schema.ts)");
  salida.push(...(await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema))));

  salida.push("", "-- Funciones");
  for (const { definicion } of await consultar(`
    SELECT pg_get_functiondef(p.oid) AS definicion
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
    ORDER BY p.proname`)) {
    salida.push(`${(definicion as string).trim()};`, "");
  }

  const filas: Record<string, number> = {};
  for (const t of tablas) {
    const columnas = columnasReales.get(t.name);
    if (!columnas) continue;
    const pk = t.columns.filter((c) => c.primary).map((c) => id(c.name));
    const valores = columnas.map((c) => `quote_nullable(${id(c)})`).join(" || ', ' || ");
    const insert = `INSERT INTO ${id(t.name)} (${columnas.map(id).join(", ")}) VALUES (`;
    const lineas = await consultar(
      `SELECT ${literal(insert)} || ${valores} || ');' AS linea FROM ${id(t.name)} ORDER BY ${(pk.length ? pk : columnas.map(id)).join(", ")}`,
    );
    filas[t.name] = lineas.length;
    salida.push("", `-- ${t.name}: ${lineas.length} filas`, ...lineas.map((l) => l.linea as string));

    // Los ids autonuméricos siguen desde donde iban en la base vieja, no desde el
    // máximo que quedó: el id de un pedido borrado no se vuelve a usar (el sistema
    // del negocio identifica los pedidos por id).
    for (const c of t.columns.filter((c) => c.generatedIdentity)) {
      const secuencia = `pg_get_serial_sequence(${literal(id(t.name))}, ${literal(c.name)})`;
      const [{ ultimo }] = await consultar(
        `SELECT GREATEST(pg_sequence_last_value(${secuencia}::regclass), (SELECT max(${id(c.name)}) FROM ${id(t.name)}), 0)::text AS ultimo`,
      );
      salida.push(`SELECT setval(${secuencia}, ${ultimo} + 1, false);`);
    }
  }

  // 3. Control: si no entró exactamente lo que se copió, se deshace todo
  salida.push("", "-- Control de filas", "DO $$", "BEGIN");
  for (const [tabla, n] of Object.entries(filas)) {
    salida.push(
      `  IF (SELECT count(*) FROM ${id(tabla)}) <> ${n} THEN RAISE EXCEPTION ${literal(`${tabla}: se esperaban ${n} filas`)}; END IF;`,
    );
  }
  salida.push(
    "END $$;",
    "",
    "COMMIT;",
    "",
    "-- Después de cargar:",
    "--   1. Si se usa el sistema del negocio, correr db/sistema_local.sql en la base nueva (los roles no viajan).",
    "--   2. Cambiar DATABASE_URL en Vercel (y en el .env local) por la de la base nueva.",
    "",
  );

  return { sql: salida.join("\n"), filas, avisos };
}

if (import.meta.main) {
  if (!process.env.ORIGEN_URL && !process.env.DATABASE_URL && existsSync(".env")) process.loadEnvFile(".env");
  const origen = process.env.ORIGEN_URL || process.env.DATABASE_URL;
  if (!origen) {
    console.error("Falta la base de origen: ORIGEN_URL=postgresql://… pnpm db:export");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: origen });
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await cliente.query("SET LOCAL datestyle = 'ISO, YMD'; SET LOCAL timezone = 'UTC'");
    const { sql, filas, avisos } = await generarVolcado(async (texto) => (await cliente.query(texto)).rows);
    await cliente.query("COMMIT");

    mkdirSync(".respaldos", { recursive: true });
    const archivo = `.respaldos/base-${new Date().toISOString().slice(0, 16).replace(":", "-")}.sql`;
    writeFileSync(archivo, sql, { mode: 0o600 });

    console.table(filas);
    for (const aviso of avisos) console.warn(`⚠ ${aviso}`);
    console.log(`\n✓ ${archivo}\n  Cargar en la base nueva: DESTINO_URL=postgresql://… pnpm db:import ${archivo}`);
  } finally {
    cliente.release();
    await pool.end();
  }
}
