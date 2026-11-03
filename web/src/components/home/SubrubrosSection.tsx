"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { fetchProductosCompartido } from "../../lib/catalogApi";

type Subrubro = { categoria: string; nombre: string; imagen: string; cantidad: number };

// Los sub-rubros salen de los productos (los manda el sistema): no hay lista a
// mano. La foto de cada tarjeta es la de un producto de ese sub-rubro, de
// preferencia uno de los "más vendidos".
// Foto elegida a mano para un sub-rubro (id del producto). Si ese producto se
// queda sin stock o sin foto, vuelve a elegirse sola.
const FOTO_ELEGIDA: Record<string, number> = {
  APERITIVOS: 1585, // CAJA FERNET BRANCA 750CC X12
};

export default function SubrubrosSection() {
  const [subrubros, setSubrubros] = useState<Subrubro[]>([]);
  const [total, setTotal] = useState(0);
  const fila = useRef<HTMLDivElement>(null);
  const [alPrincipio, setAlPrincipio] = useState(true);
  const [alFinal, setAlFinal] = useState(false);

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
        setTotal(productos.filter((p) => p.Stock).length);
      })
      .catch((err) => console.error("Error cargando sub-rubros:", err));
  }, []);

  // Igual que en las filas de productos: la flecha de una punta se esconde al llegar
  const medir = () => {
    const f = fila.current;
    if (!f) return;
    setAlPrincipio(f.scrollLeft <= 1);
    setAlFinal(f.scrollLeft + f.clientWidth >= f.scrollWidth - 1);
  };

  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [subrubros]);

  if (!subrubros.length) return null;

  const mover = (lado: number) =>
    fila.current?.scrollBy({ left: lado * fila.current.clientWidth * 0.8, behavior: "smooth" });

  const flecha = `hidden md:flex absolute top-[38%] -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-700 hover:text-[#f74d00] hover:scale-105 transition disabled:opacity-0 disabled:pointer-events-none`;

  return (
    <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-12">
      {/* Encabezado con el mismo formato que Ofertas Express y Comprá por bulto */}
      <div className="flex items-center gap-3 lg:gap-4 mb-2 lg:mb-4">
        <div className="w-11 h-11 lg:w-14 lg:h-14 bg-linear-to-br from-[#ff7a1a] to-[#f74d00] rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
          <LayoutGrid className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl lg:text-4xl font-black text-gray-900 leading-none tracking-tight">
            ¿Qué estás buscando?
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-1">
            Elegí un rubro y encontrá todo más rápido
          </p>
        </div>
      </div>

      <div className="relative">
        <button onClick={() => mover(-1)} disabled={alPrincipio} aria-label="Anteriores" className={`${flecha} -left-4`}>
          <ChevronLeft size={22} />
        </button>
        <button onClick={() => mover(1)} disabled={alFinal} aria-label="Siguientes" className={`${flecha} -right-4`}>
          <ChevronRight size={22} />
        </button>

        {/* El relleno deja lugar a la sombra y al levante del hover: la fila que se desliza recorta lo que sobresale */}
        <div
          ref={fila}
          onScroll={medir}
          className="flex gap-3 lg:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-2 pt-3 pb-4 -mx-2 px-2"
        >
          {/* Primera: "Todos", con un producto de cada uno de los rubros más grandes */}
          <Link
            href="/productos"
            className="group snap-start shrink-0 w-28 sm:w-32 lg:w-36 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 hover:-translate-y-0.5 transition duration-300 p-2 sm:p-2.5"
          >
            <div className="relative aspect-square rounded-xl bg-orange-50 overflow-hidden mb-2 grid grid-cols-2 grid-rows-2 gap-0.5 p-1">
              {subrubros.filter((s) => s.imagen).slice(0, 4).map((s) => (
                <div key={`${s.categoria}|${s.nombre}`} className="relative rounded-lg bg-white overflow-hidden">
                  <Image
                    src={s.imagen}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-contain p-0.5 scale-110 transition-transform duration-300 group-hover:scale-125"
                  />
                </div>
              ))}
            </div>
            <span className="text-xs sm:text-[13px] font-bold text-gray-800 leading-snug line-clamp-2 min-h-[2.6em] group-hover:text-[#f74d00] transition-colors">
              Todos
            </span>
            <span className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              {total} productos
            </span>
          </Link>

          {subrubros.map((s) => (
            <Link
              key={`${s.categoria}|${s.nombre}`}
              href={`/productos?categoria=${encodeURIComponent(s.categoria)}&subcategoria=${encodeURIComponent(s.nombre)}`}
              className="group snap-start shrink-0 w-28 sm:w-32 lg:w-36 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 hover:-translate-y-0.5 transition duration-300 p-2 sm:p-2.5"
            >
              {/* Cuadro y no círculo: las botellas son altas y finitas, y en un círculo quedaban chiquitas */}
              <div className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden mb-2">
                <Image
                  src={s.imagen || "/producto-placeholder.svg"}
                  alt=""
                  fill
                  sizes="144px"
                  // Las fotos ya traen blanco alrededor: se agrandan un poco para que el producto llene el cuadro
                  className="object-contain p-1.5 mix-blend-multiply scale-110 transition-transform duration-300 group-hover:scale-[1.18]"
                />
              </div>
              <span className="text-xs sm:text-[13px] font-bold text-gray-800 leading-snug line-clamp-2 min-h-[2.6em] break-words capitalize group-hover:text-[#f74d00] transition-colors">
                {/* Corte después de la "/" para que un nombre largo baje de renglón y no pise al de al lado */}
                {s.nombre.toLowerCase().replace(/\//g, "/​")}
              </span>
              <span className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {s.cantidad} {s.cantidad === 1 ? "producto" : "productos"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
