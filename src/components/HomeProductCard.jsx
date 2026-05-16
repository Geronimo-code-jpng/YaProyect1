import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useCart } from '../contexts/CartContext';

/**
 * Componente para mostrar un producto en la página de inicio.
 * 
 * @param {object} product - Objeto con información del producto.
 * @param {boolean} compact - Indica si se debe mostrar la versión compacta del componente.
 */
export default function HomeProductCard({ product, compact = false }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    // Preparar el producto para el carrito con la estructura correcta
    const productForCart = {
      Id: product.id || product.Id,
      nombre: product.name || product.nombre,
      precio: product.price || product.precio,
      precio_unitario: product.price || product.precio_unitario,
      cantidad: quantity,
      imagen: product.image || product.imagen,
      tipo: product.tipo || "Bulto",
      quantity_per_bundle: product.quantity_per_bundle || 1,
      originalPrice: product.originalPrice,
      discount: product.discount,
      inStock: product.inStock
    };

    addToCart(productForCart);
    
    // Resetear cantidad a 1 después de agregar
    setQuantity(1);
  };

  if (compact) {
    return (
      <div className="flex flex-col bg-white rounded-xl h-full shadow-md hover:shadow-lg transition-shadow p-3 sm:p-4">
        <div className="h-40 sm:h-52 bg-gray-100 rounded-xl mb-3 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300/f3f4f6/a1a1aa?text=Producto';
            }}
          />
        </div>
        
        <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 mb-2 leading-snug min-h-10">
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-2 mb-3 flex-wrap">
          <span className={`text-xl sm:text-2xl font-black tracking-tight ${product.originalPrice ? 'text-red-600' : 'text-orange-600'}`}>
            ${product.price ? product.price.toLocaleString() : '0'}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through font-medium">
              ${product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        
        <button
          onClick={handleAddToCart}
          className="w-full bg-orange-500 mt-auto hover:bg-orange-600 text-white py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 shadow-sm"
        >
          Agregar
        </button>
      </div>
    );
  }

  // Versión normal para 3 columnas
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4">
      {/* Badge de descuento */}
      {product.discount && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-2 py-1 rounded-lg font-bold text-xs">
          -{product.discount}%
        </div>
      )}
      
      <div className="h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
        <img
          src={product.image || product.imagen || "https://via.placeholder.com/150x150"}
          alt={product.name || product.nombre || "Producto"}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        
        {/* Indicador de stock */}
        {product.inStock && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
            En stock
          </div>
        )}
      </div>
      
      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
        {product.name}
      </h3>
      
      <p className="text-sm text-gray-500 mb-2">{product.quantity}</p>
      
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className={`text-xl font-bold ${product.originalPrice ? 'text-red-600' : 'text-orange-600'}`}>
            ${product.price ? product.price.toLocaleString() : '0'}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through ml-2">
              ${product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      
      {/* Selector de cantidad y botón agregar */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition flex items-center justify-center"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

HomeProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    nombre: PropTypes.string,
    price: PropTypes.number,
    precio: PropTypes.number,
    precio_unitario: PropTypes.number,
    image: PropTypes.string,
    imagen: PropTypes.string,
    tipo: PropTypes.string,
    quantity_per_bundle: PropTypes.number,
    originalPrice: PropTypes.number,
    discount: PropTypes.number,
    inStock: PropTypes.bool,
    quantity: PropTypes.number
  }).isRequired,
  compact: PropTypes.bool
};
