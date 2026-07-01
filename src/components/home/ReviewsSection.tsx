import { Star, Quote } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "María González",
    initial: "M",
    rating: 5,
    comment:
      "Excelente servicio y calidad de productos. Siempre encuentro lo que necesito y los precios son muy competitivos",
  },
  {
    id: 2,
    name: "Juan Pérez",
    initial: "J",
    rating: 5,
    comment:
      "La atención al cliente es increíble. Me ayudaron a encontrar productos específicos que no conseguía en otros lugares",
  },
  {
    id: 3,
    name: "Ana Rodríguez",
    initial: "A",
    rating: 5,
    comment:
      "Variedad increíble y siempre con las mejores ofertas. El delivery es rápido y los productos llegan en perfectas condiciones",
  },
];

const stats = [
  { value: "10K+", label: "Clientes felices" },
  { value: "4.9★", label: "Calificación promedio" },
  { value: "24/7", label: "Soporte online" },
  { value: "100%", label: "Garantía de satisfacción" },
];

export default function ReviewsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Encabezado */}
        <div className="text-center mb-10 lg:mb-14">
          <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-yellow-100 rounded-2xl mb-5">
            <Quote className="w-7 h-7 lg:w-8 lg:h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-gray-800 mb-3">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-gray-500 lg:text-lg max-w-xl mx-auto">
            Miles de clientes confían en nosotros para sus compras diarias
          </p>
        </div>

        {/* Tarjetas de reviews */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 lg:gap-8 mb-12 lg:mb-16">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-gray-50 rounded-2xl p-6 lg:p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              {/* Estrellas */}
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Comentario */}
              <p className="text-gray-700 italic leading-relaxed flex-1 mb-6 lg:text-base">
                &ldquo;{review.comment}&rdquo;
              </p>

              {/* Autor */}
              <div className="flex items-center">
                <div className="w-11 h-11 lg:w-12 lg:h-12 bg-linear-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                  {review.initial}
                </div>
                <div className="ml-3">
                  <h4 className="font-bold text-gray-900">{review.name}</h4>
                  <p className="text-xs text-gray-500">Cliente verificado</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10 text-center border-t border-gray-100 pt-10">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl lg:text-4xl font-black text-gray-800 mb-1">
                {value}
              </div>
              <div className="text-sm lg:text-base text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
