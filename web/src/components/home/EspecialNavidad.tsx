"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchProductosCompartido } from "../../lib/catalogApi";
import { useCart } from "../../contexts/CartContext";
import { precioPorCantidad } from "../../lib/presentaciones";
import { aTarjeta, hayBulto } from "./FilaProductos";
import { BotonAgregar, agregarAlCarrito } from "./HomeProductCard";

// Especial Navidad: los productos con el tilde "Navidad" del admin, en un
// cuadro con nieve y regalos. Se desliza para ver uno por uno.
// Sin ningún producto tildado (o sin stock), el cuadro no aparece.
const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

export default function EspecialNavidad() {
  const [productos, setProductos] = useState<any[]>([]);
  const [actual, setActual] = useState(0);
  const [desborda, setDesborda] = useState(false);
  const fila = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProductosCompartido()
      .then((lista) => setProductos(lista.filter((p) => p.navidad && p.publicado !== false && hayBulto(p))))
      .catch((err) => console.error("Error:", err));
  }, []);

  // Las flechas (en compu) solo hacen falta si no entran todos a la vista
  useEffect(() => {
    const el = fila.current;
    if (!el) return;
    const medir = () => setDesborda(el.scrollWidth > el.clientWidth + 4);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [productos.length]);

  if (productos.length === 0) return null;

  const alDeslizar = () => {
    const el = fila.current;
    const primera = el?.firstElementChild as HTMLElement | null;
    if (!el || !primera) return;
    setActual(Math.round(el.scrollLeft / primera.offsetWidth));
  };
  const mover = (dir: number) => fila.current?.scrollBy({ left: dir * fila.current.clientWidth, behavior: "smooth" });

  return (
    <section className="py-4 sm:py-8 lg:py-10">
      <style>{ESTILOS}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-red-600 via-red-700 to-red-900 px-3 pt-3.5 pb-4 sm:px-6 sm:pt-5 sm:pb-6 shadow-lg shadow-red-900/20">
          {/* Regalos abajo a la izquierda */}
          <Regalos className="pointer-events-none absolute bottom-0 -left-1 w-20 sm:w-28 opacity-90" />
          <svg
            className="pointer-events-none absolute bottom-0 inset-x-0 w-full h-4 sm:h-6"
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M0 20 C200 5 350 8 550 18 S900 30 1200 14 V40 H0 Z" fill="#fff" opacity="0.9" />
          </svg>

          {/* Encabezado */}
          <div className="relative">
            <h2 className="flex items-center gap-1.5 text-xl sm:text-3xl lg:text-4xl font-black text-white leading-none tracking-tight">
              <span className="nav-destello text-amber-300 text-base sm:text-2xl">★</span>
              Especial Navidad
              <span className="nav-destello text-amber-300 text-base sm:text-2xl [animation-delay:0.6s]">★</span>
              {/* Papá Noel 3D (Fluent Emoji de Microsoft, licencia MIT): se ve
                  igual en todos los celulares, no depende del emoji de cada uno */}
              <Image
                src="/emoji/santa.webp"
                alt=""
                width={64}
                height={64}
                className="nav-saluda w-8 h-8 sm:w-11 sm:h-11 lg:w-12 lg:h-12 -my-2 drop-shadow"
              />
            </h2>
            <p className="text-[11px] sm:text-sm text-red-100/80 mt-1">Lo infaltable para las fiestas</p>
          </div>

          {/* Productos: se deslizan de a uno en celu; en compu entran varios */}
          <div className="relative">
            <div
              ref={fila}
              onScroll={alDeslizar}
              className="flex justify-center-safe overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1"
            >
              {productos.map((p, i) => (
                <SlideNavidad key={p.Id} p={p} giro={i % 2 ? 7 : -7} />
              ))}
            </div>

            {desborda && (
              <>
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={() => mover(-1)}
                  className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/90 text-red-700 shadow hover:bg-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  onClick={() => mover(1)}
                  className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/90 text-red-700 shadow hover:bg-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Puntitos (celu): cuál se está viendo */}
          {productos.length > 1 && (
            <div className="relative flex justify-center gap-1.5 mt-1 md:hidden">
              {productos.map((p, i) => (
                <span
                  key={p.Id}
                  className={`h-1.5 rounded-full transition-all ${i === actual ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          )}

          <Nieve />
        </div>
      </div>
    </section>
  );
}

// Un producto: la foto grande en un cuadrado blanco inclinado (uno para cada lado); a la
// derecha el nombre, el precio, el botón y, debajo, el precio por cantidad.
function SlideNavidad({ p, giro }: { p: any; giro: number }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const producto = { ...aTarjeta(p), tipo: "Bulto", quantity_per_bundle: Number(p.quantity) || 1 };
  const escalas = producto.escalas.filter((e) => e.precio < producto.price);
  const enCarrito = cart.find((i) => String(i.Id) === String(p.Id) && (i.tipo || "Bulto") === "Bulto");
  const llevando = enCarrito?.cantidad ?? 0;
  const precioHoy = precioPorCantidad(producto.price, escalas, Math.max(1, llevando));

  // Tocar una escala lleva el carrito a esa cantidad; tocar la elegida lo saca
  const llevarA = (cantidad: number) => {
    if (enCarrito) updateQuantity(p.Id, cantidad, "Bulto");
    else agregarAlCarrito(addToCart, producto, cantidad);
  };

  return (
    <div className="snap-start shrink-0 w-full md:w-[24rem] lg:w-[27rem] px-1 lg:px-3 grid grid-cols-[44%_1fr] lg:grid-cols-[48%_1fr] items-center gap-2 sm:gap-3 pt-1 pb-2">
      <Link href={`/producto/${producto.id}`} className="relative block aspect-square" aria-label={producto.name}>
        {/* Cuadrado blanco de bordes redondeados, inclinado y flotando */}
        <span
          className="nav-flota absolute inset-[9%] rounded-3xl bg-white shadow-xl shadow-black/30 overflow-hidden"
          style={{ "--giro": `${giro}deg` } as CSSProperties}
        >
          <Image
            src={producto.image}
            alt={producto.name}
            fill
            sizes="(max-width: 768px) 45vw, 240px"
            className="object-contain p-1 sm:p-1.5"
          />
        </span>
      </Link>

      <div className="relative min-w-0 py-1">
        <Link href={`/producto/${producto.id}`}>
          <h3 className="text-[13px] sm:text-base font-bold text-white leading-snug line-clamp-2">{producto.name}</h3>
        </Link>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums">{pesos(precioHoy)}</span>
          {producto.originalPrice && !llevando && (
            <span className="text-[11px] text-red-200/70 line-through tabular-nums">{pesos(producto.originalPrice)}</span>
          )}
        </div>

        <BotonAgregar product={producto} className="w-full h-9 sm:h-10 mt-1.5" />

        {escalas.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {escalas.map((e, i) => {
              const siguiente = escalas[i + 1];
              const activa = llevando >= e.desde && (!siguiente || llevando < siguiente.desde);
              return (
                <button
                  key={e.desde}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => (activa ? removeFromCart(p.Id, "Bulto") : llevarA(e.desde))}
                  className={`w-full flex items-baseline justify-between gap-1 rounded-lg px-2 py-1 text-[11px] sm:text-xs transition active:scale-[0.98] ${
                    activa ? "bg-amber-300 text-red-900" : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  <span className="font-medium whitespace-nowrap">{e.desde} o más</span>
                  <span className="font-black whitespace-nowrap tabular-nums">{pesos(e.precio)} c/u</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Nieve
// Copos grandes que caen balanceándose. Los valores salen de una cuenta fija
// (no de Math.random) para que el servidor y el navegador dibujen lo mismo.
const azar = (i: number, n: number) => {
  const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
  return +(x - Math.floor(x)).toFixed(3);
};

const COPOS = Array.from({ length: 16 }, (_, i) => ({
  izquierda: azar(i, 1) * 100,
  tamano: Math.round(12 + azar(i, 2) * 20),
  caida: +(6 + azar(i, 3) * 6).toFixed(2),
  retraso: -+(azar(i, 4) * 12).toFixed(2),
  vaiven: +(2.5 + azar(i, 5) * 3).toFixed(2),
  opacidad: +(0.5 + azar(i, 6) * 0.45).toFixed(2),
}));

function Nieve() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {COPOS.map((c, i) => (
        <div
          key={i}
          className="nav-cae absolute inset-0"
          style={{ animationDuration: `${c.caida}s`, animationDelay: `${c.retraso}s` }}
        >
          <span
            className="nav-vaiven absolute top-0"
            style={{ left: `${c.izquierda}%`, opacity: c.opacidad, animationDuration: `${c.vaiven}s` }}
          >
            <Copo tamano={c.tamano} />
          </span>
        </div>
      ))}
    </div>
  );
}

function Copo({ tamano }: { tamano: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none" stroke="white" strokeWidth={1.7} strokeLinecap="round">
      {[0, 60, 120].map((r) => (
        <g key={r} transform={`rotate(${r} 12 12)`}>
          <path d="M12 2v20M12 5.5 9.5 3M12 5.5 14.5 3M12 18.5 9.5 21M12 18.5 14.5 21" />
        </g>
      ))}
      <circle cx="12" cy="12" r="1.6" fill="white" stroke="none" />
    </svg>
  );
}

// ------------------------------------------------------------------ Regalos
function Regalo({ x, y, w, h, caja, cinta, retraso }: { x: number; y: number; w: number; h: number; caja: string; cinta: string; retraso: number }) {
  const cx = x + w / 2;
  return (
    <g className="nav-salta" style={{ animationDelay: `${retraso}s`, transformOrigin: `${cx}px ${y + h}px` }}>
      <rect x={x} y={y} width={w} height={h} rx="2" fill={caja} />
      <rect x={x - 2} y={y} width={w + 4} height={h * 0.22} rx="2" fill={caja} style={{ filter: "brightness(1.12)" }} />
      <rect x={cx - 3} y={y} width="6" height={h} fill={cinta} />
      <path d={`M${cx} ${y} C${cx - 14} ${y - 14} ${cx - 16} ${y + 2} ${cx} ${y}`} fill={cinta} />
      <path d={`M${cx} ${y} C${cx + 14} ${y - 14} ${cx + 16} ${y + 2} ${cx} ${y}`} fill={cinta} />
    </g>
  );
}

function Regalos({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 70" aria-hidden>
      <Regalo x={6} y={30} w={34} h={36} caja="#16a34a" cinta="#fbbf24" retraso={0} />
      <Regalo x={46} y={18} w={40} h={48} caja="#f8fafc" cinta="#dc2626" retraso={0.6} />
      <Regalo x={90} y={40} w={24} h={26} caja="#fbbf24" cinta="#16a34a" retraso={1.2} />
    </svg>
  );
}

const ESTILOS = `
@keyframes nav-cae { from { transform: translateY(-12%); } to { transform: translateY(105%); } }
@keyframes nav-vaiven {
  0%, 100% { transform: translateX(-12px) rotate(-25deg); }
  50% { transform: translateX(12px) rotate(25deg); }
}
@keyframes nav-salta {
  0%, 70%, 100% { transform: translateY(0) rotate(0deg); }
  78% { transform: translateY(-6px) rotate(-3deg); }
  86% { transform: translateY(0) rotate(2deg); }
  92% { transform: translateY(-2px) rotate(0deg); }
}
/* La foto inclinada, flotando y meciéndose un poco */
@keyframes nav-flota {
  0%, 100% { transform: rotate(var(--giro, -7deg)) translateY(0); }
  50% { transform: rotate(calc(var(--giro, -7deg) * 0.5)) translateY(-5px) scale(1.03); }
}
/* Papá Noel se hamaca, como saludando */
@keyframes nav-saluda {
  0%, 60%, 100% { transform: rotate(0deg); }
  70% { transform: rotate(-12deg); }
  80% { transform: rotate(10deg); }
  90% { transform: rotate(-6deg); }
}
.nav-saluda { animation: nav-saluda 2.8s ease-in-out infinite; transform-origin: 50% 90%; }
@keyframes nav-destello { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.nav-cae { animation: nav-cae linear infinite; }
.nav-vaiven { animation: nav-vaiven ease-in-out infinite; }
.nav-salta { animation: nav-salta 3.2s ease-in-out infinite; transform-box: view-box; }
.nav-flota { animation: nav-flota 3.6s ease-in-out infinite; transform: rotate(var(--giro, -7deg)); }
.nav-destello { display: inline-block; animation: nav-destello 1.2s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .nav-cae, .nav-vaiven, .nav-salta, .nav-flota, .nav-destello, .nav-saluda { animation: none; }
}
`;
