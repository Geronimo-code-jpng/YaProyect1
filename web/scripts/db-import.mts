/**
 * Carga en una base NUEVA y VACÍA el archivo que arma scripts/db-export.mts.
 *
 * Uso (desde web/):
 *   DESTINO_URL=postgresql://… pnpm db:import .respaldos/<archivo>.sql
 *
 * El archivo trae su propia transacción y su control de filas: si algo falla, la
 * base destino queda como estaba. Se frena si la base destino ya tiene tablas o
 * si es la misma que DATABASE_URL (para no pisar nunca la base en uso).
 *
 * Usa el driver de Neon, así que el destino tiene que ser una base de Neon. Para
 * cualquier otro Postgres: psql "$DESTINO_URL" -v ON_ERROR_STOP=1 -f <archivo>.sql
 */
import { existsSync, readFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";

const archivo = process.argv[2];
const destino = process.env.DESTINO_URL;
if (!archivo || !destino || !existsSync(archivo)) {
  console.error("Uso: DESTINO_URL=postgresql://… pnpm db:import .respaldos/<archivo>.sql");
  process.exit(1);
}

if (!process.env.DATABASE_URL && existsSync(".env")) process.loadEnvFile(".env");
// Neon da dos hosts para la misma base (con y sin "-pooler"): se comparan sin eso
const base = (url: string) => {
  const u = new URL(url);
  return u.hostname.replace("-pooler", "") + u.pathname;
};
if (process.env.DATABASE_URL && base(process.env.DATABASE_URL) === base(destino)) {
  console.error("DESTINO_URL es la misma base que DATABASE_URL (la que está en uso). Se cancela.");
  process.exit(1);
}

const pool = new Pool({ connectionString: destino });
try {
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public'`);
  if (rows[0].n > 0) {
    console.error(`La base destino ya tiene ${rows[0].n} tablas. Tiene que estar vacía. Se cancela.`);
    process.exitCode = 1;
  } else {
    console.log(`Cargando ${archivo}…`);
    await pool.query(readFileSync(archivo, "utf8"));
    const conteo = await pool.query(`
      SELECT table_name AS tabla,
             (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) AS n FROM %I', table_name), false, true, '')))[1]::text::int AS filas
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY 1`);
    console.table(conteo.rows);
    console.log("\n✓ Listo. Falta: db/sistema_local.sql (si se usa el sistema) y cambiar DATABASE_URL en Vercel y en el .env.");
  }
} finally {
  await pool.end();
}
