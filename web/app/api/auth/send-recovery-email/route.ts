import crypto from "crypto";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { perfiles, email_recovery } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

const TOKEN_TTL_MS = 30 * 60 * 1000;

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) {
    return jsonCors({ success: false, error: "El email es obligatorio" });
  }

  const [profile] = await db.select().from(perfiles).where(eq(perfiles.email, email));
  if (!profile) {
    return jsonCors({ success: false, error: "Este email no está registrado en el sistema" });
  }

  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await db.insert(email_recovery).values({
    profile_id: profile.id,
    token,
    expires_at: expiresAt,
    attempts: 0,
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY no configurada");
    return jsonCors({ success: false, error: "Error enviando email" });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "no-reply@yamayorista.online",
    to: [email],
    subject: "Recuperación de Contraseña",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; text-align: center;">Recuperación de Contraseña</h1>
        <p style="color: #666; line-height: 1.6;">
          Hola, hemos recibido una solicitud para recuperar tu contraseña.
          Usa el siguiente token para restablecer tu contraseña:
        </p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <strong style="font-size: 18px; color: #FF6600;">Token: ${token}</strong>
        </div>
        <p style="color: #666; line-height: 1.6;">
          Si no solicitaste esta recuperación, puedes ignorar este email. El token vence en 30 minutos.
        </p>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
          Este es un email automático, por favor no responder.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Error enviando email de recuperación:", error);
    return jsonCors({ success: false, error: "Error enviando email" });
  }

  return jsonCors({ success: true });
}
