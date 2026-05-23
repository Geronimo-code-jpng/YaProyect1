import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { supabase as supabaseClient } from "../lib/supabase";
import HomeProductCard from "./HomeProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductosMasVendidos() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [itemsPerView, setItemsPerView] = useState(2);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1280) setItemsPerView(5);
      else if (window.innerWidth >= 1024) setItemsPerView(4);
      else if (window.innerWidth >= 640) setItemsPerView(3);
      else setItemsPerView(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
            const mainPrice = Number(p.precio);
            const crossedPrice =
              validDiscount > 0 ? mainPrice + validDiscount : null;
            return {
              id: p.Id,
              name: p.nombre,
              price: mainPrice,
              image:
                p.Imagen ||
                p.imagen ||
                `https://via.placeholder.com/300/f3f4f6/a1a1aa?text=${p.Id}`,
              originalPrice: crossedPrice,
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

  useEffect(() => {
    setCurrentIndex(0);
  }, [itemsPerView]);

  const totalPages = Math.ceil(productos.length / itemsPerView);

  const nextSlide = () =>
    setCurrentIndex((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));

  const prevSlide = () =>
    setCurrentIndex((prev) => (prev <= 0 ? totalPages - 1 : prev - 1));

  if (loading) {
    return (
      <section className="py-8 lg:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            Más Vendidos
          </h2>
          <div className="text-center py-8 text-gray-400 font-bold">
            Cargando...
          </div>
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
          <div className="mr-auto">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-gray-900 leading-tight">
              Más Vendidos
            </h2>
            <p className="text-sm lg:text-base text-gray-500 hidden sm:block mt-0.5">
              Los productos favoritos de nuestros clientes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden lg:block text-sm text-gray-400 mr-2">
              {currentIndex + 1} / {totalPages}
            </span>
            <button
              onClick={prevSlide}
              disabled={totalPages <= 1}
              className="p-2 lg:p-3 rounded-full bg-white shadow-md hover:shadow-lg active:scale-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              disabled={totalPages <= 1}
              className="p-2 lg:p-3 rounded-full bg-white shadow-md hover:shadow-lg active:scale-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {productos.map((product) => (
              <div
                key={product.id}
                className="shrink-0 px-1.5 sm:px-2 lg:px-3"
                style={{ width: `${100 / itemsPerView}%` }}
              >
                <HomeProductCard product={product} compact={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
