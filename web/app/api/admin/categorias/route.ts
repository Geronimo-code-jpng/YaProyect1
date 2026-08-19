import { db } from "@/db/client";
import { categorias } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function POST(request: Request) {
  const { categoria } = await request.json();
  if (!categoria || !categoria.trim()) {
    return jsonCors({ success: false, error: "Ingresá un nombre para la categoría" });
  }

  const [created] = await db.insert(categorias).values({ categoria: categoria.trim() }).returning();
  return jsonCors({ success: true, categoria: created });
}
