"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../contexts/CartContext";
import { useProducts } from "../contexts/ProductContext";
import { fetchProductoById } from "../lib/catalogApi";
import {
  hay,
  hayBulto,
  hayUnidad,
  precioDe,
  precioBulto,
  tieneUnidad,
  tipoInicial,
  unidadesPorBulto,
  type Tipo,
} from "../lib/presentaciones";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { products } = useProducts();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [typeOfQuantity, setTypeOfQuantity] = useState<Tipo>("Bulto");

  // Al cargar el producto se elige el bulto, salvo que solo queden unidades
  // sueltas. "Unidad" solo existe si el sistema dice que el artículo tiene suelto.
  useEffect(() => {
    if (product) setTypeOfQuantity(tipoInicial(product));
  }, [product]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    // 1) Si el catálogo ya está en memoria (contexto), usamos ese producto y
    //    no hacemos ninguna llamada al backend. Es el caso normal: el usuario
    //    llega desde /productos, donde ya se cargó todo.
    const fromContext = (products || []).find(
      (p) => p && Number(p.Id) === Number(id),
    );
    if (fromContext) {
      setProduct(fromContext);
      setIsLoading(false);
      return;
    }

    // 2) Fallback: entrada directa por URL con el catálogo todavía sin cargar.
    let cancelled = false;
    const loadProduct = async () => {
      try {
        const data = await fetchProductoById(id);
        if (!cancelled) setProduct(data);
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id, products]);

  const getDiscountAmount = () => {
    if (!product) return 0;
    const d = parseInt(product.Oferta) || 0;
    const original = Number(product.precio) || 0;
    return d > 0 && d < original ? d : 0;
  };

  // El precio de cada presentación lo manda el sistema del negocio: la página
  // ya no inventa el de la unidad.
  const calculatePrice = () => {
    if (!product) return 0;
    return precioDe(product, typeOfQuantity);
  };

  const calculateOriginalPrice = () => {
    if (!product) return null;
    const discount = getDiscountAmount();
    if (discount <= 0 || typeOfQuantity !== "Bulto") return null;

    return precioBulto(product);
  };

  // Sin nada que vender de la presentación elegida (o sin stock del todo)
  const sinStock = !!product
    && ((!product.Stock && product.Stock !== undefined) || !hay(product, typeOfQuantity));

  const handleAddToCart = () => {
    if (!product || sinStock) {
      return;
    }
    if (product) {
      addToCart({
        ...product,
        cantidad: quantity,
        tipo: typeOfQuantity,
        precio: calculatePrice(),
        precio_unitario: calculatePrice(),
        quantity_per_bundle: unidadesPorBulto(product),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#FF6600] mb-4"></i>
          <p className="text-lg font-bold text-gray-500">
            Cargando producto...
          </p>
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
            href="/productos"
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
            <Link href="/" className="text-gray-500 hover:text-[#FF6600]">
              Inicio
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link
              href="/productos"
              className="text-gray-500 hover:text-[#FF6600]"
            >
              Productos
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-zinc-900 font-black">{product.nombre}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-square">
          <Image
            src={product.Imagen || "/producto-placeholder.svg"}
            alt={product.nombre}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/producto-placeholder.svg";
            }}
          />
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <span className="inline-block px-3 py-1 bg-[#FF6600]/10 text-[#FF6600] rounded-full text-sm font-black mb-3">
              {product.Categoria}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 mb-4">
              {product.nombre}
            </h1>
            {(() => {
              const discount = getDiscountAmount();
              const currentPrice = calculatePrice();
              const originalPrice = calculateOriginalPrice();
              const originalPriceForBulto = calculateOriginalPrice() + discount;
              return (
                <>
                  <div className="flex items-baseline gap-3 mb-2">
                    <p
                      className={`text-3xl font-black ${originalPrice ? "text-red-600" : "text-[#FF6600]"}`}
                    >
                      ${currentPrice.toLocaleString("es-AR")}
                    </p>
                    {originalPrice && (
                      <p className="text-xl text-gray-400 diagonal-strike font-medium">
                        $
                        {typeOfQuantity == "Bulto"
                          ? originalPriceForBulto.toLocaleString("es-AR")
                          : currentPrice.toLocaleString("es-AR")}
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Unit/Bundle Selector */}
          <div>
            <h3 className="text-lg font-black text-zinc-900 mb-3">
              Tipo de compra
            </h3>
            <div className="flex gap-3">
              {tieneUnidad(product) && (
                <button
                  disabled={!hayUnidad(product)}
                  onClick={() => setTypeOfQuantity("Unidad")}
                  className={`flex-1 py-3 px-4 rounded-xl font-black transition ${
                    !hayUnidad(product)
                      ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed"
                      : typeOfQuantity === "Unidad"
                        ? "bg-[#FF6600] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <i className="fas fa-box mr-2"></i>
                  Por Unidad
                </button>
              )}
              <button
                disabled={!hayBulto(product)}
                onClick={() => setTypeOfQuantity("Bulto")}
                className={`flex-1 py-3 px-4 rounded-xl font-black transition ${
                  !hayBulto(product)
                    ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed"
                    : typeOfQuantity === "Bulto"
                      ? "bg-[#FF6600] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <i className="fas fa-boxes mr-2"></i>
                Por Bulto
                {tieneUnidad(product) && unidadesPorBulto(product) > 1 && (
                  <span className="ml-2 text-xs">
                    ({unidadesPorBulto(product)} unidades)
                  </span>
                )}
              </button>
            </div>
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
              <span className="text-xl font-black w-12 text-center">
                {quantity}
              </span>
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
            disabled={sinStock}
            className={`w-full text-lg font-black py-4 rounded-xl transition shadow-lg ${
              sinStock
                ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                : "bg-[#FF6600] text-white hover:bg-orange-700"
            }`}
          >
            <i
              className={`fas mr-2 ${
                sinStock
                  ? "fa-ban"
                  : "fa-shopping-cart"
              }`}
            ></i>
            {sinStock
              ? "NO DISPONIBLE"
              : "Agregar al Carrito"}
          </button>

          {/* Product Features */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-black text-zinc-900 mb-4">
              Características
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <i
                  className={`fas ${
                    !product.Stock && product.Stock !== undefined
                      ? "fa-times-circle text-red-500"
                      : "fa-check-circle text-green-500"
                  }`}
                ></i>
                <span className="text-gray-600">
                  {!product.Stock && product.Stock !== undefined
                    ? "Sin stock"
                    : "Stock disponible"}
                </span>
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
            href="/productos"
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
