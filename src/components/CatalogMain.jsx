import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../contexts/ProductContext';
import CategoriesGrid from './CategoriesGrid';
import ProductsGrid from './ProductsGrid';

// Categories data
const CATEGORIAS = [
  { id: "SoloOfertas", nombre: " Ofertas Exclusivas", imagen: "./carpetafotos/ofertas.jpg" },
  { id: "Todas_Filtro", nombre: " Todos Los Productos", imagen: "./carpetafotos/todocatalogo.jpg" },
  { id: "ALIMENTO", nombre: " Alimentos", imagen: "./carpetafotos/alimentos.jpg" },
  { id: "BEBIDAS", nombre: " Bebidas", imagen: "./carpetafotos/bebidas.jpg" },
  { id: "LACTEOS", nombre: " Lácteos", imagen: "./carpetafotos/lacteos.jpg" },
  { id: "HARINA", nombre: " Harinas", imagen: "./carpetafotos/harinas.jpg" },
  { id: "ACEITE", nombre: " Aceites", imagen: "./carpetafotos/aceites.jpg" },
  { id: "AZUCAR", nombre: " Azúcares", imagen: "./carpetafotos/azucar.jpg" },
  { id: "VINOS", nombre: " Vinos", imagen: "./carpetafotos/vinos.jpg" },
  { id: "CERVEZAS", nombre: " Cervezas", imagen: "./carpetafotos/cervezas.jpg" },
  { id: "YERBA", nombre: " Yerbas", imagen: "./carpetafotos/yerbas.jpg" },
  { id: "APERITIVOS", nombre: " Aperitivos", imagen: "./carpetafotos/aperitivos.jpg" }
];

export default function CatalogMain() {
  const [categoriaActual, setCategoriaActual] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { products, isLoading, error } = useProducts();

  // Manejar errores
  useEffect(() => {
    if (error) {
      console.error("Error cargando productos:", error);
    }
  }, [error]);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    const sanitizedValue = e.target.value
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/["']/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    setSearchTerm(sanitizedValue);
  }, []);

  // Handle category click
  const handleCategoryClick = useCallback((categoria) => {
    setCategoriaActual(categoria);
    setSearchTerm("");
  }, []);

  // Filter products
  const filtrados = useMemo(() => {
    const term = searchTerm
      .replace(/[<>"']/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
      .trim();
    const estaBuscando = term !== "";

    return products.filter(p => {
      const productName = (p.nombre || "")
        .replace(/[<>"']/g, '')
        .toLowerCase();
      const coincideTexto = productName.includes(term);

      if (estaBuscando) return coincideTexto;

      if (categoriaActual === 'SoloOfertas') {
        return coincideTexto && (p.Oferta !== null && p.Oferta !== "");
      }

      if (categoriaActual === 'Todas_Filtro' || categoriaActual === 'Todas') {
        return coincideTexto;
      }

      return coincideTexto && p.Categoria === categoriaActual;
    });
  }, [products, searchTerm, categoriaActual]);

  // Determine what to show
  const estaBuscando = searchTerm.trim() !== "";
  const mostrarCategorias = !estaBuscando && (categoriaActual === 'Todas' || categoriaActual === 'inicio');

  // Get section title
  const getSectionTitle = () => {
    if (estaBuscando) {
      return `Resultados para "${searchTerm}"`;
    } else if (categoriaActual === 'SoloOfertas') {
      return '🔥 Ofertas Exclusivas';
    } else if (categoriaActual === 'Todas_Filtro' || categoriaActual === 'Todas') {
      return 'Todo el Catálogo';
    } else {
      return categoriaActual;
    }
  };

  // Get results count text
  const getResultsCount = () => {
    if (mostrarCategorias) {
      return 'Categorías';
    } else {
      return `${filtrados.length} productos`;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-3"></i>
        <p className="text-lg font-bold text-gray-500">Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar productos..."
          className="w-full max-w-md mx-auto block px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF6600] focus:outline-none"
        />
      </div>

      {/* Section Title and Results Count */}
      <div className="mb-6 text-center">
        <h2 id="tituloSeccion" className="text-2xl font-bold text-gray-800 mb-2">
          {getSectionTitle()}
        </h2>
        <p id="resultsCount" className="text-gray-600">
          {getResultsCount()}
        </p>
      </div>

      {/* Categories Grid */}
      {mostrarCategorias && (
        <CategoriesGrid 
          categories={CATEGORIAS}
          onCategoryClick={handleCategoryClick}
        />
      )}

      {/* Products Grid */}
      {!mostrarCategorias && (
        <ProductsGrid 
          products={filtrados} 
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}
