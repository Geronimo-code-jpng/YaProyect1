"use client";

// Aviso como el de las apps de delivery: si la cuenta todavía no tiene su
// dirección marcada en el mapa, se lo recuerda con un botón "Ahora". Si lo
// cierra, vuelve a aparecer en la próxima visita (no en cada página).
// No carga nada de Google hasta que toca "Ahora".

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MapPin, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchPerfilByEmail } from "../../lib/catalogApi";
import { AVISO_UBICACION, hayClaveDeMaps } from "../../lib/googleMaps";
import UbicacionModal, { UBICACION_GUARDADA } from "../cart/UbicacionModal";

// "ok" (ya tiene), "cerrado" (lo cerró en esta visita) o "pedir" (cuenta recién
// creada: se abre el mapa directo, en cualquier página)
const CLAVE = AVISO_UBICACION;

// En el carrito ya se elige la dirección; en el panel y al terminar la compra, molesta.
const SIN_AVISO = ["/cart", "/admin", "/thankyoupage", "/login", "/register", "/auth"];

const leer = () => {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
};
const anotar = (v: string) => {
  try {
    sessionStorage.setItem(CLAVE, v);
  } catch {
    /* sin almacenamiento: vuelve a preguntar, no pasa nada */
  }
};

interface Perfil {
  id: string;
  direccion?: string | null;
  referencia?: string | null;
}

export default function AvisoUbicacion() {
  const { userProfile } = useAuth();
  const pathname = usePathname();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [visible, setVisible] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const email = userProfile?.email;
  const esAdmin = userProfile?.rol === "admin";

  useEffect(() => {
    const estado = leer();
    if (!email || esAdmin || !hayClaveDeMaps() || estado === "ok" || estado === "cerrado") return;
    let vigente = true;
    fetchPerfilByEmail(email)
      .then((p) => {
        if (!vigente || !p?.id) return;
        if (p.lat != null && p.lon != null) {
          anotar("ok");
          return;
        }
        setPerfil(p);
        setVisible(true);
        if (estado === "pedir") {
          // Una sola vez: si lo cierra, queda el cartel como recordatorio
          try {
            sessionStorage.removeItem(CLAVE);
          } catch {}
          setAbierto(true);
        }
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [email, esAdmin]);

  useEffect(() => {
    const listo = () => {
      anotar("ok");
      setVisible(false);
    };
    window.addEventListener(UBICACION_GUARDADA, listo);
    return () => window.removeEventListener(UBICACION_GUARDADA, listo);
  }, []);

  const cerrar = () => {
    anotar("cerrado");
    setVisible(false);
  };

  if (!perfil) return null;
  const enPaginaSinAviso = SIN_AVISO.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  return (
    <>
      {visible && !abierto && !enPaginaSinAviso && (
        <div className="fixed z-[8999] left-3 right-3 bottom-20 md:bottom-5 md:left-5 md:right-auto md:w-[380px] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.18)] border border-gray-100 p-4 flex items-center gap-3 animate-[fadeIn_.3s_ease-out]">
          <div className="w-11 h-11 shrink-0 rounded-full bg-orange-50 flex items-center justify-center">
            <MapPin size={22} className="text-[#FF6600]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[#14122e] leading-tight">Completá tu ubicación</p>
            <p className="text-xs text-gray-600 mt-0.5">Así tu pedido llega justo a tu puerta.</p>
          </div>
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="shrink-0 px-4 py-2 rounded-xl bg-[#FF6600] hover:bg-orange-700 text-white text-sm font-black transition cursor-pointer"
          >
            Ahora
          </button>
          <button
            type="button"
            onClick={cerrar}
            className="shrink-0 -mr-1 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
            aria-label="Más tarde"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>
      )}
      {abierto && (
        <UbicacionModal
          perfilId={perfil.id}
          inicial={{ direccion: perfil.direccion || "", referencia: perfil.referencia || "" }}
          onCerrar={() => setAbierto(false)}
          onGuardado={() => {
            anotar("ok");
            setAbierto(false);
            setVisible(false);
          }}
        />
      )}
    </>
  );
}
