import React from "react";
import Carrusel from '../components/Carrusel';
import ProductosMasVendidos from '../components/ProductosMasVendidos';
import CategoriesSection from '../components/CategoriesSection';
import OfertasExpress from '../components/OfertasExpress';
import ReviewsSection from '../components/ReviewsSection';

export default function HomePage() {
  return (
    <main className="flex flex-col bg-gray-50 min-h-screen">

      {/* Carrusel: full-width en mobile, con padding lateral y redondeo en desktop */}
      <div className="w-full lg:px-8 xl:px-14 2xl:px-20 lg:pt-6">
        <div className="overflow-hidden lg:rounded-2xl lg:shadow-2xl">
          <Carrusel />
        </div>
      </div>

      {/* Secciones sin wrappers redundantes — cada componente maneja su propio max-width */}
      <OfertasExpress />
      <CategoriesSection />
      <ProductosMasVendidos />
      <ReviewsSection />

    </main>
  );
}