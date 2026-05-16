import React, {  useState, useEffect  } from 'react';
import HomeProductCard from './HomeProductCard';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import getRandomOfertProducts from "../db/index"

export default function ProductosDestacados() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getRandomOfertProducts();
        console.log("Productos cargados:", products);
        setProductosDestacados(products);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handlePrev = () => {
    if (productosDestacados.length > 0) {
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? productosDestacados.length - 1 : prevIndex - 1
      );
    }
  };

  const handleNext = () => {
    if (productosDestacados.length > 0) {
      setCurrentIndex((prevIndex) => 
        prevIndex === productosDestacados.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  if (loading) {
    return (
      <section className="pt-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-gray-800">Ofertas del Día</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-48 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-6 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              Ofertas Express
            </h2>
          </div>
          <div className="flex items-center">
            <a className="flex items-center gap-2" href="productos?categoria=soloofertas">
              <span className="flex items-center justify-center">
                Ver Todas
                <ArrowRight className='w-4 h-4' />
              </span>
            </a>
          </div>
        </div>

        {/* Carrusel de productos - 2 columnas */}
        <div className="relative mb-6 px-12">
          {/* Contenedor del carrusel */}
          <div className="overflow-hidden rounded-lg">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ 
                transform: `translateX(-${currentIndex * 50}%)`,
                width: `${productosDestacados.length * 50}%`
              }}
            >
              {productosDestacados.map((product, index) => (
                <div key={product.Id || `product-${index}`} className="w-1/2 shrink-0 px-2">
                  <HomeProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Flechas de navegación */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicadores */}
          <div className="flex justify-center mt-4 space-x-2">
            {productosDestacados.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-orange-500 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ir al producto ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
