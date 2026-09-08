import { isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCorsCached } from "@/lib/cors";

// Equivalente a la RPC de Supabase obtener_ofertas_aleatorias().
export async function GET() {
  const rows = await db
    .select()
    .from(productos)
    .where(isNotNull(productos.Oferta))
    .orderBy(sql`random()`)
    .limit(4);
  // Cache corto: rota cada ~2 min pero absorbe las ráfagas de la home.
  return jsonCorsCached(rows, 120, 300);
}
