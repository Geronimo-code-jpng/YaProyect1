import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function Carrusel() {
  // 1. Use React State to track the current slide instead of a global let
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;

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
    <div className="py-1 sm:py-2">
      <div
        id="heroCarousel"
        className="relative w-full overflow-hidden shadow-xl mb-6 sm:mb-8 h-33 sm:h-40 md:h-56 lg:h-80 xl:h-96 2xl:h-[500px]"
      >
        <div
          id="carouselInner"
          className="flex transition-transform duration-700 ease-in-out h-full w-full"
          // We apply the transform style directly using React state!
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* Slide 1 */}
          <div className="w-full flex-none h-full bg-linear-to-r from-blue-700 to-blue-900 flex items-center justify-between px-6 md:px-20 text-white relative overflow-hidden">
            <picture>
              {/* Imagen para celulares (máximo 640px) */}
              <source
                media="(max-width: 640px)"
                srcset="./Carrusel1-mobile.png"
              />
              {/* Imagen para computadoras (más de 1024px) */}
              <img
                src="./Carrusel1.png"
                alt="CarruselSlide1"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </picture>
          </div>

          {/* Slide 2 */}
          <div className="w-full flex-none h-full bg-linear-to-r from-green-600 to-emerald-800 flex items-center justify-between px-6 md:px-20 text-white relative overflow-hidden">
            <picture>
              {/* Imagen para celulares */}
              <source
                media="(max-width: 640px)"
                srcset="./Carrusel2-mobile.png"
              />
              {/* Imagen para computadoras */}
              <img
                src="./Carrusel2.png"
                alt="CarruselSlide2"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </picture>
          </div>

          {/* Slide 3 */}
          <div className="w-full flex-none h-full bg-linear-to-r from-[#FF6600] to-orange-800 flex items-center justify-between px-6 md:px-20 text-white relative overflow-hidden">
            <picture>
              {/* Imagen para celulares */}
              <source
                media="(max-width: 640px)"
                srcset="./Carrusel3-mobile.png"
              />

              {/* Imagen para computadoras */}
              <img
                src="./Carrusel3.png"
                alt="CarruselSlide3"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </picture>
          </div>

          {/* Slide 4 */}
          <div className="w-full flex-none h-full bg-linear-to-r from-[#FF6600] to-orange-800 flex items-center justify-between px-6 md:px-20 text-white relative overflow-hidden">
            <picture>
              {/* Imagen para celulares */}
              <source
                media="(max-width: 640px)"
                srcset="./Carrusel4-mobile.png"
              />

              {/* Imagen para computadoras */}
              <img
                src="./Carrusel4.png"
                alt="CarruselSlide4"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </picture>
          </div>
        </div>

        {/* Removed the () from the onClick handlers */}
        <button
          onClick={prevSlide}
          className="absolute left-1 sm:left-2 md:left-4 lg:left-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-14 rounded-full flex items-center justify-center transition z-20 backdrop-blur-sm"
        >
          <ChevronLeft className="text-xs sm:text-sm md:text-base lg:text-xl" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-1 sm:right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-14 rounded-full flex items-center justify-center transition z-20 backdrop-blur-sm"
        >
          <ChevronRight className="text-xs sm:text-sm md:text-base lg:text-xl" />
        </button>

        <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 z-20">
          {/* Mapped over an array to dynamically render the dots and their active states */}
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`dot w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-full transition ${
                currentSlide === index ? "bg-white" : "bg-white/50"
              }`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
}
