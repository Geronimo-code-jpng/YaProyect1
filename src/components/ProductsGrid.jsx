import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import PropTypes from 'prop-types';

// Función para generar URL de imagen por defecto si no hay imagen personalizada
export const getDefaultProductImage = (productId) => {
  return `https://via.placeholder.com/300x300/f3f4f6/a1a1aa?text=Producto+${productId}`;
};

export default function ProductsGrid({ products }) {
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState(new Set());
  const [selectedTypes, setSelectedTypes] = useState({});

  // Initialize selectedTypes to "Bulto" for products with solo_bulto
  useEffect(() => {
    const initialTypes = {};
    products.forEach((producto) => {
      if (producto.solo_bulto) {
        initialTypes[producto.Id] = "Bulto";
      }
    });
    if (Object.keys(initialTypes).length > 0) {
      setSelectedTypes((prev) => ({ ...prev, ...initialTypes }));
    }
  }, [products]);

  const getDiscount = (producto) => {
    const d = parseInt(producto.Oferta) || 0;
    return d > 0 && d < Number(producto.precio) ? d : 0;
  };

  const handleAddToCart = (producto, event, tipo = "Bulto") => {
    event.preventDefault();
    event.stopPropagation();

    const nombreSeguro = producto.nombre
      ? producto.nombre.replace(/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ.-]/g, "").trim()
      : "Producto";
    const imgSrc =
      producto.Imagen || producto.imagen || getDefaultProductImage(producto.Id);

    const bundleOriginal = Number(producto.precio) || 0;
    const discount = getDiscount(producto);
    const quantityPerBundle = producto.quantity || 1;
    const unitOriginal = Math.ceil((bundleOriginal / quantityPerBundle) * 1.2 / 10) * 10;
    const bundlePrice =
      discount > 0 ? bundleOriginal - discount : bundleOriginal;
    const finalPrice = tipo === "Bulto" ? bundlePrice : unitOriginal;

    addToCart({
      Id: producto.Id,
      nombre: nombreSeguro,
      precio: finalPrice,
      imagen: imgSrc,
      cantidad: 1,
      tipo: tipo,
      precio_unitario: finalPrice,
      quantity_per_bundle: quantityPerBundle,
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
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-6"
    >
      {products.map((producto) => {
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
            className="product-card bg-white rounded-sm border border-gray-200 overflow-hidden flex flex-col relative hover:shadow-lg transition-shadow group"
          >
            {producto.Oferta && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded shadow-md uppercase z-10 animate-pulse">
                <i className="fas fa-fire"></i> OFERTA
              </div>
            )}

            {/* Product Image */}
            <div className="relative pt-[100%] bg-white p-4">
              {(() => {
                // Usar solo imágenes de Supabase Storage o placeholder
                const imgSrc =
                  producto.Imagen ||
                  producto.imagen ||
                  getDefaultProductImage(producto.Id);
                return (
                  <img
                    src={imgSrc}
                    className="absolute inset-0 w-full h-full object-contain p-5 mix-blend-multiply"
                    alt={nombreSeguro}
                    onError={(e) => {
                      // Si falla la imagen, usar placeholder
                      if (
                        e.target.src !== getDefaultProductImage(producto.Id)
                      ) {
                        e.target.src = getDefaultProductImage(producto.Id);
                      }
                    }}
                  />
                );
              })()}

              {/* Barra de SIN STOCK */}
              {!producto.Stock && producto.Stock !== undefined && (
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
                {/* Unit/Bundle Selector */}
                <div className="flex gap-2 mb-3">
                  {!producto.solo_bulto && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedTypes((prev) => ({
                          ...prev,
                          [producto.Id]: "Unidad",
                        }));
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition ${
                        (selectedTypes[producto.Id] || "Bulto") === "Unidad"
                          ? "bg-[#FF6600] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <i className="fas fa-box text-xs mr-1"></i>
                      Unidad
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedTypes((prev) => ({
                        ...prev,
                        [producto.Id]: "Bulto",
                      }));
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition ${
                      (selectedTypes[producto.Id] || "Bulto") === "Bulto"
                        ? "bg-[#FF6600] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <i className="fas fa-boxes text-xs mr-1"></i>
                    Bulto
                  </button>
                </div>
                {producto.solo_bulto && (
                  <p className="text-xs text-blue-600 mb-2 font-medium">
                    <i className="fas fa-info-circle mr-1"></i>
                    Solo bulto
                  </p>
                )}

                {/* Dynamic Price */}
                {(() => {
                  const bundleOriginal = precioNumero;
                  const discount = getDiscount(producto);
                  const quantityPerBundle = producto.quantity || 1;
                  const unitOriginal =
                    Math.ceil((bundleOriginal / quantityPerBundle) * 1.2 / 10) * 10;
                  const selectedType = selectedTypes[producto.Id] || "Bulto";
                  const isBulto = selectedType === "Bulto";
                  const applyDiscount = discount > 0;
                  const bundleSale = bundleOriginal + discount;
                  const displayPrice = isBulto
                    ? bundleOriginal
                    : unitOriginal;
                  const displayOriginal = isBulto ? bundleOriginal : null;

                  return (
                    <div className="mb-1">
                      <div className="flex items-baseline gap-2">
                        <p
                          className={`text-2xl font-black tracking-tight ${applyDiscount && isBulto ? "text-red-600" : "text-zinc-900"}`}
                        >
                          ${displayPrice.toLocaleString("es-AR")}
                        </p>
                        {(displayOriginal && applyDiscount) && (
                          <span className="text-sm text-gray-400 line-through">
                            ${bundleSale.toLocaleString("es-AR")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={(e) =>
                    handleAddToCart(
                      producto,
                      e,
                      selectedTypes[producto.Id] || "Bulto",
                    )
                  }
                  disabled={!producto.Stock && producto.Stock !== undefined}
                  className={`mt-2 w-full border-2 py-2.5 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-sm group-hover:border-orange-700 ${
                    !producto.Stock && producto.Stock !== undefined
                      ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                      : addedToCart.has(producto.Id)
                        ? "bg-[#FF6600] text-white border-[#FF6600]"
                        : "bg-white text-[#FF6600] border-[#FF6600] hover:bg-[#FF6600] hover:text-white"
                  }`}
                >
                  <i
                    className={`fas ${
                      !producto.Stock && producto.Stock !== undefined
                        ? "fa-ban"
                        : addedToCart.has(producto.Id)
                          ? "fa-check"
                          : "fa-cart-plus"
                    }`}
                  ></i>
                  {!producto.Stock && producto.Stock !== undefined
                    ? "NO DISPONIBLE"
                    : addedToCart.has(producto.Id)
                      ? "AGREGADO"
                      : "AGREGAR"}
                </button>
              </div>
            </div>
          </Link>
        );
      })}{" "}
    </div>
  );
}

ProductsGrid.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      Id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      nombre: PropTypes.string.isRequired,
      precio: PropTypes.number.isRequired,
      Imagen: PropTypes.string,
      imagen: PropTypes.string,
      Stock: PropTypes.bool,
      Oferta: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      quantity: PropTypes.number
    })
  ).isRequired
};
