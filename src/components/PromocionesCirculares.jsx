import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, {  useState  } from 'react';

export default function PromocionesCirculares() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const promociones = [
    {
      id: 1,
      descuento: "Hasta 50%",
      categoria: "Lácteos",
      imagen: "./lacteos-promo.jpg",
      color: "bg-blue-500"
    },
    {
      id: 2,
      descuento: "30%",
      categoria: "Hellmann's",
      imagen: "./hellmanns-promo.jpg",
      color: "bg-red-500"
    },
    {
      id: 3,
      descuento: "2x1",
      categoria: "Bebidas",
      imagen: "./bebidas-promo.jpg",
      color: "bg-green-500"
    },
    {
      id: 4,
      descuento: "40%",
      categoria: "Snacks",
      imagen: "./snacks-promo.jpg",
      color: "bg-yellow-500"
    },
    {
      id: 5,
      descuento: "25%",
      categoria: "Limpieza",
      imagen: "./limpieza-promo.jpg",
      color: "bg-purple-500"
    },
    {
      id: 6,
      descuento: "35%",
      categoria: "Cereales",
      imagen: "./cereales-promo.jpg",
      color: "bg-orange-500"
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % promociones.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + promociones.length) % promociones.length);
  };

  const getVisiblePromociones = () => {
    const visible = [];
    for (let i = 0; i < 4; i++) {
      visible.push(promociones[(currentIndex + i) % promociones.length]);
    }
    return visible;
  };

  return (
    <section className="py-4 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">
          Ofertas Imperdibles
        </h2>
        
        <div className="relative">
          {/* Contenedor de promociones */}
          <div className="flex justify-center items-center space-x-4 overflow-hidden">
            {getVisiblePromociones().map((promo, index) => (
              <div
                key={`${promo.id}-${index}`}
                className={`flex-none w-28 h-28 ${promo.color} rounded-full flex flex-col items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
              >
                <div className="text-center">
                  <p className="text-lg font-black">{promo.descuento}</p>
                  <p className="text-xs font-medium px-2">{promo.categoria}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Botones de navegación */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        {/* Indicadores */}
        <div className="flex justify-center space-x-2 mt-4">
          {promociones.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentIndex ? "bg-orange-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
