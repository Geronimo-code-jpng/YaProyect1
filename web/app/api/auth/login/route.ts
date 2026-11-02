import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { perfiles } from "@/db/schema";
import { jsonCors } from "@/lib/cors";
import { mismoEmail, normalizarEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { email: emailEscrito, password } = await request.json();
  const email = normalizarEmail(emailEscrito);

  if (!email || !password) {
    return jsonCors({ success: false, error: "Email y contraseña son obligatorios" });
  }

  // Puede haber más de una cuenta vieja con el mismo email escrito distinto
  // (mayúsculas): vale la que tenga esa contraseña.
  const candidatos = await db.select().from(perfiles).where(mismoEmail(perfiles.email, email));
  if (candidatos.length === 0) {
    return jsonCors({ success: false, error: "Usuario no encontrado" });
  }

  let user = null;
  for (const c of candidatos) {
    if (c.password && (await bcrypt.compare(password, c.password))) {
      user = c;
      break;
    }
  }

  if (!user) {
    // Las cuentas creadas con Google no tienen contraseña (pueden crearse una con
    // "¿Olvidaste tu contraseña?").
    if (candidatos.every((c) => !c.password)) {
      return jsonCors({ success: false, error: "Esta cuenta usa Google: iniciá sesión con el botón \"Continuar con Google\"" });
    }
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
