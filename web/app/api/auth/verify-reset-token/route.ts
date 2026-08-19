import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { perfiles, email_recovery } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function POST(request: Request) {
  const { token, email } = await request.json();
  if (!token || !email) {
    return jsonCors({ success: false, error: "Faltan datos" });
  }

  const [tokenRow] = await db.select().from(email_recovery).where(eq(email_recovery.token, token));
  if (!tokenRow) {
    return jsonCors({ success: false, error: "Código inválido o expirado" });
  }

  if (!tokenRow.expires_at || new Date(tokenRow.expires_at) < new Date()) {
    return jsonCors({ success: false, error: "Código expirado. Solicita uno nuevo." });
  }

  if (tokenRow.attempts >= 3) {
    return jsonCors({ success: false, error: "Máximo de intentos alcanzado. Solicita un nuevo código." });
  }

  const [profile] = await db.select().from(perfiles).where(eq(perfiles.id, tokenRow.profile_id));
  if (!profile) {
    return jsonCors({ success: false, error: "Perfil no encontrado" });
  }

  if (profile.email?.toLowerCase() !== email.toLowerCase()) {
    await db
      .update(email_recovery)
      .set({ attempts: tokenRow.attempts + 1 })
      .where(eq(email_recovery.id, tokenRow.id));
    return jsonCors({ success: false, error: "El email no coincide con el del código" });
  }

  return jsonCors({ success: true, email: profile.email });
}
