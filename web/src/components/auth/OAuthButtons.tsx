"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

// Mensajes para /login?oauth_error=... (los pone /api/auth/oauth/[provider]/callback).
export const OAUTH_ERRORS: Record<string, string> = {
  cancelado: "Cancelaste el inicio de sesión con Google",
  estado: "La sesión con Google expiró. Probá de nuevo",
  proveedor: "No pudimos iniciar sesión con Google. Probá de nuevo",
  email: "Tu cuenta de Google no tiene el email verificado",
  config: "El inicio de sesión con Google no está disponible",
};

interface OAuthButtonsProps {
  /** Tipo de cliente con el que se crea el perfil si es un registro nuevo. */
  tipoCliente?: string;
  label?: string;
}

export default function OAuthButtons({ tipoCliente, label = "Continuar con Google" }: OAuthButtonsProps) {
  const handleClick = () => {
    const params = new URLSearchParams();
    // Volver a la página desde donde se abrió (salvo login/registro).
    const { pathname, search } = window.location;
    if (pathname !== "/login" && pathname !== "/register") params.set("next", pathname + search);
    if (tipoCliente) params.set("tipo", tipoCliente);
    const qs = params.toString();
    // Es una Route Handler que redirige a Google, no una página: navegación completa.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/auth/oauth/google${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-3 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition"
      >
        <FontAwesomeIcon icon={faGoogle} className="flex" />
        {label}
      </button>
      <div className="flex items-center gap-3 my-5 text-sm text-gray-400">
        <div className="flex-1 border-t border-gray-200" />
        o con tu email
        <div className="flex-1 border-t border-gray-200" />
      </div>
    </div>
  );
}
