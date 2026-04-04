import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function Carrusel() {
  // 1. Use React State to track the current slide instead of a global let
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  // 2. Use useEffect to handle the interval so it doesn't run infinitely on re-renders
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    // Cleanup function to clear the interval if the component is removed
    return () => clearInterval(slideInterval);
  }, []); // Empty dependency array means this sets up once on mount

  // 3. Navigation functions using state
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="py-2">
      <div
        id="heroCarousel"
        className="relative w-full overflow-hidden shadow-xl mb-8 h-48 md:h-[230px]"
      >
        <div
          id="carouselInner"
          className="flex transition-transform duration-700 ease-in-out h-full w-full"
          // We apply the transform style directly using React state!
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* Slide 1 */}
          <div className="w-full flex-none h-full bg-linear-to-r from-blue-700 to-blue-900 flex items-center justify-between px-6 md:px-20 text-white relative overflow-hidden">
            <div className="z-10 w-full">
              <span className="bg-yellow-400 text-black text-[10px] md:text-sm font-black px-2 md:px-3 py-1 rounded uppercase tracking-wider">
                Especial
              </span>
              <h2 className="text-3xl md:text-6xl font-black italic mt-2 leading-none">
                {/* Fixed unclosed <br> tags */}
                SEMANA DE <br />
                <span className="text-blue-300">BEBIDAS</span>
              </h2>
              <p className="mt-2 text-blue-100 text-xs md:text-xl font-medium line-clamp-2">
                Hasta 20% OFF llevando por bulto cerrado.
              </p>
            </div>
            <i className="fas fa-wine-bottle text-7xl md:text-[220px] text-white/10 absolute right-[-10px] md:right-16 bottom-[-10px] md:bottom-auto"></i>
          </div>

          {/* Slide 2 */}
          <div className="w-full flex-none h-full bg-gradient-to-r from-green-600 to-emerald-800 flex items-center justify-between px-6 md:px-20 text-white relative overflow-hidden">
            <div className="z-10 w-full">
              <span className="bg-white text-green-700 text-[10px] md:text-sm font-black px-2 md:px-3 py-1 rounded uppercase tracking-wider">
                Logística
              </span>
              <h2 className="text-3xl md:text-6xl font-black italic mt-2 leading-none">
                ENVÍO <br />
                <span className="text-green-300">10% OFF</span>
              </h2>
              <p className="mt-2 text-green-100 text-xs md:text-xl font-medium line-clamp-2">
                10% en todos los envios por WEB.
              </p>
            </div>
            <i className="fas fa-truck-fast text-7xl md:text-[220px] text-white/10 absolute right-[-10px] md:right-16 bottom-[-10px] md:bottom-auto"></i>
          </div>

          {/* Slide 3 */}
          <div className="w-full flex-none h-full bg-linear-to-r from-[#FF6600] to-orange-800 flex items-center justify-between px-6 md:px-20 text-white relative overflow-hidden">
            <div className="z-10 w-full">
              <span className="bg-black text-white text-[10px] md:text-sm font-black px-2 md:px-3 py-1 rounded uppercase tracking-wider">
                Catálogo
              </span>
              <h2 className="text-3xl md:text-6xl font-black italic mt-2 leading-none">
                TODO PARA <br />
                <span className="text-yellow-300">TU LOCAL</span>
              </h2>
              <p className="mt-2 text-orange-100 text-xs md:text-xl font-medium line-clamp-2">
                Surtido completo, los mejores precios.
              </p>
            </div>
            <i className="fas fa-boxes-stacked text-7xl md:text-[220px] text-white/10 absolute right-[-10px] md:right-16 bottom-[-10px] md:bottom-auto"></i>
          </div>
        </div>

        {/* Removed the () from the onClick handlers */}
        <button
          onClick={prevSlide}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/70 text-white w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition z-20 backdrop-blur-sm"
        >
          <ChevronLeft className="text-sm md:text-xl" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/70 text-white w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition z-20 backdrop-blur-sm"
        >
          <ChevronRight className="text-sm md:text-xl" />
        </button>

        <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-20">
          {/* Mapped over an array to dynamically render the dots and their active states */}
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`dot w-2 h-2 md:w-3 md:h-3 rounded-full transition ${
                currentSlide === index ? "bg-white" : "bg-white/50"
              }`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
}