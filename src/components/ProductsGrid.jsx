import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

// Función para generar URL de imagen por defecto si no hay imagen personalizada
export const getDefaultProductImage = (productId) => {
  return `https://via.placeholder.com/300x300/f3f4f6/a1a1aa?text=Producto+${productId}`;
};

export default function ProductsGrid({ products }) {
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState(new Set());

  const handleAddToCart = (producto, event) => {
    event.preventDefault();
    event.stopPropagation();

    const nombreSeguro = producto.nombre
      ? producto.nombre.replace(/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ.-]/g, "").trim()
      : "Producto";
    const precioNumero = Number(producto.precio) || 0;
    const imgSrc =
      producto.Imagen ||
      producto.imagen ||
      getDefaultProductImage(producto.Id);

    addToCart({
      Id: producto.Id,
      nombre: nombreSeguro,
      precio: precioNumero,
      imagen: imgSrc,
      cantidad: 1,
    });

    // Visual feedback using React state
    setAddedToCart((prev) => new Set(prev).add(producto.Id));

    setTimeout(() => {
      setAddedToCart((prev) => {
        const newSet = new Set(prev);
        newSet.delete(producto.Id);
        return newSet;
      });
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
    <div
      id="productsGrid"
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
    >
      {products.map((producto) => {
        const unidadVenta =
          producto.Categoria || producto.categoria || "UNIDAD";
        const nombreSeguro = producto.nombre
          ? producto.nombre
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;")
              .trim()
          : "Producto";
        const precioNumero = Number(producto.precio) || 0;

        return (
          <Link
            key={producto.Id}
            to={`/producto/${producto.Id}`}
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
              {(() => {
                // Usar solo imágenes de Supabase Storage o placeholder
                const imgSrc = producto.Imagen || producto.imagen || getDefaultProductImage(producto.Id);
                return (
                  <img
                    src={imgSrc}
                    className="absolute inset-0 w-full h-full object-contain p-5 mix-blend-multiply"
                    alt={nombreSeguro}
                    onError={(e) => {
                      // Si falla la imagen, usar placeholder
                      if (e.target.src !== getDefaultProductImage(producto.Id)) {
                        e.target.src = getDefaultProductImage(producto.Id);
                      }
                    }}
                  />
                );
              })()}
              
              {/* Barra de SIN STOCK */}
              {(!producto.Stock && producto.Stock !== undefined) && (
                <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
                  <div className="bg-gray-600 text-white px-6 py-3 rounded-lg font-black text-lg shadow-lg transform rotate-12">
                    <i className="fas fa-times-circle mr-2"></i>
                    SIN STOCK
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-5 flex flex-col flex-1 border-t border-gray-100 bg-gray-50/50">
              <h3 className="text-sm text-gray-800 font-bold leading-snug mb-3 line-clamp-2 h-10">
                {nombreSeguro}
              </h3>
              <div className="mt-auto">
                {producto.Oferta && (
                  <p className="text-xs text-red-600 font-bold mb-1">
                    OFERTA: -${Number(producto.Oferta).toLocaleString("es-AR")}
                  </p>
                )}
                <p className="text-xs text-gray-500 font-semibold mb-1">
                  Precio x Bulto
                </p>
                <p className="text-3xl font-black text-zinc-900 tracking-tight">
                  ${precioNumero.toLocaleString("es-AR")}
                </p>
                <button
                  onClick={(e) => handleAddToCart(producto, e)}
                  disabled={!producto.Stock && producto.Stock !== undefined}
                  className={`mt-4 w-full border-2 py-2.5 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-sm group-hover:border-orange-700 ${
                    (!producto.Stock && producto.Stock !== undefined)
                      ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                      : addedToCart.has(producto.Id)
                      ? "bg-[#FF6600] text-white border-[#FF6600]"
                      : "bg-white text-[#FF6600] border-[#FF6600] hover:bg-[#FF6600] hover:text-white"
                  }`}
                >
                  <i
                    className={`fas ${
                      (!producto.Stock && producto.Stock !== undefined)
                        ? "fa-ban"
                        : addedToCart.has(producto.Id)
                        ? "fa-check"
                        : "fa-cart-plus"
                    }`}
                  ></i>
                  {(!producto.Stock && producto.Stock !== undefined)
                    ? "NO DISPONIBLE"
                    : addedToCart.has(producto.Id)
                    ? "AGREGADO"
                    : "AGREGAR"}
                </button>
              </div>
            </div>
          </Link>
        );
      })}    </div>
  );
}
