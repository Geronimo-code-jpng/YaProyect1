import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { perfiles, email_recovery } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function POST(request: Request) {
  const { token, newPassword } = await request.json();
  if (!token || !newPassword || newPassword.length < 6) {
    return jsonCors({ success: false, error: "Datos inválidos" });
  }

  const [tokenRow] = await db.select().from(email_recovery).where(eq(email_recovery.token, token));
  if (!tokenRow) {
    return jsonCors({ success: false, error: "Código inválido o expirado" });
  }

  if (!tokenRow.expires_at || new Date(tokenRow.expires_at) < new Date()) {
    return jsonCors({ success: false, error: "Código expirado. Solicita uno nuevo." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.update(perfiles).set({ password: hashedPassword }).where(eq(perfiles.id, tokenRow.profile_id));
  await db.delete(email_recovery).where(eq(email_recovery.token, token));

  return jsonCors({ success: true });
}
