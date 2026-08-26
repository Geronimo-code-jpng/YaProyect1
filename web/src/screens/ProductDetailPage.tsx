"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "../contexts/CartContext";
import { fetchProductoById } from "../lib/catalogApi";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [typeOfQuantity, setTypeOfQuantity] = useState("Unidad");

  // Set default to "Bulto" if solo_bulto is true
  useEffect(() => {
    if (product && product.solo_bulto) {
      setTypeOfQuantity("Bulto");
    }
  }, [product]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProductoById(id);
        setProduct(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading product:", error);
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const getDiscountAmount = () => {
    if (!product) return 0;
    const d = parseInt(product.Oferta) || 0;
    const original = Number(product.precio) || 0;
    return d > 0 && d < original ? d : 0;
  };

  const calculatePrice = () => {
    if (!product) return 0;

    const bundleOriginal = product.precio || 0;
    const quantityPerBundle = product.quantity || 1;
    const discount = getDiscountAmount();
    const isBulto = typeOfQuantity === "Bulto";
    const bundlePrice =
      isBulto && discount > 0 ? bundleOriginal : bundleOriginal;
    const unitPrice =
      Math.ceil(((bundleOriginal / quantityPerBundle) * 1.2) / 10) * 10;

    return isBulto ? bundlePrice : unitPrice;
  };

  const calculateOriginalPrice = () => {
    if (!product) return null;
    const discount = getDiscountAmount();
    if (discount <= 0 || typeOfQuantity !== "Bulto") return null;

    return product.precio || 0;
  };

  const handleAddToCart = () => {
    if (product && (!product.Stock || product.Stock === undefined)) {
      return;
    }
    if (product) {
      addToCart({
        ...product,
        cantidad: quantity,
        tipo: typeOfQuantity,
        precio: calculatePrice(),
        precio_unitario: calculatePrice(),
        quantity_per_bundle: product?.quantity || 1,
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
        <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-square">
          <img
            src={
              product.Imagen ||
              "https://via.placeholder.com/600/f3f4f6/a1a1aa?text=Producto"
            }
            alt={product.nombre}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/600/f3f4f6/a1a1aa?text=Producto";
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
              {!product.solo_bulto && (
                <button
                  onClick={() => setTypeOfQuantity("Unidad")}
                  className={`flex-1 py-3 px-4 rounded-xl font-black transition ${
                    typeOfQuantity === "Unidad"
                      ? "bg-[#FF6600] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <i className="fas fa-box mr-2"></i>
                  Por Unidad
                </button>
              )}
              <button
                onClick={() => setTypeOfQuantity("Bulto")}
                className={`flex-1 py-3 px-4 rounded-xl font-black transition ${
                  typeOfQuantity === "Bulto"
                    ? "bg-[#FF6600] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <i className="fas fa-boxes mr-2"></i>
                Por Bulto
                {product && product.quantity > 1 && (
                  <span className="ml-2 text-xs">
                    ({product.quantity} unidades)
                  </span>
                )}
              </button>
            </div>
            {product.solo_bulto && (
              <p className="text-sm text-blue-600 mt-2 font-medium">
                <i className="fas fa-info-circle mr-1"></i>
                Este producto solo se vende por bulto
              </p>
            )}
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
            disabled={!product.Stock && product.Stock !== undefined}
            className={`w-full text-lg font-black py-4 rounded-xl transition shadow-lg ${
              !product.Stock && product.Stock !== undefined
                ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                : "bg-[#FF6600] text-white hover:bg-orange-700"
            }`}
          >
            <i
              className={`fas mr-2 ${
                !product.Stock && product.Stock !== undefined
                  ? "fa-ban"
                  : "fa-shopping-cart"
              }`}
            ></i>
            {!product.Stock && product.Stock !== undefined
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
