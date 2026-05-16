import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function Carrusel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);

  const goToSlide = (index) => setCurrentSlide(index);

  const slides = [
    {
      desktop: "./Carrusel1.png",
      mobile: "./Carrusel1-mobile.png",
      alt: "CarruselSlide1",
      bg: "from-blue-700 to-blue-900",
    },
    {
      desktop: "./Carrusel2.png",
      mobile: "./Carrusel2-mobile.png",
      alt: "CarruselSlide2",
      bg: "from-green-600 to-emerald-800",
    },
    {
      desktop: "./Carrusel3.png",
      mobile: "./Carrusel3-mobile.png",
      alt: "CarruselSlide3",
      bg: "from-orange-500 to-orange-800",
    },
    {
      desktop: "./Carrusel4.png",
      mobile: "./Carrusel4-mobile.png",
      alt: "CarruselSlide4",
      bg: "from-orange-500 to-orange-800",
    },
  ];

  return (
    <div
      id="heroCarousel"
      className="relative w-full overflow-hidden
        h-[13vh]
        sm:h-[28vh]
        md:h-[35vh]
        lg:h-[45vh]
        xl:h-[52vh]
        2xl:h-[58vh]"
    >
      {/* Tira de slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`w-full flex-none h-full bg-linear-to-r ${slide.bg} relative overflow-hidden`}
          >
            <picture>
              <source media="(max-width: 640px)" srcSet={slide.mobile} />
              <img
                src={slide.desktop}
                alt={slide.alt}
                className="absolute inset-0 w-full h-full object-fit object-center"
              />
            </picture>
          </div>
        ))}
      </div>

      {/* Botón anterior */}
      <button
        onClick={prevSlide}
        aria-label="Slide anterior"
        className="absolute left-2 sm:left-3 lg:left-5 top-1/2 -translate-y-1/2
          bg-black/30 hover:bg-black/60 text-white
          w-7 h-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 xl:w-13 xl:h-13
          rounded-full flex items-center justify-center
          transition-colors duration-200 z-20 backdrop-blur-sm"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
      </button>

      {/* Botón siguiente */}
      <button
        onClick={nextSlide}
        aria-label="Slide siguiente"
        className="absolute right-2 sm:right-3 lg:right-5 top-1/2 -translate-y-1/2
          bg-black/30 hover:bg-black/60 text-white
          w-7 h-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 xl:w-13 xl:h-13
          rounded-full flex items-center justify-center
          transition-colors duration-200 z-20 backdrop-blur-sm"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
      </button>

      {/* Dots de navegación */}
      <div className="absolute bottom-2 sm:bottom-3 lg:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 lg:gap-2.5 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Ir al slide ${index + 1}`}
            className={`rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "bg-white w-5 sm:w-6 h-1.5 sm:h-2"
                : "bg-white/50 hover:bg-white/80 w-1.5 sm:w-2 h-1.5 sm:h-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
