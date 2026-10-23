import { useState, useEffect } from "react"
import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { fetchProductosCompartido } from "../../lib/catalogApi";
import FilaProductos, { FilaCargando, aTarjeta, hayBulto } from "./FilaProductos";

export default function OfertasExpress() {
  const [ofertas, setOfertas] = useState(null);

  useEffect(() => {
    fetchProductosCompartido()
      .then((all) =>
        setOfertas(
          all
            .filter((p) => p.oferta_express && hayBulto(p))
            .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""))
            .map(aTarjeta)
        )
      )
      .catch((err) => {
        console.error("Error:", err);
        setOfertas([]);
      });
  }, []);

  if (ofertas && ofertas.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="relative pt-5 pb-4 sm:pt-7 lg:pt-8 lg:pb-6">
          {/* El fondo naranja es más angosto que la fila: las tarjetas sobresalen por los costados */}
          <div className="absolute inset-y-0 inset-x-3 sm:inset-x-6 lg:inset-x-10 overflow-hidden rounded-3xl bg-linear-to-br from-[#ff7a1a] via-[#f74d00] to-[#d93a00] shadow-xl shadow-orange-500/20">
            {/* Círculos de fondo, solo decoración */}
            <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/10" />
            <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-black/5" />
          </div>

          {/* Encabezado */}
          <div className="relative flex items-center gap-3 mb-4 lg:mb-6 px-6 sm:px-10 lg:px-14">
            <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0">
              <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-[#f74d00] fill-[#f74d00]" />
            </div>
            <div className="mr-auto min-w-0">
              <h2 className="text-2xl lg:text-4xl font-black text-white leading-none tracking-tight whitespace-nowrap">
                Ofertas Express
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-white/85 mt-1">
                Las mejores ofertas del momento
              </p>
            </div>
            <Link
              href="/productos?categoria=soloofertas"
              aria-label="Ver todas las ofertas"
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-bold p-2 sm:px-4 sm:py-2 transition"
            >
              <span className="hidden sm:inline">Ver todas</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative">
            {ofertas ? <FilaProductos productos={ofertas} /> : <FilaCargando />}
          </div>
        </div>
      </div>
    </section>
  );
}
