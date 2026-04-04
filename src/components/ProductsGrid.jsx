import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useState } from 'react';

export default function ProductsGrid({ products, onAddToCart }) {
  const { addToCart } = useCart();

  const handleAddToCart = (producto, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const nombreSeguro = producto.nombre ? producto.nombre.replace(/"/g, '&quot;').replace(/'/g, '&#39;').trim() : 'Producto';
    const precioNumero = Number(producto.precio) || 0;
    const imgSrc = producto.Imagen || producto.imagen || 'https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Sin+Foto';

    addToCart({
      id: producto.id,
      nombre: nombreSeguro,
      precio: precioNumero,
      imagen: imgSrc,
      cantidad: 1
    });
    
    // Visual feedback
    const button = event.currentTarget;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> AGREGADO';
    button.classList.add('bg-[#FF6600]', 'text-white');
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('bg-[#FF6600]', 'text-white');
    }, 1000);
  };

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-10 text-gray-400 font-bold">
        No se encontraron productos.
      </div>
    );
  }

  return (
    <div id="productsGrid" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {products.map((producto) => {
        const imgSrc = producto.Imagen || producto.imagen || 'https://via.placeholder.com/300/f3f4f6/a1a1aa?text=Sin+Foto';
        const unidadVenta = producto.Categoria || producto.categoria || 'UNIDAD';
        const nombreSeguro = producto.nombre ? producto.nombre.replace(/"/g, '&quot;').replace(/'/g, '&#39;').trim() : 'Producto';
        const precioNumero = Number(producto.precio) || 0;

        return (
          <Link
            key={producto.id}
            to={`/producto/${producto.id}`}
            className="product-card bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col relative hover:shadow-lg transition-shadow group"
          >
            {/* Badges */}
            <div className="absolute top-3 left-3 bg-yellow-400 text-black text-[11px] font-black px-2.5 py-1 rounded shadow-md uppercase z-10">
              {unidadVenta}
            </div>
            {producto.Oferta && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded shadow-md uppercase z-10 animate-pulse">
                <i className="fas fa-fire"></i> OFERTA
              </div>
            )}

            {/* Product Image */}
            <div className="relative pt-[100%] bg-white p-4">
              <img 
                src={imgSrc} 
                className="absolute inset-0 w-full h-full object-contain p-5 mix-blend-multiply" 
                alt={nombreSeguro}
              />
            </div>

            {/* Product Info */}
            <div className="p-5 flex flex-col flex-1 border-t border-gray-100 bg-gray-50/50">
              <h3 className="text-sm text-gray-800 font-bold leading-snug mb-3 line-clamp-2 h-10">
                {nombreSeguro}
              </h3>
              <div className="mt-auto">
                {producto.Oferta && (
                  <p className="text-xs text-red-600 font-bold mb-1">
                    OFERTA: -${Number(producto.Oferta).toLocaleString('es-AR')}
                  </p>
                )}
                <p className="text-xs text-gray-500 font-semibold mb-1">
                  Precio x {unidadVenta.toLowerCase()}
                </p>
                <p className="text-3xl font-black text-zinc-900 tracking-tight">
                  ${precioNumero.toLocaleString('es-AR')}
                </p>
                <button 
                  onClick={(e) => handleAddToCart(producto, e)}
                  className="mt-4 w-full bg-white border-2 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white py-2.5 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-sm group-hover:border-orange-700"
                >
                  <i className="fas fa-cart-plus"></i> 
                  AGREGAR
                </button>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
