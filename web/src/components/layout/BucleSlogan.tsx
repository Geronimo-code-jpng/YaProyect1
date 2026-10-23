"use client";

import { useEffect, useState } from "react";

// Cinta del envío en el día: corre de lado a lado los primeros 2 minutos de la
// visita y después se esconde. La hora de llegada queda en sessionStorage para
// que no vuelva a aparecer al cambiar de página; en una visita nueva, sí.
// Cada tanto cada motito levanta la rueda, sale al palo dejando humo y vuelve a
// entrar por la izquierda (las animaciones están en app/globals.css).
const DURACION_MS = 2 * 60 * 1000;
const CLAVE = "ya_envio_cinta_desde";

// demora: para que las motitos no arranquen todas a la vez
const Frase = ({ demora }: { demora: number }) => (
  <div className="mx-20 sm:mx-28 flex items-center gap-2 shrink-0">
    <span className="relative w-7 h-7 shrink-0">
      {/* Humo que queda donde arrancó */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute left-0 bottom-0 w-3 h-3 rounded-full bg-gray-400/50 opacity-0 motion-safe:animate-humo"
          style={{ animationDelay: `${demora + i * 0.12}s` }}
        />
      ))}
      <span
        className="absolute inset-0 z-10 origin-[20%_90%] motion-safe:animate-arranque"
        style={{ animationDelay: `${demora}s` }}
      >
        {/* Foto quieta y liviana (13 KB): el GIF de antes pesaba 3,4 MB y con 8 a la vez trababa el celular.
            El movimiento lo dan las animaciones de CSS */}
        <img className="w-7 h-7 motion-safe:animate-moto" src="/moto-envio.png" alt="" />
      </span>
    </span>
    <p className="text-sm py-1.5 text-gray-700">
      Si sos de <strong>Santa Fe</strong>, tu envío llega{" "}
      <strong className="text-[#f74d00]">en el día</strong>
    </p>
  </div>
);

// Pocas frases bien separadas (2 o 3 a la vista en computadora); va dos veces para que el bucle empalme
const Tira = () => (
  <div className="flex shrink-0">
    {Array.from({ length: 4 }, (_, i) => <Frase key={i} demora={i * 2.7} />)}
  </div>
);

export default function BucleSlogan() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let desde = Date.now();
    try {
      const guardado = Number(sessionStorage.getItem(CLAVE));
      if (guardado) desde = guardado;
      else sessionStorage.setItem(CLAVE, String(desde));
    } catch {}
    const t = setTimeout(() => setVisible(false), Math.max(0, desde + DURACION_MS - Date.now()));
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="relative flex overflow-hidden border-b border-gray-200 bg-white">
      <div className="flex w-max motion-safe:animate-marquee whitespace-nowrap">
        <Tira />
        <Tira />
      </div>
    </div>
  );
}
