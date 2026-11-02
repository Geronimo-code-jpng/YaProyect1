"use client";

import { useEffect } from "react";
import { saveSession } from "../utils/authDB";

// Destino final del login con OAuth: /api/auth/oauth/[provider]/callback deja
// el usuario en el #hash (base64url de JSON) y acá se guarda la sesión igual
// que en el login con contraseña.
function decodePayload(hash: string) {
  const b64 = hash.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function OAuthCallbackPage() {
  useEffect(() => {
    try {
      const { user, next, completar } = decodePayload(window.location.hash.slice(1));
      if (!user?.id || !user?.email) throw new Error("payload inválido");
      saveSession(user);
      const destino = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      // replace: que "atrás" no vuelva a esta página con la sesión en la URL.
      window.location.replace(
        completar ? `/completar-perfil?next=${encodeURIComponent(destino)}` : destino,
      );
    } catch (err) {
      console.error("Error en login con OAuth:", err);
      window.location.replace("/login?oauth_error=proveedor");
    }
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 flex items-center justify-center">
      <p className="text-gray-600 font-medium">Iniciando sesión...</p>
    </div>
  );
}
