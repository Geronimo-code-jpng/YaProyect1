import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { supabase as supabaseClient } from "../lib/supabase";
import HomeProductCard from "./HomeProductCard";

export default function ProductosMasVendidos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProductos = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("productos")
          .select("*")
          .eq("mas_vendido", true)
          .order("nombre", { ascending: true });

        if (error) {
          console.error("Error cargando más vendidos:", error);
          return;
        }

        if (data) {
          const mapped = data.map((p) => {
            const discount = parseInt(p.Oferta) || 0;
            const validDiscount =
              discount > 0 && discount < Number(p.precio) ? discount : 0;
            const salePrice =
              validDiscount > 0
                ? Number(p.precio) - validDiscount
                : Number(p.precio);
            return {
              id: p.Id,
              name: p.nombre,
              price: salePrice,
              image:
                p.Imagen ||
                p.imagen ||
                `https://via.placeholder.com/300/f3f4f6/a1a1aa?text=${p.Id}`,
              originalPrice: validDiscount > 0 ? Number(p.precio) : null,
              discount: validDiscount,
            };
          });
          setProductos(mapped);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProductos();
  }, []);

  if (loading) {
    return (
      <section className="py-8 lg:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Más Vendidos</h2>
          <div className="text-center py-8 text-gray-400 font-bold">Cargando...</div>
        </div>
      </section>
    );
  }

  if (productos.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 lg:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* Encabezado */}
        <div className="flex items-center gap-3 lg:gap-4 mb-6 lg:mb-10">
          <div className="w-10 h-10 lg:w-14 lg:h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-md shrink-0">
            <Trophy className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-gray-900 leading-tight">
              Más Vendidos
            </h2>
            <p className="text-sm lg:text-base text-gray-500 hidden sm:block mt-0.5">
              Los productos favoritos de nuestros clientes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {productos.map((producto) => (
            <HomeProductCard
              key={producto.id}
              product={producto}
              compact={true}
              showOriginalPrice={true}
            />
          ))}
        </div>

      </div>
    </section>
  );
}