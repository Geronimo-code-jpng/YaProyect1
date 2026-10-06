import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCorsCached } from "@/lib/cors";

export async function GET() {
  // Solo lo que el sistema del negocio dejó a la vista: un producto dado de
  // baja o de un rubro que no va a la tienda queda con publicado = false (no se
  // borra, para que conserve su foto y sus tildes). Uno sin stock SÍ se ve,
  // con el cartel de "SIN STOCK".
  const rows = await db.select().from(productos).where(eq(productos.publicado, true));
  // Catálogo completo: caché corto en el CDN (ver lib/cors.ts) porque trae el stock.
  return jsonCorsCached(rows);
}
