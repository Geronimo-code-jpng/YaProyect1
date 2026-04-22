import { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useProducts } from "../contexts/ProductContext";
import ProductsGrid from "../components/ProductsGrid";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ProductsPage() {
  const [categoriaActual, setCategoriaActual] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const { addToCart } = useCart();
  const { products, isLoading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Obtener parámetros de la URL
  const category = searchParams.get("categoria");
  const search = searchParams.get("search");

  // Actualizar estado con los parámetros
  if (category) {
    const categoryMap = {
      soloofertas: "SoloOfertas",
      alimento: "ALIMENTO",
      bebidas: "BEBIDAS",
      lacteos: "LACTEOS",
      harina: "HARINA",
      aceite: "ACEITE",
      vinos: "VINOS",
      limpieza: "LIMPIEZA",
      sales: "SALES",
      cervezas: "CERVEZAS",
      yerba: "YERBA",
      aperitivos: "APERITIVOS",
      cigarrillos: "CIGARRILLOS",
    };

    const normalizedCategory =
      categoryMap[category.toLowerCase()] || category.toUpperCase();
    if (normalizedCategory !== categoriaActual) {
      setCategoriaActual(normalizedCategory);
    }
  } else if (categoriaActual !== "Todas") {
    // Si no hay categoría en URL, asegurarse de que esté en 'Todas'
    setCategoriaActual("Todas");
  }

  if (search && search !== searchTerm) {
    setSearchTerm(search);
  }

  // Function to handle category change and update URL
  const handleCategoryChange = (newCategory) => {
    setCategoriaActual(newCategory);

    // Update URL based on category
    if (newCategory === "Todas") {
      navigate("/productos");
    } else {
      // Convert category to URL-friendly format
      const categoryMap = {
        SoloOfertas: "soloofertas",
        ALIMENTO: "alimento",
        BEBIDAS: "bebidas",
        LACTEOS: "lacteos",
        HARINA: "harina",
        ACEITE: "aceite",
        VINOS: "vinos",
        CERVEZAS: "cervezas",
        LIMPIEZA: "limpieza",
        SALES: "sales",
        YERBA: "yerba",
        APERITIVOS: "aperitivos",
        CIGARRILLOS: "cigarrillos",
      };

      const urlCategory = categoryMap[newCategory] || newCategory.toLowerCase();
      navigate(`/productos?categoria=${urlCategory}`);
    }
  };

  // Get unique categories
  const categorias = [
    "Todas",
    "SoloOfertas",
    ...new Set(products.map((product) => product.Categoria)),
  ];

  // Filter products based on category and search
  const productosFiltrados = products.filter((product) => {
    // Sanitize search term
    const sanitizedSearchTerm = searchTerm
      .replace(/[<>"']/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();

    // Sanitize product name
    const sanitizedName = (product.nombre || "")
      .replace(/[<>"']/g, "")
      .toLowerCase();

    const matchesSearch = sanitizedName.includes(sanitizedSearchTerm);

    // Handle special categories
    if (categoriaActual === "SoloOfertas") {
      return matchesSearch && product.Oferta !== null && product.Oferta !== "";
    }

    if (categoriaActual === "Todas_Filtro" || categoriaActual === "Todas") {
      return matchesSearch;
    }

    // Handle regular categories
    const matchesCategory =
      categoriaActual === "Todas" || product.Categoria === categoriaActual;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-black text-zinc-900 mb-8">
        Todos los Productos
      </h1>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => {
              // Sanitize input
              const sanitizedValue = e.target.value
                .replace(/[<>]/g, "")
                .replace(/["']/g, "")
                .replace(/\s+/g, " ")
                .trim();
              setSearchTerm(sanitizedValue);
            }}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
          />
          <select
            value={categoriaActual}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
          >
            {categorias.map((categoria) => {
              let displayLabel = categoria;
              if (categoria === "SoloOfertas")
                displayLabel = "🔥 Ofertas Exclusivas";
              else if (categoria === "Todas_Filtro")
                displayLabel = "Todos Los Productos";
              else if (categoria === "Todas")
                displayLabel = "Todas las Categorías";

              return (
                <option key={categoria} value={categoria}>
                  {displayLabel}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-4"></i>
          <p className="text-lg font-bold text-gray-500">
            Cargando productos...
          </p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <i className="fas fa-search text-6xl mb-4"></i>
          <p className="text-lg font-bold">No se encontraron productos</p>
        </div>
      ) : (
        <ProductsGrid products={productosFiltrados} onAddToCart={addToCart} />
      )}
    </div>
  );
}
