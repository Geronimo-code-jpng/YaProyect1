import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { carrito_actividad } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

// Se llama al confirmar un pedido: marca la sesión como convertida para que su
// carrito no cuente como abandonado en la analítica del admin.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.session_id !== "string" || !body.session_id) {
    return jsonCors({ ok: false });
  }

  await db
    .update(carrito_actividad)
    .set({ convertido: true, updated_at: new Date().toISOString() })
    .where(eq(carrito_actividad.session_id, body.session_id));

  return jsonCors({ ok: true });
}
