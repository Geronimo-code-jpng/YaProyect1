import { Resend } from "resend";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { perfiles, pedidos, carrito_actividad } from "@/db/schema";
import { jsonCors } from "@/lib/cors";
import { abandonedCartEmail } from "@/lib/emailTemplates";

const FROM = "Ya Mayorista <no-reply@yamayorista.online>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yamayorista.online";

/**
 * Recordatorio de carrito abandonado. Lo dispara el admin desde la pestaña
 * Clientes → Carritos abandonados, una fila a la vez.
 * Body: { session_id: string }
 *
 * El servidor relee la fila de carrito_actividad para sacar email, ítems y total
 * frescos (no confía en lo que manda el cliente). Solo suma la caja del descuento
 * si la cuenta todavía no tiene ningún pedido pagado.
 */
export async function POST(request: Request) {
  let body: { session_id?: string };
  try {
    body = await request.json();
  } catch {
    return jsonCors({ success: false, error: "Body inválido" });
  }

  const sessionId = (body.session_id || "").trim();
  if (!sessionId) {
    return jsonCors({ success: false, error: "Falta session_id" });
  }

  const [row] = await db
    .select()
    .from(carrito_actividad)
    .where(eq(carrito_actividad.session_id, sessionId));
  if (!row) {
    return jsonCors({ success: false, error: "No se encontró ese carrito" });
  }

  // Email: preferimos el de la cuenta linkeada, si no el guardado en la fila.
  let email = (row.email || "").trim().toLowerCase();
  let nombre = row.nombre || "";
  if (row.user_id) {
    const [profile] = await db
      .select()
      .from(perfiles)
      .where(eq(perfiles.id, row.user_id));
    if (profile?.email) email = profile.email.trim().toLowerCase();
    if (profile?.nombre) nombre = profile.nombre;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonCors({
      success: false,
      error: "Este carrito no tiene un email asociado",
    });
  }

  // ¿Primera compra? Solo entonces mostramos el descuento.
  let showDiscount = false;
  if (row.user_id) {
    const pagados = await db
      .select({ id: pedidos.id })
      .from(pedidos)
      .where(and(eq(pedidos.user_id, row.user_id), eq(pedidos.estado, "pagado")));
    showDiscount = pagados.length === 0;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY no configurada");
    return jsonCors({
      success: false,
      error: "El servidor no tiene configurado el envío de emails",
    });
  }

  const items = Array.isArray(row.items)
    ? (row.items as { nombre?: string; cantidad?: number }[])
    : [];

  const { subject, html } = abandonedCartEmail({
    nombre,
    itemCount: row.item_count || items.length,
    total: Number(row.total) || 0,
    items,
    showDiscount,
    ctaUrl: `${SITE_URL}/login?email=${encodeURIComponent(email)}`,
  });

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject,
    html,
  });

  if (error) {
    console.error("Error enviando recordatorio de carrito abandonado:", error);
    return jsonCors({ success: false, error: "Resend rechazó el envío" });
  }

  return jsonCors({ success: true });
}

/**
 * Preview del email en el navegador:
 *   /api/admin/recordatorio-carrito-abandonado?nombre=Ana&discount=1
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const nombre = sp.get("nombre") || "Ana Gómez";
  const showDiscount = sp.get("discount") === "1";
  const { html } = abandonedCartEmail({
    nombre,
    itemCount: 6,
    total: 92400,
    items: [
      { nombre: "Aceite de girasol 900ml", cantidad: 2 },
      { nombre: "Arroz largo fino 1kg", cantidad: 3 },
      { nombre: "Fideos guiseros 500g", cantidad: 6 },
      { nombre: "Puré de tomate 520g", cantidad: 4 },
      { nombre: "Yerba mate 1kg", cantidad: 1 },
      { nombre: "Azúcar 1kg", cantidad: 2 },
    ],
    showDiscount,
  });
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
