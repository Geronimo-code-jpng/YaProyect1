import { and, desc, eq, or, ilike, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { pedidos, perfiles } from "@/db/schema";
import { jsonCors } from "@/lib/cors";
import { promoEnvio } from "@/lib/promoEnvio";

// created_at lo pone la DB (defaultNow) — nunca el cliente: el reloj del
// dispositivo puede estar desfasado y el pedido aparecería fuera de orden en el
// panel.
//
// "estado" y "fuente" NO vienen del navegador: los fija el servidor. Antes los
// mandaba el cliente y cualquiera podía crear un pedido ya "pagado". Un pedido
// nuevo siempre arranca "pendiente" y de la fuente "web"; de ahí en adelante lo
// maneja el sistema del negocio, que lo lee desde esta base.
const CREATE_FIELDS = [
  "nombre_cliente",
  "telefono",
  "direccion",
  "metodo_pago",
  "carrito",
  "total",
  "recargo",
  "descuento_aplicado",
  "metodo",
  "horario",
  "notas",
  "user_id",
  "referencia",
] as const;

// Un punto en el mapa solo si son dos números de verdad (si no, sin punto)
function punto(body: { lat?: unknown; lon?: unknown }): { lat: number; lon: number } | null {
  const lat = Number(body?.lat);
  const lon = Number(body?.lon);
  if (body?.lat == null || body?.lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

export async function POST(request: Request) {
  const body = await request.json();

  const values: Record<string, unknown> = {};
  for (const field of CREATE_FIELDS) {
    if (field in body) values[field] = body[field];
  }

  values.estado = "pendiente";
  values.fuente = "web";
  const p = body.metodo === "envio" ? punto(body) : null;
  values.lat = p?.lat ?? null;
  values.lon = p?.lon ?? null;
  if (body.metodo !== "envio") values.referencia = null;

  // Envío gratis de la promo de sellos: se gasta SOLO, en el primer pedido con
  // envío que haga la cuenta cuando lo tiene (no se elige). El navegador ya
  // arma el total sin envío; el servidor controla que coincida con lo que
  // corresponde, en los dos sentidos, porque el total lo calculó el navegador.
  const promo = body.metodo === "envio" && body.user_id ? await promoEnvio(body.user_id) : null;
  const corresponde = !!(promo?.activa && promo.gratis);
  const pidio = body.envio_gratis === true;
  if (pidio !== corresponde) {
    return jsonCors({
      error: corresponde
        ? "Tenés el envío gratis disponible y no se aplicó. Recargá la página para que se descuente."
        : "El envío gratis ya no está disponible para este pedido. Recargá la página.",
    }, 409);
  }
  values.envio_gratis = corresponde;

  const [created] = await db.insert(pedidos).values(values as any).returning();

  // Las cuentas de Google nacen sin teléfono ni dirección: el primer pedido los
  // completa en el perfil. Solo llena los vacíos, nunca pisa lo que ya tiene.
  if (created.user_id) {
    const telefono = created.telefono?.trim() || null;
    // La primera dirección marcada en el mapa queda como la de la cuenta. Si la
    // cuenta ya tenía una, no se toca: un pedido a otro lugar (el trabajo, la
    // casa de un familiar) no cambia la de siempre. Se cambia desde el perfil.
    if (created.metodo === "envio" && created.lat != null && created.direccion?.trim()) {
      const sinPunto = sql`${perfiles.lat} IS NULL`;
      await db
        .update(perfiles)
        .set({
          telefono: sql`coalesce(nullif(${perfiles.telefono}, ''), ${telefono})`,
          direccion: sql`CASE WHEN ${sinPunto} THEN ${created.direccion.trim()}::text ELSE ${perfiles.direccion} END`,
          referencia: sql`CASE WHEN ${sinPunto} THEN ${created.referencia?.trim() || null}::text ELSE ${perfiles.referencia} END`,
          lat: sql`CASE WHEN ${sinPunto} THEN ${created.lat}::double precision ELSE ${perfiles.lat} END`,
          lon: sql`CASE WHEN ${sinPunto} THEN ${created.lon}::double precision ELSE ${perfiles.lon} END`,
        })
        .where(eq(perfiles.id, created.user_id));
      return jsonCors(created);
    }
    const direccion =
      created.metodo === "envio" ? created.direccion?.trim() || null : null;
    await db
      .update(perfiles)
      .set({
        telefono: sql`coalesce(nullif(${perfiles.telefono}, ''), ${telefono})`,
        direccion: sql`coalesce(nullif(${perfiles.direccion}, ''), ${direccion})`,
      })
      .where(eq(perfiles.id, created.user_id));
  }

  return jsonCors(created);
}

// La tienda solo muestra los pedidos que se hicieron en la tienda (fuente "web").
// Los que nacen en el sistema del negocio (mostrador, facturas) no se ven acá.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  const nombre = url.searchParams.get("nombre");
  const telefono = url.searchParams.get("telefono");

  let rows;
  if (userId) {
    rows = await db
      .select()
      .from(pedidos)
      .where(and(eq(pedidos.fuente, "web"), eq(pedidos.user_id, userId)))
      .orderBy(desc(pedidos.created_at));
  } else if (nombre || telefono) {
    const conditions = [];
    if (nombre) conditions.push(ilike(pedidos.nombre_cliente, `%${nombre}%`));
    if (telefono) conditions.push(eq(pedidos.telefono, telefono));
    rows = await db
      .select()
      .from(pedidos)
      .where(and(eq(pedidos.fuente, "web"), or(...conditions)))
      .orderBy(desc(pedidos.created_at));
  } else {
    return jsonCors([]);
  }

  return jsonCors(rows);
}
