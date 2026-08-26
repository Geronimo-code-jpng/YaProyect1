import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { pedidos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

// Pedidos "configurado" cuyo expira_en ya pasó -> vencido. El auto-cancelado
// de pedidos "pendiente" por timeout se eliminó a pedido del negocio.
export async function POST() {
  await db
    .update(pedidos)
    .set({ estado: "vencido" })
    .where(and(eq(pedidos.estado, "configurado"), lt(pedidos.expira_en, sql`now()`)));

  return jsonCors({ success: true });
}
