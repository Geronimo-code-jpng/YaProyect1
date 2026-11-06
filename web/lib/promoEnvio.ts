import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { configuracion, pedidos } from "@/db/schema";

// Promo de sellos: cada pedido con envío COBRADO (hecho entre las fechas de la
// promo) suma un sello. Con 5 sellos, el próximo pedido con envío va gratis y
// la tarjeta vuelve a 0. El pedido gratis no suma sello.
//
// No se guarda un contador: se cuenta cada vez desde los pedidos. Así, si el
// pedido gratis se rechaza o se cancela, el envío gratis vuelve solo, y un
// pedido suma recién cuando el sistema del negocio lo marca cobrado ("pagado").
export const SELLOS_META = 5;
const ZONA = "America/Argentina/Buenos_Aires";

export type PromoEnvio =
  | { activa: false }
  | { activa: true; desde: string; hasta: string; sellos: number; meta: number; gratis: boolean };

export async function promoEnvio(userId: string | null | undefined): Promise<PromoEnvio> {
  const [cfg] = await db
    .select({
      desde: configuracion.promo_envio_desde,
      hasta: configuracion.promo_envio_hasta,
      vigente: sql<boolean>`(now() AT TIME ZONE ${ZONA})::date BETWEEN ${configuracion.promo_envio_desde} AND ${configuracion.promo_envio_hasta}`,
    })
    .from(configuracion)
    .where(eq(configuracion.id, 1));
  if (!cfg?.desde || !cfg?.hasta || !cfg.vigente) return { activa: false };

  let cobrados = 0;
  let usados = 0;
  if (userId) {
    const [r] = await db
      .select({
        cobrados: sql<number>`count(*) FILTER (WHERE ${pedidos.estado} = 'pagado' AND NOT ${pedidos.envio_gratis})`.mapWith(Number),
        usados: sql<number>`count(*) FILTER (WHERE ${pedidos.envio_gratis} AND ${pedidos.estado} NOT IN ('rechazado','cancelado','vencido'))`.mapWith(Number),
      })
      .from(pedidos)
      .where(
        and(
          eq(pedidos.user_id, userId),
          eq(pedidos.fuente, "web"),
          eq(pedidos.metodo, "envio"),
          sql`${pedidos.created_at} >= (${cfg.desde}::date)::timestamp AT TIME ZONE ${ZONA}`,
          sql`${pedidos.created_at} < (${cfg.hasta}::date + 1)::timestamp AT TIME ZONE ${ZONA}`,
        ),
      );
    cobrados = r?.cobrados ?? 0;
    usados = r?.usados ?? 0;
  }

  const avance = Math.max(0, cobrados - SELLOS_META * usados);
  return {
    activa: true,
    desde: cfg.desde,
    hasta: cfg.hasta,
    sellos: Math.min(avance, SELLOS_META),
    meta: SELLOS_META,
    gratis: avance >= SELLOS_META,
  };
}
