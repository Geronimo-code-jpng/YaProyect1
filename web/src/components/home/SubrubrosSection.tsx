"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchProductosCompartido } from "../../lib/catalogApi";

type Subrubro = { categoria: string; nombre: string; imagen: string; cantidad: number };

// Los sub-rubros salen de los productos (los manda el sistema): no hay lista a
// mano. La foto de cada círculo es la de un producto de ese sub-rubro, de
// preferencia uno de los "más vendidos".
// Foto elegida a mano para un sub-rubro (id del producto). Si ese producto se
// queda sin stock o sin foto, vuelve a elegirse sola.
const FOTO_ELEGIDA: Record<string, number> = {
  APERITIVOS: 1585, // CAJA FERNET BRANCA 750CC X12
};

export default function SubrubrosSection() {
  const [subrubros, setSubrubros] = useState<Subrubro[]>([]);
  const fila = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProductosCompartido()
      .then((productos) => {
        const grupos = new Map<string, Subrubro & { masVendido: boolean }>();
        for (const p of productos) {
          if (!p.subcategoria || !p.Categoria || !p.Stock) continue;
          const clave = `${p.Categoria}|${p.subcategoria}`;
          const g = grupos.get(clave) ?? {
            categoria: p.Categoria, nombre: p.subcategoria, imagen: "", cantidad: 0, masVendido: false,
          };
          g.cantidad++;
          const foto = p.Imagen || p.imagen;
          if (foto && p.Stock && (!g.imagen || (p.mas_vendido && !g.masVendido))) {
            g.imagen = foto;
            g.masVendido = !!p.mas_vendido;
          }
          grupos.set(clave, g);
        }
        for (const p of productos) {
          const g = grupos.get(`${p.Categoria}|${p.subcategoria}`);
          if (g && p.Stock && FOTO_ELEGIDA[p.subcategoria] === p.Id && (p.Imagen || p.imagen)) {
            g.imagen = p.Imagen || p.imagen;
          }
        }
        // Solo cuentan los productos con stock: un sub-rubro sin nada no aparece. Los que más tienen, primero
        setSubrubros([...grupos.values()].sort((a, b) => b.cantidad - a.cantidad));
      })
      .catch((err) => console.error("Error cargando sub-rubros:", err));
  }, []);

  if (!subrubros.length) return null;

  const mover = (lado: number) =>
    fila.current?.scrollBy({ left: lado * fila.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10">
      <div className="flex items-center justify-between mb-3 lg:mb-5">
        <h2 className="text-xl lg:text-3xl font-black text-gray-800">¿Qué estás buscando?</h2>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => mover(-1)}
            aria-label="Anteriores"
            className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-[#f74d00] transition"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => mover(1)}
            aria-label="Siguientes"
            className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-[#f74d00] transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div ref={fila} className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide snap-x pt-1.5 pb-2 -mx-1 px-1">
        {subrubros.map((s) => (
          <Link
            key={`${s.categoria}|${s.nombre}`}
            href={`/productos?categoria=${encodeURIComponent(s.categoria)}&subcategoria=${encodeURIComponent(s.nombre)}`}
            className="group snap-start shrink-0 w-20 sm:w-24 flex flex-col items-center gap-2 text-center"
          >
            <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-white border border-gray-200 shadow-sm overflow-hidden transition group-hover:border-[#f74d00] group-hover:shadow-md group-hover:-translate-y-0.5">
              <Image
                src={s.imagen || "/producto-placeholder.svg"}
                alt=""
                fill
                sizes="96px"
                className="object-contain p-2.5 mix-blend-multiply"
              />
            </div>
            <span className="w-full text-[11px] sm:text-xs font-bold text-gray-700 leading-tight line-clamp-2 break-words capitalize group-hover:text-[#f74d00]">
              {/* Corte después de la "/" para que un nombre largo baje de renglón y no pise al de al lado */}
              {s.nombre.toLowerCase().replace(/\//g, "/\u200b")}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
