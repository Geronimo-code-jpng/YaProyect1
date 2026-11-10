"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, TrendingDown } from "lucide-react";
import { fetchProductosCompartido } from "../../lib/catalogApi";
import { useCart } from "../../contexts/CartContext";
import {
  escalasDe,
  hayUnidad,
  nombreDe,
  precioBulto,
  precioUnidad,
  unidadesPorBulto,
  type Escala,
  type Tipo,
} from "../../lib/presentaciones";
import { hayBulto } from "./FilaProductos";
import { BotonAgregar, agregarAlCarrito } from "./HomeProductCard";

const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
const ahorroDe = (base: number, precio: number) => Math.round((1 - precio / base) * 100);

type Item = {
  p: any;
  tipo: Tipo;
  base: number;
  escalas: Escala[]; // solo las que bajan el precio
  ahorroMax: number;
};

// Productos con precio por cantidad (escalas del sistema): "llevando 12 o más,
// cada uno a $1.200". De cada producto va la presentación que más ahorra.
function conEscala(p: any): Item | null {
  const opciones: Item[] = [];
  const presentaciones: [Tipo, number | null, boolean][] = [
    ["Bulto", precioBulto(p), hayBulto(p)],
    ["Unidad", precioUnidad(p), hayUnidad(p)],
  ];
  for (const [tipo, base, hay] of presentaciones) {
    if (!hay || !base) continue;
    const escalas = escalasDe(p, tipo).filter((e) => e.precio < base);
    if (!escalas.length) continue;
    const mejor = Math.min(...escalas.map((e) => e.precio));
    opciones.push({ p, tipo, base, escalas, ahorroMax: ahorroDe(base, mejor) });
  }
  return opciones.sort((a, b) => b.ahorroMax - a.ahorroMax)[0] ?? null;
}

export default function CompraMasAhorra() {
  const [items, setItems] = useState<Item[]>([]);
  const fila = useRef<HTMLDivElement>(null);
  const [alPrincipio, setAlPrincipio] = useState(true);
  const [alFinal, setAlFinal] = useState(false);

  // Como en FilaProductos: solo sabe si está en una punta, para esconder la flecha
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
  }, [items]);

  const mover = (lado: number) =>
    fila.current?.scrollBy({ left: lado * fila.current.clientWidth * 0.9, behavior: "smooth" });

  useEffect(() => {
    fetchProductosCompartido()
      .then((productos) => {
        const lista = productos
          .filter((p) => p.publicado !== false)
          .map(conEscala)
          .filter((x): x is Item => x !== null)
          .sort((a, b) => b.ahorroMax - a.ahorroMax)
          .slice(0, 12);
        setItems(lista);
      })
      .catch((err) => console.error("Error:", err));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="relative pt-5 pb-4 sm:pt-7 lg:pt-8 lg:pb-6">
          {/* Como en Ofertas Express: el fondo es más angosto que la fila, así en el
              celular las tarjetas se deslizan hasta el borde de la pantalla */}
          <div className="absolute inset-y-0 inset-x-3 sm:inset-x-6 lg:inset-x-10 rounded-3xl bg-linear-to-br from-emerald-50 via-emerald-50 to-green-100 border border-emerald-100" />

          <div className="relative flex items-center gap-3 lg:gap-4 mb-3 lg:mb-5 px-6 sm:px-10 lg:px-14">
            <div className="w-11 h-11 lg:w-14 lg:h-14 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/25 shrink-0">
              <TrendingDown className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-4xl font-black text-gray-900 leading-none tracking-tight">
                Comprá más y ahorrá
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-emerald-800/70 mt-1">
                Cuantos más llevás, menos pagás cada uno
              </p>
            </div>
          </div>

          {/* Una sola fila que se desliza con el dedo; en compu, con las flechas */}
          <div className="relative">
            <button onClick={() => mover(-1)} disabled={alPrincipio} aria-label="Anteriores" className={`${FLECHA} -left-4`}>
              <ChevronLeft size={22} />
            </button>
            <button onClick={() => mover(1)} disabled={alFinal} aria-label="Siguientes" className={`${FLECHA} -right-4`}>
              <ChevronRight size={22} />
            </button>

            <div
              ref={fila}
              onScroll={medir}
              className="flex gap-3 lg:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-2 pt-3 pb-4 -mx-2 px-2"
            >
              {items.map((item) => (
                <div key={`${item.p.Id}-${item.tipo}`} className="snap-start shrink-0 w-[44%] sm:w-[31%] lg:w-[23.5%] xl:w-[18.8%]">
                  <TarjetaEscala {...item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FLECHA =
  "hidden md:flex absolute top-1/3 z-20 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-700 hover:text-emerald-600 hover:scale-105 transition disabled:opacity-0 disabled:pointer-events-none";

// Tocar la tarjeta agrega lo justo para la primera escala; tocar una opción
// (precio normal o una escala) lleva la cantidad del carrito ahí, y tocar la
// que ya está elegida lo saca del carrito; − y + afinan
function TarjetaEscala({ p, tipo, base, escalas, ahorroMax }: Item) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const enCarrito = cart.find((i) => String(i.Id) === String(p.Id) && (i.tipo || "Bulto") === tipo);
  const llevando = enCarrito?.cantidad ?? 0;
  const primera = escalas[0];

  // Lo que el botón Agregar necesita: el producto en la presentación elegida,
  // con sus escalas para que el carrito calcule el precio según la cantidad
  const producto = {
    id: p.Id,
    name: nombreDe(p, tipo),
    price: base,
    image: p.Imagen || p.imagen || "/producto-placeholder.svg",
    tipo,
    escalas: escalasDe(p, tipo),
    quantity_per_bundle: unidadesPorBulto(p),
  };

  // Las opciones para elegir: el precio de siempre (1) y cada escala
  const opciones = [{ desde: 1, precio: base }, ...escalas];
  const llevarA = (cantidad: number) => {
    if (enCarrito) updateQuantity(p.Id, cantidad, tipo);
    else agregarAlCarrito(addToCart, producto, cantidad);
  };

  return (
    <div
      onClick={() => !enCarrito && llevarA(primera.desde)}
      className={`group relative h-full flex flex-col bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition duration-300 p-2.5 sm:p-3 cursor-pointer ${
        enCarrito ? "border-[#f74d00]/40" : "border-white"
      }`}
    >
      {ahorroMax > 0 && (
        <span className="absolute -top-2.5 -left-1.5 z-10 -rotate-3 bg-emerald-600 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg shadow-lg shadow-emerald-700/30">
          {escalas.length > 1 ? "hasta " : ""}-{ahorroMax}%
        </span>
      )}

      <div className="relative aspect-square rounded-xl bg-gray-50 mb-2.5 overflow-hidden">
        <Image
          src={producto.image}
          alt={producto.name}
          fill
          sizes="(max-width: 640px) 45vw, 240px"
          className="object-contain p-3 sm:p-4 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <h3 className="text-[13px] sm:text-sm font-bold text-gray-800 line-clamp-2 leading-snug min-h-[2.6em]">
        {producto.name}
      </h3>
      {/* Las opciones van abajo, pegadas al botón: así quedan parejas entre tarjetas */}
      <div className="flex-1 min-h-2" />
      <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium mb-1">Precio c/u llevando:</p>

      {/* Cada opción se toca y lleva la cantidad ahí; la que corresponde a lo
          que hay en el carrito queda resaltada */}
      <div className="space-y-1">
        {opciones.map((e, i) => {
          const siguiente = opciones[i + 1];
          const activa = llevando >= e.desde && (!siguiente || llevando < siguiente.desde);
          const normal = i === 0;
          return (
            <button
              key={e.desde}
              type="button"
              aria-pressed={activa}
              onClick={(ev) => {
                ev.stopPropagation();
                // Tocar la que ya está elegida la saca del carrito
                if (activa) removeFromCart(p.Id, tipo);
                else llevarA(e.desde);
              }}
              className={`w-full flex items-baseline justify-between gap-1 rounded-lg px-2 py-1.5 text-xs border transition active:scale-[0.98] ${
                activa
                  ? normal
                    ? "bg-gray-700 border-gray-700 text-white"
                    : "bg-emerald-600 border-emerald-600 text-white"
                  : normal
                    ? "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                    : "bg-emerald-50 border-emerald-100 text-emerald-900 hover:border-emerald-400"
              }`}
            >
              <span className="font-medium whitespace-nowrap">{normal ? "Normal" : `${e.desde} o más`}</span>
              <span className={`whitespace-nowrap tabular-nums ${normal ? "font-bold" : "font-black"}`}>{pesos(e.precio)}</span>
            </button>
          );
        })}
      </div>

      <BotonAgregar product={producto} cantidad={primera.desde} className="w-full h-9 sm:h-10 mt-2" />
    </div>
  );
}
