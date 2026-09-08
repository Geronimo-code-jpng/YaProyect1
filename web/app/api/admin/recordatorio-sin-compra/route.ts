import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { perfiles } from "@/db/schema";
import { jsonCors } from "@/lib/cors";
import { reminderNoPurchaseEmail } from "@/lib/emailTemplates";

const FROM = "Ya Mayorista <no-reply@yamayorista.online>";

/**
 * Manda el recordatorio de "todavía no compraste" con el descuento de primera
 * compra. Lo dispara el admin desde la pestaña Clientes, uno por fila.
 * Body: { email: string, nombre?: string }
 */
export async function POST(request: Request) {
  let body: { email?: string; nombre?: string };
  try {
    body = await request.json();
  } catch {
    return jsonCors({ success: false, error: "Body inválido" });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonCors({ success: false, error: "Email inválido" });
  }

  // Confirmamos que la cuenta existe (y tomamos el nombre real si no vino).
  const [profile] = await db
    .select()
    .from(perfiles)
    .where(eq(perfiles.email, email));
  if (!profile) {
    return jsonCors({ success: false, error: "No hay una cuenta con ese email" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY no configurada");
    return jsonCors({ success: false, error: "El servidor no tiene configurado el envío de emails" });
  }

  const { subject, html } = reminderNoPurchaseEmail({
    nombre: body.nombre || profile.nombre,
  });

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject,
    html,
  });

  if (error) {
    console.error("Error enviando recordatorio sin compra:", error);
    return jsonCors({ success: false, error: "Resend rechazó el envío" });
  }

  return jsonCors({ success: true });
}

/**
 * Preview del email en el navegador: abrir /api/admin/recordatorio-sin-compra
 * (opcional ?nombre=Juan) para ver exactamente el HTML que se manda.
 */
export async function GET(request: Request) {
  const nombre = new URL(request.url).searchParams.get("nombre") || "Juan Pérez";
  const { html } = reminderNoPurchaseEmail({ nombre });
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
