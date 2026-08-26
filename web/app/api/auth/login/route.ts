import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { perfiles } from "@/db/schema";
import { jsonCors } from "@/lib/cors";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return jsonCors({ success: false, error: "Email y contraseña son obligatorios" });
  }

  const [user] = await db.select().from(perfiles).where(eq(perfiles.email, email));
  if (!user) {
    return jsonCors({ success: false, error: "Usuario no encontrado" });
  }

  if (!user.password) {
    return jsonCors({ success: false, error: "Usuario sin contraseña configurada" });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return jsonCors({ success: false, error: "Contraseña incorrecta" });
  }

  return jsonCors({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      telefono: user.telefono,
      direccion: user.direccion,
      tipo_cliente: user.tipo_cliente,
    },
  });
}
