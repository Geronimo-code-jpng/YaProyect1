"use client";

import React, { useState, useEffect } from "react"
import type { Product, CartItem } from "../../types";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../contexts/CartContext";
import {
  hay,
  hayBulto,
  hayUnidad,
  precioDe,
  precioBulto,
  tieneUnidad,
  tipoValido,
  unidadesPorBulto,
  type Tipo,
} from "../../lib/presentaciones";

// Imagen por defecto (estática, servida desde /public) cuando el producto no
// tiene una imagen cargada.
export const getDefaultProductImage = (_productId?: number) => {
  return "/producto-placeholder.svg";
};

// Cuántas tarjetas se muestran de entrada y cuántas suma cada "Ver más".
// Limita el DOM y, sobre todo, cuántas imágenes puede llegar a pedir el
// navegador al optimizador / a Blob de una sola vez.
const PAGE_SIZE = 24;

export default function ProductsGrid({ products }: { products: any; onAddToCart?: (product: any) => void }) {
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState(new Set());
  const [selectedTypes, setSelectedTypes] = useState({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Firma estable del listado filtrado: cambia sólo cuando cambia el resultado
  // (categoría / búsqueda), no en cada render. Al cambiar, volvemos a la
  // primera página.
  const listSignature = `${products.length}:${products[0]?.Id ?? ""}:${
    products[products.length - 1]?.Id ?? ""
  }`;
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [listSignature]);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  // Qué presentación está elegida en cada tarjeta. Si nadie eligió nada: el
  // bulto, salvo que solo queden unidades sueltas. "Unidad" solo existe si el
  // sistema dice que el artículo tiene suelto.
  const tipoElegido = (producto: Product): Tipo => tipoValido(producto, selectedTypes[producto.Id]);

  // Sin nada que vender de la presentación elegida (o sin stock del todo)
  const sinStock = (producto: Product) =>
    (!producto.Stock && producto.Stock !== undefined) || !hay(producto, tipoElegido(producto));

  const getDiscount = (producto) => {
    const d = parseInt(producto.Oferta) || 0;
    return d > 0 && d < Number(producto.precio) ? d : 0;
  };

  const handleAddToCart = (producto, event, tipo: Tipo = "Bulto") => {
    event.preventDefault();
    event.stopPropagation();
    // No se agrega una presentación de la que no hay
    if (!hay(producto, tipo)) return;

    const nombreSeguro = producto.nombre
      ? producto.nombre.replace(/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ.-]/g, "").trim()
      : "Producto";
    const imgSrc =
      producto.Imagen || producto.imagen || getDefaultProductImage(producto.Id);

    const discount = getDiscount(producto);
    const quantityPerBundle = unidadesPorBulto(producto);
    // El precio de cada presentación lo manda el sistema: ya no se calcula acá
    const finalPrice = precioDe(producto, tipo);

    addToCart({
      Id: producto.Id,
      nombre: nombreSeguro,
      precio: finalPrice,
      imagen: imgSrc,
      cantidad: 1,
      tipo: tipo,
      precio_unitario: finalPrice,
      quantity_per_bundle: quantityPerBundle,
      Oferta: producto.Oferta,
      descuento: discount,
    } as CartItem);
// 2. --- INICIO DATALAYER PARA GA4 ---
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        currency: "ARS", // Cambia a "USD", "MXN", etc. si corresponde
        value: finalPrice, // Como la cantidad aquí está forzada a 1, el valor total es finalPrice
        items: [
          {
            item_id: String(producto.Id),
            item_name: nombreSeguro,
            price: finalPrice,
            quantity: 1, // En este código específico, siempre agregas de a 1
            item_category: tipo
          }
        ]
      }
    });
    // --- FIN DATALAYER PARA GA4 ---
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
    <>
    <div
      id="productsGrid"
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-6"
    >
      {visibleProducts.map((producto: Product) => {
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
            href={`/producto/${producto.Id}`}
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
                  <Image
                    src={imgSrc}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-contain p-5 mix-blend-multiply"
                    alt={nombreSeguro}
                    onError={(e) => {
                      // Si falla la imagen, usar placeholder
                      if (
                        (e.target as HTMLImageElement).src !== getDefaultProductImage(producto.Id)
                      ) {
                        (e.target as HTMLImageElement).src = getDefaultProductImage(producto.Id);
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
                {/* Unit/Bundle Selector: cada presentación se deshabilita si no hay de ella */}
                <div className="flex gap-2 mb-3">
                  {tieneUnidad(producto) && (
                    <button
                      disabled={!hayUnidad(producto)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedTypes((prev) => ({
                          ...prev,
                          [producto.Id]: "Unidad",
                        }));
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition ${
                        !hayUnidad(producto)
                          ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed"
                          : tipoElegido(producto) === "Unidad"
                            ? "bg-[#FF6600] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <i className="fas fa-box text-xs mr-1"></i>
                      Unidad
                    </button>
                  )}
                  <button
                    disabled={!hayBulto(producto)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedTypes((prev) => ({
                        ...prev,
                        [producto.Id]: "Bulto",
                      }));
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition ${
                      !hayBulto(producto)
                        ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed"
                        : tipoElegido(producto) === "Bulto"
                          ? "bg-[#FF6600] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <i className="fas fa-boxes text-xs mr-1"></i>
                    Bulto
                  </button>
                </div>

                {/* Dynamic Price */}
                {(() => {
                  const bundleOriginal = precioBulto(producto);
                  const discount = getDiscount(producto);
                  const isBulto = tipoElegido(producto) === "Bulto";
                  const applyDiscount = discount > 0;
                  const bundleSale = bundleOriginal + discount;
                  const displayPrice = precioDe(producto, tipoElegido(producto));
                  const displayOriginal = isBulto ? bundleOriginal : null;

                  return (
                    <div className="mb-1">
                      <div className="flex items-baseline gap-2">
                        <p
                          className={`[@media(max-width:390px)]:text-sm text-2xl font-black tracking-tight ${applyDiscount && isBulto ? "text-red-600" : "text-zinc-900"}`}
                        >
                          ${displayPrice.toLocaleString("es-AR")}
                        </p>
                        {displayOriginal && applyDiscount && (
                          <span className="text-sm text-gray-400 line-through">
                            ${bundleSale.toLocaleString("es-AR")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={(e) => handleAddToCart(producto, e, tipoElegido(producto))}
                  disabled={sinStock(producto)}
                  className={`mt-2 w-full border-2 py-2.5 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-sm group-hover:border-orange-700 ${
                    sinStock(producto)
                      ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                      : addedToCart.has(producto.Id)
                        ? "bg-[#FF6600] text-white border-[#FF6600]"
                        : "bg-white text-[#FF6600] border-[#FF6600] hover:bg-[#FF6600] hover:text-white"
                  }`}
                >
                  <i
                    className={`fas ${
                      sinStock(producto)
                        ? "fa-ban"
                        : addedToCart.has(producto.Id)
                          ? "fa-check"
                          : "fa-cart-plus"
                    }`}
                  ></i>
                  {sinStock(producto)
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

    {hasMore && (
      <div className="flex flex-col items-center gap-2 mt-8">
        <p className="text-sm font-bold text-gray-400">
          Mostrando {visibleProducts.length} de {products.length}
        </p>
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="px-6 py-3 rounded-xl bg-[#FF6600] text-white font-black hover:bg-orange-700 transition shadow-lg"
        >
          Ver más productos
        </button>
      </div>
    )}
    </>
  );
}
