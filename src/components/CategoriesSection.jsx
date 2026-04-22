import { Link } from "react-router-dom";

// Categorías reales del sistema (misma configuración que CategoriesGrid)
const CATEGORIAS = [
  {
    id: "SoloOfertas",
    nombre: " Ofertas Exclusivas",
    imagen: "./ofertas.jpg",
  },
  {
    id: "",
    nombre: " Todos Los Productos",
    imagen: "./todos.jpg",
  },
  {
    id: "ALIMENTO",
    nombre: " Alimentos",
    imagen: "./arroz.jpg",
  },
  { id: "BEBIDAS", nombre: " Bebidas", imagen: "./gaseosas.jpg" },
  { id: "LACTEOS", nombre: " Lácteos", imagen: "./lacteos.jpg" },
  { id: "HARINA", nombre: " Harinas", imagen: "./harina.jpg" },
  { id: "ACEITE", nombre: " Aceites", imagen: "./aceite.jpg" },
  { id: "AZUCAR", nombre: " Azúcares", imagen: "./azucar.jpg" },
  { id: "VINOS", nombre: " Vinos", imagen: "./vinos.jpg" },
  {
    id: "CERVEZAS",
    nombre: " Cervezas",
    imagen: "./cervezas.jpg",
  },
  { id: "YERBA", nombre: " Yerbas", imagen: "./yerba.jpg" },
  {
    id: "APERITIVOS",
    nombre: " Aperitivos",
    imagen: "./aperitivos.jpg",
  },
  {
    id: "CIGARRILLOS",
    nombre: "Cigarrillos",
    imagen: "./cigarrillos.jpg",
  },
  { id: "LIMPIEZA", nombre: "Limpieza", imagen: "./limpieza.jpg" },
  { id: "SALES", nombre: "Sales", imagen: "./sales.jpg" },
];

export default function CategoriesSection() {
  return (
    <section className="py-16 bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            Explora nuestras <span className="text-[#FF6600]">Categorías</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestra amplia gama de productos para tu hogar o negocio
          </p>
        </div>

        {/* Categories Grid - Usando el mismo diseño que CategoriesGrid pero mejorado */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {CATEGORIAS.map((categoria) => (
            <Link
              key={categoria.id}
              to={`/productos?categoria=${categoria.id.toLowerCase()}`}
              className="group relative overflow-hidden rounded-2xl cursor-pointer transform transition hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center justify-center text-center h-48 md:h-56"
            >
              {/* Imagen de fondo */}
              <img
                src={categoria.imagen}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt={categoria.nombre}
              />

              {/* Overlay para mejor legibilidad */}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-transparent group-hover:from-black/60 group-hover:via-black/30 transition-all duration-300"></div>

              {/* Contenido */}
              <div className="relative z-10 p-6 text-white h-full flex flex-col justify-end">
                {/* Título */}
                <h3 className="font-black text-xl md:text-2xl tracking-wide leading-tight drop-shadow-lg mb-2">
                  {categoria.nombre.trim()}
                </h3>

                {/* Indicador de productos */}
                <div className="flex items-center justify-center text-white/90 text-sm font-medium group-hover:text-white transition-colors">
                  <span>Ver productos</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <h3 className="text-2xl font-black text-gray-900 mb-4">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-gray-600 mb-6">
              Contáctanos y te ayudaremos a encontrar el producto perfecto para
              tus necesidades
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/productos"
                className="bg-[#FF6600] hover:bg-[#E55500] text-white px-8 py-3 rounded-full font-bold transition inline-flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Ver todos los productos
              </Link>
              <button
                onClick={() =>
                  window.open("https://wa.me/03425084197", "_blank")
                }
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold transition inline-flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.885-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
                </svg>
                Contactar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
