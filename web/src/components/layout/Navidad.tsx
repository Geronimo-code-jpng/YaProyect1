"use client";

import { esNavidad } from "../../lib/temporada";

// Adornos de Navidad. Cada uno se muestra solo en temporada (ver lib/temporada).
// Las animaciones están en app/globals.css y se apagan con "reducir movimiento".

// Posiciones fijas por número de copo, no al azar: si no, lo que arma el
// servidor y lo que arma el navegador no coinciden.
const azar = (i: number, semilla: number) => {
  const x = Math.sin(i * 12.9898 + semilla * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const COPOS = Array.from({ length: 36 }, (_, i) => ({
  izquierda: azar(i, 1) * 100,
  tamano: 4 + azar(i, 2) * 6,
  duracion: 9 + azar(i, 3) * 9,
  demora: -azar(i, 4) * 18,
  vaiven: 15 + azar(i, 5) * 30,
  opacidad: 0.5 + azar(i, 6) * 0.4,
  // En el celular cae la mitad, para no tapar ni gastar batería
  soloCompu: i % 2 === 1,
}));

export function Nieve() {
  if (!esNavidad()) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden motion-reduce:hidden">
      {COPOS.map((c, i) => (
        <span
          key={i}
          className={`absolute -top-4 rounded-full bg-white shadow-[0_0_4px_rgba(0,0,0,0.15)] animate-nieve ${c.soloCompu ? "hidden md:block" : ""}`}
          style={{
            left: `${c.izquierda}%`,
            width: c.tamano,
            height: c.tamano,
            opacity: c.opacidad,
            animationDuration: `${c.duracion}s`,
            animationDelay: `${c.demora}s`,
            ["--vaiven" as string]: `${c.vaiven}px`,
          }}
        />
      ))}
    </div>
  );
}

// Lamparitas colgando del borde de abajo de la barra naranja
const COLORES = ["#e11d48", "#facc15", "#22c55e", "#38bdf8", "#ffffff"];

export function Guirnalda() {
  if (!esNavidad()) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-full h-4 overflow-hidden z-10">
      {/* El cable */}
      <svg className="absolute inset-x-0 top-0 w-full h-3" preserveAspectRatio="none" viewBox="0 0 100 10">
        <path d="M0 0 Q 2.5 6 5 0 T 10 0 T 15 0 T 20 0 T 25 0 T 30 0 T 35 0 T 40 0 T 45 0 T 50 0 T 55 0 T 60 0 T 65 0 T 70 0 T 75 0 T 80 0 T 85 0 T 90 0 T 95 0 T 100 0"
          fill="none" stroke="#14532d" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute inset-x-0 top-0 flex justify-around">
        {Array.from({ length: 40 }, (_, i) => (
          <span
            key={i}
            className={`mt-[3px] w-2 h-3 rounded-b-full rounded-t-sm motion-safe:animate-titila ${i >= 20 ? "hidden md:block" : ""}`}
            style={{
              backgroundColor: COLORES[i % COLORES.length],
              boxShadow: `0 0 6px ${COLORES[i % COLORES.length]}`,
              animationDelay: `${(i % 4) * 0.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Gorrito de Papá Noel apoyado sobre el "YA!" del logo
export function GorroNavideno() {
  if (!esNavidad()) return null;
  return (
    <svg aria-hidden viewBox="0 0 64 48" className="pointer-events-none absolute -top-3.5 -left-3 w-9 h-7 -rotate-[18deg]">
      <path d="M8 38 C 14 14, 34 2, 52 10 C 46 16, 44 26, 46 36 Z" fill="#dc2626" />
      <path d="M52 10 C 56 14, 58 20, 57 26" fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
      <circle cx="57" cy="29" r="5.5" fill="#fff" />
      <rect x="4" y="34" width="46" height="11" rx="5.5" fill="#fff" />
    </svg>
  );
}
