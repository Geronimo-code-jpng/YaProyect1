import { useState, useEffect } from "react"
import { Trophy } from "lucide-react";
import { fetchProductosCompartido } from "../../lib/catalogApi";
import FilaProductos, { FilaCargando, aTarjeta, hayBulto } from "./FilaProductos";

export default function ProductosMasVendidos() {
  const [productos, setProductos] = useState(null);

  useEffect(() => {
    fetchProductosCompartido()
      .then((all) =>
        setProductos(
          all
            .filter((p) => p.mas_vendido && hayBulto(p))
            .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""))
            .map(aTarjeta)
        )
      )
      .catch((err) => {
        console.error("Error:", err);
        setProductos([]);
      });
  }, []);

  if (productos && productos.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 lg:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Encabezado */}
        <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
          <div className="w-11 h-11 lg:w-14 lg:h-14 bg-linear-to-br from-yellow-300 to-amber-500 rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
            <Trophy className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl lg:text-4xl font-black text-gray-900 leading-none tracking-tight">
              Más Vendidos
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-1">
              Los productos favoritos de nuestros clientes
            </p>
          </div>
        </div>

        {productos ? <FilaProductos productos={productos} /> : <FilaCargando />}
      </div>
    </section>
  );
}
