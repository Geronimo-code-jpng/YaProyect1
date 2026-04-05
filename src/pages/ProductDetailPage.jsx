import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabaseClient } from '../db/supabeClient';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("productos")
          .select('*')
          .eq('Id', id)
          .single();
        
        if (error) {
          console.error("Error loading product:", error);
          setIsLoading(false);
          return;
        }
        
        setProduct(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading product:", error);
        setIsLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        ...product,
        cantidad: quantity
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-4"></i>
          <p className="text-lg font-bold text-gray-500">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-gray-400">
          <i className="fas fa-exclamation-circle text-6xl mb-4"></i>
          <p className="text-lg font-bold">Producto no encontrado</p>
          <Link 
            to="/productos" 
            className="mt-4 inline-block bg-[#FF6600] text-white px-6 py-3 rounded-xl font-black hover:bg-orange-700 transition"
          >
            Volver a Productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link to="/" className="text-gray-500 hover:text-[#FF6600]">Inicio</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link to="/productos" className="text-gray-500 hover:text-[#FF6600]">Productos</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-zinc-900 font-black">{product.nombre}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="bg-gray-100 rounded-2xl overflow-hidden">
          <img
            src={product.imagen || 'https://via.placeholder.com/600/f3f4f6/a1a1aa?text=Producto'}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <span className="inline-block px-3 py-1 bg-[#FF6600]/10 text-[#FF6600] rounded-full text-sm font-black mb-3">
              {product.Categoria}
            </span>
            <h1 className="text-4xl font-black text-zinc-900 mb-4">{product.nombre}</h1>
            <p className="text-3xl font-black text-[#FF6600]">
              ${product.precio?.toLocaleString('es-AR')}
            </p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-black text-zinc-900 mb-2">Descripción</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.descripcion || 'Producto de alta calidad seleccionado cuidadosamente para ofrecer la mejor experiencia a nuestros clientes.'}
            </p>
          </div>

          {/* Quantity Selector */}
          <div>
            <h3 className="text-lg font-black text-zinc-900 mb-3">Cantidad</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#FF6600] transition font-black text-xl"
              >
                -
              </button>
              <span className="text-xl font-black w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#FF6600] transition font-black text-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-[#FF6600] text-white text-lg font-black py-4 rounded-xl hover:bg-orange-700 transition shadow-lg"
          >
            <i className="fas fa-shopping-cart mr-2"></i>
            Agregar al Carrito
          </button>

          {/* Product Features */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-black text-zinc-900 mb-4">Características</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="text-gray-600">Stock disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-truck text-[#FF6600]"></i>
                <span className="text-gray-600">Envío a domicilio</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-shield-alt text-blue-500"></i>
                <span className="text-gray-600">Garantía de calidad</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-credit-card text-purple-500"></i>
                <span className="text-gray-600">Múltiples medios de pago</span>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <Link
            to="/productos"
            className="inline-flex items-center text-gray-500 hover:text-[#FF6600] font-medium transition"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a Productos
          </Link>
        </div>
      </div>
    </div>
  );
}
