import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { pedidos } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

// Reemplaza dos limpiezas que antes corrían como updates masivos directos a
// Supabase: pedidos "pendiente" de web sin configurar en 10 min -> cancelado,
// y pedidos "configurado" cuyo expira_en ya pasó -> vencido.
export async function POST() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  await db
    .update(pedidos)
    .set({ estado: "cancelado", horario: "Pedido vencido por timeout de 10 minutos" })
    .where(
      and(
        eq(pedidos.estado, "pendiente"),
        eq(pedidos.fuente, "web"),
        lt(pedidos.created_at, tenMinutesAgo),
      ),
    );

  await db
    .update(pedidos)
    .set({ estado: "vencido" })
    .where(and(eq(pedidos.estado, "configurado"), lt(pedidos.expira_en, sql`now()`)));

  return jsonCors({ success: true });
}
