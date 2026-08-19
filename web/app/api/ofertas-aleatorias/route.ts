import { isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

// Equivalente a la RPC de Supabase obtener_ofertas_aleatorias().
export async function GET() {
  const rows = await db
    .select()
    .from(productos)
    .where(isNotNull(productos.Oferta))
    .orderBy(sql`random()`)
    .limit(4);
  return jsonCors(rows);
}
