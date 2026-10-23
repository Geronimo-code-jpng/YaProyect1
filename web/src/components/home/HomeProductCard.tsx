import React, { useEffect, useState } from "react"
import Image from "next/image";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from '../../contexts/CartContext';

function agregarAlCarrito(addToCart, product, quantity) {
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
      Oferta: product.Oferta || product.discount,
      originalPrice: product.originalPrice,
      discount: product.discount,
      inStock: product.inStock
    };

    addToCart(productForCart as any);
// 2. --- INICIO DATALAYER PARA GA4 ---
    // Aseguramos que dataLayer exista en el entorno global (window)
    window.dataLayer = window.dataLayer || [];

    // Empujamos el evento con la estructura exacta que pide GA4
    window.dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        currency: "ARS", // Cambia esto si usas otra moneda (ej. "USD", "MXN")
        value: (product.price || product.precio) * quantity, // Valor total de esta acción
        items: [
          {
            item_id: String(product.id || product.Id), // GA4 recomienda IDs como texto
            item_name: product.name || product.nombre,
            price: product.price || product.precio,
            quantity: quantity,
            item_category: product.tipo || "Bulto"
          }
        ]
      }
    });
    // --- FIN DATALAYER PARA GA4 ---
}

/**
 * Botón "Agregar" que, una vez en el carrito, pasa a ser − cantidad +.
 * La cantidad sale del carrito, así coincide en todas las tarjetas del mismo producto.
 */
export function BotonAgregar({ product, className = "" }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const [recien, setRecien] = useState(false);
  const id = product.id || product.Id;
  const tipo = product.tipo || "Bulto";
  const enCarrito = cart.find((i) => String(i.Id) === String(id) && (i.tipo || "Bulto") === tipo);
  // Dentro de una tarjeta que se toca, que el toque quede en el botón
  const parar = (e) => { e.preventDefault(); e.stopPropagation(); };

  // Recién agregado: un segundo en verde y después aparece el − / +
  useEffect(() => {
    if (!recien) return;
    const t = setTimeout(() => setRecien(false), 1000);
    return () => clearTimeout(t);
  }, [recien]);

  if (recien) {
    return (
      <button
        onClick={parar}
        className={`${className} rounded-xl font-bold text-sm bg-green-500 text-white flex items-center justify-center gap-2 motion-safe:animate-[popIn_0.25s_ease-out]`}
      >
        <Check className="w-4 h-4" /> Agregado
      </button>
    );
  }

  if (!enCarrito) {
    return (
      <button
        onClick={(e) => { parar(e); agregarAlCarrito(addToCart, product, 1); setRecien(true); }}
        className={`${className} rounded-xl font-bold text-sm bg-[#f74d00] hover:bg-[#e04400] text-white flex items-center justify-center gap-2 transition active:scale-95`}
      >
        <ShoppingCart className="w-4 h-4" /> Agregar
      </button>
    );
  }

  const boton = "h-full aspect-square rounded-lg flex items-center justify-center text-[#f74d00] hover:bg-white active:scale-90 transition";
  return (
    <div onClick={parar} className={`${className} rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between p-0.5`}>
      <button
        aria-label="Uno menos"
        className={boton}
        onClick={(e) => {
          parar(e);
          if (enCarrito.cantidad > 1) updateQuantity(id, enCarrito.cantidad - 1, tipo);
          else removeFromCart(id, tipo);
        }}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="font-black text-gray-900 tabular-nums">{enCarrito.cantidad}</span>
      <button aria-label="Uno más" className={boton} onClick={(e) => { parar(e); agregarAlCarrito(addToCart, product, 1); }}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Componente para mostrar un producto en la página de inicio.
 *
 * @param {object} product - Objeto con información del producto.
 * @param {boolean} compact - Indica si se debe mostrar la versión compacta del componente.
 */
export default function HomeProductCard({ product, compact = false }) {
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    agregarAlCarrito(addToCart, product, quantity);
    setAddedToCart(true);

    setTimeout(() => setAddedToCart(false), 1500);
    // Resetear cantidad a 1 después de agregar
    setQuantity(1);
  };

  if (compact) {
    const porcentaje = product.originalPrice
      ? Math.round((product.discount / product.originalPrice) * 100)
      : 0;
    return (
      <div className="relative group flex flex-col bg-white rounded-2xl h-full border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition duration-300 p-2.5 sm:p-3">
        {/* La etiqueta sale por afuera de la tarjeta. Un descuento chico ("-1%") luce poco: ahí va "Oferta" */}
        {product.discount > 0 && (
          <span className="absolute -top-2.5 -left-1.5 z-10 -rotate-3 bg-red-600 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg shadow-lg shadow-red-600/30">
            {porcentaje >= 5 ? `-${porcentaje}%` : "Oferta"}
          </span>
        )}
        <Link href={`/producto/${product.id}`} className="relative block aspect-square rounded-xl bg-gray-50 mb-2.5 overflow-hidden">
          <Image
            src={product.image || "/producto-placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 45vw, 260px"
            className="object-contain p-3 sm:p-4 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/producto-placeholder.svg';
            }}
          />
        </Link>

        <Link href={`/producto/${product.id}`}>
          <h3 className="text-[13px] sm:text-sm font-bold text-gray-800 line-clamp-2 leading-snug min-h-[2.6em] hover:text-[#f74d00] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Cada renglón ocupa su lugar aunque esté vacío: así todas las tarjetas quedan parejas */}
        <p className="text-[11px] sm:text-xs text-gray-500 mt-1 min-h-[1.5em]">
          {product.units > 1 &&
            `x${product.units} u. · $${Math.round(product.price / product.units).toLocaleString("es-AR")} c/u`}
        </p>

        <div className="flex items-baseline gap-x-2 whitespace-nowrap overflow-hidden mt-1">
          <span className="text-lg sm:text-xl font-black tracking-tight text-gray-900">
            ${product.price ? product.price.toLocaleString("es-AR") : '0'}
          </span>
          {product.originalPrice && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">
              ${product.originalPrice.toLocaleString("es-AR")}
            </span>
          )}
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-green-600 min-h-[1.5em]">
          {product.discount > 0 && `Ahorrás $${product.discount.toLocaleString("es-AR")}`}
        </p>

        <div className="flex-1 min-h-2" />
        <BotonAgregar product={product} className="w-full h-9 sm:h-10" />
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
        <Image
          src={product.image || product.imagen || "/producto-placeholder.svg"}
          alt={product.name || product.nombre || "Producto"}
          fill
          sizes="(max-width: 768px) 50vw, 300px"
          className="object-cover hover:scale-105 transition-transform duration-300"
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
