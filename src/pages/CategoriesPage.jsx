import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase as supabaseClient } from '../lib/supabase';

export default function CategoriesPage() {
  const [allProducts, setAllProducts] = useState([]);
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

  // Group products by category
  const productsByCategory = allProducts.reduce((acc, product) => {
    const category = product.Categoria || 'Sin Categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  const categoryColors = {
    'BEBIDAS': 'bg-blue-100 text-blue-800',
    'ALIMENTO': 'bg-green-100 text-green-800',
    'LACTEOS': 'bg-yellow-100 text-yellow-800',
    'ACEITE': 'bg-amber-100 text-amber-800',
    'AZUCAR': 'bg-pink-100 text-pink-800',
    'YERBA': 'bg-emerald-100 text-emerald-800',
  };

  const categoryIcons = {
    'BEBIDAS': 'fa-bottle-water',
    'ALIMENTO': 'fa-utensils',
    'LACTEOS': 'fa-cheese',
    'ACEITE': 'fa-droplet',
    'AZUCAR': 'fa-cube',
    'YERBA': 'fa-mug-hot',
  };

  const getCategoryInfo = (category) => ({
    color: categoryColors[category] || 'bg-gray-100 text-gray-800',
    icon: categoryIcons[category] || 'fa-box'
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-black text-zinc-900 mb-8">Categorías</h1>
      
      {isLoading ? (
        <div className="text-center py-20">
          <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-4"></i>
          <p className="text-lg font-bold text-gray-500">Cargando categorías...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(productsByCategory).map(([category, products]) => {
            const categoryInfo = getCategoryInfo(category);
            return (
              <Link
                key={category}
                to={`/productos?categoria=${encodeURIComponent(category)}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${categoryInfo.color}`}>
                      <i className={`fas ${categoryInfo.icon} text-2xl`}></i>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-black ${categoryInfo.color}`}>
                      {products.length} productos
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-zinc-900 mb-3 group-hover:text-[#FF6600] transition-colors">
                    {category}
                  </h3>
                  
                  <div className="space-y-2">
                    {products.slice(0, 3).map((product) => (
                      <div key={product.Id || product.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 truncate flex-1">{product.nombre}</span>
                        <span className="font-black text-zinc-900 ml-2">${product.precio?.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                    {products.length > 3 && (
                      <p className="text-sm text-gray-500 font-medium">
                        +{products.length - 3} productos más
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-[#FF6600] font-black text-sm group-hover:underline">
                      Ver todos →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
