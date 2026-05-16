import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase as supabaseClient } from "../lib/supabase";
import HomeProductCard from "./HomeProductCard";

export default function OfertasExpress() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Responsive: cuántos productos mostrar por "página" ───────────────────
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

  // Resetear índice cuando cambia itemsPerView para no quedar fuera de rango
  useEffect(() => {
    setCurrentIndex(0);
  }, [itemsPerView]);

  // ─── Carga de datos ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadOfertas = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("productos")
          .select("*")
          .eq("oferta_express", true)
          .order("nombre", { ascending: true });

        if (error) {
          console.error("Error cargando ofertas express:", error);
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
          setOfertas(mapped);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOfertas();
  }, []);

  const totalPages = Math.ceil(ofertas.length / itemsPerView);

  const nextSlide = () =>
    setCurrentIndex((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));

  const prevSlide = () =>
    setCurrentIndex((prev) => (prev <= 0 ? totalPages - 1 : prev - 1));

  if (loading) {
    return (
      <section className="py-8 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            Ofertas <span className="text-orange-600">Express</span>
          </h2>
          <div className="text-center py-8 text-gray-400 font-bold">
            Cargando ofertas...
          </div>
        </div>
      </section>
    );
  }

  if (ofertas.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 lg:py-14 bg-gradient-to-r from-red-50 to-orange-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-gray-900 leading-tight">
              Ofertas <span className="text-orange-600">Express</span>
            </h2>
            <p className="text-sm lg:text-base text-gray-500 mt-1 hidden sm:block">
              Las mejores ofertas del momento
            </p>
          </div>

          {/* Controles */}
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

        {/* Carrusel */}
        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {ofertas.map((product) => (
              <div
                key={product.id}
                className="shrink-0 px-1.5 sm:px-2 lg:px-3"
                style={{ width: `${100 / itemsPerView}%` }}
              >
                <HomeProductCard
                  product={product}
                  compact={true}
                  showOriginalPrice={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-5 gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  currentIndex === index
                    ? "bg-orange-500 w-6"
                    : "bg-gray-300 hover:bg-gray-400 w-2"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}