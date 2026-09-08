import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { carrito_actividad } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

// Espejo del carrito del navegador. CartContext hace POST acá (debounced) cada
// vez que cambia el carrito. Upsert por session_id: una fila por navegador.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.session_id !== "string" || !body.session_id) {
    return jsonCors({ ok: false });
  }

  const rawItems: unknown[] = Array.isArray(body.items) ? body.items : [];
  const items = rawItems.map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return {
      Id: o.Id ?? null,
      nombre: typeof o.nombre === "string" ? o.nombre : "Producto",
      cantidad: Number(o.cantidad) || 0,
      precio: Number(o.precio) || 0,
      tipo: typeof o.tipo === "string" ? o.tipo : "Bulto",
    };
  });
  const itemCount = items.reduce((n, it) => n + it.cantidad, 0);
  const total = items.reduce((s, it) => s + it.precio * it.cantidad, 0);

  const userId =
    typeof body.user_id === "string" && body.user_id ? body.user_id : null;
  const nombre = typeof body.nombre === "string" && body.nombre ? body.nombre : null;
  const telefono =
    typeof body.telefono === "string" && body.telefono ? body.telefono : null;
  const email = typeof body.email === "string" && body.email ? body.email : null;
  const now = new Date().toISOString();

  await db
    .insert(carrito_actividad)
    .values({
      session_id: body.session_id,
      user_id: userId,
      nombre,
      telefono,
      email,
      items,
      item_count: itemCount,
      total: String(total),
      convertido: false,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: carrito_actividad.session_id,
      set: {
        // No pisar la identidad conocida con nulls de una visita anónima.
        user_id: sql`coalesce(${userId}, ${carrito_actividad.user_id})`,
        nombre: sql`coalesce(${nombre}, ${carrito_actividad.nombre})`,
        telefono: sql`coalesce(${telefono}, ${carrito_actividad.telefono})`,
        email: sql`coalesce(${email}, ${carrito_actividad.email})`,
        items,
        item_count: itemCount,
        total: String(total),
        // Nueva actividad de carrito = nueva oportunidad de abandono.
        convertido: false,
        updated_at: now,
      },
    });

  return jsonCors({ ok: true });
}
