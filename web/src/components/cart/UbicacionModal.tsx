"use client";

// Guarda la dirección de la cuenta (la que aparece por defecto en el carrito).
// La usan el aviso "Completá tu ubicación" y la pantalla de perfil.

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import DireccionEnMapa, { direccionLista, type Direccion } from "./DireccionEnMapa";
import { updatePerfil } from "../../lib/catalogApi";

export const UBICACION_GUARDADA = "ya:ubicacion-guardada";

interface Props {
  perfilId: string;
  inicial: Partial<Direccion>;
  onCerrar: () => void;
  onGuardado: (d: Direccion) => void;
}

export default function UbicacionModal({ perfilId, inicial, onCerrar, onGuardado }: Props) {
  const [d, setD] = useState<Direccion>({
    direccion: inicial.direccion || "",
    referencia: inicial.referencia || "",
    lat: inicial.lat ?? null,
    lon: inicial.lon ?? null,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const lista = direccionLista(d);

  const guardar = async () => {
    if (!lista) return;
    setGuardando(true);
    setError("");
    try {
      const datos = {
        direccion: d.direccion.trim(),
        referencia: d.referencia?.trim() || null,
        lat: d.lat,
        lon: d.lon,
      };
      await updatePerfil(perfilId, datos);
      // El aviso "Completá tu ubicación" se entera y se va
      window.dispatchEvent(new Event(UBICACION_GUARDADA));
      onGuardado({ ...d, ...datos, referencia: datos.referencia || "" });
    } catch {
      setError("No pudimos guardar la dirección. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[9500] bg-black/50 flex items-end md:items-center justify-center" onClick={onCerrar}>
      <div
        className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-black text-[#14122e]">¿Dónde recibís tus pedidos?</h3>
            <p className="text-sm text-gray-600 mt-0.5">Queda guardada en tu cuenta. En cada pedido la podés cambiar.</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-9 h-9 shrink-0 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <DireccionEnMapa value={d} onChange={(c) => setD((p) => ({ ...p, ...c }))} />

        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <button
          type="button"
          onClick={guardar}
          disabled={!lista || guardando}
          className="w-full mt-4 py-3.5 rounded-2xl bg-[#FF6600] hover:bg-orange-700 text-white font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? "Guardando..." : "Guardar dirección"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
