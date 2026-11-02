import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { perfiles } from "@/db/schema";
import { jsonCors } from "@/lib/cors";
import { mismoEmail, normalizarEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const { password, nombre, telefono, direccion, tipo_cliente } = body;
  const email = normalizarEmail(body.email);

  if (!email || !password || !nombre || !telefono) {
    return jsonCors({ success: false, error: "Faltan campos obligatorios" });
  }

  const [existing] = await db.select().from(perfiles).where(mismoEmail(perfiles.email, email));
  if (existing) {
    return jsonCors({ success: false, error: "Este email ya está registrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [created] = await db
    .insert(perfiles)
    .values({
      email,
      password: hashedPassword,
      nombre,
      telefono,
      tipo_cliente: tipo_cliente || "minorista",
      direccion: direccion || null,
      rol: "user",
    })
    .returning();

  return jsonCors({
    success: true,
    user: {
      id: created.id,
      email: created.email,
      nombre: created.nombre,
      rol: created.rol,
      telefono: created.telefono,
      direccion: created.direccion,
      tipo_cliente: created.tipo_cliente,
    },
  });
}
