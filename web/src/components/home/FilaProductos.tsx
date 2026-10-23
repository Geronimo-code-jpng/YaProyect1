import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HomeProductCard from "./HomeProductCard";

// Fila de tarjetas que se desliza con el dedo (en compu, con las flechas).
// En celular se asoma la tarjeta siguiente para que se note que se puede deslizar.
export default function FilaProductos({ productos, oscuro = false }) {
  const fila = useRef<HTMLDivElement>(null);
  const [barra, setBarra] = useState({ inicio: 0, ancho: 1 });

  const medir = () => {
    const f = fila.current;
    if (!f) return;
    setBarra({ inicio: f.scrollLeft / f.scrollWidth, ancho: f.clientWidth / f.scrollWidth });
  };

  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [productos]);

  const mover = (lado: number) =>
    fila.current?.scrollBy({ left: lado * fila.current.clientWidth * 0.9, behavior: "smooth" });

  const alPrincipio = barra.inicio <= 0.001;
  const alFinal = barra.inicio + barra.ancho >= 0.999;

  const flecha = `hidden md:flex absolute top-1/3 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-700 hover:text-[#f74d00] hover:scale-105 transition disabled:opacity-0 disabled:pointer-events-none`;

  return (
    <div className="relative">
      <button onClick={() => mover(-1)} disabled={alPrincipio} aria-label="Anteriores" className={`${flecha} -left-4`}>
        <ChevronLeft size={22} />
      </button>
      <button onClick={() => mover(1)} disabled={alFinal} aria-label="Siguientes" className={`${flecha} -right-4`}>
        <ChevronRight size={22} />
      </button>

      {/* El relleno deja lugar a la sombra y a la etiqueta que sale de la tarjeta: la fila que se desliza recorta lo que sobresale */}
      <div
        ref={fila}
        onScroll={medir}
        className="flex gap-3 lg:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-2 pt-3 pb-4 -mx-2 px-2"
      >
        {productos.map((product) => (
          <div key={product.id} className="snap-start shrink-0 w-[44%] sm:w-[31%] lg:w-[23.5%] xl:w-[18.8%]">
            <HomeProductCard product={product} compact />
          </div>
        ))}
      </div>

      {barra.ancho < 1 && (
        <div className={`mx-auto w-24 h-1 rounded-full overflow-hidden ${oscuro ? "bg-white/30" : "bg-gray-200"}`}>
          <div
            className={`h-full rounded-full transition-[margin] duration-150 ${oscuro ? "bg-white" : "bg-[#f74d00]"}`}
            style={{ width: `${barra.ancho * 100}%`, marginLeft: `${barra.inicio * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Lo que el inicio necesita de cada producto para la tarjeta
export const aTarjeta = (p) => {
  const discount = parseInt(p.Oferta) || 0;
  const validDiscount = discount > 0 && discount < Number(p.precio) ? discount : 0;
  const mainPrice = Number(p.precio);
  return {
    id: p.Id,
    name: p.nombre,
    price: mainPrice,
    image: p.Imagen || p.imagen || "/producto-placeholder.svg",
    originalPrice: validDiscount > 0 ? mainPrice + validDiscount : null,
    discount: validDiscount,
    units: Number(p.quantity) || 1,
  };
};

// Con unidad suelta, hace falta al menos un bulto entero: si quedan solo
// sueltos no se muestra (el tilde queda y vuelve solo con stock)
export const hayBulto = (p) => p.Stock && (!p.tiene_unidad || Number(p.stock_actual) >= 1);

export function FilaCargando() {
  return (
    <div className="flex gap-3 lg:gap-4 overflow-hidden pt-3 pb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shrink-0 w-[44%] sm:w-[31%] lg:w-[23.5%] xl:w-[18.8%] h-72 sm:h-80 rounded-2xl bg-black/5 animate-pulse" />
      ))}
    </div>
  );
}
