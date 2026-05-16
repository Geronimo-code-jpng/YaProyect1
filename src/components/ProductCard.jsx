import { ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import React, {  useState  } from 'react';
import PropTypes from 'prop-types';

export default function ProductCard({ product, compact = false }) {
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState(product.tipo_venta === 'unidad' ? 'unidad' : 'bulto');

  const updateQuantity = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const handleAddToCart = () => {
    // Aquí iría la lógica para agregar al carrito
    const cartItem = {
      ...product,
      cantidad: quantity,
      tipo: purchaseType,
      precio_unitario: purchaseType === 'bulto' ? product.precio_bulto : product.precio_unidad,
      quantity_per_bundle: product.cantidad_por_bulto || 1
    };
    console.log(`Agregando ${quantity} ${purchaseType}(s) de ${product.name} al carrito`, cartItem);
  };

  const getPrice = () => {
    if (purchaseType === 'bulto') {
      return product.precio_bulto || product.precio;
    }
    return product.precio_unidad || product.precio;
  };

  const getUnitPrice = () => {
    if (purchaseType === 'bulto') {
      const bulkPrice = product.precio_bulto || product.precio;
      const unitsPerBulk = product.cantidad_por_bulto || 1;
      return bulkPrice / unitsPerBulk;
    }
    return product.precio_unidad || product.precio;
  };

  if (compact) {
    // Versión compacta para 4 columnas
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-3">
        <div className="h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        {/* Unit/Bulk selector */}
        {product.tipo_venta === 'ambos' && (
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setPurchaseType('unidad')}
              className={`flex-1 text-xs px-2 py-1 rounded font-medium transition ${
                purchaseType === 'unidad' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Unidad
            </button>
            <button
              onClick={() => setPurchaseType('bulto')}
              className={`flex-1 text-xs px-2 py-1 rounded font-medium transition ${
                purchaseType === 'bulto' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Bulto
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className={`text-lg font-bold ${product.originalPrice ? 'text-red-600' : 'text-orange-600'}`}>
              ${getPrice().toLocaleString()}
            </span>
            {purchaseType === 'bulto' && product.cantidad_por_bulto > 1 && (
              <span className="text-xs text-gray-500 ml-1">
                ($${getUnitPrice().toLocaleString()} c/u)
              </span>
            )}
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through block">
                ${product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={handleAddToCart}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium text-sm transition flex items-center justify-center"
        >
          <ShoppingCart className="w-4 h-4 mr-1" />
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
          src={product.image}
          alt={product.name}
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
      
      {/* Unit/Bulk selector */}
      {product.tipo_venta === 'ambos' && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setPurchaseType('unidad')}
            className={`flex-1 text-sm px-3 py-2 rounded-lg font-medium transition ${
              purchaseType === 'unidad' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <Package className="w-4 h-4 mr-1" />
            Unidad
          </button>
          <button
            onClick={() => setPurchaseType('bulto')}
            className={`flex-1 text-sm px-3 py-2 rounded-lg font-medium transition ${
              purchaseType === 'bulto' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <Package className="w-4 h-4 mr-1" />
            Bulto
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className={`text-xl font-bold ${product.originalPrice ? 'text-red-600' : 'text-orange-600'}`}>
            ${getPrice().toLocaleString()}
          </span>
          {purchaseType === 'bulto' && product.cantidad_por_bulto > 1 && (
            <div className="text-sm text-gray-500">
              <span className="block">(${product.cantidad_por_bulto} unidades)</span>
              <span>($${getUnitPrice().toLocaleString()} c/u)</span>
            </div>
          )}
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through block">
              ${product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      
      {/* Selector de cantidad y botón agregar */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => updateQuantity(-1)}
            className="p-1 hover:bg-gray-100 transition"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-2 py-1 font-medium text-sm">
            {quantity}
          </span>
          <button
            onClick={() => updateQuantity(1)}
            className="p-1 hover:bg-gray-100 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition flex items-center justify-center"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Agregar
        </button>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    tipo_venta: PropTypes.string,
    precio_bulto: PropTypes.number,
    precio_unidad: PropTypes.number,
    cantidad_por_bulto: PropTypes.number,
    name: PropTypes.string,
    precio: PropTypes.number,
    image: PropTypes.string,
    originalPrice: PropTypes.number,
    discount: PropTypes.number,
    inStock: PropTypes.bool,
    quantity: PropTypes.number
  }).isRequired,
  compact: PropTypes.bool
};
