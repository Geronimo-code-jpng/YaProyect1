import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../contexts/ProductContext';
import ProductsGrid from '../components/ProductsGrid';
import { useSearchParams } from 'react-router-dom';

export default function ProductsPage() {
  const [categoriaActual, setCategoriaActual] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { products, isLoading, error, refreshProducts } = useProducts();
  const [searchParams] = useSearchParams();

  // Obtener parámetros de la URL
  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    if (category) {
      // Convert category parameter to display format
      const categoryMap = {
        'soloofertas': 'SoloOfertas',
        'todas_filtro': 'Todas_Filtro',
        'alimento': 'ALIMENTO',
        'bebidas': 'BEBIDAS',
        'lacteos': 'LACTEOS',
        'harina': 'HARINA',
        'aceite': 'ACEITE',
        'vinos': 'VINOS',
        'cervezas': 'CERVEZAS',
        'yerba': 'YERBA',
        'aperitivos': 'APERITIVOS'
      };
      
      const normalizedCategory = categoryMap[categoryFromUrl.toLowerCase()] || categoryFromUrl.toUpperCase();
      setCategoriaActual(normalizedCategory);
    }
  }, [searchParams]);

  // Get unique categories
  const categorias = ['Todas', 'SoloOfertas', 'Todas_Filtro', ...new Set(products.map(product => product.Categoria))];

  // Filter products based on category and search
  const productosFiltrados = products.filter(product => {
    // Sanitize search term
    const sanitizedSearchTerm = searchTerm
      .replace(/[<>"']/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim();
    
    // Sanitize product name
    const sanitizedName = (product.nombre || "")
      .replace(/[<>"']/g, '')
      .toLowerCase();
    
    const matchesSearch = sanitizedName.includes(sanitizedSearchTerm);
    
    // Handle special categories
    if (categoriaActual === 'SoloOfertas') {
      return matchesSearch && (product.Oferta !== null && product.Oferta !== "");
    }
    
    if (categoriaActual === 'Todas_Filtro' || categoriaActual === 'Todas') {
      return matchesSearch;
    }
    
    // Handle regular categories
    const matchesCategory = categoriaActual === 'Todas' || product.Categoria === categoriaActual;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-black text-zinc-900 mb-8">Todos los Productos</h1>
      
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
                .replace(/[<>]/g, '')
                .replace(/["']/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              setSearchTerm(sanitizedValue);
            }}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
          />
          <select
            value={categoriaActual}
            onChange={(e) => setCategoriaActual(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
          >
            {categorias.map(categoria => {
              let displayLabel = categoria;
              if (categoria === 'SoloOfertas') displayLabel = '🔥 Ofertas Exclusivas';
              else if (categoria === 'Todas_Filtro') displayLabel = 'Todos Los Productos';
              else if (categoria === 'Todas') displayLabel = 'Todas las Categorías';
              
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
          <p className="text-lg font-bold text-gray-500">Cargando productos...</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <i className="fas fa-search text-6xl mb-4"></i>
          <p className="text-lg font-bold">No se encontraron productos</p>
        </div>
      ) : (
        <ProductsGrid 
          products={productosFiltrados} 
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}
