"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { fetchProductosCompartido } from "../../lib/catalogApi";
import { useCart } from "../../contexts/CartContext";
import { aTarjeta, hayBulto } from "./FilaProductos";
import { BotonAgregar } from "./HomeProductCard";

const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

// Lo que conviene comprar por bulto: compara cuánto sale cada unidad dentro del
// bulto contra la unidad suelta. Uno por sub-rubro, para que no salgan tres
// sabores del mismo jugo.
export default function AhorroPorBulto() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchProductosCompartido()
      .then((productos) => {
        const usados = new Set();
        const lista = productos
          .filter((p) => hayBulto(p) && p.tiene_unidad && Number(p.precio_unidad) > 0 && Number(p.quantity) >= 2)
          .map((p) => {
            const porUnidad = Number(p.precio) / Number(p.quantity);
            return { p, porUnidad, ahorro: Math.round((1 - porUnidad / Number(p.precio_unidad)) * 100) };
          })
          .filter((x) => x.ahorro >= 5)
          .sort((a, b) => b.ahorro - a.ahorro)
          .filter(({ p }) => {
            const clave = p.subcategoria || p.Id;
            if (usados.has(clave)) return false;
            usados.add(clave);
            return true;
          })
          .slice(0, 3);
        setItems(lista);
      })
      .catch((err) => console.error("Error:", err));
  }, []);

  if (items.length < 3) return null;

  return (
    <section className="py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="rounded-3xl bg-linear-to-br from-emerald-50 via-emerald-50 to-green-100 border border-emerald-100 px-4 pt-5 pb-4 sm:p-7 lg:p-8">
          <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-5">
            <div className="w-11 h-11 lg:w-14 lg:h-14 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/25 shrink-0">
              <Package className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-4xl font-black text-gray-900 leading-none tracking-tight">
                Comprá por bulto y ahorrá
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-emerald-800/70 mt-1">
                Llevando el bulto, cada unidad te sale menos que suelta
              </p>
            </div>
          </div>

          {/* En celular se desliza (2 a la vista); desde tablet van las 3 en fila */}
          <div className="flex sm:grid sm:grid-cols-3 gap-3 lg:gap-6 overflow-x-auto sm:overflow-visible scrollbar-hide snap-x snap-mandatory scroll-px-2 pt-3 pb-1 -mx-2 px-2">
            {items.map((item) => <TarjetaBulto key={item.p.Id} {...item} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// Tocar la tarjeta es como tocar su botón Agregar; ya agregado, se maneja con − y +
function TarjetaBulto({ p, porUnidad, ahorro }) {
  const { cart } = useCart();
  const producto = aTarjeta(p);
  const enCarrito = cart.some((i) => String(i.Id) === String(p.Id) && (i.tipo || "Bulto") === "Bulto");

  return (
    <div
      onClick={(e) => !enCarrito && e.currentTarget.querySelector("button")?.click()}
      className={`group relative snap-start shrink-0 w-[44%] sm:w-auto flex flex-col bg-white rounded-2xl border shadow-sm hover:shadow-xl transition duration-300 p-2.5 sm:p-4 cursor-pointer active:scale-[0.99] ${
        enCarrito ? "border-[#f74d00]/40" : "border-white"
      }`}
    >
      <span className="absolute -top-2.5 -left-1.5 z-10 -rotate-3 bg-emerald-600 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg shadow-lg shadow-emerald-700/30">
        -{ahorro}%
      </span>

      <div className="relative aspect-square sm:aspect-[4/3] rounded-xl bg-gray-50 mb-2.5 overflow-hidden">
        <Image
          src={producto.image}
          alt={p.nombre}
          fill
          sizes="(max-width: 640px) 45vw, 360px"
          className="object-contain p-3 sm:p-4 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <h3 className="text-[13px] sm:text-sm font-bold text-gray-800 line-clamp-2 leading-snug min-h-[2.6em]">{p.nombre}</h3>
      <div className="flex items-baseline gap-1 mt-1.5">
        <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">{pesos(porUnidad)}</span>
        <span className="text-xs text-gray-500">c/u</span>
      </div>
      <p className="text-[11px] sm:text-xs text-gray-500">
        Suelta <span className="line-through">{pesos(p.precio_unidad)}</span>
      </p>
      <p className="text-[11px] sm:text-xs text-gray-500">Bulto x{p.quantity}: {pesos(p.precio)}</p>

      <div className="flex-1 min-h-3" />
      <BotonAgregar product={producto} className="w-full h-9 sm:h-10" />
    </div>
  );
}
