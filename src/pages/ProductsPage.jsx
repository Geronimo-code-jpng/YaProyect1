import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import ProductsGrid from '../components/ProductsGrid';
import { supabaseClient } from '../db/supabeClient';

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [categoriaActual, setCategoriaActual] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  // Load products from Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabaseClient.from("productos").select()
        if (error) {
          console.error("Error loading products:", error);
          setIsLoading(false);
          return;
        }
        setAllProducts(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading products:", error);
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Get unique categories
  const categorias = ['Todas', ...new Set(allProducts.map(product => product.Categoria))];

  // Filter products based on category and search
  const productosFiltrados = allProducts.filter(product => {
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
    
    const matchesCategory = categoriaActual === 'Todas' || product.Categoria === categoriaActual;
    const matchesSearch = sanitizedName.includes(sanitizedSearchTerm);
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
            {categorias.map(categoria => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
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
