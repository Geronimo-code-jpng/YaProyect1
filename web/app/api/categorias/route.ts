import { db } from "@/db/client";
import { categorias } from "@/db/schema";
import { jsonCorsCached } from "@/lib/cors";

export async function GET() {
  const rows = await db.select().from(categorias);
  return jsonCorsCached(rows);
}
