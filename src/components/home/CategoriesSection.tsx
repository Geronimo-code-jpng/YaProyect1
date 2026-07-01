import { Link, useNavigate } from "react-router-dom";

const CATEGORIAS = [
  { id: "SoloOfertas", nombre: "Ofertas Exclusivas", imagen: "./ofertas.jpg" },
  { id: "", nombre: "Todos Los Productos", imagen: "./todos.jpg" },
  { id: "ALIMENTO", nombre: "Alimentos", imagen: "./arroz.jpg" },
  { id: "BEBIDAS", nombre: "Bebidas", imagen: "./gaseosas.jpg" },
  { id: "LACTEOS", nombre: "Lácteos", imagen: "./lacteos.jpg" },
  { id: "HARINA", nombre: "Harinas", imagen: "./harina.jpg" },
  { id: "ACEITE", nombre: "Aceites", imagen: "./aceite.jpg" },
  { id: "AZUCAR", nombre: "Azúcares", imagen: "./azucar.jpg" },
  { id: "VINOS", nombre: "Vinos", imagen: "./vinos.jpg" },
  { id: "CERVEZAS", nombre: "Cervezas", imagen: "./cervezas.jpg" },
  { id: "YERBA", nombre: "Yerbas", imagen: "./yerba.jpg" },
  { id: "APERITIVOS", nombre: "Aperitivos", imagen: "./aperitivos.jpg" },
  { id: "CIGARRILLOS", nombre: "Cigarrillos", imagen: "./cigarrillos.jpg" },
  { id: "LIMPIEZA", nombre: "Limpieza", imagen: "./limpieza.jpg" },
  { id: "SALES", nombre: "Sales", imagen: "./sales.jpg" },
];

// ─── Tarjeta de categoría reutilizable ────────────────────────────────────────
function CategoriaCard({ categoria, size = "md" }) {
  const heights = {
    lg: "h-52 sm:h-64",
    md: "h-32 sm:h-40 lg:h-44",
    sm: "h-24 lg:h-32",
  };

  return (
    <Link
      to={`/productos?categoria=${categoria.id.toLowerCase()}`}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center ${heights[size]} transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl`}
    >
      {/* Imagen de fondo */}
      <img
        src={categoria.imagen}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        alt={categoria.nombre}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-transparent group-hover:from-black/60 transition-all duration-300" />

      {/* Contenido */}
      <div className="relative z-10 p-3 text-white h-full flex flex-col justify-end pb-4">
        <h3
          className={`font-black leading-tight drop-shadow-lg ${
            size === "lg"
              ? "text-xl sm:text-2xl mb-2"
              : size === "md"
              ? "text-sm sm:text-base lg:text-lg mb-1"
              : "text-xs sm:text-sm mb-1"
          }`}
        >
          {categoria.nombre}
        </h3>
        <div className="flex items-center justify-center text-white/80 text-xs font-medium group-hover:text-white transition-colors">
          <span>Ver productos</span>
          <svg
            className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"
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

      {/* Brillo en hover */}
      <div className="absolute inset-0 bg-linear-to-br from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  );
}


export default function CategoriesSection() {
  const navigate = useNavigate();

  return (
    <section className="py-6 sm:py-8 lg:py-14 bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-4 lg:mb-8">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-gray-800">
            Categorías
          </h2>
          <button
            onClick={() => navigate("/productos")}
            className="text-gray-600 hover:text-black font-bold px-4 py-2 rounded-full transition-colors text-sm lg:text-base"
          >
            Ver todas →
          </button>
        </div>

        {/* ── MOBILE: 2 tarjetas grandes (comportamiento original) ─────────── */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {CATEGORIAS.slice(0, 2).map((cat) => (
            <CategoriaCard key={cat.id} categoria={cat} size="lg" />
          ))}
        </div>

        {/* ── DESKTOP: grilla completa con todas las categorías ─────────────
              Fila 1: 2 destacadas más grandes
              Fila 2+: resto en grid de 5 columnas
        ──────────────────────────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-4">

          {/* Fila destacada: las 2 primeras más grandes */}
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIAS.slice(0, 2).map((cat) => (
              <CategoriaCard key={cat.id} categoria={cat} size="lg" />
            ))}
          </div>

          {/* Resto de categorías en grid de 5 columnas */}
          <div className="grid grid-cols-5 gap-3">
            {CATEGORIAS.slice(2).map((cat) => (
              <CategoriaCard key={cat.id} categoria={cat} size="md" />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}