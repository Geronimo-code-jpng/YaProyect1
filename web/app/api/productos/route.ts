import { db } from "@/db/client";
import { productos } from "@/db/schema";
import { jsonCorsCached } from "@/lib/cors";

export async function GET() {
  const rows = await db.select().from(productos);
  // Catálogo completo: cacheado en el CDN 5 min (+10 min stale-while-revalidate).
  return jsonCorsCached(rows);
}
